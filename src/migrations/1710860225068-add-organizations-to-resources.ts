import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationsToResources1710860225068 implements MigrationInterface {
    name = 'AddOrganizationsToResources1710860225068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "resource_item_organizations_organization" ("resourceItemId" uuid NOT NULL, "organizationId" uuid NOT NULL, CONSTRAINT "PK_90793976122ca041a541ff5a0cf" PRIMARY KEY ("resourceItemId", "organizationId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_867f5a3cf929cf7cbf46ba5f6c" ON "resource_item_organizations_organization" ("resourceItemId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64d257bfe97c0225d5b7e16875" ON "resource_item_organizations_organization" ("organizationId") `);
        await queryRunner.query(`ALTER TABLE "resource_item_organizations_organization" ADD CONSTRAINT "FK_867f5a3cf929cf7cbf46ba5f6cb" FOREIGN KEY ("resourceItemId") REFERENCES "resource_item"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "resource_item_organizations_organization" ADD CONSTRAINT "FK_64d257bfe97c0225d5b7e168753" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resource_item_organizations_organization" DROP CONSTRAINT "FK_64d257bfe97c0225d5b7e168753"`);
        await queryRunner.query(`ALTER TABLE "resource_item_organizations_organization" DROP CONSTRAINT "FK_867f5a3cf929cf7cbf46ba5f6cb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64d257bfe97c0225d5b7e16875"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_867f5a3cf929cf7cbf46ba5f6c"`);
        await queryRunner.query(`DROP TABLE "resource_item_organizations_organization"`);
    }

}
