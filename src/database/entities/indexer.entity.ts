import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { AccountEntity } from './account.entity';
import { IdlDappEntity } from './idl-dapp.entity';
import { IndexerTriggerEntity } from './indexer-trigger.entity';
import { Cluster } from './rpc.entity';

@Entity({
  name: 'indexer',
})
export class IndexerEntity extends AbstractEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: false,
    default: '',
  })
  description: string;

  @Column({
    name: 'slug',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  slug: string;

  @Column({
    name: 'program_id',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  programId: string; // TODO: Index programId

  @Column({
    name: 'cluster',
    type: 'varchar',
    length: 10,
    nullable: false,
    default: Cluster.MAINNET,
  })
  cluster: Cluster;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isActive: boolean;

  @Column({
    name: 'schema_path',
    type: 'varchar',
    length: 255,
    nullable: false,
    default: 'public',
  })
  schemaPath: string;

  @Column({
    name: 'idl_id',
    type: 'bigint',
    nullable: true,
  })
  idlId: number;

  @ManyToOne(() => IdlDappEntity)
  @JoinColumn({ name: 'idl_id', referencedColumnName: 'id' })
  idl: IdlDappEntity;

  @Column({
    type: 'bigint',
    name: 'account_id',
  })
  accountId: number;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: AccountEntity;

  @OneToMany(
    () => IndexerTriggerEntity,
    (indexerTriggers) => indexerTriggers.indexer,
  )
  indexerTriggers: IndexerTriggerEntity[];
}
