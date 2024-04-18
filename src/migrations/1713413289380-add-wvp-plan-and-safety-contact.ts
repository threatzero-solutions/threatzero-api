import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWvpPlanAndSafetyContact1713413289380 implements MigrationInterface {
    name = 'AddWvpPlanAndSafetyContact1713413289380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "safety_contact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "email" character varying(254) NOT NULL, "phone" character varying(20) NOT NULL, "title" character varying(100), CONSTRAINT "PK_7d067036cae64156a30d11e2852" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workplace_violence_prevention_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "pdfS3Key" character varying(255) NOT NULL, CONSTRAINT "PK_f8b15665ba4ed07c1a997b37b3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organization" ADD "safetyContactId" uuid`);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "UQ_785b4bfc3727f71222a6a33e13f" UNIQUE ("safetyContactId")`);
        await queryRunner.query(`ALTER TABLE "organization" ADD "workplaceViolencePreventionPlanId" uuid`);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "UQ_3eb3af9f6c74f05fc42a0916334" UNIQUE ("workplaceViolencePreventionPlanId")`);
        await queryRunner.query(`ALTER TABLE "unit" ADD "safetyContactId" uuid`);
        await queryRunner.query(`ALTER TABLE "unit" ADD CONSTRAINT "UQ_c2830c7dd19b1242ff556f813c3" UNIQUE ("safetyContactId")`);
        await queryRunner.query(`ALTER TABLE "unit" ADD "workplaceViolencePreventionPlanId" uuid`);
        await queryRunner.query(`ALTER TABLE "unit" ADD CONSTRAINT "UQ_3ab3774e3014c04377dfeac11eb" UNIQUE ("workplaceViolencePreventionPlanId")`);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_785b4bfc3727f71222a6a33e13f" FOREIGN KEY ("safetyContactId") REFERENCES "safety_contact"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_3eb3af9f6c74f05fc42a0916334" FOREIGN KEY ("workplaceViolencePreventionPlanId") REFERENCES "workplace_violence_prevention_plan"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unit" ADD CONSTRAINT "FK_c2830c7dd19b1242ff556f813c3" FOREIGN KEY ("safetyContactId") REFERENCES "safety_contact"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unit" ADD CONSTRAINT "FK_3ab3774e3014c04377dfeac11eb" FOREIGN KEY ("workplaceViolencePreventionPlanId") REFERENCES "workplace_violence_prevention_plan"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "FK_3ab3774e3014c04377dfeac11eb"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "FK_c2830c7dd19b1242ff556f813c3"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_3eb3af9f6c74f05fc42a0916334"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_785b4bfc3727f71222a6a33e13f"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "UQ_3ab3774e3014c04377dfeac11eb"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "workplaceViolencePreventionPlanId"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "UQ_c2830c7dd19b1242ff556f813c3"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "safetyContactId"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "UQ_3eb3af9f6c74f05fc42a0916334"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "workplaceViolencePreventionPlanId"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "UQ_785b4bfc3727f71222a6a33e13f"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "safetyContactId"`);
        await queryRunner.query(`DROP TABLE "workplace_violence_prevention_plan"`);
        await queryRunner.query(`DROP TABLE "safety_contact"`);
    }

}
