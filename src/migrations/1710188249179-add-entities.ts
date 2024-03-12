import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEntities1710188249179 implements MigrationInterface {
    name = 'AddEntities1710188249179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_representation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "externalId" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "name" character varying(100), "givenName" character varying(100), "familyName" character varying(100), "picture" text, "organizationSlug" character varying(100), "unitSlug" character varying(100), CONSTRAINT "UQ_e9491d8c126d1a50b5db7146698" UNIQUE ("externalId"), CONSTRAINT "PK_dfb68da9e244521853ab5345843" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "field" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(128) NOT NULL, "label" text NOT NULL, "placeholder" text, "helpText" text, "type" character varying NOT NULL DEFAULT 'text', "elementProperties" jsonb, "typeParams" jsonb, "required" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "hidden" boolean NOT NULL DEFAULT false, "formId" uuid, "groupId" uuid, CONSTRAINT "PK_39379bba786d7a75226b358f81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "field_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" text, "subtitle" text, "description" text, "order" integer NOT NULL DEFAULT '0', "formId" uuid, "parentGroupId" uuid, CONSTRAINT "PK_fe18423dcdf6854450479054de3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(100) NOT NULL, "version" integer NOT NULL, "title" text, "subtitle" text, "description" text, "state" character varying NOT NULL DEFAULT 'draft', CONSTRAINT "UQ_a2d55b7c9970de41765992b27f7" UNIQUE ("slug", "version"), CONSTRAINT "CHK_d3a5a8cc3816ef1e2cbc78e5e7" CHECK (state = 'draft' OR (state = 'published' AND version > 0)), CONSTRAINT "PK_8f72b95aa2f8ba82cf95dc7579e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1288bfbf098df297254d5d2745" ON "form" ("slug") `);
        await queryRunner.query(`CREATE TABLE "field_response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "value" jsonb NOT NULL, "fieldId" uuid, "formResponseId" uuid, CONSTRAINT "PK_9dad59aea2ea00817a1a729ddf2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "form_submission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "formId" uuid, "userId" character varying(64), "ipv4" inet, "ipv6" inet, "status" character varying NOT NULL DEFAULT 'not_complete', CONSTRAINT "PK_afdf6f86e3747141dd75876e027" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tip" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "unitSlug" character varying(64) NOT NULL, "informantFirstName" character varying(64), "informantLastName" character varying(64), "informantEmail" character varying(319), "informantPhone" character varying(32), "status" character varying NOT NULL DEFAULT 'new', "submissionId" uuid, CONSTRAINT "REL_7a8325a27d7441c06c7efbea24" UNIQUE ("submissionId"), CONSTRAINT "PK_855d736988802b4ec0e07b7e762" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "value" text NOT NULL, "userExternalId" character varying(100) NOT NULL, "tipId" uuid, "assessmentId" uuid, CONSTRAINT "PK_96d0c172a4fba276b1bbed43058" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "threat_assessment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "unitSlug" character varying(64) NOT NULL, "status" character varying NOT NULL DEFAULT 'in_progress', "submissionId" uuid, CONSTRAINT "REL_b10a7bbd724e8ec573bc56a68f" UNIQUE ("submissionId"), CONSTRAINT "PK_2aa40497df26494cd8d271828e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."resource_type_enum" AS ENUM('document', 'video')`);
        await queryRunner.query(`CREATE TABLE "resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fileKey" character varying NOT NULL, "thumbnailKey" text, "title" text NOT NULL, "description" text, "type" "public"."resource_type_enum" NOT NULL, "category" character varying(64) NOT NULL, CONSTRAINT "PK_e2894a5867e06ae2e8889f1173f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_550fbf8fa7eb206e8c18061546" ON "resource" ("category") `);
        await queryRunner.query(`CREATE TABLE "field_group_closure" ("id_ancestor" uuid NOT NULL, "id_descendant" uuid NOT NULL, CONSTRAINT "PK_5a492e533494b1d59de5a370041" PRIMARY KEY ("id_ancestor", "id_descendant"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9d049a6a1950ae647eb6080e3f" ON "field_group_closure" ("id_ancestor") `);
        await queryRunner.query(`CREATE INDEX "IDX_2c6946db7ffda6d233588ecb91" ON "field_group_closure" ("id_descendant") `);
        await queryRunner.query(`ALTER TABLE "course" ALTER COLUMN "visibility" SET DEFAULT 'hidden'`);
        await queryRunner.query(`ALTER TABLE "field" ADD CONSTRAINT "FK_1bc8b60404fce5836d595e6611b" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field" ADD CONSTRAINT "FK_0cb7eadcf14da14c615d29c458b" FOREIGN KEY ("groupId") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_group" ADD CONSTRAINT "FK_12c3d422a4bfce8ca79ccbc7578" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_group" ADD CONSTRAINT "FK_9014f35018133be90f8bd17bea9" FOREIGN KEY ("parentGroupId") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_response" ADD CONSTRAINT "FK_02db534955c2d19ec0f32c3219e" FOREIGN KEY ("fieldId") REFERENCES "field"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_response" ADD CONSTRAINT "FK_0dc68dff3073955452f3c427a2c" FOREIGN KEY ("formResponseId") REFERENCES "form_submission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "form_submission" ADD CONSTRAINT "FK_0c044839ddb8d7bef1c8762a3ce" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tip" ADD CONSTRAINT "FK_fd5508d489ec303eb5d0fb65757" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tip" ADD CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_17a903e8d2463bd3351a0687906" FOREIGN KEY ("userExternalId") REFERENCES "user_representation"("externalId") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_0f5c7c9d5ef1ca0db2c91984f78" FOREIGN KEY ("tipId") REFERENCES "tip"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_84f9f7d49ff6513797f47d5a3df" FOREIGN KEY ("assessmentId") REFERENCES "threat_assessment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "threat_assessment" ADD CONSTRAINT "FK_023b78260cc26961c673e55fc43" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "threat_assessment" ADD CONSTRAINT "FK_b10a7bbd724e8ec573bc56a68f6" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_group_closure" ADD CONSTRAINT "FK_9d049a6a1950ae647eb6080e3f0" FOREIGN KEY ("id_ancestor") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_group_closure" ADD CONSTRAINT "FK_2c6946db7ffda6d233588ecb919" FOREIGN KEY ("id_descendant") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "field_group_closure" DROP CONSTRAINT "FK_2c6946db7ffda6d233588ecb919"`);
        await queryRunner.query(`ALTER TABLE "field_group_closure" DROP CONSTRAINT "FK_9d049a6a1950ae647eb6080e3f0"`);
        await queryRunner.query(`ALTER TABLE "threat_assessment" DROP CONSTRAINT "FK_b10a7bbd724e8ec573bc56a68f6"`);
        await queryRunner.query(`ALTER TABLE "threat_assessment" DROP CONSTRAINT "FK_023b78260cc26961c673e55fc43"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_84f9f7d49ff6513797f47d5a3df"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_0f5c7c9d5ef1ca0db2c91984f78"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_17a903e8d2463bd3351a0687906"`);
        await queryRunner.query(`ALTER TABLE "tip" DROP CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c"`);
        await queryRunner.query(`ALTER TABLE "tip" DROP CONSTRAINT "FK_fd5508d489ec303eb5d0fb65757"`);
        await queryRunner.query(`ALTER TABLE "form_submission" DROP CONSTRAINT "FK_0c044839ddb8d7bef1c8762a3ce"`);
        await queryRunner.query(`ALTER TABLE "field_response" DROP CONSTRAINT "FK_0dc68dff3073955452f3c427a2c"`);
        await queryRunner.query(`ALTER TABLE "field_response" DROP CONSTRAINT "FK_02db534955c2d19ec0f32c3219e"`);
        await queryRunner.query(`ALTER TABLE "field_group" DROP CONSTRAINT "FK_9014f35018133be90f8bd17bea9"`);
        await queryRunner.query(`ALTER TABLE "field_group" DROP CONSTRAINT "FK_12c3d422a4bfce8ca79ccbc7578"`);
        await queryRunner.query(`ALTER TABLE "field" DROP CONSTRAINT "FK_0cb7eadcf14da14c615d29c458b"`);
        await queryRunner.query(`ALTER TABLE "field" DROP CONSTRAINT "FK_1bc8b60404fce5836d595e6611b"`);
        await queryRunner.query(`ALTER TABLE "course" ALTER COLUMN "visibility" SET DEFAULT 'visible'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c6946db7ffda6d233588ecb91"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d049a6a1950ae647eb6080e3f"`);
        await queryRunner.query(`DROP TABLE "field_group_closure"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_550fbf8fa7eb206e8c18061546"`);
        await queryRunner.query(`DROP TABLE "resource"`);
        await queryRunner.query(`DROP TYPE "public"."resource_type_enum"`);
        await queryRunner.query(`DROP TABLE "threat_assessment"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`DROP TABLE "tip"`);
        await queryRunner.query(`DROP TABLE "form_submission"`);
        await queryRunner.query(`DROP TABLE "field_response"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1288bfbf098df297254d5d2745"`);
        await queryRunner.query(`DROP TABLE "form"`);
        await queryRunner.query(`DROP TABLE "field_group"`);
        await queryRunner.query(`DROP TABLE "field"`);
        await queryRunner.query(`DROP TABLE "user_representation"`);
    }

}
