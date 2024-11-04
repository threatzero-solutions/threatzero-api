import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveExpirationDates1730750133940 implements MigrationInterface {
  name = 'MoveExpirationDates1730750133940';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    UPDATE "opaque_token"
    SET "expiresOn" = CASE
        WHEN "value"->>'expiresOn' IS NOT NULL THEN ("value"->>'expiresOn')::timestamptz
        ELSE NULL
    END
    WHERE "expiresOn" IS NULL;
        `);
  }

  public async down(): Promise<void> {}
}
