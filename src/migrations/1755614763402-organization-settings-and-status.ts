import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationSettingsAndStatus1755614763402
  implements MigrationInterface
{
  name = 'OrganizationSettingsAndStatus1755614763402';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organization_status_enum" AS ENUM('pending', 'active', 'inactive')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "status" "public"."organization_status_enum" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "notificationSettings" jsonb`,
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
      `ALTER TABLE "organization" DROP COLUMN "notificationSettings"`,
    );
    await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."organization_status_enum"`);
  }
}
