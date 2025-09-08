import { ApiProperty } from '@nestjs/swagger';
import { AccountEntity } from 'src/database/entities';

export class AccountResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  createdAt: Date;

  constructor(account: AccountEntity) {
    this.id = account.id;
    this.email = account.email;
    this.walletAddress = account.walletAddress;
    this.createdAt = account.createdAt;
  }
}
