import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToTip1711601256329 implements MigrationInterface {
    name = 'AddLocationToTip1711601256329'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tip" ADD "locationId" uuid`);
        await queryRunner.query(`ALTER TABLE "location" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tip" ADD CONSTRAINT "FK_87cdf83d8ecf379bacc2cb95bc1" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tip" DROP CONSTRAINT "FK_87cdf83d8ecf379bacc2cb95bc1"`);
        await queryRunner.query(`ALTER TABLE "location" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tip" DROP COLUMN "locationId"`);
    }

}
