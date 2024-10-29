import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeToSectionDurations1730141062384
  implements MigrationInterface
{
  name = 'ChangeToSectionDurations1730141062384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_section" ADD "duration" interval NOT NULL DEFAULT '1 month'::interval`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_section" DROP COLUMN "duration"`,
    );
  }
}
