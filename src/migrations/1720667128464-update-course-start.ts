import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCourseStart1720667128464 implements MigrationInterface {
  name = 'UpdateCourseStart1720667128464';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_section" DROP COLUMN "isStart"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" ADD "startMonth" smallint NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" ADD "startDay" smallint NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "startDay"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "startMonth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ADD "isStart" boolean NOT NULL DEFAULT false`,
    );
  }
}
