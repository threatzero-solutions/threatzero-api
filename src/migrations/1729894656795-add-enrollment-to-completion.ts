import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrollmentToCompletion1729894656795
  implements MigrationInterface
{
  name = 'AddEnrollmentToCompletion1729894656795';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ae7aa28aaf8ba30038b521b6cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fd815424b8d1469841966dded9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "UQ_ae7aa28aaf8ba30038b521b6cdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD "enrollmentId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3b7ec3e2c2ac8629ddb4b595e" ON "item_completion" ("userId", "enrollmentId", "itemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_865ecb84c854eea054ac4a301d" ON "item_completion" ("organizationId", "unitId", "enrollmentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8" UNIQUE ("userId", "enrollmentId", "itemId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_ed553f44fb9a5ee22d7b62fb73a" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `UPDATE "item_completion"
        SET "enrollmentId" = "course_enrollment"."id"
        FROM "course_enrollment"
        WHERE "course_enrollment"."courseId" = "item_completion"."courseId"
            AND "course_enrollment"."organizationId" = "item_completion"."organizationId"`,
    );
    await queryRunner.query(
      `UPDATE "opaque_token"
        SET "value" = jsonb_set("value", '{enrollmentId}', to_jsonb("course_enrollment"."id"::TEXT), true)
        FROM "course_enrollment"
        LEFT JOIN "organization" ON "organization"."id" = "course_enrollment"."organizationId"
        WHERE "opaque_token"."type" = 'training'
            AND "opaque_token"."value"->>'trainingCourseId' = "course_enrollment"."courseId"::TEXT
            AND "opaque_token"."value"->>'organizationSlug' = "organization"."slug"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_ed553f44fb9a5ee22d7b62fb73a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_865ecb84c854eea054ac4a301d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3b7ec3e2c2ac8629ddb4b595e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP COLUMN "enrollmentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "UQ_ae7aa28aaf8ba30038b521b6cdd" UNIQUE ("userId", "itemId", "courseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd815424b8d1469841966dded9" ON "item_completion" ("courseId", "organizationId", "unitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae7aa28aaf8ba30038b521b6cd" ON "item_completion" ("userId", "itemId", "courseId") `,
    );
  }
}
