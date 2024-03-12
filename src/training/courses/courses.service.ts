import { Inject, Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/utils';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Injectable({ scope: Scope.REQUEST })
export class CoursesService extends BaseEntityService<Course> {
  alias = 'course';

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
  ) {
    super();
  }

  getRepository() {
    return this.coursesRepository;
  }

  getQb(query?: BaseQueryDto) {
    let qb = super
      .getQb(query)
      .leftJoinAndSelect('course.audiences', 'audience')
      .leftJoinAndSelect('course.presentableBy', 'presentableBy');

    qb = filterTraining(this.request, qb);

    return qb;
  }

  getQbSingle(id: string) {
    return super
      .getQbSingle(id)
      .leftJoinAndSelect('course.organizations', 'organization')
      .leftJoinAndSelect('course.sections', 'section')
      .leftJoinAndSelect('section.items', 'section_items')
      .leftJoinAndSelect('section_items.item', 'item');
  }
}
