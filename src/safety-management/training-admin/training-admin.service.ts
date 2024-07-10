import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
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
import sanitizeHtml from 'sanitize-html';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { TrainingTokenQueryDto } from 'src/users/dto/training-token-query.dto';
import { OpaqueToken } from 'src/auth/entities/opaque-token.entity';
import { ResendTrainingLinksDto } from './dto/resend-training-link.dto';
import { CoursesService } from 'src/training/courses/courses.service';

const DEFAULT_TOKEN_EXPIRATION_DAYS = 90;

// Determines maximum distance between watch events that are still considered
// continous play.
const MAX_SECONDS_BETWEEN_PLAYS = 6;

@Injectable({ scope: Scope.REQUEST })
export class TrainingAdminService {
  logger = new Logger(TrainingAdminService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME) private notificationsQueue: Queue,
    @Inject(REQUEST) private request: Request,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly coursesService: CoursesService,
    private readonly itemsService: ItemsService,
    private readonly unitsService: UnitsService,
  ) {}

  /**
   * Send special training invite links with tokens to specified emails.
   *
   * @param data Data used to build tokens and send training links to given emails.
   */
  async sendTrainingLinks(data: SendTrainingLinksDto) {
    const {
      trainingTokenValues,
      trainingUrlTemplate,
      trainingCourseId,
      trainingItemId,
    } = data;

    // Ensure user information is available.
    if (!this.request.user) {
      throw new ForbiddenException('User not found');
    }

    // Get training course and item to make sure they exist and to provide training metadata in emails.
    const trainingCourse = await this.coursesService
      .findOne(trainingCourseId)
      .catch((e) => {
        this.logger.error('Failed to fetch training course', e);
        return null;
      });
    const trainingItem = trainingCourse?.sections.reduce(
      (acc, s) => {
        if (!acc) {
          acc = s.items.map((i) => i.item).find((i) => i.id === trainingItemId);
        }

        return acc;
      },
      undefined as TrainingItem | undefined,
    );

    if (!trainingCourse || !trainingItem) {
      throw new BadRequestException('Training course or item not found');
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
        trainingCourseId: trainingCourse.id,
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
    const tokens =
      await this.usersService.createTrainingToken(preparedTokenValues);

    this.sendTrainingLinkEmails(
      tokens,
      new Map([[trainingItem.id, trainingItem]]),
      trainingUrlTemplate,
    );
  }

  async findTrainingLinks(query: TrainingTokenQueryDto) {
    const [unitSlugs, organizationSlugs] =
      this.parseAvailableOrganizations(query);
    query.unitSlug = unitSlugs;
    query.organizationSlug = organizationSlugs;

    return this.usersService.findTrainingTokens(query);
  }

  async findTrainingLinksCsv(
    query: TrainingTokenQueryDto,
    trainingUrlTemplate: string,
  ) {
    const [unitSlugs, organizationSlugs] =
      this.parseAvailableOrganizations(query);
    query.unitSlug = unitSlugs;
    query.organizationSlug = organizationSlugs;

    const qb = this.usersService.getTrainingTokensQb(query);

    const al = qb.alias;
    return qb
      .select(`${al}.value ->> 'trainingItemId'`, 'training_item_id')
      .addSelect(`${al}.value ->> 'firstName'`, 'first_name')
      .addSelect(`${al}.value ->> 'lastName'`, 'last_name')
      .addSelect(`${al}.value ->> 'email'`, 'email')
      .addSelect(
        `REPLACE(REPLACE(:urlTemplate, '{token}', ${al}.key), '{trainingItemId}', ${al}.value ->> 'trainingItemId')`,
        'training_link',
      )
      .setParameter('urlTemplate', trainingUrlTemplate)
      .stream()
      .then((stream) => stream.pipe(csvFormat({ headers: true })));
  }

  async resendTrainingLinks(data: ResendTrainingLinksDto) {
    const q = new TrainingTokenQueryDto();
    q.id = data.trainingTokenIds;
    q.limit = Number.MAX_SAFE_INTEGER;
    const tokens = await this.findTrainingLinks(q).then(
      (d) => d.results as OpaqueToken<TrainingParticipantRepresentationDto>[],
    );

    const trainingMap = new Map<string, TrainingItem>();
    for (const token of tokens) {
      if (!trainingMap.has(token.value.trainingItemId)) {
        const item = await this.itemsService
          .findOne(token.value.trainingItemId)
          .catch((e) => {
            this.logger.error('Failed to fetch training item', e);
            return null;
          });
        if (item) {
          trainingMap.set(token.value.trainingItemId, item);
        }
      }
    }

    this.sendTrainingLinkEmails(tokens, trainingMap, data.trainingUrlTemplate);
  }

  private sendTrainingLinkEmails(
    tokens: OpaqueToken<TrainingParticipantRepresentationDto>[],
    trainingMap: Map<string, TrainingItem>,
    trainingUrlTemplate: string,
  ) {
    const stripTags = (s?: string | null) =>
      s && sanitizeHtml(s, { allowedTags: [] });

    // Send out training invite emails.
    this.notificationsQueue.addBulk(
      tokens.reduce((acc, { key: token, value }) => {
        const trainingItem = trainingMap.get(value.trainingItemId);

        if (!trainingItem) {
          return acc;
        }

        acc.push({
          name: NotificationsJobNames.SendEmailNotification,
          data: {
            to: [value.email],
            templateName: this.config.get<string>(
              'notifications.email.templates.trainingLink',
            ),
            context: {
              firstName: value.firstName,
              trainingLink: this.buildTrainingLink(
                trainingUrlTemplate,
                trainingItem.id,
                token,
              ),
              trainingTitle: stripTags(trainingItem.metadata.title),
              trainingDescription: stripTags(trainingItem.metadata.description),
              trainingThumbnailUrl: trainingItem.thumbnailUrl,
            },
          },
        });

        return acc;
      }, [] as any[]),
    );
  }

  private buildTrainingLink = (
    trainingUrlTemplate: string,
    trainingItemId: string,
    token: string,
  ) => {
    return trainingUrlTemplate
      .replace('{trainingItemId}', trainingItemId)
      .replace('{token}', encodeURIComponent(token));
  };

  getWatchStatsQb(query: WatchStatsQueryDto) {
    const scopeToOrganizationLevel = (qb: SelectQueryBuilder<VideoEvent>) => {
      const [unitSlugs, organizationSlugs] =
        this.parseAvailableOrganizations(query);

      if (!organizationSlugs && !unitSlugs) {
        throw new BadRequestException(
          'Please provide at least one organization or unit slug.',
        );
      }

      if (organizationSlugs) {
        qb = qb.andWhere((_qb) => {
          let subQb = _qb
            .subQuery()
            .select('unit.slug')
            .from(Unit, 'unit')
            .innerJoin('unit.organization', 'organization')
            .where('organization.slug IN (:...organizationSlugs)', {
              organizationSlugs,
            });

          if (unitSlugs) {
            subQb = subQb.andWhere('unit.slug IN (:...unitSlugs)', {
              unitSlugs,
            });
          }

          return `video_event."unitSlug" IN (${subQb.getQuery()})`;
        });
      } else if (unitSlugs) {
        qb = qb.andWhere('video_event."unitSlug" IN (:...unitSlugs)', {
          unitSlugs,
        });
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
            .andWhere((qb) => {
              let subQb = qb
                .subQuery()
                .select('item.id::TEXT')
                .from(TrainingCourse, 'course')
                .leftJoin('course.sections', 'section')
                .leftJoin('section.items', 'section_item')
                .leftJoin('section_item.item', 'item')
                .where('course.id = :courseId', { courseId: query.courseId });

              return 'video_event."itemId" IN (' + subQb.getQuery() + ')';
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
      .from('user_video_progress', 'user_video_progress')
      .leftJoin(
        TrainingItem,
        'training_item',
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

  private parseAvailableOrganizations(query: {
    unitSlug?: string[];
    organizationSlug?: string[];
  }) {
    const organizationLevel = getOrganizationLevel(this.request);

    let unitSlugs = query.unitSlug;
    let organizationSlugs = query.organizationSlug;

    if (organizationLevel === LEVEL.UNIT) {
      const availableUnits = [
        this.request.user!.unitSlug!,
        ...(this.request.user?.peerUnits ?? []),
      ];
      unitSlugs = (unitSlugs ?? []).filter((slug) =>
        availableUnits.includes(slug),
      );

      if (!unitSlugs.length) {
        unitSlugs = availableUnits;
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

    return [unitSlugs, organizationSlugs];
  }
}
