import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoGenerate1756310417103 implements MigrationInterface {
  name = 'AutoGenerate1756310417103';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vertex_transaction" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" BIGSERIAL NOT NULL, "execution_layer" character varying(255) NOT NULL, "transaction_type" character varying(255) NOT NULL, "amount" bigint, "indexer_id" bigint, "bytes" bigint, "transaction_hash" character varying(255) NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "account_id" bigint NOT NULL, CONSTRAINT "PK_6c50fe8f3958cc8286fecdf7dc1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ce0d1d9756d563bc042681a41" ON "vertex_transaction" ("transaction_hash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_583b5ecb8daaf40ef94cb88b71" ON "vertex_transaction" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d358c3d5eb905e9ef808d669fc" ON "vertex_transaction" ("account_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "vertex_transaction" ADD CONSTRAINT "FK_d358c3d5eb905e9ef808d669fc1" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vertex_transaction" DROP CONSTRAINT "FK_d358c3d5eb905e9ef808d669fc1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d358c3d5eb905e9ef808d669fc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_583b5ecb8daaf40ef94cb88b71"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ce0d1d9756d563bc042681a41"`,
    );
    await queryRunner.query(`DROP TABLE "vertex_transaction"`);
  }
}
