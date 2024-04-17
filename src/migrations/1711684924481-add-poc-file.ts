import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPocFile1711684924481 implements MigrationInterface {
    name = 'AddPocFile1711684924481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "poc_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "pocFirstName" character varying(64), "pocLastName" character varying(64), "unitId" uuid, CONSTRAINT "PK_86aa31970da4850b36ea38281ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "poc_file_tips_tip" ("pocFileId" uuid NOT NULL, "tipId" uuid NOT NULL, CONSTRAINT "PK_41be22b6769d9583cbbe08c1d59" PRIMARY KEY ("pocFileId", "tipId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b8a7177c584df17e200a3303bd" ON "poc_file_tips_tip" ("pocFileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cd041f4c1586ac84b89473098" ON "poc_file_tips_tip" ("tipId") `);
        await queryRunner.query(`CREATE TABLE "poc_file_assessments_threat_assessment" ("pocFileId" uuid NOT NULL, "threatAssessmentId" uuid NOT NULL, CONSTRAINT "PK_bf6c3821d3db4ea3147fac5ef00" PRIMARY KEY ("pocFileId", "threatAssessmentId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_23afecf97c0dd7a83e9e026cf7" ON "poc_file_assessments_threat_assessment" ("pocFileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a33a399ce388926cb885b90a2" ON "poc_file_assessments_threat_assessment" ("threatAssessmentId") `);
        await queryRunner.query(`CREATE TABLE "poc_file_peer_units_unit" ("pocFileId" uuid NOT NULL, "unitId" uuid NOT NULL, CONSTRAINT "PK_2049f3dd56ffa589bdcc1464b4c" PRIMARY KEY ("pocFileId", "unitId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6ae8e009b4fd10a674a6e59c59" ON "poc_file_peer_units_unit" ("pocFileId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dccbef5d2db3f05825284f610f" ON "poc_file_peer_units_unit" ("unitId") `);
        await queryRunner.query(`ALTER TABLE "poc_file" ADD CONSTRAINT "FK_fc554d8910b83421f8e0dd06b28" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "poc_file_tips_tip" ADD CONSTRAINT "FK_b8a7177c584df17e200a3303bdd" FOREIGN KEY ("pocFileId") REFERENCES "poc_file"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "poc_file_tips_tip" ADD CONSTRAINT "FK_0cd041f4c1586ac84b894730987" FOREIGN KEY ("tipId") REFERENCES "tip"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "poc_file_assessments_threat_assessment" ADD CONSTRAINT "FK_23afecf97c0dd7a83e9e026cf72" FOREIGN KEY ("pocFileId") REFERENCES "poc_file"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "poc_file_assessments_threat_assessment" ADD CONSTRAINT "FK_3a33a399ce388926cb885b90a26" FOREIGN KEY ("threatAssessmentId") REFERENCES "threat_assessment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "poc_file_peer_units_unit" ADD CONSTRAINT "FK_6ae8e009b4fd10a674a6e59c596" FOREIGN KEY ("pocFileId") REFERENCES "poc_file"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "poc_file_peer_units_unit" ADD CONSTRAINT "FK_dccbef5d2db3f05825284f610f5" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "poc_file_peer_units_unit" DROP CONSTRAINT "FK_dccbef5d2db3f05825284f610f5"`);
        await queryRunner.query(`ALTER TABLE "poc_file_peer_units_unit" DROP CONSTRAINT "FK_6ae8e009b4fd10a674a6e59c596"`);
        await queryRunner.query(`ALTER TABLE "poc_file_assessments_threat_assessment" DROP CONSTRAINT "FK_3a33a399ce388926cb885b90a26"`);
        await queryRunner.query(`ALTER TABLE "poc_file_assessments_threat_assessment" DROP CONSTRAINT "FK_23afecf97c0dd7a83e9e026cf72"`);
        await queryRunner.query(`ALTER TABLE "poc_file_tips_tip" DROP CONSTRAINT "FK_0cd041f4c1586ac84b894730987"`);
        await queryRunner.query(`ALTER TABLE "poc_file_tips_tip" DROP CONSTRAINT "FK_b8a7177c584df17e200a3303bdd"`);
        await queryRunner.query(`ALTER TABLE "poc_file" DROP CONSTRAINT "FK_fc554d8910b83421f8e0dd06b28"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dccbef5d2db3f05825284f610f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ae8e009b4fd10a674a6e59c59"`);
        await queryRunner.query(`DROP TABLE "poc_file_peer_units_unit"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a33a399ce388926cb885b90a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23afecf97c0dd7a83e9e026cf7"`);
        await queryRunner.query(`DROP TABLE "poc_file_assessments_threat_assessment"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cd041f4c1586ac84b89473098"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b8a7177c584df17e200a3303bd"`);
        await queryRunner.query(`DROP TABLE "poc_file_tips_tip"`);
        await queryRunner.query(`DROP TABLE "poc_file"`);
    }

}
