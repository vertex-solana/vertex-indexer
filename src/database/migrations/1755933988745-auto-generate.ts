import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoGenerate1755933988745 implements MigrationInterface {
  name = 'AutoGenerate1755933988745';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "is_updated_user_name"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "is_updated_user_name" boolean NOT NULL DEFAULT false`,
    );
  }
}
