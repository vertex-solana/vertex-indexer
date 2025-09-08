import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from './abstract.entity';

@Entity({ name: 'account' })
export class AccountEntity extends AbstractEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: false,
  })
  email: string;

  @Column({
    name: 'wallet_address',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  walletAddress: string;
}
