import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoGenerate1754958422214 implements MigrationInterface {
  name = 'AutoGenerate1754958422214';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "indexer" ADD "schema_path" character varying(255) NOT NULL DEFAULT 'public'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "indexer" DROP COLUMN "schema_path"`);
  }
}
