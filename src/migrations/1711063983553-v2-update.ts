import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2Update1711063983553 implements MigrationInterface {
  name = 'V2Update1711063983553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_17a903e8d2463bd3351a0687906"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" RENAME COLUMN "organizationExternalId" TO "organizationSlug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" RENAME COLUMN "externalId" TO "groupId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" RENAME CONSTRAINT "UQ_64112faa73ec58b0f8ce1d01a86" TO "UQ_2019056e94321fa9f966d0d89e1"`,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_item_organizations_organization" ("resourceItemId" uuid NOT NULL, "organizationId" uuid NOT NULL, CONSTRAINT "PK_90793976122ca041a541ff5a0cf" PRIMARY KEY ("resourceItemId", "organizationId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_867f5a3cf929cf7cbf46ba5f6c" ON "resource_item_organizations_organization" ("resourceItemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64d257bfe97c0225d5b7e16875" ON "resource_item_organizations_organization" ("organizationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "training_course_organizations_organization" ("trainingCourseId" uuid NOT NULL, "organizationId" uuid NOT NULL, CONSTRAINT "PK_3021f00e7fb70b5cfce28d57f7a" PRIMARY KEY ("trainingCourseId", "organizationId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c267e58dc51662e6380f315f53" ON "training_course_organizations_organization" ("trainingCourseId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_675faa560554fea84eed92d949" ON "training_course_organizations_organization" ("organizationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" DROP COLUMN "prerequisitesFulfilled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item" ADD "vimeoUrl" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ADD "groupId" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ADD CONSTRAINT "UQ_372da73f1bbac8ab5060c0d6a35" UNIQUE ("groupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" ADD "mediaKeys" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" ADD "vimeoUrl" character varying(1024)`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" ADD "encodingJobId" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" ADD "abrEnabled" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."training_course_visibility_enum" AS ENUM('visible', 'hidden')`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course" ADD "visibility" "public"."training_course_visibility_enum" NOT NULL DEFAULT 'hidden'`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD "groupId" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "UQ_caf01fb00bc8886a50aa8b8999e" UNIQUE ("groupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD "tatGroupId" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "UQ_4e19d25f7f93d0f7624dcb2e033" UNIQUE ("tatGroupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item" DROP COLUMN "fileKey"`,
    );
    await queryRunner.query(`ALTER TABLE "resource_item" ADD "fileKey" text`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP CONSTRAINT "UQ_2019056e94321fa9f966d0d89e1"`,
    );
    await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "groupId"`);
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "groupId" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD CONSTRAINT "UQ_2019056e94321fa9f966d0d89e1" UNIQUE ("groupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_event" ALTER COLUMN "timestamp" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_17a903e8d2463bd3351a0687906" FOREIGN KEY ("userExternalId") REFERENCES "user_representation"("externalId") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item_organizations_organization" ADD CONSTRAINT "FK_867f5a3cf929cf7cbf46ba5f6cb" FOREIGN KEY ("resourceItemId") REFERENCES "resource_item"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item_organizations_organization" ADD CONSTRAINT "FK_64d257bfe97c0225d5b7e168753" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_organizations_organization" ADD CONSTRAINT "FK_c267e58dc51662e6380f315f531" FOREIGN KEY ("trainingCourseId") REFERENCES "training_course"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_organizations_organization" ADD CONSTRAINT "FK_675faa560554fea84eed92d9496" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_course_organizations_organization" DROP CONSTRAINT "FK_675faa560554fea84eed92d9496"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_organizations_organization" DROP CONSTRAINT "FK_c267e58dc51662e6380f315f531"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item_organizations_organization" DROP CONSTRAINT "FK_64d257bfe97c0225d5b7e168753"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item_organizations_organization" DROP CONSTRAINT "FK_867f5a3cf929cf7cbf46ba5f6cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_17a903e8d2463bd3351a0687906"`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_event" ALTER COLUMN "timestamp" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP CONSTRAINT "UQ_2019056e94321fa9f966d0d89e1"`,
    );
    await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "groupId"`);
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "groupId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD CONSTRAINT "UQ_2019056e94321fa9f966d0d89e1" UNIQUE ("groupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item" DROP COLUMN "fileKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_item" ADD "fileKey" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "UQ_4e19d25f7f93d0f7624dcb2e033"`,
    );
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "tatGroupId"`);
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "UQ_caf01fb00bc8886a50aa8b8999e"`,
    );
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "groupId"`);
    await queryRunner.query(
      `ALTER TABLE "training_course" DROP COLUMN "visibility"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."training_course_visibility_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" DROP COLUMN "abrEnabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" DROP COLUMN "encodingJobId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" DROP COLUMN "vimeoUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" DROP COLUMN "mediaKeys"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audience" DROP CONSTRAINT "UQ_372da73f1bbac8ab5060c0d6a35"`,
    );
    await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "groupId"`);
    await queryRunner.query(
      `ALTER TABLE "resource_item" DROP COLUMN "vimeoUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item" ADD "prerequisitesFulfilled" boolean`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_675faa560554fea84eed92d949"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c267e58dc51662e6380f315f53"`,
    );
    await queryRunner.query(
      `DROP TABLE "training_course_organizations_organization"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64d257bfe97c0225d5b7e16875"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_867f5a3cf929cf7cbf46ba5f6c"`,
    );
    await queryRunner.query(
      `DROP TABLE "resource_item_organizations_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" RENAME CONSTRAINT "UQ_2019056e94321fa9f966d0d89e1" TO "UQ_64112faa73ec58b0f8ce1d01a86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" RENAME COLUMN "groupId" TO "externalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" RENAME COLUMN "organizationSlug" TO "organizationExternalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_17a903e8d2463bd3351a0687906" FOREIGN KEY ("userExternalId") REFERENCES "user_representation"("externalId") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
