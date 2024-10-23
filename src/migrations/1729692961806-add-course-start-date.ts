import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseStartDate1729692961806 implements MigrationInterface {
  name = 'AddCourseStartDate1729692961806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_section" DROP COLUMN "repeats"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" ADD "startDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "availableOn" TYPE date USING "availableOn"::date, ALTER COLUMN "availableOn" SET DEFAULT ('now'::text)::date`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "expiresOn" TYPE date USING "expiresOn"::date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "expiresOn" TYPE timestamptz USING "expiresOn"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "availableOn" TYPE timestamptz USING "availableOn"::timestamptz, ALTER COLUMN "availableOn" SET DEFAULT NOW()`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ADD "repeats" character varying NOT NULL DEFAULT 'once'`,
    );
  }
}
