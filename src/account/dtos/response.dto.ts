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
  isUpdatedUserName: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(account: AccountEntity) {
    this.id = account.id;
    this.email = account.email;
    this.walletAddress = account.walletAddress;
    this.isUpdatedUserName = account.isUpdatedUserName;
    this.createdAt = account.createdAt;
  }
}
