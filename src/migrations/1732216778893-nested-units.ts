import { MigrationInterface, QueryRunner } from 'typeorm';

export class NestedUnits1732216778893 implements MigrationInterface {
  name = 'NestedUnits1732216778893';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_training_checkpoint"`);
    await queryRunner.query(
      `ALTER TABLE "tip" DROP CONSTRAINT "FK_fd5508d489ec303eb5d0fb65757"`,
    );
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" DROP CONSTRAINT "FK_c359694f2277e913e2e759ef27e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" DROP CONSTRAINT "FK_023b78260cc26961c673e55fc43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_d28c20c8fe2c9467b5d36740d65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_aa2b5af5b2b950791bfdde574b1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_865ecb84c854eea054ac4a301d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6485558d3d15e3929c4f2fca91"`,
    );
    await queryRunner.query(`ALTER TABLE "tip" ADD "unitId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" ADD "unitId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" ADD "unitId" uuid`,
    );
    await queryRunner.query(
      `
          UPDATE "tip" AS tip
          SET "unitId" = unit.id
          FROM "unit" AS unit
          WHERE tip."unitSlug" = unit.slug
          `,
    );
    await queryRunner.query(
      `
          UPDATE "violent_incident_report" AS vir
          SET "unitId" = unit.id
          FROM "unit" AS unit
          WHERE vir."unitSlug" = unit.slug
          `,
    );
    await queryRunner.query(
      `
          UPDATE "threat_assessment" AS ta
          SET "unitId" = unit.id
          FROM "unit" AS unit
          WHERE ta."unitSlug" = unit.slug
          `,
    );
    await queryRunner.query(`ALTER TABLE "tip" DROP COLUMN "unitSlug"`);
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" DROP COLUMN "unitSlug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" DROP COLUMN "unitSlug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "UQ_caf01fb00bc8886a50aa8b8999e"`,
    );
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "groupId"`);
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD "unitId" uuid`,
    );
    await queryRunner.query(
      `
          UPDATE "user_representation" AS ur
          SET "organizationId" = organization.id, "unitId" = unit.id
          FROM "unit" AS unit
          LEFT JOIN "organization" AS organization ON unit."organizationId" = organization.id
          WHERE ur."organizationSlug" = organization.slug AND ur."unitSlug" = unit.slug
          `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP COLUMN "organizationSlug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP COLUMN "unitSlug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP COLUMN "organizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP COLUMN "unitId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD "isDefault" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "unit" ADD "parentUnitId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "duration" SET DEFAULT '1 month'::interval`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "FK_f00221965f05e328934b31233f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "UQ_492d3a34b8f91ef665e7e92dd39"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ALTER COLUMN "organizationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3b7ec3e2c2ac8629ddb4b595e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_14bf91f80afa453e9545523814"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a3e99a41352f5e601a6a44d7c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" RENAME COLUMN "userId" TO "userExternalId"`,
    );
    await queryRunner.query(`ALTER TABLE "item_completion" ADD "userId" uuid`);
    await queryRunner.query(
      `
          UPDATE "item_completion" AS ic
          SET "userId" = ur.id
          FROM "user_representation" AS ur
          WHERE ur."externalId" = ic."userExternalId"
          `,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP COLUMN "userExternalId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9491d8c126d1a50b5db714669" ON "user_representation" ("externalId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec4e91a06ff857a70b7b84dffe" ON "user_representation" ("organizationId", "unitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a3e99a41352f5e601a6a44d7c" ON "item_completion" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3b7ec3e2c2ac8629ddb4b595e" ON "item_completion" ("userId", "enrollmentId", "itemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14bf91f80afa453e9545523814" ON "item_completion" ("userId", "completed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e9ffad2c5a0a31295024f60ca" ON "item_completion" ("userId", "itemId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "UQ_71f605e69e76ffa23082218a286" UNIQUE ("slug", "organizationId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8" UNIQUE ("userId", "enrollmentId", "itemId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "FK_f00221965f05e328934b31233f1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "FK_329004e9a777aa2b5a17c8a1b63" FOREIGN KEY ("parentUnitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" ADD CONSTRAINT "FK_55607e56534790c58eac9456264" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" ADD CONSTRAINT "FK_c4df49354dd8f1dbf45723772e6" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" ADD CONSTRAINT "FK_d014cfe7708212e3ff603dbf669" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD CONSTRAINT "FK_d172b28ad4c34c76dca05971073" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD CONSTRAINT "FK_6b061442ddc2f0cea496eb3ca9e" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_8a3e99a41352f5e601a6a44d7c7" FOREIGN KEY ("userId") REFERENCES "user_representation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "FK_8a3e99a41352f5e601a6a44d7c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP CONSTRAINT "FK_6b061442ddc2f0cea496eb3ca9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP CONSTRAINT "FK_d172b28ad4c34c76dca05971073"`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" DROP CONSTRAINT "FK_d014cfe7708212e3ff603dbf669"`,
    );
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" DROP CONSTRAINT "FK_c4df49354dd8f1dbf45723772e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" DROP CONSTRAINT "FK_55607e56534790c58eac9456264"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "FK_329004e9a777aa2b5a17c8a1b63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "FK_f00221965f05e328934b31233f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "UQ_71f605e69e76ffa23082218a286"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2e9ffad2c5a0a31295024f60ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_14bf91f80afa453e9545523814"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3b7ec3e2c2ac8629ddb4b595e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a3e99a41352f5e601a6a44d7c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec4e91a06ff857a70b7b84dffe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9491d8c126d1a50b5db714669"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD COLUMN "userExternalId" character varying`,
    );
    await queryRunner.query(
      `
          UPDATE "item_completion" AS ic
          SET "userExternalId" = ur."externalId"
          FROM "user_representation" AS ur
          WHERE ur.id = ic."userId"
          `,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" RENAME COLUMN "userExternalId" TO "userId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a3e99a41352f5e601a6a44d7c" ON "item_completion" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "UQ_a3b7ec3e2c2ac8629ddb4b595e8" UNIQUE ("userId", "itemId", "enrollmentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14bf91f80afa453e9545523814" ON "item_completion" ("completed", "userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3b7ec3e2c2ac8629ddb4b595e" ON "item_completion" ("userId", "itemId", "enrollmentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ALTER COLUMN "organizationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "UQ_492d3a34b8f91ef665e7e92dd39" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "FK_f00221965f05e328934b31233f1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ALTER COLUMN "duration" SET DEFAULT '1 mon'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD "unitSlug" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" ADD "organizationSlug" character varying(100)`,
    );
    await queryRunner.query(
      `
          UPDATE "user_representation" AS ur
          SET "organizationSlug" = organization.slug, "unitSlug" = unit.slug
          FROM "unit" AS unit
          LEFT JOIN "organization" AS organization ON unit."organizationId" = organization.id
          WHERE ur."organizationId" = organization.id AND ur."unitId" = unit.id
          `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP COLUMN "unitId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_representation" DROP COLUMN "organizationId"`,
    );
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "parentUnitId"`);
    await queryRunner.query(`ALTER TABLE "unit" DROP COLUMN "isDefault"`);
    await queryRunner.query(`ALTER TABLE "item_completion" ADD "unitId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD "groupId" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "UQ_caf01fb00bc8886a50aa8b8999e" UNIQUE ("groupId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" ADD "unitSlug" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" ADD "unitSlug" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" ADD "unitSlug" character varying(100)`,
    );
    await queryRunner.query(
      `
          UPDATE "tip" AS tip
          SET "unitSlug" = unit.slug
          FROM "unit" AS unit
          WHERE tip."unitId" = unit.id
          `,
    );
    await queryRunner.query(
      `
          UPDATE "violent_incident_report" AS vir
          SET "unitSlug" = unit.slug
          FROM "unit" AS unit
          WHERE vir."unitId" = unit.id
          `,
    );
    await queryRunner.query(
      `
          UPDATE "threat_assessment" AS ta
          SET "unitSlug" = unit.slug
          FROM "unit" AS unit
          WHERE ta."unitId" = unit.id
          `,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" DROP COLUMN "unitId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" DROP COLUMN "unitId"`,
    );
    await queryRunner.query(`ALTER TABLE "tip" DROP COLUMN "unitId"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6485558d3d15e3929c4f2fca91" ON "item_completion" ("itemId", "organizationId", "unitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_865ecb84c854eea054ac4a301d" ON "item_completion" ("organizationId", "unitId", "enrollmentId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_aa2b5af5b2b950791bfdde574b1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item_completion" ADD CONSTRAINT "FK_d28c20c8fe2c9467b5d36740d65" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" ADD CONSTRAINT "FK_023b78260cc26961c673e55fc43" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "violent_incident_report" ADD CONSTRAINT "FK_c359694f2277e913e2e759ef27e" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" ADD CONSTRAINT "FK_fd5508d489ec303eb5d0fb65757" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
