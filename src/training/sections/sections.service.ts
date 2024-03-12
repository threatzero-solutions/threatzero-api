import { Inject, Injectable, Scope } from '@nestjs/common';
import { Section } from './entities/section.entity';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/utils';
import { Request } from 'express';
import { BaseEntityService } from 'src/common/base-entity.service';

@Injectable({ scope: Scope.REQUEST })
export class SectionsService extends BaseEntityService<Section> {
  alias = 'section';

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectRepository(Section)
    private sectionsRepository: Repository<Section>,
  ) {
    super();
  }

  getRepository() {
    return this.sectionsRepository;
  }

  getQb() {
    let qb = super
      .getQb()
      .leftJoin('section.course', 'course')
      .leftJoinAndSelect('section.items', 'sectionItems')
      .leftJoinAndSelect('sectionItems.item', 'item');

    qb = filterTraining(this.request, qb);

    return qb;
  }
}
