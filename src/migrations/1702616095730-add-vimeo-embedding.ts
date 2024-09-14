import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVimeoEmbedding1702616095730 implements MigrationInterface {
  name = 'AddVimeoEmbedding1702616095730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_item" ADD "embeddedHtml" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_item" DROP COLUMN "embeddedHtml"`,
    );
  }
}
