import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrgTatGroupId1712793911517 implements MigrationInterface {
  name = 'AddOrgTatGroupId1712793911517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "tatGroupId" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD CONSTRAINT "UQ_a6a9760bcf71d2654fbc79a2fe4" UNIQUE ("tatGroupId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP CONSTRAINT "UQ_a6a9760bcf71d2654fbc79a2fe4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "tatGroupId"`,
    );
  }
}
