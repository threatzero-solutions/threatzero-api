import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { SendTrainingLinksDto } from './dto/send-training-links.dto';
import dayjs from 'dayjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATIONS_QUEUE_NAME } from 'src/common/constants/queue.constants';
import { NotificationsJobNames } from 'src/notifications/notifications.processor';
import { ConfigService } from '@nestjs/config';
import { ItemsService } from 'src/training/items/items.service';
import { TrainingParticipantRepresentationDto } from 'src/training/items/dto/training-participant-representation.dto';
import { plainToInstance } from 'class-transformer';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { LEVEL } from 'src/auth/permissions';
import { DataSource, In, SelectQueryBuilder } from 'typeorm';
import { VideoEvent } from 'src/media/entities/video-event.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';
import { getOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { UserRepresentation } from 'src/users/entities/user-representation.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { format as csvFormat } from '@fast-csv/format';
import { WatchStatsQueryDto } from './dto/watch-stats-query.dto';
import { TrainingSection } from 'src/training/sections/entities/section.entity';
import { UnitsService } from 'src/organizations/units/units.service';

const DEFAULT_TOKEN_EXPIRATION_DAYS = 90;

// Determines maximum distance between watch events that are still considered
// continous play.
const MAX_SECONDS_BETWEEN_PLAYS = 6;

@Injectable({ scope: Scope.REQUEST })
export class TrainingAdminService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME) private notificationsQueue: Queue,
    @Inject(REQUEST) private request: Request,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
    private readonly unitsService: UnitsService,
  ) {}

  /**
   * Send special training invite links with tokens to specified emails.
   *
   * @param data Data used to build tokens and send training links to given emails.
   */
  async sendTrainingLinks(data: SendTrainingLinksDto) {
    const { trainingTokenValues, trainingUrlTemplate, trainingItemId } = data;

    // Ensure user information is available.
    if (!this.request.user) {
      throw new ForbiddenException('User not found');
    }

    // Get training item to make sure it exists and to provide training metadata in emails.
    const trainingItem = await this.itemsService.findOne(trainingItemId);
    if (!trainingItem) {
      throw new BadRequestException('Training item not found');
    }

    // Filter down and auto-populate input if possible for users who are not system admins.
    const availableUnitSlugs: string[] = [];

    let tokenAddIns: Partial<TrainingParticipantRepresentationDto> = {};
    if (
      this.request.user.hasPermission(LEVEL.ORGANIZATION) ||
      this.request.user.hasPermission(LEVEL.UNIT)
    ) {
      if (!this.request.user.unitSlug) {
        throw new ForbiddenException('Missing user information.');
      }

      availableUnitSlugs.push(
        ...(await this.unitsService.findAll()).map((u) => u.slug),
      );
    } else if (!this.request.user.hasPermission(LEVEL.ADMIN)) {
      throw new ForbiddenException();
    }

    // Prepare token values.
    let preparedTokenValues = trainingTokenValues.map((tokenValue) => {
      const preparedValue = {
        ...tokenValue,
        expiresOn: dayjs().add(DEFAULT_TOKEN_EXPIRATION_DAYS, 'day').toDate(),
        trainingItemId: trainingItem.id,
        ...tokenAddIns,
      };

      if (!this.request.user?.hasPermission(LEVEL.ADMIN)) {
        if (!availableUnitSlugs.includes(preparedValue.unitSlug)) {
          throw new BadRequestException('Invalid unit provided.');
        }
      }

      return plainToInstance(
        TrainingParticipantRepresentationDto,
        preparedValue,
      );
    });

    // Build mapping of units to organizations.
    const unitSlugs = preparedTokenValues
      .filter((t) => !!t.unitSlug)
      .map((t) => t.unitSlug);
    const unitsQb = this.unitsService.getQb();
    const unitsMap = await unitsQb
      .select(`${unitsQb.alias}.slug`, 'unitSlug')
      .addSelect('organization.slug', 'organizationSlug')
      .where({
        slug: In(unitSlugs),
      })
      .getRawMany()
      .then((rows) =>
        rows.reduce((acc, row) => {
          acc.set(row.unitSlug, row.organizationSlug);
          return acc;
        }, new Map<string, string>()),
      );

    // Add organization slugs to token values.
    preparedTokenValues = preparedTokenValues.map((t) => {
      if (t.unitSlug) {
        t.organizationSlug = unitsMap.get(t.unitSlug);
      }
      return t;
    });

    // Create tokens.
    const tokenSets =
      await this.usersService.createTrainingToken(preparedTokenValues);

    const _buildTrainingLink = (token: string) => {
      return trainingUrlTemplate.replace('{token}', encodeURIComponent(token));
    };

    // Send out training invite emails.
    this.notificationsQueue.addBulk(
      tokenSets.map(({ token, email, value }) => ({
        name: NotificationsJobNames.SendEmailNotification,
        data: {
          to: [email],
          templateName: this.config.get<string>(
            'notifications.email.templates.trainingLink',
          ),
          context: {
            firstName: value.firstName,
            trainingLink: _buildTrainingLink(token),
            trainingTitle: trainingItem.metadata.title,
            trainingDescription: trainingItem.metadata.description,
            trainingThumbnailUrl: trainingItem.thumbnailUrl,
          },
        },
      })),
    );
  }

  getWatchStatsQb(query: WatchStatsQueryDto) {
    const organizationLevel = getOrganizationLevel(this.request);

    let unitSlugs = query.unitSlug;
    let organizationSlugs = query.organizationSlug;

    const scopeToOrganizationLevel = (qb: SelectQueryBuilder<VideoEvent>) => {
      if (organizationLevel === LEVEL.UNIT) {
        const availableUnits = [
          this.request.user!.unitSlug!,
          ...(this.request.user?.peerUnits ?? []),
        ];
        unitSlugs = (unitSlugs ?? []).filter((slug) =>
          availableUnits.includes(slug),
        );

        if (!unitSlugs.length) {
          unitSlugs = [this.request.user!.unitSlug!];
        }
      } else if (
        organizationLevel === LEVEL.ORGANIZATION ||
        organizationLevel === LEVEL.UNIT
      ) {
        if (!this.request.user?.organizationSlug) {
          throw new ForbiddenException('Missing user information.');
        }
        organizationSlugs = [this.request.user.organizationSlug];
      }

      if (organizationSlugs) {
        qb = qb.andWhere((_qb) => {
          let subQb = _qb
            .subQuery()
            .select('unit.slug')
            .from('organization', 'organization')
            .innerJoin('organization.unit', 'unit')
            .where('organization.slug IN (:...organizationSlugs)', {
              organizationSlugs,
            });

          if (unitSlugs) {
            subQb = subQb.andWhere('unit.slug IN (:...unitSlugs)', {
              unitSlugs,
            });
          }

          return `video_event."unitSlug" IN ${subQb.getQuery()}`;
        });
      } else if (unitSlugs) {
        qb = qb.andWhere('video_event."unitSlug" IN (:...unitSlugs)', {
          unitSlugs,
        });
      }

      if (!organizationSlugs && !unitSlugs) {
        throw new BadRequestException(
          'Please provide at least one organization or unit slug.',
        );
      }

      return qb;
    };

    let qb = this.dataSource
      .createQueryBuilder()
      .addCommonTableExpression(
        scopeToOrganizationLevel(
          this.dataSource
            .createQueryBuilder()
            .select('video_event."userId"', 'user_id')
            .addSelect('video_event."unitSlug"', 'unit_slug')
            .addSelect('video_event."itemId"', 'item_id')
            .addSelect('video_event."type"', 'type')
            .addSelect('video_event."timestamp"', 'timestamp')
            .addSelect(
              `(video_event."eventData"->>'loaded')::NUMERIC`,
              'loaded_pct',
            )
            .addSelect(
              `(video_event."eventData"->>'loadedSeconds')::NUMERIC`,
              'loaded_seconds',
            )
            .addSelect(
              `(video_event."eventData"->>'playedSeconds')::NUMERIC`,
              'played_seconds',
            )
            .addSelect(
              `LAG((video_event."eventData"->>'playedSeconds')::NUMERIC) OVER (PARTITION BY video_event."userId", video_event."itemId" ORDER BY (video_event."eventData"->>'playedSeconds')::NUMERIC)`,
              'lag_played_seconds',
            )
            .addSelect(
              `MAX((video_event."eventData"->>'playedSeconds')::NUMERIC) OVER (PARTITION BY video_event."userId", video_event."itemId" ORDER BY (video_event."eventData"->>'playedSeconds')::NUMERIC)`,
              'max_played_seconds',
            )
            .from(VideoEvent, 'video_event')
            .where((qb) => {
              let subQb = qb
                .subQuery()
                .select('MIN(section."availableOn")')
                .from(TrainingSection, 'section')
                .where('section."courseId" = :courseId', {
                  courseId: query.courseId,
                })
                .andWhere('section."isStart" = true');

              const q = ` COALESCE((${subQb.getQuery()}), CURRENT_TIMESTAMP - INTERVAL '1 YEAR')`;

              return `video_event.timestamp >= ${q} AND video_event.timestamp < (${q} + INTERVAL '1 YEAR')`;
            })
            .orderBy('played_seconds', 'ASC'),
        ),
        'ordered_events',
      )
      .addCommonTableExpression(
        this.dataSource
          .createQueryBuilder()
          .select([
            'user_id',
            'unit_slug',
            'item_id',
            'type',
            'timestamp',
            'loaded_seconds',
            'played_seconds',
          ])
          .addSelect(
            `
            SUM(
              CASE
              WHEN played_seconds >= max_played_seconds AND ABS(played_seconds - lag_played_seconds) < ${MAX_SECONDS_BETWEEN_PLAYS} THEN played_seconds - lag_played_seconds
              ELSE 0
                END
            ) OVER (
              PARTITION BY user_id, item_id
              ORDER BY played_seconds
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
            `,
            'rolling_sum_seconds_watched',
          )
          .from('ordered_events', 'ordered_events'),
        'rolling_sums',
      )
      .addCommonTableExpression(
        this.dataSource
          .createQueryBuilder()
          .select('item_id')
          .addSelect('MAX(loaded_seconds / loaded_pct)', 'duration')
          .from('ordered_events', 'ordered_events')
          .where('loaded_pct > 0')
          .groupBy('item_id'),
        'video_duration',
      )
      .addCommonTableExpression(
        this.dataSource
          .createQueryBuilder()
          .select(['user_id', 'unit_slug', 'item_id'])
          .addSelect('MAX(rolling_sum_seconds_watched)', 'total_played_seconds')
          .from('rolling_sums', 'rolling_sums')
          .groupBy('user_id')
          .addGroupBy('item_id')
          .addGroupBy('unit_slug'),
        'user_video_progress',
      )
      .select('user_video_progress.user_id', 'userId')
      .addSelect('training_item."metadataTitle"', 'videoTitle')
      .addSelect(
        'ROUND(100.0 * user_video_progress.total_played_seconds / video_duration.duration, 2)',
        'percentWatched',
      )
      .addSelect('training_item.id', 'itemId')
      .addSelect('user_representation."givenName"', 'firstName')
      .addSelect('user_representation."familyName"', 'lastName')
      .addSelect('user_representation."email"', 'email')
      .addSelect('organization.slug', 'organizationSlug')
      .addSelect('organization.name', 'organizationName')
      .addSelect('unit.slug', 'unitSlug')
      .addSelect('unit.name', 'unitName')
      .from(TrainingItem, 'training_item')
      .leftJoin(
        'user_video_progress',
        'user_video_progress',
        'user_video_progress.item_id = training_item.id::TEXT',
      )
      .leftJoin(
        'video_duration',
        'video_duration',
        'video_duration.item_id = training_item.id::TEXT',
      )
      .leftJoin(
        UserRepresentation,
        'user_representation',
        'user_representation."externalId" = user_video_progress.user_id',
      )
      .leftJoin(
        Organization,
        'organization',
        'organization.slug = user_representation."organizationSlug"',
      )
      .leftJoin(Unit, 'unit', 'unit.slug = user_representation."unitSlug"');

    qb.skip(query.offset).take(query.limit);

    return qb;
  }

  async getWatchStats(query: WatchStatsQueryDto) {
    return this.getWatchStatsQb(query).getRawMany();
  }

  async getWatchStatsCsv(query: WatchStatsQueryDto) {
    return this.getWatchStatsQb(query)
      .stream()
      .then((stream) => stream.pipe(csvFormat({ headers: true })));
  }
}
