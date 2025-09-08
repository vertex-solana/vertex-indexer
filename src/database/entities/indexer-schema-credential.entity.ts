import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { IndexerEntity } from './indexer.entity';

@Entity({
  name: 'indexer_schema_credential',
})
export class IndexerSchemaCredentialEntity extends AbstractEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;

  @Column({
    name: 'user_name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  userName: string;

  @Column({
    name: 'password_encrypted',
    type: 'varchar',
    length: 1024,
    nullable: false,
  })
  passwordEncrypted: string;

  @Column({
    name: 'indexer_id',
    type: 'bigint',
  })
  indexerId: number;

  @OneToOne(() => IndexerEntity)
  @JoinColumn({ name: 'indexer_id', referencedColumnName: 'id' })
  indexer: IndexerEntity;
}

export const getIndexerRole = (
  indexerId: number,
  role: 'owner' | 'reader',
): string => {
  if (role === 'owner') {
    return `indexer_${indexerId}_owner`;
  } else {
    return `indexer_${indexerId}_reader`;
  }
};
