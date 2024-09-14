import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipAndAssessmentTags1711657735217
  implements MigrationInterface
{
  name = 'AddTipAndAssessmentTags1711657735217';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" ADD "tag" character varying(128)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" ADD "tag" character varying(128)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tip" DROP COLUMN "tag"`);
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" DROP COLUMN "tag"`,
    );
  }
}
