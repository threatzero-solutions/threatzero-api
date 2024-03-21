import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResourceItems1703283656073 implements MigrationInterface {
  name = 'AddResourceItems1703283656073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."resource_item_type_enum" AS ENUM('document', 'video')`,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fileKey" character varying NOT NULL, "thumbnailKey" text, "title" text NOT NULL, "description" text, "type" "public"."resource_item_type_enum" NOT NULL, "category" character varying(64) NOT NULL, CONSTRAINT "PK_be398545e041798823ec4e2e6de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d7a2e4dba099577e1f1fcaa038" ON "resource_item" ("category") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d7a2e4dba099577e1f1fcaa038"`,
    );
    await queryRunner.query(`DROP TABLE "resource_item"`);
    await queryRunner.query(`DROP TYPE "public"."resource_item_type_enum"`);
  }
}
