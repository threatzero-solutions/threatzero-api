import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoEventIndices1719237798594 implements MigrationInterface {
  name = 'AddVideoEventIndices1719237798594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_c4e419bbec938ee967cdc37b3a" ON "video_event" ("unitSlug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f5a377f7b8c6da6990aa50890" ON "video_event" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7bd5e1f23b330c34de8ffc30a2" ON "video_event" ("itemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c146e50f54852aeacd463f865" ON "video_event" ("unitSlug", "itemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "video_played_seconds" ON "video_event" (("eventData"->>'playedSeconds')) `,
    );
    await queryRunner.query(
      `CREATE INDEX "video_loaded_percent" ON "video_event" (("eventData"->>'loaded')) `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3c146e50f54852aeacd463f865"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7bd5e1f23b330c34de8ffc30a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f5a377f7b8c6da6990aa50890"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c4e419bbec938ee967cdc37b3a"`,
    );
    await queryRunner.query(`DROP INDEX "public"."video_played_seconds"`);
    await queryRunner.query(`DROP INDEX "public"."video_loaded_percent"`);
  }
}
