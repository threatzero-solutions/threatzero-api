import { MigrationInterface, QueryRunner } from "typeorm";

export class WvpToOrganizationPolicyFile1717444609188 implements MigrationInterface {
    name = 'WvpToOrganizationPolicyFile1717444609188'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_3eb3af9f6c74f05fc42a0916334"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "FK_3ab3774e3014c04377dfeac11eb"`);
        await queryRunner.query(`CREATE TABLE "organization_policy_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "pdfS3Key" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "organizationId" uuid, "unitId" uuid, CONSTRAINT "PK_bff1b989e94132381777549f9aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "UQ_3eb3af9f6c74f05fc42a0916334"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "workplaceViolencePreventionPlanId"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP CONSTRAINT "UQ_3ab3774e3014c04377dfeac11eb"`);
        await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "workplaceViolencePreventionPlanId"`);
        await queryRunner.query(`ALTER TABLE "organization_policy_file" ADD CONSTRAINT "FK_13e3b4b1db52cc8716fb8ee5973" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_policy_file" ADD CONSTRAINT "FK_ba039833bf9f2eec01c0436b0e0" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_policy_file" DROP CONSTRAINT "FK_ba039833bf9f2eec01c0436b0e0"`);
        await queryRunner.query(`ALTER TABLE "organization_policy_file" DROP CONSTRAINT "FK_13e3b4b1db52cc8716fb8ee5973"`);
        await queryRunner.query(`ALTER TABLE "unit" ADD "workplaceViolencePreventionPlanId" uuid`);
        await queryRunner.query(`ALTER TABLE "unit" ADD CONSTRAINT "UQ_3ab3774e3014c04377dfeac11eb" UNIQUE ("workplaceViolencePreventionPlanId")`);
        await queryRunner.query(`ALTER TABLE "organization" ADD "workplaceViolencePreventionPlanId" uuid`);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "UQ_3eb3af9f6c74f05fc42a0916334" UNIQUE ("workplaceViolencePreventionPlanId")`);
        await queryRunner.query(`DROP TABLE "organization_policy_file"`);
        await queryRunner.query(`ALTER TABLE "unit" ADD CONSTRAINT "FK_3ab3774e3014c04377dfeac11eb" FOREIGN KEY ("workplaceViolencePreventionPlanId") REFERENCES "workplace_violence_prevention_plan"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_3eb3af9f6c74f05fc42a0916334" FOREIGN KEY ("workplaceViolencePreventionPlanId") REFERENCES "workplace_violence_prevention_plan"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
