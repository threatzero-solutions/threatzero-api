import {
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TrainingItem } from './entities/item.entity';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/training.utils';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Video } from './entities/video-item.entity';
import { MediaService } from 'src/media/media.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { TrainingParticipantRepresentationDto } from './dto/training-participant-representation.dto';

@Injectable({ scope: Scope.REQUEST })
export class ItemsService extends BaseEntityService<TrainingItem> {
  alias = 'item';

  constructor(
    @Inject(REQUEST) private request: Request,
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
    let qb = super
      .getQb(query)
      .leftJoin('item.sectionItems', 'section_item')
      .leftJoin('section_item.section', 'section')
      .leftJoin('section.course', 'course');

    qb = filterTraining(this.request, qb);

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
