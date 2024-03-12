import { Inject, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { Item } from './entities/item.entity';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/utils';
import { BaseEntityService } from 'src/common/base-entity.service';

@Injectable({ scope: Scope.REQUEST })
export class ItemsService extends BaseEntityService<Item> {
  alias = 'item';

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
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
}
