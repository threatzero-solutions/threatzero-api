import { Inject, Injectable, Scope } from '@nestjs/common';
import { Section } from './entities/section.entity';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/training.utils';
import { Request } from 'express';
import { BaseEntityService } from 'src/common/base-entity.service';
import { MediaService } from 'src/media/media.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CreateSectionDto } from './dto/create-section.dto';

@Injectable({ scope: Scope.REQUEST })
export class SectionsService extends BaseEntityService<Section> {
  alias = 'section';

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectRepository(Section)
    private sectionsRepository: Repository<Section>,
    private mediaService: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.sectionsRepository;
  }

  getQb(query?: BaseQueryDto, courseId?: string) {
    let qb = super
      .getQb(query)
      .leftJoin('section.course', 'course')
      .leftJoinAndSelect('section.items', 'sectionItems')
      .leftJoinAndSelect('sectionItems.item', 'item')
      .where('course.id = :courseId', { courseId: courseId || '' });

    qb = filterTraining(this.request, qb);

    return qb;
  }

  async mapResult(section: Section) {
    await section.loadVideoThumbnails(
      this.mediaService.getThumbnailUrlForVimeoUrl,
    );
    return section;
  }

  async create(createSectionDto: CreateSectionDto, courseId: string) {
    return super.create({ ...createSectionDto, course: { id: courseId } });
  }
}
