import { VideoEvent } from 'src/media/entities/video-event.entity';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from 'src/organizations/units/entities/unit.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';
import { TrainingItem } from 'src/training/items/entities/item.entity';
import { UserRepresentation } from 'src/users/entities/user-representation.entity';
import { DataSource, Index, ViewColumn, ViewEntity } from 'typeorm';

// Determines maximum distance between watch events that are still considered
// continous play.
const MAX_SECONDS_BETWEEN_PLAYS = 6;

@ViewEntity({
  materialized: true,
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .addCommonTableExpression(
        dataSource
          .createQueryBuilder()
          .select('video_event."userId"', 'user_id')
          .addSelect('video_event."unitSlug"', 'unit_slug')
          .addSelect('video_event."itemId"', 'item_id')
          .addSelect('video_event."courseId"', 'course_id')
          .addSelect('video_event."type"', 'type')
          .addSelect('video_event."timestamp"', 'timestamp')
          .addSelect(
            `(video_event."eventData"->>'loaded')::NUMERIC`,
            'loaded_pct',
          )
          .addSelect(
            `(video_event."eventData"->>'loadedSeconds')::NUMERIC`,
            'loaded_seconds',
          )
          .addSelect(
            `(video_event."eventData"->>'playedSeconds')::NUMERIC`,
            'played_seconds',
          )
          .addSelect(
            `LAG((video_event."eventData"->>'playedSeconds')::NUMERIC) OVER (PARTITION BY video_event."userId", video_event."itemId" ORDER BY (video_event."eventData"->>'playedSeconds')::NUMERIC)`,
            'lag_played_seconds',
          )
          .addSelect(
            `MAX((video_event."eventData"->>'playedSeconds')::NUMERIC) OVER (PARTITION BY video_event."userId", video_event."itemId" ORDER BY (video_event."eventData"->>'playedSeconds')::NUMERIC)`,
            'max_played_seconds',
          )
          .addSelect(
            `
            CASE
              WHEN EXTRACT(MONTH FROM video_event."timestamp") > COALESCE(course."startMonth", 1) OR (
                EXTRACT(MONTH FROM video_event."timestamp") = COALESCE(course."startMonth", 1) AND
                EXTRACT(DAY FROM video_event."timestamp") >= COALESCE(course."startDay", 1)
              )
            THEN EXTRACT(YEAR FROM video_event."timestamp")
            ELSE EXTRACT(YEAR FROM video_event."timestamp") - 1
            END
            `,
            'year',
          )
          .from(VideoEvent, 'video_event')
          .leftJoin(
            TrainingCourse,
            'course',
            'course.id::TEXT = video_event."courseId"',
          )
          .orderBy('played_seconds', 'ASC'),
        'ordered_events',
      )
      .addCommonTableExpression(
        dataSource
          .createQueryBuilder()
          .select([
            'user_id',
            'unit_slug',
            'item_id',
            'type',
            'timestamp',
            'loaded_seconds',
            'played_seconds',
            'year',
            'course_id',
          ])
          .addSelect(
            `
            SUM(
              CASE
              WHEN played_seconds >= max_played_seconds AND ABS(played_seconds - lag_played_seconds) < ${MAX_SECONDS_BETWEEN_PLAYS} THEN played_seconds - lag_played_seconds
              ELSE 0
                END
            ) OVER (
              PARTITION BY user_id, item_id
              ORDER BY played_seconds
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
            `,
            'rolling_sum_seconds_watched',
          )
          .from('ordered_events', 'ordered_events'),
        'rolling_sums',
      )
      .addCommonTableExpression(
        dataSource
          .createQueryBuilder()
          .select('item_id')
          .addSelect('MAX(loaded_seconds / loaded_pct)', 'duration')
          .from('ordered_events', 'ordered_events')
          .where('loaded_pct > 0')
          .groupBy('item_id'),
        'video_duration',
      )
      .addCommonTableExpression(
        dataSource
          .createQueryBuilder()
          .select(['user_id', 'unit_slug', 'item_id', 'year', 'course_id'])
          .addSelect('MAX(rolling_sum_seconds_watched)', 'total_played_seconds')
          .from('rolling_sums', 'rolling_sums')
          .groupBy('user_id')
          .addGroupBy('item_id')
          .addGroupBy('year')
          .addGroupBy('course_id')
          .addGroupBy('unit_slug'),
        'user_video_progress',
      )
      .select('training_item."id"', 'trainingItemId')
      .addSelect('user_video_progress."course_id"', 'trainingCourseId')
      .addSelect('training_item."metadataTitle"', 'trainingItemTitle')
      .addSelect(
        'ROUND(100.0 * user_video_progress.total_played_seconds / video_duration.duration, 2)',
        'percentWatched',
      )
      .addSelect('user_video_progress.year', 'year')
      .addSelect('user_representation."id"', 'userId')
      .addSelect('user_representation."externalId"', 'userExternalId')
      .addSelect('user_representation."givenName"', 'firstName')
      .addSelect('user_representation."familyName"', 'lastName')
      .addSelect('user_representation."email"', 'email')
      .addSelect('organization.id', 'organizationId')
      .addSelect('organization.slug', 'organizationSlug')
      .addSelect('organization.name', 'organizationName')
      .addSelect('unit.id', 'unitId')
      .addSelect('unit.slug', 'unitSlug')
      .addSelect('unit.name', 'unitName')
      .from('user_video_progress', 'user_video_progress')
      .leftJoin(
        TrainingItem,
        'training_item',
        'user_video_progress.item_id = training_item.id::TEXT',
      )
      .leftJoin(
        'video_duration',
        'video_duration',
        'video_duration.item_id = training_item.id::TEXT',
      )
      .leftJoin(
        UserRepresentation,
        'user_representation',
        'user_representation."externalId" = user_video_progress.user_id',
      )
      .leftJoin(Unit, 'unit', 'unit.slug = unit_slug')
      .leftJoin(
        Organization,
        'organization',
        'organization.id = unit."organizationId"',
      ),
})
@Index(['organizationSlug', 'unitSlug', 'trainingItemId'])
@Index(['organizationId', 'unitId', 'trainingItemId'])
export class WatchStat {
  @ViewColumn()
  trainingItemId: string;

  @ViewColumn()
  trainingItemTitle: string;

  @ViewColumn()
  trainingCourseId: string;

  @ViewColumn()
  percentWatched: number;

  @ViewColumn()
  year: number;

  @Index('watch_stat_user_id_idx')
  @ViewColumn()
  userId: string;

  @Index('watch_stat_user_external_id_idx')
  @ViewColumn()
  userExternalId: string;

  @ViewColumn()
  firstName: string;

  @ViewColumn()
  lastName: string;

  @Index('watch_stat_email_idx')
  @ViewColumn()
  email: string;

  @ViewColumn()
  organizationId: string;

  @ViewColumn()
  organizationSlug: string;

  @ViewColumn()
  organizationName: string;

  @ViewColumn()
  unitId: string;

  @ViewColumn()
  unitSlug: string;

  @ViewColumn()
  unitName: string;
}
