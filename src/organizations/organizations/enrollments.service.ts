import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-ioredis-yet';
import { ClsService } from 'nestjs-cls';
import { LEVEL } from 'src/auth/permissions';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { TrainingVisibility } from 'src/training/common/training.types';
import { DataSource, Repository } from 'typeorm';
import { getOrganizationLevel } from '../common/organizations.utils';
import { LatestCourseEnrollmentsQueryDto } from './dto/latest-course-enrollments-query.dto';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { Organization } from './entities/organization.entity';

@Injectable()
export class EnrollmentsService extends BaseEntityService<CourseEnrollment> {
  constructor(
    @InjectRepository(CourseEnrollment)
    private courseEnrollmentsRepository: Repository<CourseEnrollment>,
    private dataSource: DataSource,
    private readonly cls: ClsService<CommonClsStore>,
    @Inject(CACHE_MANAGER) private cache: Cache<RedisStore>,
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

  async getRelativeEnrollment(organizationId: string, enrollmentId: string) {
    const validOrganizationId =
      await this.getValidOrganizationId(organizationId);

    const rankedEnrollmentsQb = this.dataSource
      .createQueryBuilder()
      .select('enrollment."courseId"', 'courseId')
      .addSelect('enrollment."id"', 'id')
      .addSelect('enrollment."startDate"', 'startDate')
      .addSelect('enrollment."endDate"', 'endDate')
      .addSelect('enrollment."visibility"', 'visibility')
      .addSelect('enrollment."organizationId"', 'organizationId')
      .addSelect(
        'enrollment."startDate" = MIN(enrollment."startDate") OVER (PARTITION BY enrollment."courseId")',
        'isEarliest',
      )
      .addSelect(
        'enrollment."startDate" = MAX(enrollment."startDate") OVER (PARTITION BY enrollment."courseId")',
        'isLatest',
      )
      .from(CourseEnrollment, 'enrollment')
      .where('enrollment."organizationId"::text = :organizationId', {
        organizationId: validOrganizationId,
      });

    return await this.dataSource
      .createQueryBuilder()
      .addCommonTableExpression(rankedEnrollmentsQb, 'ranked_enrollments')
      .select('*')
      .from('ranked_enrollments', 'ranked_enrollments')
      .where('id::text = :id', { id: enrollmentId })
      .getRawOne();
  }

  async getPreviousEnrollment(organizationId: string, enrollmentId: string) {
    return await this.getAdjacentEnrollment(
      organizationId,
      enrollmentId,
      'previous',
    );
  }

  async getNextEnrollment(organizationId: string, enrollmentId: string) {
    return await this.getAdjacentEnrollment(
      organizationId,
      enrollmentId,
      'next',
    );
  }

  private async getAdjacentEnrollment(
    organizationId: string,
    enrollmentId: string,
    direction: 'previous' | 'next',
  ) {
    const validOrganizationId =
      await this.getValidOrganizationId(organizationId);

    return await this.dataSource
      .createQueryBuilder()
      .addCommonTableExpression(
        this.dataSource
          .createQueryBuilder()
          .select('enrollment."courseId"', 'courseId')
          .addSelect('enrollment."startDate"', 'startDate')
          .from(CourseEnrollment, 'enrollment')
          .where('enrollment."organizationId"::text = :organizationId', {
            organizationId: validOrganizationId,
          })
          .andWhere('enrollment.id::text = :enrollmentId', {
            enrollmentId,
          }),
        'current_enrollment',
      )
      .addCommonTableExpression(
        this.dataSource
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
          .groupBy('enrollment."courseId"'),
        'enrollment_window',
      )
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
  }

  private async getValidOrganizationId(organizationId: string) {
    const user = this.cls.get('user');

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.hasPermission(LEVEL.ADMIN)) {
      return organizationId;
    }

    if (user.organizationSlug) {
      const cacheKey = `organization-id-by-slug:${user.organizationSlug}`;
      const cachedOrganizationId = await this.cache.get<string>(cacheKey);

      if (cachedOrganizationId) {
        return cachedOrganizationId;
      }
      const organization = await this.dataSource
        .getRepository(Organization)
        .findOne({
          where: {
            slug: user.organizationSlug,
          },
        });

      if (organization) {
        await this.cache.set(
          cacheKey,
          organization.id,
          1000 * 60 * 60 * 24, // 24 hours
        );
        return organization.id;
      }
    }

    throw new NotFoundException('Organization not found');
  }
}
