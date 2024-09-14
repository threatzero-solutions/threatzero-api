import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToOpaqueToken1718684126180 implements MigrationInterface {
  name = 'AddTypeToOpaqueToken1718684126180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opaque_token" ADD "type" character varying(128)`,
    );
    await queryRunner.query(
      `ALTER TABLE "opaque_token" ADD CONSTRAINT "UQ_2514546f9bd99f78a7119e5b743" UNIQUE ("key")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c7e41dd12183c1891f97dfac5" ON "opaque_token" ("type") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c7e41dd12183c1891f97dfac5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opaque_token" DROP CONSTRAINT "UQ_2514546f9bd99f78a7119e5b743"`,
    );
    await queryRunner.query(`ALTER TABLE "opaque_token" DROP COLUMN "type"`);
  }
}
