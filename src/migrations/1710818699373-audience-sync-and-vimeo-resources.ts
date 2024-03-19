import { MigrationInterface, QueryRunner } from "typeorm";

export class AudienceSyncAndVimeoResources1710818699373 implements MigrationInterface {
    name = 'AudienceSyncAndVimeoResources1710818699373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization_base" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(64) NOT NULL, "name" character varying(128) NOT NULL, "address" text, CONSTRAINT "UQ_aa11413ee8274d8c9347595f662" UNIQUE ("slug"), CONSTRAINT "PK_ee4cd3e13b88a9a4c8f7379b270" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aa11413ee8274d8c9347595f66" ON "organization_base" ("slug") `);
        await queryRunner.query(`ALTER TABLE "training_item" DROP COLUMN "prerequisitesFulfilled"`);
        await queryRunner.query(`ALTER TABLE "audience" ADD "groupId" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "audience" ADD CONSTRAINT "UQ_372da73f1bbac8ab5060c0d6a35" UNIQUE ("groupId")`);
        await queryRunner.query(`ALTER TABLE "resource_item" ADD "vimeoUrl" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "training_course" ALTER COLUMN "visibility" SET DEFAULT 'hidden'`);
        await queryRunner.query(`ALTER TABLE "resource_item" DROP COLUMN "fileKey"`);
        await queryRunner.query(`ALTER TABLE "resource_item" ADD "fileKey" text`);
        await queryRunner.query(`ALTER TABLE "video_event" ALTER COLUMN "timestamp" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_event" ALTER COLUMN "timestamp" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "resource_item" DROP COLUMN "fileKey"`);
        await queryRunner.query(`ALTER TABLE "resource_item" ADD "fileKey" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "training_course" ALTER COLUMN "visibility" SET DEFAULT 'visible'`);
        await queryRunner.query(`ALTER TABLE "resource_item" DROP COLUMN "vimeoUrl"`);
        await queryRunner.query(`ALTER TABLE "audience" DROP CONSTRAINT "UQ_372da73f1bbac8ab5060c0d6a35"`);
        await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "groupId"`);
        await queryRunner.query(`ALTER TABLE "training_item" ADD "prerequisitesFulfilled" boolean`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa11413ee8274d8c9347595f66"`);
        await queryRunner.query(`DROP TABLE "organization_base"`);
    }

}
