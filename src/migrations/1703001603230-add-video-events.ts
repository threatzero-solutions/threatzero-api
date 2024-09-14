import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoEvents1703001603230 implements MigrationInterface {
  name = 'AddVideoEvents1703001603230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."video_event_type_enum" AS ENUM('play', 'end', 'error', 'pause', 'progress', 'ready', 'buffer', 'duration', 'start', 'seek', 'buffer_end', 'click_preview', 'enable_pip', 'disable_pip')`,
    );
    await queryRunner.query(
      `CREATE TABLE "video_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying(64) NOT NULL, "audienceSlugs" jsonb, "unitSlug" character varying(64), "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "type" "public"."video_event_type_enum" NOT NULL, "itemId" character varying(50), "sectionId" character varying(50), "videoId" character varying(50), "eventData" jsonb NOT NULL, "url" character varying NOT NULL, CONSTRAINT "PK_8a0b5645052a244198171549240" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "video_event"`);
    await queryRunner.query(`DROP TYPE "public"."video_event_type_enum"`);
  }
}
