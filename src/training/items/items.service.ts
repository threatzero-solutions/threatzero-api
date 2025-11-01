import { format as csvFormat } from '@fast-csv/format';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-ioredis-yet';
import { ClsService } from 'nestjs-cls';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { LEVEL } from 'src/auth/permissions';
import { StatelessUser } from 'src/auth/user.factory';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Paginated } from 'src/common/dto/paginated.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { asArray, single } from 'src/common/utils';
import { MediaService } from 'src/media/media.service';
import { ORGANIZATION_USER_CREATED_EVENT } from 'src/organizations/common/events';
import {
  getOrganizationLevel,
  getUserUnitPredicate,
  scopeToOrganizationLevel,
} from 'src/organizations/common/organizations.utils';
import { BaseOrganizationUserChangeEvent } from 'src/organizations/events/base-organization-user-change-event';
import { LmsViewershipTokenValueDto } from 'src/organizations/organizations/dto/lms-viewership-token-value.dto';
import { CourseEnrollment } from 'src/organizations/organizations/entities/course-enrollment.entity';
import { OrganizationsService } from 'src/organizations/organizations/organizations.service';
import { UsersService } from 'src/users/users.service';
import { DataSource, DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { filterTraining } from '../common/training.utils';
import { CreateItemCompletionDto } from './dto/create-item-completion.dto';
import { ItemCompletionQueryDto } from './dto/item-completion-query.dto';
import { ItemCompletionsSummaryQueryDto } from './dto/item-completions-summary-query.dto';
import { TrainingParticipantRepresentationDto } from './dto/training-participant-representation.dto';
import { UpdateItemCompletionDto } from './dto/update-item-completion.dto';
import { UpdateOrCreateItemCompletionDto } from './dto/update-or-update-item-completion.dto';
import { ItemCompletion } from './entities/item-completion.entity';
import { TrainingItem } from './entities/item.entity';
import { Video } from './entities/video-item.entity';

export class ItemsService extends BaseEntityService<TrainingItem> {
  private readonly logger = new Logger(ItemsService.name);
  alias = 'item';

  private readonly CHECK_POPULATE_TRAINING_COMPLETIONS_FROM_USERS_SET_KEY =
    'check-populate-training-completions-from-users';

  constructor(
    private readonly cls: ClsService<CommonClsStore>,
    @InjectRepository(TrainingItem)
    private itemsRepository: Repository<TrainingItem>,
    @InjectRepository(ItemCompletion)
    private itemCompletionsRepository: Repository<ItemCompletion>,
    private dataSource: DataSource,
    private mediaService: MediaService,
    private opaqueTokenService: OpaqueTokenService,
    private organizationsService: OrganizationsService,
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cache: Cache<RedisStore>,
  ) {
    super();
  }

  getRepository() {
    return this.itemsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    let qb = super
      .getQb(query)
      .leftJoin('item.sectionItems', 'section_item')
      .leftJoin('section_item.section', 'section')
      .leftJoin('section.course', 'course');

    qb = filterTraining(user, qb);

    return qb;
  }

  async mapResult(item: TrainingItem) {
    if (item instanceof Video) {
      await item.loadThumbnailUrl((url) =>
        this.mediaService.getThumbnailUrlForVimeoUrl(url),
      );
    }
    return item;
  }

  async watch(itemId: TrainingItem['id'], watchId: string) {
    const user = await this.opaqueTokenService.validate(
      watchId,
      TrainingParticipantRepresentationDto,
      ['training', 'training-reminder'],
    );

    if (!user) {
      throw new UnauthorizedException('No user information found.');
    }

    if (user.trainingItemId !== itemId) {
      throw new UnauthorizedException();
    }

    const item = await super.getQb().where({ id: itemId }).getOneOrFail();
    return await this.mapResult(item);
  }

  async lmsWatch(itemId: TrainingItem['id'], lmsId: string) {
    const token = await this.opaqueTokenService.validate(
      lmsId,
      LmsViewershipTokenValueDto,
      'lms-training',
    );

    if (!token) {
      throw new UnauthorizedException('Access denied.');
    }

    if (token.trainingItemId !== itemId) {
      throw new UnauthorizedException();
    }

    const [item, organization] = await Promise.all([
      super.getQb().where({ id: itemId }).getOneOrFail(),
      this.organizationsService
        .getQb()
        .where({ id: token.organizationId })
        .getOneOrFail(),
    ]);
    return {
      item: await this.mapResult(item),
      allowedOrigins: organization.trainingAccessSettings?.allowedOrigins ?? [],
    };
  }

  async createMyItemCompletion(
    createItemCompletionDto: CreateItemCompletionDto,
    watchId?: string,
  ) {
    const { user, userRep, decodedToken } = await this.getUserContext(watchId);

    if (decodedToken) {
      createItemCompletionDto.enrollment = {
        id: decodedToken.enrollmentId,
      };
      createItemCompletionDto.item.id = decodedToken.trainingItemId;
    } else {
      // Make sure user has access to item.
      await this.getQb()
        .where({ id: createItemCompletionDto.item.id })
        .getOneOrFail();
    }

    if (!createItemCompletionDto.enrollment?.id) {
      throw new BadRequestException(
        'Enrollment is required for item completions.',
      );
    }

    const rawItemCompletion: DeepPartial<ItemCompletion> = {
      ...createItemCompletionDto,
      userId: userRep.id,
      email: user.email,
      audienceSlugs: user.audiences,
    };

    return this.itemCompletionsRepository.save(
      this.itemCompletionsRepository.create(rawItemCompletion),
    );
  }

  async updateMyItemCompletion(
    id: ItemCompletion['id'],
    updateItemCompletionDto: UpdateItemCompletionDto,
    watchId?: string,
  ) {
    const { userRep } = await this.getUserContext(watchId);

    const criteria: FindOptionsWhere<ItemCompletion> = {
      id,
      userId: userRep.id,
    };

    // Only allow setting completed to false if not already completed.
    if (!updateItemCompletionDto.completed) {
      criteria.completed = false;
    }

    const values: QueryDeepPartialEntity<ItemCompletion> = {
      ...updateItemCompletionDto,
    };

    // Only set completed on the very first time the item is completed.
    if (updateItemCompletionDto.completed) {
      values.completedOn = () =>
        `CASE WHEN "completed" = FALSE THEN NOW() ELSE "completedOn" END`;
    }

    await this.itemCompletionsRepository
      .createQueryBuilder()
      .update()
      .set(values)
      .where(criteria)
      .execute();
  }

  async updateOrCreateMyItemCompletion(
    updateOrCreateItemCompletionDto: UpdateOrCreateItemCompletionDto,
    watchId?: string,
  ) {
    const { user, userRep, decodedToken } = await this.getUserContext(watchId);

    if (decodedToken) {
      updateOrCreateItemCompletionDto.enrollment = {
        id: decodedToken.enrollmentId,
      };
      updateOrCreateItemCompletionDto.item.id = decodedToken.trainingItemId;
    } else {
      // Make sure user has access to item.
      await this.getQb()
        .where({ id: updateOrCreateItemCompletionDto.item.id })
        .getExists()
        .then((exists) => {
          if (!exists) {
            throw new BadRequestException('User does not have access to item.');
          }
        });
    }

    if (!updateOrCreateItemCompletionDto.enrollment?.id) {
      throw new BadRequestException(
        'Enrollment ID is required for reporting training progress.',
      );
    }

    const insertValues: QueryDeepPartialEntity<ItemCompletion> = {
      ...updateOrCreateItemCompletionDto,
      userId: userRep.id,
      email: user.email,
      audienceSlugs: user.audiences,
    };

    const updateValues: QueryDeepPartialEntity<ItemCompletion> = {
      ...insertValues,
      progress: () =>
        `CASE WHEN "progress" < :progress THEN :progress ELSE "progress" END`,
    };

    if (updateOrCreateItemCompletionDto.completed) {
      updateValues.completedOn = () =>
        `CASE WHEN "completed" = FALSE THEN NOW() ELSE "completedOn" END`;
    }

    const updateResult = await this.itemCompletionsRepository
      .createQueryBuilder()
      .update()
      .set(updateValues)
      .where({
        userId: userRep.id,
        enrollment: {
          id: updateOrCreateItemCompletionDto.enrollment.id,
        },
        item: {
          id: updateOrCreateItemCompletionDto.item.id,
        },
      })
      .setParameters({
        progress: insertValues.progress,
      })
      .execute();

    if (updateResult.affected === 0) {
      await this.itemCompletionsRepository
        .createQueryBuilder()
        .insert()
        .values(insertValues)
        .execute();
    }
  }

  async getMyItemCompletions(query: ItemCompletionQueryDto, watchId?: string) {
    const { userRep, decodedToken } = await this.getUserContext(watchId);
    let qb = this.getItemCompletionsQb(query, userRep.id);

    // Add enrollment filter if token contains enrollmentId
    if (decodedToken?.enrollmentId) {
      qb = qb.andWhere('enrollment.id = :enrollmentId', {
        enrollmentId: decodedToken.enrollmentId,
      });
    }

    return Paginated.fromQb(qb, query);
  }

  @OnEvent(ORGANIZATION_USER_CREATED_EVENT)
  async handleOrganizationUserCreatedEvent(
    event: BaseOrganizationUserChangeEvent,
  ) {
    const pattern = `${event.organizationSlug}:*`;
    const members: string[] = [];

    for await (const values of this.cache.store.client.sscanStream(
      this.CHECK_POPULATE_TRAINING_COMPLETIONS_FROM_USERS_SET_KEY,
      { match: pattern },
    )) {
      members.push(...values);
    }

    await this.cache.store.client.srem(
      this.CHECK_POPULATE_TRAINING_COMPLETIONS_FROM_USERS_SET_KEY,
      ...members,
    );
  }

  async getItemCompletionsSummary(query: ItemCompletionsSummaryQueryDto) {
    // For certain types of queries, try to populate completion stats for users
    // that haven't used the system yet.
    const [organizationId, enrollmentId, itemIds] = [
      single(query['user.organization.id']),
      single(query['enrollment.id']),
      asArray(query['item.id']),
    ];

    const validOrganizationSlug =
      await this.organizationsService.getValidOrganizationId(
        organizationId ?? undefined,
        {
          type: 'idToSlug',
        },
      );

    if (validOrganizationSlug && enrollmentId && itemIds.length > 0) {
      // Use Redis set to avoid duplicate work by checking if this population
      // process has already been run.
      const memberValue = [
        validOrganizationSlug,
        enrollmentId,
        itemIds.join(','),
      ].join(':');
      const alreadyPopulated = await this.cache.store.client.sismember(
        this.CHECK_POPULATE_TRAINING_COMPLETIONS_FROM_USERS_SET_KEY,
        memberValue,
      );

      if (!alreadyPopulated) {
        await this.populateEmptyItemCompletionsForUsers({
          organizationSlug: validOrganizationSlug,
          enrollmentId,
          itemIds,
        }).catch((e) => {
          this.logger.error('error populating item completions', e);
        });

        await this.cache.store.client.sadd(
          this.CHECK_POPULATE_TRAINING_COMPLETIONS_FROM_USERS_SET_KEY,
          memberValue,
        );
      }
    }

    let subQb = this.itemCompletionsRepository
      .createQueryBuilder('sub_completions')
      .select('sub_completions.completed', 'completed')
      .leftJoin(`sub_completions.user`, 'user')
      .leftJoin(`user.organization`, 'organization')
      .leftJoin(`user.unit`, 'unit')
      .leftJoin(`sub_completions.enrollment`, 'enrollment')
      .leftJoin(`sub_completions.item`, 'item');

    const user = this.cls.get('user');
    subQb = scopeToOrganizationLevel(
      user,
      subQb,
      'user.unit',
      'user.organization',
    );
    subQb = query.applyToQb(subQb);

    // Move parameters from inner query to outer query.
    const parameters = subQb.getParameters();

    const qb = this.dataSource
      .createQueryBuilder()
      .select(
        `COUNT(CASE WHEN completions.completed = TRUE THEN 1 END)::int`,
        'totalComplete',
      )
      .addSelect(
        `COUNT(CASE WHEN completions.completed = FALSE THEN 1 END)::int`,
        'totalIncomplete',
      )
      .from(`(${subQb.getQuery()})`, 'completions');

    return qb.setParameters(parameters).getRawOne();
  }

  async findItemCompletions(query: ItemCompletionQueryDto) {
    return Paginated.fromQb(this.findItemCompletionsQb(query), query);
  }

  async findItemCompletionsCsv(query: ItemCompletionQueryDto) {
    const qb = this.findItemCompletionsQb(query);
    return qb
      .select('user.familyName', 'Last Name')
      .addSelect('user.givenName', 'First Name')
      .addSelect('user.email', 'Email')
      .addSelect('user.externalId', 'User ID')
      .addSelect('organization.name', 'Organization')
      .addSelect('unit.name', 'Unit')
      .addSelect(
        `REGEXP_REPLACE(item.metadata.title, '<[^>]*>', '', 'g')`,
        'Training Item',
      )
      .addSelect('EXTRACT(YEAR FROM enrollment.startDate)', 'Year')
      .addSelect(
        `TO_CHAR(${qb.alias}.completedOn, 'YYYY-MM-DD')`,
        'Completed On',
      )
      .addSelect(
        `TO_CHAR(${qb.alias}.progress * 100, 'FM999.00"%')`,
        'Percent Watched',
      )
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

  private findItemCompletionsQb(query: ItemCompletionsSummaryQueryDto) {
    return this.getItemCompletionsQb(query);
  }

  private getItemCompletionsQb(
    query: ItemCompletionsSummaryQueryDto,
    forOwnerId?: string,
  ) {
    let qb = this.itemCompletionsRepository.createQueryBuilder();
    const qbAlias = qb.alias;
    qb = qb
      .leftJoinAndSelect(`${qbAlias}.item`, 'item')
      .leftJoinAndSelect(`${qbAlias}.user`, 'user')
      .leftJoinAndSelect(`user.organization`, 'organization')
      .leftJoinAndSelect(`user.unit`, 'unit')
      .leftJoinAndSelect(`${qbAlias}.enrollment`, 'enrollment')
      .leftJoinAndSelect(`enrollment.course`, 'course');

    const user = this.cls.get('user');

    if (forOwnerId) {
      qb = qb.andWhere('user.id = :userId', {
        userId: forOwnerId,
      });
    } else {
      switch (getOrganizationLevel(user)) {
        case LEVEL.ADMIN:
          qb = qb;
          break;
        case LEVEL.ORGANIZATION:
          qb = qb.andWhere('organization.slug = :organizationSlug', {
            organizationSlug: user?.organizationSlug,
          });
          break;
        case LEVEL.UNIT:
          qb = qb.andWhere(getUserUnitPredicate(user));
          break;
        default:
          qb = qb.where('1 = 0');
      }
    }

    if (query) {
      qb = query.applyToQb(qb);
    }

    return qb;
  }

  private async getUserContext(watchId?: string | null) {
    let user = this.cls.get('user');
    let decodedToken: TrainingParticipantRepresentationDto | undefined =
      undefined;

    if (!user && watchId) {
      const viewingUser = await this.opaqueTokenService.validate(
        watchId,
        TrainingParticipantRepresentationDto,
      );

      if (viewingUser) {
        user = new StatelessUser(
          viewingUser.userId,
          null,
          viewingUser.email,
          `${viewingUser.firstName ?? ''} ${viewingUser.lastName ?? ''}`.trim(),
          viewingUser.firstName,
          viewingUser.lastName,
          null,
          [],
          viewingUser.audiences ?? [],
          viewingUser.organizationSlug,
          null,
          viewingUser.unitSlug,
          [],
        );
        decodedToken = viewingUser;
      }
    }

    if (user) {
      return {
        userRep: await this.usersService.updateRepresentation(user),
        user,
        decodedToken,
      };
    }

    throw new UnauthorizedException('No user information found.');
  }

  private async populateEmptyItemCompletionsForUsers({
    organizationSlug,
    itemIds,
    enrollmentId,
  }: {
    organizationSlug?: string;
    itemIds: string[];
    enrollmentId: string;
  }) {
    const enrollmentWithRelevantAudienceSlugs = await this.dataSource
      .getRepository(CourseEnrollment)
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoin('course.audiences', 'audiences')
      .leftJoin('course.presentableBy', 'presentableBy')
      .leftJoin('enrollment.organization', 'organization')
      .select([
        'enrollment.id',
        'course.id',
        'audiences.slug',
        'presentableBy.slug',
      ])
      .where('enrollment.id = :enrollmentId', { enrollmentId })
      .andWhere('organization.slug = :organizationSlug', { organizationSlug })
      .getOne();

    if (!enrollmentWithRelevantAudienceSlugs) return;

    const relevantAudienceSlugs = [
      ...enrollmentWithRelevantAudienceSlugs.course.audiences.map(
        (a) => a.slug,
      ),
      ...enrollmentWithRelevantAudienceSlugs.course.presentableBy.map(
        (a) => a.slug,
      ),
    ];

    const batchSize = 50;
    const batch: Parameters<
      ReturnType<
        ReturnType<
          typeof this.itemCompletionsRepository.createQueryBuilder
        >['insert']
      >['values']
    >[0] = [];

    const processBatch = async () => {
      await this.itemCompletionsRepository
        .createQueryBuilder()
        .insert()
        .values(batch)
        .orIgnore()
        .execute();

      batch.length = 0;
    };

    for await (const user of this.usersService.getAllUsersGenerator({
      organizationSlug,
    })) {
      if (user.source === 'opaque_token') {
        if (
          !itemIds.includes(user.trainingItemId) ||
          user.enrollmentId !== enrollmentId
        ) {
          continue;
        }
      } else if (
        !user.canAccessTraining ||
        !user.audiences?.some((audience) =>
          relevantAudienceSlugs.includes(audience),
        )
      ) {
        continue;
      }

      if (user.source === 'keycloak' && !user.enabled) {
        continue;
      }

      const localUser = await this.usersService.updateRepresentation(
        new StatelessUser(
          user.id,
          user.source === 'keycloak' ? user.idpId ?? null : null,
          user.email,
          [user.firstName, user.lastName].filter(Boolean).join(' '),
          user.firstName,
          user.lastName,
          user.source === 'keycloak' ? user.picture : null,
          [],
          user.source === 'keycloak' ? user.audiences ?? [] : [],
          user.organizationSlug,
          null,
          user.unitSlug,
          [],
        ),
      );

      for (const itemId of itemIds) {
        batch.push({
          item: {
            id: itemId,
          },
          enrollment: {
            id: enrollmentId,
          },
          userId: localUser.id,
          email: user.email,
          url: 'https://threatzero.org',
          audienceSlugs: user.audiences,
        });

        if (batch.length >= batchSize) {
          await processBatch();
        }
      }
    }

    if (batch.length > 0) {
      await processBatch();
    }
  }
}
