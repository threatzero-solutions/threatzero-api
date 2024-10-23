import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseEndDate1729702458384 implements MigrationInterface {
  name = 'AddCourseEndDate1729702458384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "training_course" ADD "endDate" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "endDate"`,
    );
  }
}
