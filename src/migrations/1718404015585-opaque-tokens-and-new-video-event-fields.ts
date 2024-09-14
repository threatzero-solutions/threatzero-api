import { MigrationInterface, QueryRunner } from 'typeorm';

export class OpaqueTokensAndNewVideoEventFields1718404015585
  implements MigrationInterface
{
  name = 'OpaqueTokensAndNewVideoEventFields1718404015585';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "opaque_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key" character varying(255) NOT NULL, "value" jsonb NOT NULL, CONSTRAINT "PK_042ce18f924056bbb30c4ac5b66" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "video_event" ADD "email" character varying(254)`,
    );
    await queryRunner.query(`ALTER TABLE "video_event" ADD "ipv4" inet`);
    await queryRunner.query(`ALTER TABLE "video_event" ADD "ipv6" inet`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "video_event" DROP COLUMN "ipv6"`);
    await queryRunner.query(`ALTER TABLE "video_event" DROP COLUMN "ipv4"`);
    await queryRunner.query(`ALTER TABLE "video_event" DROP COLUMN "email"`);
    await queryRunner.query(`DROP TABLE "opaque_token"`);
  }
}
