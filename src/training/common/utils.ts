import { Request } from 'express';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { TrainingVisibility } from '../courses/entities/course.entity';
import { TrainingMetadata } from './entities/training-metadata.entity';
import { LEVEL, WRITE } from 'src/auth/permissions';

export const isTrainingAdmin = (req: Request) => {
  return (
    req.user?.hasPermission(LEVEL.ADMIN) &&
    req.user?.hasPermission(WRITE.COURSES)
  );
};

export const filterTraining = <
  T extends ObjectLiteral & { metadata: TrainingMetadata },
>(
  req: Request,
  qb: SelectQueryBuilder<T>,
): SelectQueryBuilder<T> => {
  if (isTrainingAdmin(req)) {
    return qb;
  }

  let _qb = qb;

  const audienceSlugs = req.user?.audiences;

  if (!audienceSlugs?.length) {
    return _qb.andWhere('1 = 0');
  }

  const audienceFilter = `IN (${audienceSlugs
    .map((s) => `'${s}'`)
    .join(', ')})`;

  // Filter by audiences.
  _qb = _qb
    .leftJoin('course.audiences', 'course_by_audience')
    .leftJoin('course.presentableBy', 'course_by_presentableBy')
    .andWhere(
      `(course_by_audience.slug ${audienceFilter} OR course_by_presentableBy.slug ${audienceFilter})`,
    );

  // Filter by visibility.
  _qb = _qb.andWhere('course.visibility = :visibility', {
    visibility: TrainingVisibility.VISIBLE,
  });

  // Filter by organization if set.
  _qb = _qb
    .leftJoin('course.organizations', 'course_by_organization')
    .andWhere('course_by_organization.slug = :organizationSlug', {
      organizationSlug: req.user?.organizationSlug,
    });

  return _qb;
};
