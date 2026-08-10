import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameAvatarUrlToAvatarKey1786387880081 implements MigrationInterface {
    name = 'RenameAvatarUrlToAvatarKey1786387880081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO "avatarKey"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "avatarKey" TO "avatarUrl"`);
    }

}
