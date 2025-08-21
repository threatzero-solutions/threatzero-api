import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { LEVEL } from 'src/auth/permissions';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { TrainingVisibility } from 'src/training/common/training.types';
import { DataSource, Repository } from 'typeorm';
import { getOrganizationLevel } from '../common/organizations.utils';
import { LatestCourseEnrollmentsQueryDto } from './dto/latest-course-enrollments-query.dto';
import { RelativeCourseEnrollmentsQueryDto } from './dto/relative-course-enrollments-query.dto';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { OrganizationsService } from './organizations.service';

@Injectable()
export class EnrollmentsService extends BaseEntityService<CourseEnrollment> {
  constructor(
    @InjectRepository(CourseEnrollment)
    private courseEnrollmentsRepository: Repository<CourseEnrollment>,
    private dataSource: DataSource,
    private readonly cls: ClsService<CommonClsStore>,
    private organizationsService: OrganizationsService,
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
          ? qb
              .andWhere(`organization.slug = :organizationSlug`, {
                organizationSlug: user.organizationSlug,
              })
              .andWhere(`${qb.alias}.visibility = :visibility`, {
                visibility: TrainingVisibility.VISIBLE,
              })
          : qb.where('1 = 0');
    }
  }

  async getLatestEnrollments(
    organizationId: string,
    query: LatestCourseEnrollmentsQueryDto,
  ) {
    const validOrganizationId =
      await this.getValidOrganizationId(organizationId);

    let rankedEnrollmentsQb = this.dataSource
      .createQueryBuilder()
      .select('enrollment."courseId"', 'course_id')
      .addSelect('enrollment."id"', 'enrollment_id')
      .addSelect('enrollment."startDate"', 'start_date')
      .addSelect(
        'MIN(enrollment."startDate") OVER (PARTITION BY enrollment."courseId")',
        'earliest_start_date',
      )
      .addSelect(
        'ROW_NUMBER() OVER (PARTITION BY enrollment."courseId" ORDER BY enrollment."startDate" DESC)',
        'rn',
      )
      .from(CourseEnrollment, 'enrollment')
      .where('enrollment."organizationId"::text = :organizationId', {
        organizationId: validOrganizationId,
      });

    if (!query.includeHidden) {
      rankedEnrollmentsQb = rankedEnrollmentsQb.andWhere(
        'enrollment."visibility" = :visibility',
        {
          visibility: TrainingVisibility.VISIBLE,
        },
      );
    }

    if (query.onlyCurrent) {
      rankedEnrollmentsQb = rankedEnrollmentsQb.andWhere(
        'enrollment."startDate" <= CURRENT_DATE',
      );
    }

    return await this.dataSource
      .createQueryBuilder()
      .addCommonTableExpression(rankedEnrollmentsQb, 'ranked_enrollments')
      .select('enrollment_id', 'id')
      .addSelect('start_date = earliest_start_date', 'isOnlyEnrollment')
      .from('ranked_enrollments', 'ranked_enrollments')
      .where('rn = 1')
      .getRawMany();
  }

  async getRelativeEnrollment(
    organizationId: string,
    enrollmentId: string,
    query: RelativeCourseEnrollmentsQueryDto,
  ) {
    const validOrganizationId =
      await this.getValidOrganizationId(organizationId);

    let rankedEnrollmentsQb = this.dataSource
      .createQueryBuilder()
      .select('enrollment."courseId"', 'courseId')
      .addSelect('enrollment."id"', 'id')
      .addSelect('enrollment."startDate"', 'startDate')
      .addSelect('enrollment."endDate"', 'endDate')
      .addSelect('enrollment."visibility"', 'visibility')
      .addSelect('enrollment."organizationId"', 'organizationId')
      .addSelect(
        'enrollment."startDate" IS NULL OR enrollment."startDate" = MIN(enrollment."startDate") OVER (PARTITION BY enrollment."courseId")',
        'isEarliest',
      )
      .addSelect(
        'enrollment."startDate" IS NULL OR enrollment."startDate" = MAX(enrollment."startDate") OVER (PARTITION BY enrollment."courseId")',
        'isLatest',
      )
      .from(CourseEnrollment, 'enrollment')
      .where('enrollment."organizationId"::text = :organizationId', {
        organizationId: validOrganizationId,
      });

    if (!query.includeHidden) {
      rankedEnrollmentsQb = rankedEnrollmentsQb.andWhere(
        'enrollment."visibility" = :visibility',
        {
          visibility: TrainingVisibility.VISIBLE,
        },
      );
    }

    const result = await this.dataSource
      .createQueryBuilder()
      .addCommonTableExpression(rankedEnrollmentsQb, 'ranked_enrollments')
      .select('*')
      .from('ranked_enrollments', 'ranked_enrollments')
      .where('id::text = :id', { id: enrollmentId })
      .getRawOne();

    if (!result) {
      throw new NotFoundException('Enrollment not found');
    }

    return result;
  }

  async getPreviousEnrollment(
    organizationId: string,
    enrollmentId: string,
    query: RelativeCourseEnrollmentsQueryDto,
  ) {
    return await this.getAdjacentEnrollment(
      organizationId,
      enrollmentId,
      'previous',
      query,
    );
  }

  async getNextEnrollment(
    organizationId: string,
    enrollmentId: string,
    query: RelativeCourseEnrollmentsQueryDto,
  ) {
    return await this.getAdjacentEnrollment(
      organizationId,
      enrollmentId,
      'next',
      query,
    );
  }

  private async getAdjacentEnrollment(
    organizationId: string,
    enrollmentId: string,
    direction: 'previous' | 'next',
    query: RelativeCourseEnrollmentsQueryDto,
  ) {
    const validOrganizationId =
      await this.getValidOrganizationId(organizationId);

    let currentEnrollmentQb = this.dataSource
      .createQueryBuilder()
      .select('enrollment."courseId"', 'courseId')
      .addSelect('enrollment."startDate"', 'startDate')
      .from(CourseEnrollment, 'enrollment')
      .where('enrollment."organizationId"::text = :organizationId', {
        organizationId: validOrganizationId,
      })
      .andWhere('enrollment.id::text = :enrollmentId', {
        enrollmentId,
      });

    if (!query.includeHidden) {
      currentEnrollmentQb = currentEnrollmentQb.andWhere(
        'enrollment."visibility" = :visibility',
        {
          visibility: TrainingVisibility.VISIBLE,
        },
      );
    }

    let enrollmentWindowQb = this.dataSource
      .createQueryBuilder()
      .select('enrollment."courseId"', 'courseId')
      .addSelect('MIN(enrollment."startDate")', 'minStartDate')
      .addSelect('MAX(enrollment."startDate")', 'maxStartDate')
      .from(CourseEnrollment, 'enrollment')
      .where('enrollment."organizationId"::text = :organizationId', {
        organizationId: validOrganizationId,
      })
      .andWhere(
        'enrollment."courseId" IN (SELECT "courseId" FROM current_enrollment)',
      )
      .groupBy('enrollment."courseId"');

    if (!query.includeHidden) {
      enrollmentWindowQb = enrollmentWindowQb.andWhere(
        'enrollment."visibility" = :visibility',
        {
          visibility: TrainingVisibility.VISIBLE,
        },
      );
    }

    const result = await this.dataSource
      .createQueryBuilder()
      .addCommonTableExpression(currentEnrollmentQb, 'current_enrollment')
      .addCommonTableExpression(enrollmentWindowQb, 'enrollment_window')
      .select('ce.id', 'id')
      .addSelect('ce."courseId"', 'courseId')
      .addSelect('ce."startDate"', 'startDate')
      .addSelect('ce."endDate"', 'endDate')
      .addSelect('ce."visibility"', 'visibility')
      .addSelect('ce."organizationId"', 'organizationId')
      .addSelect('ce."startDate" = ew."minStartDate"', 'isEarliest')
      .addSelect('ce."startDate" = ew."maxStartDate"', 'isLatest')
      .from(CourseEnrollment, 'ce')
      .innerJoin(
        'current_enrollment',
        'curr',
        'curr."courseId" = ce."courseId"',
      )
      .innerJoin('enrollment_window', 'ew', 'ew."courseId" = ce."courseId"')
      .where('ce.id::text != :enrollmentId', {
        enrollmentId,
      })
      .andWhere('ce."organizationId"::text = :organizationId', {
        organizationId: validOrganizationId,
      })
      .andWhere(
        direction === 'next'
          ? 'ce."startDate" >= curr."startDate"'
          : 'ce."startDate" <= curr."startDate"',
      )
      .orderBy('ce."startDate"', direction === 'next' ? 'ASC' : 'DESC')
      .limit(1)
      .getRawOne();

    if (!result) {
      throw new NotFoundException('Enrollment not found');
    }

    return result;
  }

  private async getValidOrganizationId(organizationId: string) {
    const validOrganizationId =
      await this.organizationsService.getValidOrganizationId(organizationId);

    if (!validOrganizationId) {
      throw new NotFoundException('Organization not found');
    }

    return validOrganizationId;
  }
}
