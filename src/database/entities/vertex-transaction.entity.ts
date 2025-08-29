import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import {
  ExecutionLayer,
  VertexTransactionType,
} from 'src/common/enum/common.enum';
import { AccountEntity } from './account.entity';

@Entity({ name: 'vertex_transaction' })
export class VertexTransactionEntity extends AbstractEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;

  @Column({
    name: 'execution_layer',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  executionLayer: ExecutionLayer;

  @Column({
    name: 'transaction_type',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  transactionType: VertexTransactionType;

  @Column({
    name: 'amount',
    type: 'bigint',
    nullable: true,
  })
  amount: BigInt | null;

  @Column({
    name: 'indexer_id',
    type: 'bigint',
    nullable: true,
  })
  indexerId: number | null;

  @Column({
    name: 'bytes',
    type: 'bigint',
    nullable: true,
  })
  bytes: BigInt | null;

  @Column({
    name: 'transaction_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @Index()
  transactionHash: string;

  @Column({
    name: 'timestamp',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Index()
  timestamp: Date;

  @Column({
    name: 'account_id',
    type: 'bigint',
    nullable: false,
  })
  accountId: number;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  @Index()
  account: AccountEntity;
}
