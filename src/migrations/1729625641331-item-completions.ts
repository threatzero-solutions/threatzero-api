import { MigrationInterface, QueryRunner } from 'typeorm';

export class ItemCompletions1729625641331 implements MigrationInterface {
  name = 'ItemCompletions1729625641331';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "item_completion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completed" boolean NOT NULL DEFAULT false, "completedOn" TIMESTAMP WITH TIME ZONE, "progress" double precision NOT NULL DEFAULT '0', "url" character varying NOT NULL, "userId" character varying(64) NOT NULL, "email" character varying(254), "audienceSlugs" jsonb, "itemId" uuid, "sectionId" uuid, "courseId" uuid, "organizationId" uuid, "unitId" uuid, CONSTRAINT "UQ_ae7aa28aaf8ba30038b521b6cdd" UNIQUE ("userId", "courseId", "itemId"), CONSTRAINT "PK_3b6b5ad509eb0bf46e3e73ab6ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a3e99a41352f5e601a6a44d7c" ON "item_completion" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae7aa28aaf8ba30038b521b6cd" ON "item_completion" ("userId", "courseId", "itemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14bf91f80afa453e9545523814" ON "item_completion" ("userId", "completed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd815424b8d1469841966dded9" ON "item_completion" ("organizationId", "unitId", "courseId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6485558d3d15e3929c4f2fca91" ON "item_completion" ("organizationId", "unitId", "itemId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_94e6de85f42bab5be07e6a1bde1" FOREIGN KEY ("itemId") REFERENCES "training_item"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_7e82d513e9807a53c47542d3036" FOREIGN KEY ("sectionId") REFERENCES "training_section"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_2a102620a39d42c098b3d354654" FOREIGN KEY ("courseId") REFERENCES "training_course"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_aa2b5af5b2b950791bfdde574b1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_d28c20c8fe2c9467b5d36740d65" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_d28c20c8fe2c9467b5d36740d65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_aa2b5af5b2b950791bfdde574b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_2a102620a39d42c098b3d354654"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_7e82d513e9807a53c47542d3036"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_94e6de85f42bab5be07e6a1bde1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6485558d3d15e3929c4f2fca91"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fd815424b8d1469841966dded9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_14bf91f80afa453e9545523814"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ae7aa28aaf8ba30038b521b6cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a3e99a41352f5e601a6a44d7c"`,
    );
    await queryRunner.query(`DROP TABLE "item_completion"`);
  }
}
