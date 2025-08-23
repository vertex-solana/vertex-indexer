import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoGenerate1755049625321 implements MigrationInterface {
  name = 'AutoGenerate1755049625321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "indexer_schema_credential" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "user_name" character varying(255) NOT NULL, "password_encrypted" character varying(1024) NOT NULL, "indexer_id" bigint NOT NULL, CONSTRAINT "REL_cba1b4f08d75f4cccb0f7ce0ef" UNIQUE ("indexer_id"), CONSTRAINT "PK_f3c2a52fdfcc7716277882d3c21" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "indexer_schema_credential" ADD CONSTRAINT "FK_cba1b4f08d75f4cccb0f7ce0ef4" FOREIGN KEY ("indexer_id") REFERENCES "indexer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "indexer_schema_credential" DROP CONSTRAINT "FK_cba1b4f08d75f4cccb0f7ce0ef4"`,
    );
    await queryRunner.query(`DROP TABLE "indexer_schema_credential"`);
  }
}
