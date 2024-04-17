import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViolentIncidentReports1713325671706 implements MigrationInterface {
    name = 'AddViolentIncidentReports1713325671706'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tip" DROP CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c"`);
        await queryRunner.query(`CREATE TABLE "violent_incident_report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tag" character varying(128), "unitSlug" character varying(64) NOT NULL, "status" character varying NOT NULL DEFAULT 'new', "submissionId" uuid, CONSTRAINT "REL_9f290e6a643a74fb1aefd4b2a6" UNIQUE ("submissionId"), CONSTRAINT "PK_162ef557da8cb4c2753c4d5449c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "poc_file_violent_incident_reports_violent_incident_report" ("pocFileId" uuid NOT NULL, "violentIncidentReportId" uuid NOT NULL, CONSTRAINT "PK_3d5a9fff42e2c1929f944cacd41" PRIMARY KEY ("pocFileId", "violentIncidentReportId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4a745854b2e3a6044914b4bf1f" ON "poc_file_violent_incident_reports_violent_incident_report" ("pocFileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7ae068b583fcdd13f86c0077a2" ON "poc_file_violent_incident_reports_violent_incident_report" ("violentIncidentReportId") `);
        await queryRunner.query(`ALTER TABLE "note" ADD "violentIncidentReportId" uuid`);
        await queryRunner.query(`ALTER TABLE "tip" ADD CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "violent_incident_report" ADD CONSTRAINT "FK_c359694f2277e913e2e759ef27e" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "violent_incident_report" ADD CONSTRAINT "FK_9f290e6a643a74fb1aefd4b2a68" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_20489c737792e9e0361eccd0af1" FOREIGN KEY ("violentIncidentReportId") REFERENCES "violent_incident_report"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "poc_file_violent_incident_reports_violent_incident_report" ADD CONSTRAINT "FK_4a745854b2e3a6044914b4bf1f9" FOREIGN KEY ("pocFileId") REFERENCES "poc_file"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "poc_file_violent_incident_reports_violent_incident_report" ADD CONSTRAINT "FK_7ae068b583fcdd13f86c0077a2e" FOREIGN KEY ("violentIncidentReportId") REFERENCES "violent_incident_report"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "poc_file_violent_incident_reports_violent_incident_report" DROP CONSTRAINT "FK_7ae068b583fcdd13f86c0077a2e"`);
        await queryRunner.query(`ALTER TABLE "poc_file_violent_incident_reports_violent_incident_report" DROP CONSTRAINT "FK_4a745854b2e3a6044914b4bf1f9"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_20489c737792e9e0361eccd0af1"`);
        await queryRunner.query(`ALTER TABLE "violent_incident_report" DROP CONSTRAINT "FK_9f290e6a643a74fb1aefd4b2a68"`);
        await queryRunner.query(`ALTER TABLE "violent_incident_report" DROP CONSTRAINT "FK_c359694f2277e913e2e759ef27e"`);
        await queryRunner.query(`ALTER TABLE "tip" DROP CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "violentIncidentReportId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ae068b583fcdd13f86c0077a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4a745854b2e3a6044914b4bf1f"`);
        await queryRunner.query(`DROP TABLE "poc_file_violent_incident_reports_violent_incident_report"`);
        await queryRunner.query(`DROP TABLE "violent_incident_report"`);
        await queryRunner.query(`ALTER TABLE "tip" ADD CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
