import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCompletionCourse1729897158293 implements MigrationInterface {
  name = 'DropCompletionCourse1729897158293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_2a102620a39d42c098b3d354654"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP COLUMN "courseId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD "courseId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_2a102620a39d42c098b3d354654" FOREIGN KEY ("courseId") REFERENCES "training_course"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
