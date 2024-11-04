import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrainingAccessSettings1730499745545
  implements MigrationInterface
{
  name = 'AddTrainingAccessSettings1730499745545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "trainingAccessSettings" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "trainingAccessSettings"`,
    );
  }
}
