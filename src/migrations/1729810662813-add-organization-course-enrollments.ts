import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationCourseEnrollments1729810662813
  implements MigrationInterface
{
  name = 'AddOrganizationCourseEnrollments1729810662813';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."course_enrollment_visibility_enum" AS ENUM('visible', 'hidden')`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_enrollment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "startDate" date, "endDate" date, "visibility" "public"."course_enrollment_visibility_enum" NOT NULL DEFAULT 'hidden', "organizationId" uuid, "courseId" uuid, CONSTRAINT "PK_3ae773370689173c290163de513" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "endDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ADD CONSTRAINT "FK_22b214a9f05eb12c54914c08b7e" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ADD CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03" FOREIGN KEY ("courseId") REFERENCES "training_course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "course_enrollment" ("startDate", "endDate", "visibility", "organizationId", "courseId")
        SELECT NULL, NULL, 'visible', tcoo."organizationId", tcoo."trainingCourseId"
        FROM "training_course_organizations_organization" AS "tcoo"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_22b214a9f05eb12c54914c08b7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" ADD "startDate" date`,
    );
    await queryRunner.query(`ALTER TABLE "training_course" ADD "endDate" date`);
    await queryRunner.query(`DROP TABLE "course_enrollment"`);
    await queryRunner.query(
      `DROP TYPE "public"."course_enrollment_visibility_enum"`,
    );
  }
}
