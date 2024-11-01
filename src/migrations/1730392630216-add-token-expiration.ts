import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenExpiration1730392630216 implements MigrationInterface {
  name = 'AddTokenExpiration1730392630216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opaque_token" ADD "expiresOn" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "duration" SET DEFAULT '1 month'::interval`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "duration" SET DEFAULT '1 mon'`,
    );
    await queryRunner.query(
      `ALTER TABLE "opaque_token" DROP COLUMN "expiresOn"`,
    );
  }
}
