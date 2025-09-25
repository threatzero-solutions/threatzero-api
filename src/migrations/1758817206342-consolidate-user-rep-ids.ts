import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateUserRepIds1758817206342 implements MigrationInterface {
  name = 'ConsolidateUserRepIds1758817206342';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_17a903e8d2463bd3351a0687906"`,
    );
    await queryRunner.query(`ALTER TABLE "note" ADD "userId" uuid`);
    await queryRunner.query(`
      UPDATE "note" n
      SET "userId" = ur."id"
      FROM "user_representation" ur
      WHERE n."userExternalId" = ur."externalId"
    `);
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "userExternalId"`);
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD "idpId" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD CONSTRAINT "UQ_37fe280e6de76627f3083f00fa2" UNIQUE ("idpId")`,
    );
    await queryRunner.query(`
      UPDATE "user_representation"
      SET "idpId" = "externalId"
      WHERE "externalId" ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    `);

    // Temporarily drop unique together constraint on item_completion while working on updating user IDs.
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8"`,
    );

    // For every set of user_representation rows with the same email, keep the one with non-null idpId if possible, else the first, and reassign related rows.
    await queryRunner.query(`
      WITH duplicates AS (
        SELECT
          id,
          email,
          "idpId",
          ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
              ("idpId" IS NOT NULL) DESC, 
              CASE WHEN "idpId" IS NOT NULL THEN "createdOn" END DESC,
              id
          ) AS rn
        FROM user_representation
      ),
      to_keep AS (
        SELECT email, id AS keep_id
        FROM duplicates
        WHERE rn = 1
      ),
      to_remove AS (
        SELECT d.id AS remove_id, d.email, tk.keep_id
        FROM duplicates d
        JOIN to_keep tk ON d.email = tk.email
        WHERE d.rn > 1
      ),
      update_item_completion AS (
          UPDATE item_completion ic
          SET "userId" = tr.keep_id
          FROM to_remove tr
          WHERE ic."userId" = tr.remove_id
          RETURNING 1
      ),
      update_note AS (
          UPDATE note n
          SET "userId" = tr.keep_id
          FROM to_remove tr
          WHERE n."userId" = tr.remove_id
          RETURNING 1
      )
      DELETE FROM user_representation ur
      USING to_remove tr
      WHERE ur.id = tr.remove_id
    `);
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD CONSTRAINT "UQ_f19bf0eacee21aa2f77441d6d62" UNIQUE ("email")`,
    );

    // For every set of item_completion rows with the same combination of "userId", "enrollmentId", and "itemId",
    // keep the one with the highest progress, or fallback to the most recently updated one.
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          "userId",
          "enrollmentId",
          "itemId",
          progress,
          "updatedOn",
          ROW_NUMBER() OVER (
            PARTITION BY "userId", "enrollmentId", "itemId"
            ORDER BY progress DESC, "updatedOn" DESC, id
          ) AS rn
        FROM item_completion
      ),
      to_delete AS (
        SELECT id
        FROM ranked
        WHERE rn > 1
      )
      DELETE FROM item_completion ic
      USING to_delete td
      WHERE ic.id = td.id
    `);

    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8" UNIQUE ("userId", "enrollmentId", "itemId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "duration" SET DEFAULT '1 month'::interval`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ALTER COLUMN "courseId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ALTER COLUMN "externalId" DROP NOT NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_37fe280e6de76627f3083f00fa" ON "user_representation" ("idpId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f19bf0eacee21aa2f77441d6d6" ON "user_representation" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ADD CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03" FOREIGN KEY ("courseId") REFERENCES "training_course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_5b87d9d19127bd5d92026017a7b" FOREIGN KEY ("userId") REFERENCES "user_representation"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_5b87d9d19127bd5d92026017a7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f19bf0eacee21aa2f77441d6d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_37fe280e6de76627f3083f00fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP CONSTRAINT "UQ_f19bf0eacee21aa2f77441d6d62"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ALTER COLUMN "externalId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ALTER COLUMN "courseId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ADD CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03" FOREIGN KEY ("courseId") REFERENCES "training_course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "duration" SET DEFAULT '1 mon'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP CONSTRAINT "UQ_37fe280e6de76627f3083f00fa2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP COLUMN "idpId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD "userExternalId" character varying(100) NOT NULL`,
    );
    await queryRunner.query(`
        UPDATE "note" n
        SET "userExternalId" = ur."externalId"
        FROM "user_representation" ur
        WHERE n."userId" = ur."id"
      `);
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "userId"`);

    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_17a903e8d2463bd3351a0687906" FOREIGN KEY ("userExternalId") REFERENCES "user_representation"("externalId") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
  }
}
