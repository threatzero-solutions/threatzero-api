import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSectionStart1719266482512 implements MigrationInterface {
    name = 'AddSectionStart1719266482512'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "training_section" ADD "isStart" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "training_section" DROP COLUMN "isStart"`);
    }

}
