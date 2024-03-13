import { Inject, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { Item } from './entities/item.entity';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/training.utils';
import { BaseEntityService } from 'src/common/base-entity.service';
import { VideoItem } from './entities/video-item.entity';
import { MediaService } from 'src/media/media.service';

@Injectable({ scope: Scope.REQUEST })
export class ItemsService extends BaseEntityService<Item> {
  alias = 'item';

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private mediaService: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.itemsRepository;
  }

  getQb() {
    let qb = super
      .getQb()
      .leftJoin('item.sectionItems', 'section_item')
      .leftJoin('section_item.section', 'section')
      .leftJoin('section.course', 'course');

    qb = filterTraining(this.request, qb);

    return qb;
  }

  async mapResult(item: Item) {
    if (item instanceof VideoItem) {
      await item.loadThumbnailUrl(this.mediaService.getThumbnailUrlForVimeoUrl);
    }
    return item;
  }
}
