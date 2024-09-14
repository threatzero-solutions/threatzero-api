import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrainingTag1712279681992 implements MigrationInterface {
  name = 'AddTrainingTag1712279681992';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_item" ADD "metadataTag" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ADD "metadataTag" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" ADD "metadataTag" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "metadataTag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" DROP COLUMN "metadataTag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" DROP COLUMN "metadataTag"`,
    );
  }
}
