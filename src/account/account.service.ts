import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil } from 'lodash';
import { AccountEntity } from 'src/database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async findAccounts(payload: {
    pageNum: number;
    pageSize: number;
  }): Promise<AccountEntity[]> {
    const { pageNum, pageSize } = payload;
    return await this.accountRepository.find({
      take: pageSize,
      skip: pageNum * pageSize,
    });
  }

  async findOrCreateAccountByEmail(email: string): Promise<AccountEntity> {
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .where('account.email = :email', { email })
      .getOne();
    if (!isNil(account)) {
      return account;
    }
    const newAccount = await this.accountRepository.save(
      this.accountRepository.create({
        email: email,
        walletAddress: '',
      }),
    );
    return newAccount;
  }

  async findAccountById(id: number): Promise<AccountEntity> {
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .where('account.id = :id', { id })
      .getOne();
    if (isNil(account)) {
      throw new BadRequestException(`Account not found`);
    }

    return account;
  }

  async findOrCreateAccountByWalletAddress(
    walletAddress: string,
  ): Promise<AccountEntity> {
    const account = await this.accountRepository
      .createQueryBuilder('account')
      .where('account.walletAddress = :walletAddress', { walletAddress })
      .getOne();

    if (!isNil(account)) {
      return account;
    }

    const newAccount = await this.accountRepository.save(
      this.accountRepository.create({
        walletAddress: walletAddress,
        email: null,
      }),
    );

    return newAccount;
  }
}
