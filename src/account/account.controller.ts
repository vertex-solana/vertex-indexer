import { Controller, Get, Param } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountResponse } from './dtos/response.dto';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':accountId')
  async findAccount(
    @Param('accountId') accountId: string,
  ): Promise<AccountResponse> {
    const account = await this.accountService.findAccountById(
      parseInt(accountId),
    );
    return new AccountResponse(account);
  }
}
