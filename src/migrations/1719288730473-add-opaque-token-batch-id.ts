import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOpaqueTokenBatchId1719288730473 implements MigrationInterface {
    name = 'AddOpaqueTokenBatchId1719288730473'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "opaque_token" ADD "batchId" uuid`);
        await queryRunner.query(`ALTER TABLE "opaque_token" ADD CONSTRAINT "UQ_4265f4c68e6a57d5d05109a3160" UNIQUE ("batchId")`);
        await queryRunner.query(`CREATE INDEX "IDX_4265f4c68e6a57d5d05109a316" ON "opaque_token" ("batchId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4265f4c68e6a57d5d05109a316"`);
        await queryRunner.query(`ALTER TABLE "opaque_token" DROP CONSTRAINT "UQ_4265f4c68e6a57d5d05109a3160"`);
        await queryRunner.query(`ALTER TABLE "opaque_token" DROP COLUMN "batchId"`);
    }

}
