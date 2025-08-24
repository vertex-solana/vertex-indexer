import * as anchor from 'anchor-v31';
import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { AbstractJobProcessor } from 'src/common/processors/common.processor';
import {
  InjectBillingSystemQueue,
  SystemQueue,
  SystemQueueJob,
  VertexBillingQueueJob,
} from 'src/common/queue';
import {
  IInitUserVaultJob,
  IInitIndexerJob,
  ISyncTransactionBillingJob,
  IStartDelegateUserVaultJob,
  IDepositToVaultJob,
  IWithdrawIndexerFeeJob,
  UpdateTrackUserActivityJob,
  ITrackUserActivityJob,
  IStartBillingJob,
  IStartChargeFeeJob,
  IChargedFeeJob,
} from './billing-job.interface';
import { BillingSyncTransactionService } from './billing-sync-transaction.service';
import { BillingService } from '../billing.service';
import { Repository } from 'typeorm';
import { AccountEntity, IndexerEntity } from 'src/database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil } from 'lodash';
import {
  ExecutionLayer,
  VertexTransactionType,
} from 'src/common/enum/common.enum';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  chargeFeeIx,
  commitAndStartBillingIx,
  delegateUserVaultIx,
  getProgram,
  seeds,
  trackUserActivityIx,
  UserVault,
} from '../sdk';
import { Program } from 'anchor-v31';
import { VertexProgram } from '../sdk/idl/vertex_program';
import {
  MAGIC_BLOCK_ER_RPC_URL,
  RPC_URL,
  SYNC_TRANSACTION_QUEUE_JOB_OPTIONS,
} from 'src/app.environment';
import {
  DEFAULT_RETRIES,
  OPERATOR_BILLING_KEYPAIR,
  TIME_WAIT_RETRY_GET_COMMIT_SIG_AT_ER,
} from 'src/common/constant';
import { sendTransactionWithRetry } from 'src/common/solana';
import { BN } from 'bn.js';
import { retryAsync } from 'src/common/utils';
import { GetCommitmentSignature } from '@magicblock-labs/ephemeral-rollups-sdk';
import { DEFAULT_INDEXER_ID } from '../sdk/common';

@Processor(SystemQueue.BILLING)
export class BillingProcessor extends AbstractJobProcessor {
  private readonly connection: Connection;
  private readonly connectionER: Connection;
  private readonly program: Program<VertexProgram>;
  private readonly programER: Program<VertexProgram>;
  private readonly operator: anchor.Wallet;

  constructor(
    private readonly billingService: BillingService,
    private readonly syncTransactionService: BillingSyncTransactionService,
    @InjectBillingSystemQueue()
    private readonly billingSystemQueue: Queue,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(IndexerEntity)
    private readonly indexerRepository: Repository<IndexerEntity>,
    protected readonly logger: PinoLogger,
  ) {
    super(logger, billingSystemQueue);
    this.connection = new Connection(RPC_URL);
    this.connectionER = new Connection(MAGIC_BLOCK_ER_RPC_URL);

    this.program = getProgram(this.connection);
    this.programER = getProgram(this.connectionER);

    this.operator = new anchor.Wallet(OPERATOR_BILLING_KEYPAIR);

    this.logger.setContext(BillingProcessor.name);
  }

