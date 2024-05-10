import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormLanguages1715304435385 implements MigrationInterface {
  name = 'AddFormLanguages1715304435385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_survey_response"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "user_survey_audiences_audience"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_survey"`);
    await queryRunner.query(
      `ALTER TABLE "form" DROP CONSTRAINT "UQ_a2d55b7c9970de41765992b27f7"`,
    );
    await queryRunner.query(
      `CREATE TABLE "language" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(128) NOT NULL, "nativeName" character varying(128) NOT NULL, "code" character varying(2) NOT NULL, CONSTRAINT "UQ_465b3173cdddf0ac2d3fe73a33c" UNIQUE ("code"), CONSTRAINT "PK_cc0a99e710eb3733f6fb42b1d4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "form" ADD "languageId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "form" ADD CONSTRAINT "UQ_cc6d63e2e16802d03391924ddc5" UNIQUE ("slug", "version", "languageId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "form" ADD CONSTRAINT "FK_9f3bdfe1c9ed1894ed06c4125ce" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "language" ("id", "createdOn", "updatedOn", "name", "nativeName", "code") VALUES (DEFAULT, DEFAULT, DEFAULT, 'English', 'English', 'en')`,
    );
    await queryRunner.query(
      `UPDATE "form" SET "languageId" = (SELECT "id" FROM "language" LIMIT 1) WHERE "languageId" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "form" DROP CONSTRAINT "FK_9f3bdfe1c9ed1894ed06c4125ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form" DROP CONSTRAINT "UQ_cc6d63e2e16802d03391924ddc5"`,
    );
    await queryRunner.query(`ALTER TABLE "form" DROP COLUMN "languageId"`);
    await queryRunner.query(`DROP TABLE "language"`);
    await queryRunner.query(
      `ALTER TABLE "form" ADD CONSTRAINT "UQ_a2d55b7c9970de41765992b27f7" UNIQUE ("slug", "version")`,
    );
  }
}
