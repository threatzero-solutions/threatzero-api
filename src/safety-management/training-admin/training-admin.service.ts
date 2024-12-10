import { format as csvFormat } from '@fast-csv/format';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import dayjs from 'dayjs';
import { ClsService } from 'nestjs-cls';
import sanitizeHtml from 'sanitize-html';
import { OpaqueToken } from 'src/auth/entities/opaque-token.entity';
import { LEVEL } from 'src/auth/permissions';
import { NOTIFICATIONS_QUEUE_NAME } from 'src/common/constants/queue.constants';
import { Paginated } from 'src/common/dto/paginated.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { NotificationsJobNames } from 'src/notifications/notifications.processor';
import { DEFAULT_UNIT_SLUG } from 'src/organizations/common/constants';
import {
  getOrganizationLevel,
  getUserUnitPredicate,
} from 'src/organizations/common/organizations.utils';
import { EnrollmentsService } from 'src/organizations/organizations/enrollments.service';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { UnitsService } from 'src/organizations/units/units.service';
import { CoursesService } from 'src/training/courses/courses.service';
import { TrainingParticipantRepresentationDto } from 'src/training/items/dto/training-participant-representation.dto';
import { ItemCompletion } from 'src/training/items/entities/item-completion.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';
import { ItemsService } from 'src/training/items/items.service';
import { TrainingTokenQueryDto } from 'src/users/dto/training-token-query.dto';
import { UsersService } from 'src/users/users.service';
import { In } from 'typeorm';
import { ResendTrainingLinksDto } from './dto/resend-training-link.dto';
import { SendTrainingLinksDto } from './dto/send-training-links.dto';
import { WatchStat } from './entities/watch-stat.entity';

const DEFAULT_TOKEN_EXPIRATION_DAYS = 90;

export class TrainingAdminService {
  logger = new Logger(TrainingAdminService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME) private notificationsQueue: Queue,
    @InjectRepository(WatchStat)
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly coursesService: CoursesService,
    private readonly itemsService: ItemsService,
    private readonly unitsService: UnitsService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly cls: ClsService<CommonClsStore>,
  ) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(
      `Received shutdown signal: ${signal}. Closing BullMQ queue...`,
    );
    await this.notificationsQueue.close().catch((e) => this.logger.warn(e));
  }

  /**
   * Send special training invite links with tokens to specified emails.
   *
   * @param data Data used to build tokens and send training links to given emails.
   */
  async sendTrainingLinks(data: SendTrainingLinksDto) {
    const user = this.cls.get('user');

    const {
      trainingTokenValues,
      trainingUrlTemplate,
      courseEnrollmentId,
      trainingItemId,
    } = data;

    // Ensure user information is available.
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get enrollment, training course and item to make sure they exist and to provide training metadata in emails.
    const courseEnrollment = await this.enrollmentsService
      .findOne(courseEnrollmentId)
      .catch((e) => {
        this.logger.error('Failed to fetch course enrollment', e);
        return null;
      });

    const trainingCourse =
      courseEnrollment &&
      (await this.coursesService
        .findOne(courseEnrollment.course?.id)
        .catch((e) => {
          this.logger.error('Failed to fetch training course', e);
          return null;
        }));

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

    const tokenAddIns: Partial<TrainingParticipantRepresentationDto> = {};
    if (
      user.hasPermission(LEVEL.ORGANIZATION) ||
      user.hasPermission(LEVEL.UNIT)
    ) {
      if (!user.unitSlug || user.unitSlug === DEFAULT_UNIT_SLUG) {
        throw new ForbiddenException('Missing user information.');
      }

      availableUnitSlugs.push(
        ...(await this.unitsService.findAll()).map((u) => u.slug),
      );
    } else if (!user.hasPermission(LEVEL.ADMIN)) {
      throw new ForbiddenException();
    }

    // Prepare token values.
    let preparedTokenValues = trainingTokenValues.map((tokenValue) => {
      const preparedValue: TrainingParticipantRepresentationDto = {
        ...tokenValue,
        enrollmentId: courseEnrollmentId,
        trainingItemId: trainingItem.id,
        ...tokenAddIns,
      };

      if (!user?.hasPermission(LEVEL.ADMIN)) {
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
    const tokens = await this.usersService.createTrainingToken(
      preparedTokenValues,
      dayjs().add(DEFAULT_TOKEN_EXPIRATION_DAYS, 'day').toDate(),
    );

    this.sendTrainingLinkEmails(
      tokens,
      new Map([[trainingItem.id, trainingItem]]),
      trainingUrlTemplate,
    );
  }

  findTrainingLinksQb(query: TrainingTokenQueryDto) {
    const user = this.cls.get('user');

    let completionProgressOrder: 'ASC' | 'DESC' | undefined = undefined;
    if (query.order['completion.progress']) {
      completionProgressOrder = query.order['completion.progress'];
      Reflect.deleteProperty(query.order, 'completion.progress');
    }

    const qb = this.usersService.getTrainingTokensQb(query, (qb) => {
      switch (getOrganizationLevel(user)) {
        case LEVEL.ADMIN:
          return qb;
        case LEVEL.UNIT:
          return qb
            .leftJoin(
              Unit,
              'unit',
              `${qb.alias}.value ->> 'unitSlug' = unit.slug`,
            )
            .andWhere(getUserUnitPredicate(user));
        case LEVEL.ORGANIZATION:
          return qb
            .leftJoin(
              Organization,
              'organization',
              `${qb.alias}.value ->> 'organizationSlug' = organization.slug`,
            )
            .andWhere('organization.slug = :organizationSlug', {
              organizationSlug: user?.organizationSlug,
            });
        default:
          return qb.where('1 = 0');
      }
    });
    const al = qb.alias;
    qb.leftJoinAndMapOne(
      `${al}.completion`,
      ItemCompletion,
      'item_completion',
      `item_completion."itemId"::TEXT = ${al}.value ->> 'trainingItemId'
    AND item_completion."userId"::TEXT = ${al}.value ->> 'userId'
    AND item_completion."enrollmentId"::TEXT = ${al}.value ->> 'enrollmentId'`,
    );

    if (completionProgressOrder) {
      qb.addSelect(
        'item_completion."progress"',
        'completion_progress',
      ).addOrderBy(
        'completion_progress',
        completionProgressOrder,
        completionProgressOrder === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST',
      );
    }

    return qb;
  }

  async findTrainingLinks(query: TrainingTokenQueryDto) {
    return Paginated.fromQb(this.findTrainingLinksQb(query), query);
  }

  async findTrainingLinksCsv(
    query: TrainingTokenQueryDto,
    trainingUrlTemplate: string,
  ) {
    const qb = this.findTrainingLinksQb(query);

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
      .addSelect(
        `TO_CHAR(item_completion."progress" * 100, 'FM999.00"%')`,
        'percent_watched',
      )
      .setParameter('urlTemplate', trainingUrlTemplate)
      .stream()
      .then((qbStream) => {
        const csvStream = csvFormat({ headers: true });

        qbStream.on('error', (err) => {
          csvStream.emit('error', err);
        });
        qbStream.pipe(csvStream);

        return csvStream;
      });
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
}
