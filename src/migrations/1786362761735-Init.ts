import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1786362761735 implements MigrationInterface {
    name = 'Init1786362761735'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "name" character varying(100) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "channelName" character varying(100) NOT NULL, "avatarUrl" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."videos_category_enum" AS ENUM('MUSIC', 'GAMING', 'EDUCATION', 'ENTERTAINMENT', 'SPORTS', 'TECHNOLOGY', 'NEWS', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "description" text NOT NULL, "videoKey" character varying(1000) NOT NULL, "thumbnailKey" character varying(1000) NOT NULL, "category" "public"."videos_category_enum" NOT NULL DEFAULT 'OTHER', "ownerId" uuid NOT NULL, "viewCount" integer NOT NULL DEFAULT '0', "likeCount" integer NOT NULL DEFAULT '0', "dislikeCount" integer NOT NULL DEFAULT '0', "commentCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_e4c86c0cf95aff16e9fb8220f6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9d4a85ef57648e1ba768fbdafd" ON "videos" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_05ad06b5fe2ffa7124cd479141" ON "videos" ("deletedAt") `);
        await queryRunner.query(`CREATE TYPE "public"."upload_sessions_status_enum" AS ENUM('INITIATED', 'COMPLETED', 'ABORTED')`);
        await queryRunner.query(`CREATE TABLE "upload_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "s3Key" character varying(1000) NOT NULL, "s3UploadId" character varying(500) NOT NULL, "fileName" character varying(500) NOT NULL, "fileSize" bigint NOT NULL, "contentType" character varying(150) NOT NULL, "partSize" integer NOT NULL, "totalParts" integer NOT NULL, "status" "public"."upload_sessions_status_enum" NOT NULL DEFAULT 'INITIATED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4b6ca30b8bb2baa0de9c6bf8fea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reactions_type_enum" AS ENUM('LIKE', 'DISLIKE')`);
        await queryRunner.query(`CREATE TABLE "reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "videoId" uuid NOT NULL, "userId" uuid NOT NULL, "type" "public"."reactions_type_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_edd79d51c41d59676c23018890c" UNIQUE ("videoId", "userId"), CONSTRAINT "PK_0b213d460d0c473bc2fb6ee27f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "videoId" uuid NOT NULL, "userId" uuid NOT NULL, "text" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3f2c277fbe1ff89c9dfef05cb3" ON "comments" ("videoId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "view_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "videoId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1096b665e587eb34431389f2cbc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_59e60e775888a68fa9197e9f8e" ON "view_events" ("videoId", "userId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_5d1054c40c41427c083d0a4c6d" ON "view_events" ("videoId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "replacedByTokenId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c25bc63d248ca90e8dcc1d92d0" ON "refresh_tokens" ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "videos" ADD CONSTRAINT "FK_d2dd5aa0094ea865a098c3eeb7e" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "upload_sessions" ADD CONSTRAINT "FK_7a40534aae8ccbb8f3476532317" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_80b864cd052c70cc11bfba920fa" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_f3e1d278edeb2c19a2ddad83f8e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_fd913da8a700d37ba1a456021c1" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "view_events" ADD CONSTRAINT "FK_de3a93ebbdb32791ed48deebf91" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "view_events" ADD CONSTRAINT "FK_bad2ea2689b702fb911dfd814be" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "view_events" DROP CONSTRAINT "FK_bad2ea2689b702fb911dfd814be"`);
        await queryRunner.query(`ALTER TABLE "view_events" DROP CONSTRAINT "FK_de3a93ebbdb32791ed48deebf91"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_fd913da8a700d37ba1a456021c1"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_f3e1d278edeb2c19a2ddad83f8e"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_80b864cd052c70cc11bfba920fa"`);
        await queryRunner.query(`ALTER TABLE "upload_sessions" DROP CONSTRAINT "FK_7a40534aae8ccbb8f3476532317"`);
        await queryRunner.query(`ALTER TABLE "videos" DROP CONSTRAINT "FK_d2dd5aa0094ea865a098c3eeb7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c25bc63d248ca90e8dcc1d92d0"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d1054c40c41427c083d0a4c6d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59e60e775888a68fa9197e9f8e"`);
        await queryRunner.query(`DROP TABLE "view_events"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f2c277fbe1ff89c9dfef05cb3"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TABLE "reactions"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "upload_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."upload_sessions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05ad06b5fe2ffa7124cd479141"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d4a85ef57648e1ba768fbdafd"`);
        await queryRunner.query(`DROP TABLE "videos"`);
        await queryRunner.query(`DROP TYPE "public"."videos_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
