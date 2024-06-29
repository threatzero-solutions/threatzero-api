import { MigrationInterface, QueryRunner } from "typeorm";

export class RmUniqueBatchIdConstraint1719693571815 implements MigrationInterface {
    name = 'RmUniqueBatchIdConstraint1719693571815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "opaque_token" DROP CONSTRAINT "UQ_4265f4c68e6a57d5d05109a3160"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "opaque_token" ADD CONSTRAINT "UQ_4265f4c68e6a57d5d05109a3160" UNIQUE ("batchId")`);
    }

}
