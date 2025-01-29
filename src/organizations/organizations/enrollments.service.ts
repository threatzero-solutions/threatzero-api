import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { LEVEL } from 'src/auth/permissions';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { Repository } from 'typeorm';
import { getOrganizationLevel } from '../common/organizations.utils';
import { CourseEnrollment } from './entities/course-enrollment.entity';

@Injectable()
export class EnrollmentsService extends BaseEntityService<CourseEnrollment> {
  constructor(
    @InjectRepository(CourseEnrollment)
    private courseEnrollmentsRepository: Repository<CourseEnrollment>,
    private readonly cls: ClsService<CommonClsStore>,
  ) {
    super();
  }

  getRepository() {
    return this.courseEnrollmentsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');

    let qb = super.getQb(query);
    qb = qb
      .leftJoin(`${qb.alias}.organization`, 'organization')
      .leftJoinAndSelect(`${qb.alias}.course`, 'course');
    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        return qb;
      default:
        return user?.organizationSlug
          ? qb.andWhere(`organization.slug = :organizationSlug`, {
              organizationSlug: user.organizationSlug,
            })
          : qb.where('1 = 0');
    }
  }
}
