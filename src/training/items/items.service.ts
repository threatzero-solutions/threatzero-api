import { UnauthorizedException } from '@nestjs/common';
import { TrainingItem } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/training.utils';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Video } from './entities/video-item.entity';
import { MediaService } from 'src/media/media.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { TrainingParticipantRepresentationDto } from './dto/training-participant-representation.dto';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

export class ItemsService extends BaseEntityService<TrainingItem> {
  alias = 'item';

  constructor(
    private readonly cls: ClsService<CommonClsStore>,
    @InjectRepository(TrainingItem)
    private itemsRepository: Repository<TrainingItem>,
    private mediaService: MediaService,
    private opaqueTokenService: OpaqueTokenService,
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
}
