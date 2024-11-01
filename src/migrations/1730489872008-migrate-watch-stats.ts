import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateWatchStats1730489872008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "item_completion" (
            "userId",
            "email",
            "itemId",
            "organizationId",
            "enrollmentId",
            "progress",
            "completed",
            "completedOn",
            "url"
         )
      SELECT DISTINCT ON("watch_stat"."userExternalId", "watch_stat"."trainingItemId", "course_enrollment"."id")
        "watch_stat"."userExternalId",
        "watch_stat"."email",
        "watch_stat"."trainingItemId",
        "watch_stat"."organizationId",
        "course_enrollment"."id",
        COALESCE("watch_stat"."percentWatched", 0) / 100,
        COALESCE("watch_stat"."percentWatched", 0) > 85,
        CASE WHEN "watch_stat"."percentWatched" > 85 THEN NOW() ELSE NULL END,
        ''
      FROM "watch_stat"
      LEFT JOIN "course_enrollment"
      ON ("watch_stat"."trainingCourseId" IS NULL OR
        "watch_stat"."trainingCourseId" = "course_enrollment"."courseId"::TEXT) AND
          "course_enrollment"."organizationId" = "watch_stat"."organizationId"
		 LEFT JOIN "training_course"
		 ON "training_course"."id" = "course_enrollment"."courseId"
		 LEFT JOIN "training_section"
		 ON "training_course"."id" = "training_section"."courseId"
		 LEFT JOIN "training_section_item"
		 ON "training_section"."id" = "training_section_item"."sectionId"
         WHERE
            "watch_stat"."organizationId" IS NOT NULL AND
            "course_enrollment"."id" IS NOT NULL AND
			"training_section_item"."itemId" = "watch_stat"."trainingItemId"
      ON CONFLICT ("userId", "enrollmentId", "itemId") DO NOTHING;`,
    );
  }

  public async down(): Promise<void> {}
}