  @Process(SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM)
  async handleSyncTransaction(
    job: Job<ISyncTransactionBillingJob>,
  ): Promise<string> {
    await this.syncTransactionService.syncTransaction(job.data);

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.INIT_USER_VAULT)
  async handleInitUserVault(job: Job<IInitUserVaultJob>): Promise<string> {
    const { owner, signature, userVault, timestamp } = job.data;

    const isSyncedTransaction =
      await this.billingService.isSyncedTransaction(signature);
    if (isSyncedTransaction) {
      this.logger.error(signature, 'This vertex transaction already existed');
      return 'SYNCED';
    }

    const account = await this.accountRepository.findOneBy({
      walletAddress: owner.toBase58(),
    });
    if (isNil(account)) {
      this.logger.error(
        `Wallet address ${owner.toBase58()} not found in Account table`,
      );
      return 'ERROR_NOT_FOUND_ACCOUNT';
    }

    const jobData: IStartDelegateUserVaultJob = {
      user: owner.toBase58(),
      accountId: account.id,
    };
    await this.billingSystemQueue.add(
      VertexBillingQueueJob.START_DELEGATE_USER_VAULT,
      jobData,
      {
        jobId: `${VertexBillingQueueJob.START_DELEGATE_USER_VAULT}:user<${userVault.toBase58()}>`,
      },
    );

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.BASE_CHAIN,
      signature,
      timestamp,
      transactionType: VertexTransactionType.INIT_USER_VAULT,
    });

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.START_DELEGATE_USER_VAULT)
  async handleDelegateUserVault(
    job: Job<IStartDelegateUserVaultJob>,
  ): Promise<string> {
    const user = new PublicKey(job.data.user);

    const tx = new Transaction();

    const userVault = PublicKey.findProgramAddressSync(
      seeds.userVault(user),
      this.program.programId,
    )[0];

    tx.add(
      await delegateUserVaultIx(this.connection, {
        accounts: {
          operator: this.operator.publicKey,
          user: user,
          userVault: userVault,
        },
        params: {},
      }),
    );

    const { txSig } = await sendTransactionWithRetry({
      connection: this.connection,
      instructions: tx.instructions,
      signers: [],
      wallet: this.operator,
    });

    await this.billingService.saveTransaction({
      executionLayer: ExecutionLayer.BASE_CHAIN,
      signature: txSig,
      transactionType: VertexTransactionType.DELEGATE_USER_VAULT,
      accountId: job.data.accountId,
      timestamp: Date.now(),
    });

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.INIT_INDEXER)
  async handleInitIndexerVault(job: Job<IInitIndexerJob>): Promise<string> {
    const { indexerId, owner, signature, timestamp } = job.data;

    const isSyncedTransaction =
      await this.billingService.isSyncedTransaction(signature);
    if (isSyncedTransaction) {
      this.logger.error(signature, 'This vertex transaction already existed');
      return 'SYNCED';
    }

    const account = await this.accountRepository.findOneBy({
      walletAddress: owner.toBase58(),
    });
    if (isNil(account)) {
      this.logger.error(
        `Wallet address ${owner.toBase58()} not found in Account table`,
      );
      return 'ERROR_NOT_FOUND_ACCOUNT';
    }

    const indexer = await this.indexerRepository.findOneBy({
      id: indexerId.toNumber(),
      accountId: account.id,
    });
    if (isNil(indexer)) {
      this.logger.error(
        `Indexer ${indexerId.toNumber()} not found in Indexer table`,
      );
      return 'ERROR_NOT_FOUND_INDEXER';
    }

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.BASE_CHAIN,
      signature,
      timestamp,
      transactionType: VertexTransactionType.INIT_INDEXER,
      indexerId: indexer.id,
    });

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.DEPOSIT_TO_VAULT)
  async handleDepositToVault(job: Job<IDepositToVaultJob>): Promise<string> {
    const { amount, signature, timestamp, user } = job.data;

    const isSyncedTransaction =
      await this.billingService.isSyncedTransaction(signature);
    if (isSyncedTransaction) {
      this.logger.error(signature, 'This vertex transaction already existed');
      return 'SYNCED';
    }

    const account = await this.accountRepository.findOneBy({
      walletAddress: user.toBase58(),
    });
    if (isNil(account)) {
      this.logger.error(
        `Wallet address ${user.toBase58()} not found in Account table`,
      );
      return 'ERROR_NOT_FOUND_ACCOUNT';
    }

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.BASE_CHAIN,
      signature,
      timestamp,
      transactionType: VertexTransactionType.DEPOSIT_TO_VAULT,
      amount: amount.toNumber(),
    });

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.WITHDRAW_INDEXER_FEE)
  async handleWithdrawIndexerFee(
    job: Job<IWithdrawIndexerFeeJob>,
  ): Promise<string> {
    const { indexerId, indexerOwner, signature, timestamp, amount } = job.data;

    const isSyncedTransaction =
      await this.billingService.isSyncedTransaction(signature);
    if (isSyncedTransaction) {
      this.logger.error(signature, 'This vertex transaction already existed');
      return 'SYNCED';
    }

    const account = await this.accountRepository.findOneBy({
      walletAddress: indexerOwner.toBase58(),
    });
    if (isNil(account)) {
      this.logger.error(
        `Wallet address ${indexerOwner.toBase58()} not found in Account table`,
      );
      return 'ERROR_NOT_FOUND_ACCOUNT';
    }

    const indexer = await this.indexerRepository.findOneBy({
      id: indexerId.toNumber(),
      accountId: account.id,
    });
    if (isNil(indexer)) {
      this.logger.error(
        `Indexer ${indexerId.toNumber()} not found in Indexer table`,
      );
      return 'ERROR_NOT_FOUND_INDEXER';
    }

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.BASE_CHAIN,
      signature,
      timestamp,
      transactionType: VertexTransactionType.WITHDRAW_INDEXER_FEE,
      indexerId: indexer.id,
      amount: amount.toNumber(),
    });

    return 'FINISHED';
  }

  //TODO: Handle call from Read query and storage indexed data
  @Process(VertexBillingQueueJob.UPDATE_TRACK_USER_ACTIVITY)
  async handleUpdateTrackUserActivity(
    job: Job<UpdateTrackUserActivityJob>,
  ): Promise<string> {
    const { userWallet, indexerId, bytes } = job.data;
    const userVault = PublicKey.findProgramAddressSync(
      seeds.userVault(new PublicKey(userWallet)),
      this.program.programId,
    )[0];

    const userVaultInfo = await this.connection.getAccountInfo(userVault);
    if (isNil(userVaultInfo)) {
      this.logger.error(`User ${userWallet} not initialize user vault yet.`);
      return 'ERROR_NOT_INIT_USER_VAULT';
    }

    if (userVaultInfo.owner.equals(this.program.programId)) {
      this.logger.error(
        'User vault must be delegate to ER first before update user activity.',
      );
      return 'ERROR_NOT_DELEGATE_USER_VAULT';
    }

    const userVaultDataAtER =
      await this.programER.account.userVault.fetch(userVault);
    if (userVaultDataAtER.billingStatus) {
      this.logger.info('User vault are in billing process.');
      return 'USER_VAULT_IN_BILLING_PROCESS';
    }

    let indexerPubkey: PublicKey | null = null;
    if (indexerId) {
      const indexer = await this.indexerRepository
        .createQueryBuilder('indexer')
        .innerJoinAndSelect('indexer.account', 'account')
        .where('indexer.id = :indexerId', { indexerId })
        .getOne();

      if (isNil(indexer)) {
        this.logger.error(`Indexer ${indexerId} not found in Indexer table`);
        return 'ERROR_NOT_FOUND_INDEXER';
      }
      const ownerIndexer = new PublicKey(indexer.account.walletAddress);
      indexerPubkey = PublicKey.findProgramAddressSync(
        seeds.indexer(ownerIndexer, indexerId),
        this.program.programId,
      )[0];
    }

    const ix = await trackUserActivityIx(this.connection, {
      accounts: {
        operator: this.operator.publicKey,
        user: new PublicKey(userWallet),
        userVault: userVault,
        indexer: indexerPubkey,
      },
      params: {
        bytes: new BN(bytes),
        indexerId: indexerId ? new BN(indexerId) : null,
      },
    });

    const { txSig } = await sendTransactionWithRetry({
      connection: this.connectionER,
      instructions: [ix],
      signers: [],
      wallet: this.operator,
      isAddComputeUnitIx: false,
    });

    const jobData: ISyncTransactionBillingJob = {
      signature: txSig,
      executionLayer: ExecutionLayer.EPHEMERAL_ROLLUP,
      timestamp: Date.now(),
    };
    const jobId = `${SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM}:program<${this.program.programId.toBase58()}>:sig<${txSig}>`;

    await this.billingSystemQueue.add(
      SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM,
      jobData,
      {
        ...SYNC_TRANSACTION_QUEUE_JOB_OPTIONS,
        jobId,
      },
    );

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.TRACK_USER_ACTIVITY)
  async handleTrackUserActivity(
    job: Job<ITrackUserActivityJob>,
  ): Promise<string> {
    const { user, bytes, indexerId, signature, timestamp } = job.data;

    const isSyncedTransaction = await this.billingService.isSyncedTransaction(
      signature,
      VertexTransactionType.TRACK_USER_ACTIVITY,
    );
    if (isSyncedTransaction) {
      this.logger.error(signature, 'This vertex transaction already existed');
      return 'SYNCED';
    }

    const account = await this.accountRepository.findOneBy({
      walletAddress: user.toBase58(),
    });
    if (isNil(account)) {
      this.logger.error(
        `Wallet address ${user.toBase58()} not found in Account table`,
      );
      return 'ERROR_NOT_FOUND_ACCOUNT';
    }

    if (indexerId) {
      const indexer = await this.indexerRepository.findOneBy({
        id: indexerId.toNumber(),
        accountId: account.id,
      });
      if (isNil(indexer)) {
        this.logger.error(
          `Indexer ${indexerId.toNumber()} not found in Indexer table`,
        );
        return 'ERROR_NOT_FOUND_INDEXER';
      }
    }

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.EPHEMERAL_ROLLUP,
      signature,
      timestamp,
      transactionType: VertexTransactionType.TRACK_USER_ACTIVITY,
      indexerId: indexerId ? indexerId.toNumber() : null,
      bytes: bytes.toNumber(),
    });

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.START_BILLING)
  async handleStartBilling(job: Job<IStartBillingJob>): Promise<string> {
    const { signature, timestamp, user, userVault } = job.data;

    const isSyncedTransaction = await this.billingService.isSyncedTransaction(
      signature,
      VertexTransactionType.START_BILLING,
    );
    if (isSyncedTransaction) {
      this.logger.error(signature, 'This vertex transaction already existed');
      return 'SYNCED';
    }

    const account = await this.accountRepository.findOneBy({
      walletAddress: user.toBase58(),
    });
    if (isNil(account)) {
      this.logger.error(
        `Wallet address ${user.toBase58()} not found in Account table`,
      );
      return 'ERROR_NOT_FOUND_ACCOUNT';
    }

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.EPHEMERAL_ROLLUP,
      signature,
      timestamp,
      transactionType: VertexTransactionType.START_BILLING,
    });

    const ix = await commitAndStartBillingIx(this.connection, {
      accounts: {
        operator: this.operator.publicKey,
        user,
        userVault,
      },
      params: {},
    });

    const { txSig } = await sendTransactionWithRetry({
      connection: this.connectionER,
      instructions: [ix],
      signers: [],
      wallet: this.operator,
      isAddComputeUnitIx: false,
      commitment: 'finalized',
    });

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.EPHEMERAL_ROLLUP,
      signature: txSig,
      timestamp,
      transactionType: VertexTransactionType.COMMIT_AND_START_BILLING,
    });

    this.logger.info(txSig, 'Commit and start billing at ER');

    const commitSig = await retryAsync(
      () => GetCommitmentSignature(txSig, this.connectionER),
      TIME_WAIT_RETRY_GET_COMMIT_SIG_AT_ER,
      DEFAULT_RETRIES,
    );

    const { transaction } = await this.connection.getTransaction(commitSig, {
      commitment: 'finalized',
    });

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.BASE_CHAIN,
      signature: transaction[0],
      timestamp,
      transactionType: VertexTransactionType.UNDELEGATED_AND_COMMIT_USER_VAULT,
    });

    const jobData: IStartChargeFeeJob = {
      user: user.toBase58(),
      userVault: userVault.toBase58(),
    };

    await this.billingSystemQueue.add(
      VertexBillingQueueJob.START_CHARGE_FEE,
      jobData,
      {
        jobId: `${VertexBillingQueueJob.START_CHARGE_FEE}:user<${user.toBase58()}>`,
      },
    );

    return 'FINISHED';
  }

  @Process(VertexBillingQueueJob.START_CHARGE_FEE)
  async handleStartChargeFee(job: Job<IStartChargeFeeJob>): Promise<string> {
    const user = new PublicKey(job.data.user);
    const userVault = new PublicKey(job.data.userVault);

    const userVaultInfo = await this.connection.getAccountInfo(userVault);
    if (!userVaultInfo.owner.equals(this.program.programId)) {
      // Throw error to handle retry the job
      throw new Error('User Vault not finish UnDelegate yet.');
    }

    const userVaultDecoded = this.program.coder.accounts.decode(
      'userVault',
      userVaultInfo.data,
    );
    const userVaultData = new UserVault(userVaultDecoded);
    const readDebts = userVaultData.state.readDebts.filter(
      (readDebt) => readDebt.indexerId.toNumber() !== DEFAULT_INDEXER_ID,
    );
    const indexerIds = readDebts.map((r) => r.indexerId.toNumber());

    const indexers = await this.indexerRepository
      .createQueryBuilder('indexer')
      .innerJoinAndSelect('indexer.account', 'account')
      .where('indexer.id IN (:...indexerIds)', { indexerIds })
      .getMany();

    const indexerPubkeys: PublicKey[] = [];
    for (const indexer of indexers) {
      indexerPubkeys.push(
        PublicKey.findProgramAddressSync(
          seeds.indexer(
            new PublicKey(indexer.account.walletAddress),
            indexer.id,
          ),
          this.program.programId,
        )[0],
      );
    }

    const systemAuthority = PublicKey.findProgramAddressSync(
      seeds.systemAuthority(),
      this.program.programId,
    )[0];

    const ix = await chargeFeeIx(this.connection, {
      accounts: {
        indexers: indexerPubkeys,
        operator: this.operator.publicKey,
        systemAuthority,
        user,
        userVault,
      },
      params: {},
    });

    try {
      const { txSig } = await sendTransactionWithRetry({
        connection: this.connection,
        instructions: [ix],
        signers: [],
        wallet: this.operator,
        isAddComputeUnitIx: false,
        commitment: 'finalized',
      });

      const jobData: ISyncTransactionBillingJob = {
        signature: txSig,
        executionLayer: ExecutionLayer.BASE_CHAIN,
        timestamp: Date.now(),
      };
      const jobId = `${SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM}:program<${this.program.programId.toBase58()}>:sig<${txSig}>`;

      await this.billingSystemQueue.add(
        SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM,
        jobData,
        {
          ...SYNC_TRANSACTION_QUEUE_JOB_OPTIONS,
          jobId,
        },
      );

      return 'FINISHED';
    } catch (error) {
      // NOTE: If error about not enough fund, must be mark to not allow user indexed data
      this.logger.error(error);

      return 'ERROR';
    }
  }

  @Process(VertexBillingQueueJob.CHARGED_FEE)
  async handleChargedFee(job: Job<IChargedFeeJob>): Promise<string> {
    const { amount, signature, timestamp, user, userVault } = job.data;

    const isSyncedTransaction = await this.billingService.isSyncedTransaction(
      signature,
      VertexTransactionType.START_BILLING,
    );
    if (isSyncedTransaction) {
      this.logger.error(signature, 'This vertex transaction already existed');
      return 'SYNCED';
    }

    const account = await this.accountRepository.findOneBy({
      walletAddress: user.toBase58(),
    });
    if (isNil(account)) {
      this.logger.error(
        `Wallet address ${user.toBase58()} not found in Account table`,
      );
      return 'ERROR_NOT_FOUND_ACCOUNT';
    }

    await this.billingService.saveTransaction({
      accountId: account.id,
      executionLayer: ExecutionLayer.BASE_CHAIN,
      signature,
      timestamp,
      transactionType: VertexTransactionType.CHARGED_FEE,
      amount: amount.toNumber(),
    });

    const jobData: IStartDelegateUserVaultJob = {
      user: user.toBase58(),
      accountId: account.id,
    };
    await this.billingSystemQueue.add(
      VertexBillingQueueJob.START_DELEGATE_USER_VAULT,
      jobData,
      {
        jobId: `${VertexBillingQueueJob.START_DELEGATE_USER_VAULT}:user<${userVault.toBase58()}>`,
      },
    );

    return 'FINISHED';
  }
}
