import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1696303146967 implements MigrationInterface {
  name = 'Initial1696303146967';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "training_section_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT '0', "sectionId" uuid, "itemId" uuid, CONSTRAINT "PK_179ad85a96a80d167798923286f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "thumbnailKey" character varying(128), "prerequisitesFulfilled" boolean, "estCompletionTime" interval, "mediaKey" character varying(128), "type" character varying NOT NULL, "metadataTitle" character varying(100), "metadataDescription" text, CONSTRAINT "PK_2377c2fd8a09809ca8cc4fbbd2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audience" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(32) NOT NULL, CONSTRAINT "UQ_75afb3ad5decb42d1af3294e2c7" UNIQUE ("slug"), CONSTRAINT "PK_2ecf18dc010ddf7e956afd9866b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_course" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "metadataTitle" character varying(100), "metadataDescription" text, CONSTRAINT "PK_56adcccf0f40e261ee7cac6c6b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_section" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "order" integer NOT NULL DEFAULT '0', "availableOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "expiresOn" TIMESTAMP WITH TIME ZONE, "repeats" character varying NOT NULL DEFAULT 'once', "courseId" uuid, "metadataTitle" character varying(100), "metadataDescription" text, CONSTRAINT "PK_d25fc63fc836aef1b0c1dfa3331" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "field_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" text, "subtitle" text, "description" text, "order" integer NOT NULL DEFAULT '0', "formId" uuid, "parentGroupId" uuid, CONSTRAINT "PK_fe18423dcdf6854450479054de3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "form" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(100) NOT NULL, "version" integer NOT NULL, "title" text, "subtitle" text, "description" text, "state" character varying NOT NULL DEFAULT 'draft', CONSTRAINT "UQ_a2d55b7c9970de41765992b27f7" UNIQUE ("slug", "version"), CONSTRAINT "CHK_d3a5a8cc3816ef1e2cbc78e5e7" CHECK (state = 'draft' OR (state = 'published' AND version > 0)), CONSTRAINT "PK_8f72b95aa2f8ba82cf95dc7579e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1288bfbf098df297254d5d2745" ON "form" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "field" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(128) NOT NULL, "label" text NOT NULL, "placeholder" text, "helpText" text, "type" character varying NOT NULL DEFAULT 'text', "elementProperties" jsonb, "typeParams" jsonb, "required" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "hidden" boolean NOT NULL DEFAULT false, "formId" uuid, "groupId" uuid, CONSTRAINT "PK_39379bba786d7a75226b358f81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "field_response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "value" jsonb NOT NULL, "fieldId" uuid, "formResponseId" uuid, CONSTRAINT "PK_9dad59aea2ea00817a1a729ddf2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "form_submission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "formId" uuid, "userId" character varying(64), "ipv4" inet, "ipv6" inet, "status" character varying NOT NULL DEFAULT 'not_complete', CONSTRAINT "PK_afdf6f86e3747141dd75876e027" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(64) NOT NULL, "name" character varying(128) NOT NULL, "address" text, "externalId" character varying NOT NULL, CONSTRAINT "UQ_a08804baa7c5d5427067c49a31f" UNIQUE ("slug"), CONSTRAINT "UQ_64112faa73ec58b0f8ce1d01a86" UNIQUE ("externalId"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a08804baa7c5d5427067c49a31" ON "organization" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "unit" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(64) NOT NULL, "name" character varying(128) NOT NULL, "address" text, "organizationId" uuid, CONSTRAINT "UQ_492d3a34b8f91ef665e7e92dd39" UNIQUE ("slug"), CONSTRAINT "PK_4252c4be609041e559f0c80f58a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_492d3a34b8f91ef665e7e92dd3" ON "unit" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "threat_assessment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "unitSlug" character varying(64) NOT NULL, "status" character varying NOT NULL DEFAULT 'in_progress', "submissionId" uuid, CONSTRAINT "REL_b10a7bbd724e8ec573bc56a68f" UNIQUE ("submissionId"), CONSTRAINT "PK_2aa40497df26494cd8d271828e9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_representation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "externalId" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "name" character varying(100), "givenName" character varying(100), "familyName" character varying(100), "picture" text, "organizationExternalId" character varying(100), "unitSlug" character varying(100), CONSTRAINT "UQ_e9491d8c126d1a50b5db7146698" UNIQUE ("externalId"), CONSTRAINT "PK_dfb68da9e244521853ab5345843" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "note" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "value" text NOT NULL, "userExternalId" character varying(100) NOT NULL, "tipId" uuid, "assessmentId" uuid, CONSTRAINT "PK_96d0c172a4fba276b1bbed43058" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tip" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "unitSlug" character varying(64) NOT NULL, "informantFirstName" character varying(64), "informantLastName" character varying(64), "informantEmail" character varying(319), "informantPhone" character varying(32), "status" character varying NOT NULL DEFAULT 'new', "submissionId" uuid, CONSTRAINT "REL_7a8325a27d7441c06c7efbea24" UNIQUE ("submissionId"), CONSTRAINT "PK_855d736988802b4ec0e07b7e762" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100), "locationId" character varying(15) NOT NULL, "unitId" uuid, CONSTRAINT "UQ_8b51e14a3447c3df460c1907acb" UNIQUE ("locationId"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b51e14a3447c3df460c1907ac" ON "location" ("locationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_training_checkpoint" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" character varying(64) NOT NULL, "audienceSlug" character varying(32), "unitSlug" character varying(64) NOT NULL, "status" character varying NOT NULL DEFAULT 'not_complete', "completionDate" TIMESTAMP WITH TIME ZONE, "type" character varying NOT NULL DEFAULT 'individual', "trainingItemId" uuid, CONSTRAINT "UQ_user_item_completion" UNIQUE ("userId", "trainingItemId", "audienceSlug"), CONSTRAINT "PK_06d45a9566668c55b6ac40f5ecb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_survey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" character varying(32) NOT NULL, "formSlug" character varying, "formVersion" integer NOT NULL, "triggerOnStart" boolean NOT NULL DEFAULT false, "initialDelay" interval, "repeatAfter" interval, "required" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_c1f2260379b8103f43edcb3f48c" UNIQUE ("slug"), CONSTRAINT "PK_73cfc0d09bb79a20be275122e0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_survey_response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "unitSlug" character varying(64) NOT NULL, "userId" character varying(64) NOT NULL, "status" character varying NOT NULL DEFAULT 'not_complete', "closedOn" TIMESTAMP WITH TIME ZONE, "userSurveyId" uuid, "submissionId" uuid, CONSTRAINT "REL_79e776820416a4696ffbe78148" UNIQUE ("submissionId"), CONSTRAINT "PK_646bf8e47e6df4b5ed0ca4b26a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_item_audiences_audience" ("trainingItemId" uuid NOT NULL, "audienceId" uuid NOT NULL, CONSTRAINT "PK_d8b8f5bd8829ab14e7fba58f408" PRIMARY KEY ("trainingItemId", "audienceId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f150d5e2fae0643414aee3b0b9" ON "training_item_audiences_audience" ("trainingItemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acc319d9919ebdb8f5f02e1221" ON "training_item_audiences_audience" ("audienceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "training_item_prerequisite_items_training_item" ("trainingItemId_1" uuid NOT NULL, "trainingItemId_2" uuid NOT NULL, CONSTRAINT "PK_013cf2db0c05fab6a0767c8139f" PRIMARY KEY ("trainingItemId_1", "trainingItemId_2"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e5df2e611a6eb33e04c819264" ON "training_item_prerequisite_items_training_item" ("trainingItemId_1") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_16963c94905678de28bb02881c" ON "training_item_prerequisite_items_training_item" ("trainingItemId_2") `,
    );
    await queryRunner.query(
      `CREATE TABLE "training_course_audiences_audience" ("trainingCourseId" uuid NOT NULL, "audienceId" uuid NOT NULL, CONSTRAINT "PK_908f2654c1f33883c347762ecaa" PRIMARY KEY ("trainingCourseId", "audienceId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_921c7f250632a16ee10007f561" ON "training_course_audiences_audience" ("trainingCourseId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17f8048dfe33dd9de15b5d8666" ON "training_course_audiences_audience" ("audienceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "training_course_presentable_by_audience" ("trainingCourseId" uuid NOT NULL, "audienceId" uuid NOT NULL, CONSTRAINT "PK_d0212b5be80ef694a72541185bd" PRIMARY KEY ("trainingCourseId", "audienceId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb9c76c4a1546930c670d200ec" ON "training_course_presentable_by_audience" ("trainingCourseId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79dd2c594d433e4c92f9345741" ON "training_course_presentable_by_audience" ("audienceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_survey_audiences_audience" ("userSurveyId" uuid NOT NULL, "audienceId" uuid NOT NULL, CONSTRAINT "PK_1819a111c526d24edab7314e051" PRIMARY KEY ("userSurveyId", "audienceId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d615137a816b63335abe75649" ON "user_survey_audiences_audience" ("userSurveyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fa69dfc7c4efe842d24d0ebbf0" ON "user_survey_audiences_audience" ("audienceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "field_group_closure" ("id_ancestor" uuid NOT NULL, "id_descendant" uuid NOT NULL, CONSTRAINT "PK_5a492e533494b1d59de5a370041" PRIMARY KEY ("id_ancestor", "id_descendant"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9d049a6a1950ae647eb6080e3f" ON "field_group_closure" ("id_ancestor") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c6946db7ffda6d233588ecb91" ON "field_group_closure" ("id_descendant") `,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section_item" ADD CONSTRAINT "FK_bf8d676087716baeb38b8c059df" FOREIGN KEY ("sectionId") REFERENCES "training_section"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section_item" ADD CONSTRAINT "FK_02729bb1e1a5abf9609b125a485" FOREIGN KEY ("itemId") REFERENCES "training_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" ADD CONSTRAINT "FK_89c5194422f5aa5db5d659fcf09" FOREIGN KEY ("courseId") REFERENCES "training_course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_group" ADD CONSTRAINT "FK_12c3d422a4bfce8ca79ccbc7578" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_group" ADD CONSTRAINT "FK_9014f35018133be90f8bd17bea9" FOREIGN KEY ("parentGroupId") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field" ADD CONSTRAINT "FK_1bc8b60404fce5836d595e6611b" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field" ADD CONSTRAINT "FK_0cb7eadcf14da14c615d29c458b" FOREIGN KEY ("groupId") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_response" ADD CONSTRAINT "FK_02db534955c2d19ec0f32c3219e" FOREIGN KEY ("fieldId") REFERENCES "field"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_response" ADD CONSTRAINT "FK_0dc68dff3073955452f3c427a2c" FOREIGN KEY ("formResponseId") REFERENCES "form_submission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_submission" ADD CONSTRAINT "FK_0c044839ddb8d7bef1c8762a3ce" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" ADD CONSTRAINT "FK_f00221965f05e328934b31233f1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" ADD CONSTRAINT "FK_023b78260cc26961c673e55fc43" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" ADD CONSTRAINT "FK_b10a7bbd724e8ec573bc56a68f6" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_17a903e8d2463bd3351a0687906" FOREIGN KEY ("userExternalId") REFERENCES "user_representation"("externalId") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_0f5c7c9d5ef1ca0db2c91984f78" FOREIGN KEY ("tipId") REFERENCES "tip"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" ADD CONSTRAINT "FK_84f9f7d49ff6513797f47d5a3df" FOREIGN KEY ("assessmentId") REFERENCES "threat_assessment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" ADD CONSTRAINT "FK_fd5508d489ec303eb5d0fb65757" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" ADD CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_7090a1be111f217f3e5772e2628" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_training_checkpoint" ADD CONSTRAINT "FK_c941a060b3afdb3994d9dd6c4a9" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_training_checkpoint" ADD CONSTRAINT "FK_9c80cf0cf4c56ee22dec999477b" FOREIGN KEY ("trainingItemId") REFERENCES "training_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey" ADD CONSTRAINT "FK_4fd7da4f14b88e5788492c346eb" FOREIGN KEY ("formSlug", "formVersion") REFERENCES "form"("slug","version") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_response" ADD CONSTRAINT "FK_f47b792c16e06394963bffc7c69" FOREIGN KEY ("userSurveyId") REFERENCES "user_survey"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_response" ADD CONSTRAINT "FK_e68b1529563bf70265a21703130" FOREIGN KEY ("unitSlug") REFERENCES "unit"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_response" ADD CONSTRAINT "FK_79e776820416a4696ffbe781483" FOREIGN KEY ("submissionId") REFERENCES "form_submission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_audiences_audience" ADD CONSTRAINT "FK_f150d5e2fae0643414aee3b0b92" FOREIGN KEY ("trainingItemId") REFERENCES "training_item"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_audiences_audience" ADD CONSTRAINT "FK_acc319d9919ebdb8f5f02e1221e" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_prerequisite_items_training_item" ADD CONSTRAINT "FK_8e5df2e611a6eb33e04c8192649" FOREIGN KEY ("trainingItemId_1") REFERENCES "training_item"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_prerequisite_items_training_item" ADD CONSTRAINT "FK_16963c94905678de28bb02881ce" FOREIGN KEY ("trainingItemId_2") REFERENCES "training_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_audiences_audience" ADD CONSTRAINT "FK_921c7f250632a16ee10007f5610" FOREIGN KEY ("trainingCourseId") REFERENCES "training_course"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_audiences_audience" ADD CONSTRAINT "FK_17f8048dfe33dd9de15b5d86663" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_presentable_by_audience" ADD CONSTRAINT "FK_bb9c76c4a1546930c670d200eca" FOREIGN KEY ("trainingCourseId") REFERENCES "training_course"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_presentable_by_audience" ADD CONSTRAINT "FK_79dd2c594d433e4c92f93457411" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_audiences_audience" ADD CONSTRAINT "FK_2d615137a816b63335abe75649f" FOREIGN KEY ("userSurveyId") REFERENCES "user_survey"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_audiences_audience" ADD CONSTRAINT "FK_fa69dfc7c4efe842d24d0ebbf0c" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_group_closure" ADD CONSTRAINT "FK_9d049a6a1950ae647eb6080e3f0" FOREIGN KEY ("id_ancestor") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_group_closure" ADD CONSTRAINT "FK_2c6946db7ffda6d233588ecb919" FOREIGN KEY ("id_descendant") REFERENCES "field_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "query-result-cache" ("id" SERIAL NOT NULL, "identifier" character varying, "time" bigint NOT NULL, "duration" integer NOT NULL, "query" text NOT NULL, "result" text NOT NULL, CONSTRAINT "PK_6a98f758d8bfd010e7e10ffd3d3" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "query-result-cache"`);
    await queryRunner.query(
      `ALTER TABLE "field_group_closure" DROP CONSTRAINT "FK_2c6946db7ffda6d233588ecb919"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_group_closure" DROP CONSTRAINT "FK_9d049a6a1950ae647eb6080e3f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_audiences_audience" DROP CONSTRAINT "FK_fa69dfc7c4efe842d24d0ebbf0c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_audiences_audience" DROP CONSTRAINT "FK_2d615137a816b63335abe75649f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_presentable_by_audience" DROP CONSTRAINT "FK_79dd2c594d433e4c92f93457411"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_presentable_by_audience" DROP CONSTRAINT "FK_bb9c76c4a1546930c670d200eca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_audiences_audience" DROP CONSTRAINT "FK_17f8048dfe33dd9de15b5d86663"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_course_audiences_audience" DROP CONSTRAINT "FK_921c7f250632a16ee10007f5610"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_prerequisite_items_training_item" DROP CONSTRAINT "FK_16963c94905678de28bb02881ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_prerequisite_items_training_item" DROP CONSTRAINT "FK_8e5df2e611a6eb33e04c8192649"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_audiences_audience" DROP CONSTRAINT "FK_acc319d9919ebdb8f5f02e1221e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_item_audiences_audience" DROP CONSTRAINT "FK_f150d5e2fae0643414aee3b0b92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_response" DROP CONSTRAINT "FK_79e776820416a4696ffbe781483"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_response" DROP CONSTRAINT "FK_e68b1529563bf70265a21703130"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey_response" DROP CONSTRAINT "FK_f47b792c16e06394963bffc7c69"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_survey" DROP CONSTRAINT "FK_4fd7da4f14b88e5788492c346eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_training_checkpoint" DROP CONSTRAINT "FK_9c80cf0cf4c56ee22dec999477b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_training_checkpoint" DROP CONSTRAINT "FK_c941a060b3afdb3994d9dd6c4a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_7090a1be111f217f3e5772e2628"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" DROP CONSTRAINT "FK_7a8325a27d7441c06c7efbea24c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tip" DROP CONSTRAINT "FK_fd5508d489ec303eb5d0fb65757"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_84f9f7d49ff6513797f47d5a3df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_0f5c7c9d5ef1ca0db2c91984f78"`,
    );
    await queryRunner.query(
      `ALTER TABLE "note" DROP CONSTRAINT "FK_17a903e8d2463bd3351a0687906"`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" DROP CONSTRAINT "FK_b10a7bbd724e8ec573bc56a68f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "threat_assessment" DROP CONSTRAINT "FK_023b78260cc26961c673e55fc43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unit" DROP CONSTRAINT "FK_f00221965f05e328934b31233f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_submission" DROP CONSTRAINT "FK_0c044839ddb8d7bef1c8762a3ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_response" DROP CONSTRAINT "FK_0dc68dff3073955452f3c427a2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_response" DROP CONSTRAINT "FK_02db534955c2d19ec0f32c3219e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field" DROP CONSTRAINT "FK_0cb7eadcf14da14c615d29c458b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field" DROP CONSTRAINT "FK_1bc8b60404fce5836d595e6611b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_group" DROP CONSTRAINT "FK_9014f35018133be90f8bd17bea9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "field_group" DROP CONSTRAINT "FK_12c3d422a4bfce8ca79ccbc7578"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section" DROP CONSTRAINT "FK_89c5194422f5aa5db5d659fcf09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section_item" DROP CONSTRAINT "FK_02729bb1e1a5abf9609b125a485"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_section_item" DROP CONSTRAINT "FK_bf8d676087716baeb38b8c059df"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c6946db7ffda6d233588ecb91"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9d049a6a1950ae647eb6080e3f"`,
    );
    await queryRunner.query(`DROP TABLE "field_group_closure"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fa69dfc7c4efe842d24d0ebbf0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d615137a816b63335abe75649"`,
    );
    await queryRunner.query(`DROP TABLE "user_survey_audiences_audience"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79dd2c594d433e4c92f9345741"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb9c76c4a1546930c670d200ec"`,
    );
    await queryRunner.query(
      `DROP TABLE "training_course_presentable_by_audience"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17f8048dfe33dd9de15b5d8666"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_921c7f250632a16ee10007f561"`,
    );
    await queryRunner.query(`DROP TABLE "training_course_audiences_audience"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_16963c94905678de28bb02881c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e5df2e611a6eb33e04c819264"`,
    );
    await queryRunner.query(
      `DROP TABLE "training_item_prerequisite_items_training_item"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_acc319d9919ebdb8f5f02e1221"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f150d5e2fae0643414aee3b0b9"`,
    );
    await queryRunner.query(`DROP TABLE "training_item_audiences_audience"`);
    await queryRunner.query(`DROP TABLE "user_survey_response"`);
    await queryRunner.query(`DROP TABLE "user_survey"`);
    await queryRunner.query(`DROP TABLE "user_training_checkpoint"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b51e14a3447c3df460c1907ac"`,
    );
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP TABLE "tip"`);
    await queryRunner.query(`DROP TABLE "note"`);
    await queryRunner.query(`DROP TABLE "user_representation"`);
    await queryRunner.query(`DROP TABLE "threat_assessment"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_492d3a34b8f91ef665e7e92dd3"`,
    );
    await queryRunner.query(`DROP TABLE "unit"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a08804baa7c5d5427067c49a31"`,
    );
    await queryRunner.query(`DROP TABLE "organization"`);
    await queryRunner.query(`DROP TABLE "form_submission"`);
    await queryRunner.query(`DROP TABLE "field_response"`);
    await queryRunner.query(`DROP TABLE "field"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1288bfbf098df297254d5d2745"`,
    );
    await queryRunner.query(`DROP TABLE "form"`);
    await queryRunner.query(`DROP TABLE "field_group"`);
    await queryRunner.query(`DROP TABLE "training_section"`);
    await queryRunner.query(`DROP TABLE "training_course"`);
    await queryRunner.query(`DROP TABLE "audience"`);
    await queryRunner.query(`DROP TABLE "training_item"`);
    await queryRunner.query(`DROP TABLE "training_section_item"`);
  }
}
