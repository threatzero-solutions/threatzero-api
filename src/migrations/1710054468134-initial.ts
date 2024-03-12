import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1710054468134 implements MigrationInterface {
    name = 'Initial1710054468134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization_base" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(64) NOT NULL, "name" character varying(128) NOT NULL, "address" text, CONSTRAINT "UQ_aa11413ee8274d8c9347595f662" UNIQUE ("slug"), CONSTRAINT "PK_ee4cd3e13b88a9a4c8f7379b270" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aa11413ee8274d8c9347595f66" ON "organization_base" ("slug") `);
        await queryRunner.query(`CREATE TABLE "unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(64) NOT NULL, "name" character varying(128) NOT NULL, "address" text, "groupId" character varying(50), "tatGroupId" character varying(50), "organizationId" uuid, CONSTRAINT "UQ_492d3a34b8f91ef665e7e92dd39" UNIQUE ("slug"), CONSTRAINT "UQ_caf01fb00bc8886a50aa8b8999e" UNIQUE ("groupId"), CONSTRAINT "UQ_4e19d25f7f93d0f7624dcb2e033" UNIQUE ("tatGroupId"), CONSTRAINT "PK_4252c4be609041e559f0c80f58a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_492d3a34b8f91ef665e7e92dd3" ON "unit" ("slug") `);
        await queryRunner.query(`CREATE TABLE "organization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(64) NOT NULL, "name" character varying(128) NOT NULL, "address" text, "groupId" character varying(50), CONSTRAINT "UQ_a08804baa7c5d5427067c49a31f" UNIQUE ("slug"), CONSTRAINT "UQ_2019056e94321fa9f966d0d89e1" UNIQUE ("groupId"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a08804baa7c5d5427067c49a31" ON "organization" ("slug") `);
        await queryRunner.query(`CREATE TABLE "audience" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(32) NOT NULL, CONSTRAINT "UQ_75afb3ad5decb42d1af3294e2c7" UNIQUE ("slug"), CONSTRAINT "PK_2ecf18dc010ddf7e956afd9866b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."course_visibility_enum" AS ENUM('visible', 'hidden')`);
        await queryRunner.query(`CREATE TABLE "course" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "visibility" "public"."course_visibility_enum" NOT NULL DEFAULT 'visible', "metadataTitle" character varying(100), "metadataDescription" text, CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "section" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT '0', "availableOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "expiresOn" TIMESTAMP WITH TIME ZONE, "repeats" character varying NOT NULL DEFAULT 'once', "courseId" uuid, "metadataTitle" character varying(100), "metadataDescription" text, CONSTRAINT "PK_3c41d2d699384cc5e8eac54777d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "section_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT '0', "sectionId" uuid, "itemId" uuid, CONSTRAINT "PK_bbefe1d886c71d8e16b6d36001a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "thumbnailKey" character varying(128), "prerequisitesFulfilled" boolean, "estCompletionTime" interval, "mediaKey" character varying(128), "mediaKeys" jsonb, "embeddedHtml" text, "vimeoUrl" character varying(1024), "encodingJobId" character varying(32), "abrEnabled" boolean DEFAULT false, "type" character varying NOT NULL, "metadataTitle" character varying(100), "metadataDescription" text, CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100), "locationId" character varying(15) NOT NULL, "unitId" uuid, CONSTRAINT "UQ_8b51e14a3447c3df460c1907acb" UNIQUE ("locationId"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8b51e14a3447c3df460c1907ac" ON "location" ("locationId") `);
        await queryRunner.query(`CREATE TABLE "course_audiences_audience" ("courseId" uuid NOT NULL, "audienceId" uuid NOT NULL, CONSTRAINT "PK_8b73270ab94b7f0337c083b5a6e" PRIMARY KEY ("courseId", "audienceId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_670b13c0b20cb98cc5ea9fa45a" ON "course_audiences_audience" ("courseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_83a6237818f819cdfd428f3182" ON "course_audiences_audience" ("audienceId") `);
        await queryRunner.query(`CREATE TABLE "course_presentable_by_audience" ("courseId" uuid NOT NULL, "audienceId" uuid NOT NULL, CONSTRAINT "PK_e20da6cc0de64e7c330325f887d" PRIMARY KEY ("courseId", "audienceId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_875c797e12f61548526b6a5a20" ON "course_presentable_by_audience" ("courseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_861668352500509b05a92d8a70" ON "course_presentable_by_audience" ("audienceId") `);
        await queryRunner.query(`CREATE TABLE "course_organizations_organization" ("courseId" uuid NOT NULL, "organizationId" uuid NOT NULL, CONSTRAINT "PK_d590e95bfc38b71b94b1aae5d07" PRIMARY KEY ("courseId", "organizationId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9bbe1daf6c422c0f99202a6fe3" ON "course_organizations_organization" ("courseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_606f2ba169a90a7805593a14b9" ON "course_organizations_organization" ("organizationId") `);
        await queryRunner.query(`CREATE TABLE "item_prerequisite_items_item" ("itemId_1" uuid NOT NULL, "itemId_2" uuid NOT NULL, CONSTRAINT "PK_75b736398edba71eb7fecd821eb" PRIMARY KEY ("itemId_1", "itemId_2"))`);
        await queryRunner.query(`CREATE INDEX "IDX_35b458b1aeac1e6fad9728f3b4" ON "item_prerequisite_items_item" ("itemId_1") `);
        await queryRunner.query(`CREATE INDEX "IDX_7b86e1e06cb98cd4cd1724d2ec" ON "item_prerequisite_items_item" ("itemId_2") `);
        await queryRunner.query(`ALTER TABLE "unit" ADD CONSTRAINT "FK_f00221965f05e328934b31233f1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "section" ADD CONSTRAINT "FK_c61e35b7deed3caab17e821144a" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "section_item" ADD CONSTRAINT "FK_694e5217d8959fdb0f4fbe690d5" FOREIGN KEY ("sectionId") REFERENCES "section"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "section_item" ADD CONSTRAINT "FK_396d4691e455117cf98ed6366b8" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "location" ADD CONSTRAINT "FK_7090a1be111f217f3e5772e2628" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_audiences_audience" ADD CONSTRAINT "FK_670b13c0b20cb98cc5ea9fa45a3" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "course_audiences_audience" ADD CONSTRAINT "FK_83a6237818f819cdfd428f31821" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_presentable_by_audience" ADD CONSTRAINT "FK_875c797e12f61548526b6a5a203" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "course_presentable_by_audience" ADD CONSTRAINT "FK_861668352500509b05a92d8a700" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_organizations_organization" ADD CONSTRAINT "FK_9bbe1daf6c422c0f99202a6fe3d" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "course_organizations_organization" ADD CONSTRAINT "FK_606f2ba169a90a7805593a14b91" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_prerequisite_items_item" ADD CONSTRAINT "FK_35b458b1aeac1e6fad9728f3b41" FOREIGN KEY ("itemId_1") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "item_prerequisite_items_item" ADD CONSTRAINT "FK_7b86e1e06cb98cd4cd1724d2ec6" FOREIGN KEY ("itemId_2") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE "query-result-cache" ("id" SERIAL NOT NULL, "identifier" character varying, "time" bigint NOT NULL, "duration" integer NOT NULL, "query" text NOT NULL, "result" text NOT NULL, CONSTRAINT "PK_6a98f758d8bfd010e7e10ffd3d3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "query-result-cache"`);
        await queryRunner.query(`ALTER TABLE "item_prerequisite_items_item" DROP CONSTRAINT "FK_7b86e1e06cb98cd4cd1724d2ec6"`);
        await queryRunner.query(`ALTER TABLE "item_prerequisite_items_item" DROP CONSTRAINT "FK_35b458b1aeac1e6fad9728f3b41"`);
        await queryRunner.query(`ALTER TABLE "course_organizations_organization" DROP CONSTRAINT "FK_606f2ba169a90a7805593a14b91"`);
        await queryRunner.query(`ALTER TABLE "course_organizations_organization" DROP CONSTRAINT "FK_9bbe1daf6c422c0f99202a6fe3d"`);
        await queryRunner.query(`ALTER TABLE "course_presentable_by_audience" DROP CONSTRAINT "FK_861668352500509b05a92d8a700"`);
        await queryRunner.query(`ALTER TABLE "course_presentable_by_audience" DROP CONSTRAINT "FK_875c797e12f61548526b6a5a203"`);
        await queryRunner.query(`ALTER TABLE "course_audiences_audience" DROP CONSTRAINT "FK_83a6237818f819cdfd428f31821"`);
        await queryRunner.query(`ALTER TABLE "course_audiences_audience" DROP CONSTRAINT "FK_670b13c0b20cb98cc5ea9fa45a3"`);
        await queryRunner.query(`ALTER TABLE "location" DROP CONSTRAINT "FK_7090a1be111f217f3e5772e2628"`);
        await queryRunner.query(`ALTER TABLE "section_item" DROP CONSTRAINT "FK_396d4691e455117cf98ed6366b8"`);
        await queryRunner.query(`ALTER TABLE "section_item" DROP CONSTRAINT "FK_694e5217d8959fdb0f4fbe690d5"`);
        await queryRunner.query(`ALTER TABLE "section" DROP CONSTRAINT "FK_c61e35b7deed3caab17e821144a"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "FK_f00221965f05e328934b31233f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b86e1e06cb98cd4cd1724d2ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_35b458b1aeac1e6fad9728f3b4"`);
        await queryRunner.query(`DROP TABLE "item_prerequisite_items_item"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_606f2ba169a90a7805593a14b9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9bbe1daf6c422c0f99202a6fe3"`);
        await queryRunner.query(`DROP TABLE "course_organizations_organization"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_861668352500509b05a92d8a70"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_875c797e12f61548526b6a5a20"`);
        await queryRunner.query(`DROP TABLE "course_presentable_by_audience"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_83a6237818f819cdfd428f3182"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_670b13c0b20cb98cc5ea9fa45a"`);
        await queryRunner.query(`DROP TABLE "course_audiences_audience"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b51e14a3447c3df460c1907ac"`);
        await queryRunner.query(`DROP TABLE "location"`);
        await queryRunner.query(`DROP TABLE "item"`);
        await queryRunner.query(`DROP TABLE "section_item"`);
        await queryRunner.query(`DROP TABLE "section"`);
        await queryRunner.query(`DROP TABLE "course"`);
        await queryRunner.query(`DROP TYPE "public"."course_visibility_enum"`);
        await queryRunner.query(`DROP TABLE "audience"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a08804baa7c5d5427067c49a31"`);
        await queryRunner.query(`DROP TABLE "organization"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_492d3a34b8f91ef665e7e92dd3"`);
        await queryRunner.query(`DROP TABLE "unit"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa11413ee8274d8c9347595f66"`);
        await queryRunner.query(`DROP TABLE "organization_base"`);
    }

}
