import { format as csvFormat } from '@fast-csv/format';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { LEVEL } from 'src/auth/permissions';
import { StatelessUser } from 'src/auth/user.factory';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Paginated } from 'src/common/dto/paginated.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { MediaService } from 'src/media/media.service';
import {
  getOrganizationLevel,
  getUserUnitPredicate,
} from 'src/organizations/common/organizations.utils';
import { LmsViewershipTokenValueDto } from 'src/organizations/organizations/dto/lms-viewership-token-value.dto';
import { OrganizationsService } from 'src/organizations/organizations/organizations.service';
import { UsersService } from 'src/users/users.service';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { filterTraining } from '../common/training.utils';
import { CreateItemCompletionDto } from './dto/create-item-completion.dto';
import { ItemCompletionQueryDto } from './dto/item-completion-query.dto';
import { TrainingParticipantRepresentationDto } from './dto/training-participant-representation.dto';
import { UpdateItemCompletionDto } from './dto/update-item-completion.dto';
import { ItemCompletion } from './entities/item-completion.entity';
import { TrainingItem } from './entities/item.entity';
import { Video } from './entities/video-item.entity';

export class ItemsService extends BaseEntityService<TrainingItem> {
  alias = 'item';

  constructor(
    private readonly cls: ClsService<CommonClsStore>,
    @InjectRepository(TrainingItem)
    private itemsRepository: Repository<TrainingItem>,
    @InjectRepository(ItemCompletion)
    private itemCompletionsRepository: Repository<ItemCompletion>,
    private mediaService: MediaService,
    private opaqueTokenService: OpaqueTokenService,
    private organizationsService: OrganizationsService,
    private usersService: UsersService,
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
      'training',
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

    return this.itemCompletionsRepository
      .createQueryBuilder()
      .update()
      .set(values)
      .where(criteria)
      .execute();
  }

  async getMyItemCompletions(query: ItemCompletionQueryDto, watchId?: string) {
    const { userRep } = await this.getUserContext(watchId);
    const qb = this.getItemCompletionsQb(query, userRep.id);

    return Paginated.fromQb(qb, query);
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

  private findItemCompletionsQb(query: ItemCompletionQueryDto) {
    return this.getItemCompletionsQb(query);
  }

  private getItemCompletionsQb(
    query: ItemCompletionQueryDto,
    forOwnerId?: string,
  ) {
    let qb = this.itemCompletionsRepository.createQueryBuilder();
    qb = qb
      .leftJoinAndSelect(`${qb.alias}.item`, 'item')
      .leftJoinAndSelect(`${qb.alias}.user`, 'user')
      .leftJoinAndSelect(`user.organization`, 'organization')
      .leftJoinAndSelect(`user.unit`, 'unit')
      .leftJoinAndSelect(`${qb.alias}.enrollment`, 'enrollment')
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
          viewingUser.email,
          `${viewingUser.firstName ?? ''} ${viewingUser.lastName ?? ''}`.trim(),
          viewingUser.firstName,
          viewingUser.lastName,
          null,
          [],
          viewingUser.audiences ?? [],
          viewingUser.organizationSlug,
          viewingUser.unitSlug,
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
}
