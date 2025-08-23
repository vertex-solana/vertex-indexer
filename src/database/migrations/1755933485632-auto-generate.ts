import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoGenerate1755933485632 implements MigrationInterface {
  name = 'AutoGenerate1755933485632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_4d258da1f4c854e589909d4260b"`,
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "user_name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "user_name" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_4d258da1f4c854e589909d4260b" UNIQUE ("user_name")`,
    );
  }
}
