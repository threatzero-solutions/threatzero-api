import { UnauthorizedException } from '@nestjs/common';
import { TrainingItem } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { filterTraining } from '../common/training.utils';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Video } from './entities/video-item.entity';
import { MediaService } from 'src/media/media.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { TrainingParticipantRepresentationDto } from './dto/training-participant-representation.dto';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { ItemCompletion } from './entities/item-completion.entity';
import { StatelessUser } from 'src/auth/user.factory';
import { CreateItemCompletionDto } from './dto/create-item-completion.dto';
import { UpdateItemCompletionDto } from './dto/update-item-completion.dto';
import { UnitsService } from 'src/organizations/units/units.service';
import { OrganizationsService } from 'src/organizations/organizations/organizations.service';
import { ItemCompletionQueryDto } from './dto/item-completion-query.dto';
import { getAllowedOrganizationUnits } from 'src/organizations/common/organizations.utils';
import { UsersService } from 'src/users/users.service';
import { UserRepresentation } from 'src/users/entities/user-representation.entity';
import { Paginated } from 'src/common/dto/paginated.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { LmsViewershipTokenValueDto } from 'src/organizations/organizations/dto/lms-viewership-token-value.dto';

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
    private unitsService: UnitsService,
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
    const { user, decodedToken } = await this.getWatcher(watchId);

    if (decodedToken) {
      createItemCompletionDto.enrollment.id = decodedToken.enrollmentId;
      createItemCompletionDto.item.id = decodedToken.trainingItemId;
    } else {
      // Make sure user has access to item.
      await this.getQb()
        .where({ id: createItemCompletionDto.item.id })
        .getOneOrFail();
    }

    const rawItemCompletion: DeepPartial<ItemCompletion> = {
      ...createItemCompletionDto,
      userId: user.id,
      email: user.email,
      audienceSlugs: user.audiences,
    };

    if (user.unitSlug) {
      const unit = await this.unitsService
        .getQb()
        .andWhere({ slug: user.unitSlug })
        .getOneOrFail();

      rawItemCompletion.unit = {
        id: unit.id,
      };
      rawItemCompletion.organization = {
        id: unit.organization.id,
      };
    } else if (user.organizationSlug) {
      const organization = await this.organizationsService
        .getQb()
        .andWhere({ slug: user.organizationSlug })
        .getOneOrFail();

      rawItemCompletion.organization = {
        id: organization.id,
      };
    }

    const [itemCompletion] = await Promise.all([
      this.itemCompletionsRepository.save(
        this.itemCompletionsRepository.create(rawItemCompletion),
      ),
      this.usersService.updateRepresentation(user),
    ]);

    return itemCompletion;
  }

  async updateMyItemCompletion(
    id: ItemCompletion['id'],
    updateItemCompletionDto: UpdateItemCompletionDto,
    watchId?: string,
  ) {
    const { user } = await this.getWatcher(watchId);

    const criteria: FindOptionsWhere<ItemCompletion> = {
      id,
      userId: user.id,
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

  async getMyItemCompletions(query: BaseQueryDto, watchId?: string) {
    const { user } = await this.getWatcher(watchId);
    const qb = this.getItemCompletionsQb(query).andWhere({ userId: user?.id });

    return Paginated.fromQb(qb, query);
  }

  async getItemCompletions(query: BaseQueryDto) {
    let qb = this.getItemCompletionsQb(query);
    qb = qb.leftJoinAndMapOne(
      `${qb.alias}.user`,
      UserRepresentation,
      'user',
      `user.externalId = ${qb.alias}.userId`,
    );

    return Paginated.fromQb(qb, query);
  }

  private getItemCompletionsQb(query: ItemCompletionQueryDto) {
    let qb = this.itemCompletionsRepository.createQueryBuilder();
    qb = qb
      .leftJoinAndSelect(`${qb.alias}.item`, 'item')
      .leftJoinAndSelect(`${qb.alias}.organization`, 'organization')
      .leftJoinAndSelect(`${qb.alias}.unit`, 'unit')
      .leftJoinAndSelect(`${qb.alias}.enrollment`, 'enrollment')
      .leftJoinAndSelect(`enrollment.course`, 'course');

    const { unitSlugs, organizationSlugs } = getAllowedOrganizationUnits(
      this.cls.get('user'),
    );

    query['unit.slug'] = unitSlugs;
    query['organization.slug'] = organizationSlugs;

    if (query) {
      qb = query.applyToQb(qb);
    }

    return qb;
  }

  private async getWatcher(watchId?: string | null) {
    const user = this.cls.get('user');

    if (user) {
      return {
        user,
      };
    }

    if (watchId) {
      const viewingUser = await this.opaqueTokenService.validate(
        watchId,
        TrainingParticipantRepresentationDto,
      );

      if (viewingUser) {
        return {
          user: new StatelessUser(
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
          ),
          decodedToken: viewingUser,
        };
      }
    }

    throw new UnauthorizedException('No user information found.');
  }
}
