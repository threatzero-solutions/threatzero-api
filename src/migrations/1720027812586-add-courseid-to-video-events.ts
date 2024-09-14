import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseidToVideoEvents1720027812586
  implements MigrationInterface
{
  name = 'AddCourseidToVideoEvents1720027812586';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video_event" ADD "courseId" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "video_event" DROP COLUMN "courseId"`);
  }
}
