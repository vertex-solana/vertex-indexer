import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { isEmpty } from 'lodash';
import { PinoLogger } from 'nestjs-pino';
import {
  RPC_URL,
  SCHEDULER_SCAN_PENDING_BILLING,
  SCHEDULER_TRACKING_STORAGE_INDEXER,
  SIZE_BATCH_HANDLE_PENDING_BILLING,
  SIZE_BATCH_HANDLE_TRACKING_STORAGE,
} from 'src/app.environment';
import {
  InjectBillingSystemQueue,
  VertexBillingQueueJob,
} from 'src/common/queue';
import { IndexerTableService } from 'src/indexer/indexer-table.service';
import {
  IStartChargeFeeJob,
  UpdateTrackUserActivityJob,
} from './processor/billing-job.interface';
import { Program } from 'anchor-v31';
import { VertexProgram } from './sdk/idl/vertex_program';
import { getProgram, seeds, UserVault } from './sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { AccountService } from 'src/account/account.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BillingScheduler {
  private readonly program: Program<VertexProgram>;

  constructor(
    @InjectBillingSystemQueue()
    private readonly billingSystemQueue: Queue,
    private readonly indexerTableService: IndexerTableService,
    private readonly accountService: AccountService,
    private readonly logger: PinoLogger,
  ) {
    this.program = getProgram(new Connection(RPC_URL));

    this.logger.setContext(BillingScheduler.name);
  }

  @Cron(SCHEDULER_TRACKING_STORAGE_INDEXER)
  async startScanIndexerStorage() {
    this.logger.info('Start scan indexer storage');
    let pageNum = 0;

    let indexers = await this.indexerTableService.findIndexersActive({
      pageNum,
      pageSize: SIZE_BATCH_HANDLE_TRACKING_STORAGE,
    });

    while (!isEmpty(indexers)) {
      for (const indexer of indexers) {
        const { totalSizeBytes } = await this.indexerTableService.getSchemaSize(
          indexer.id,
        );

        if (totalSizeBytes > 0) {
          const jobData: UpdateTrackUserActivityJob = {
            userWallet: indexer.account.walletAddress,
            indexerId: null,
            bytes: totalSizeBytes,
          };
          const jobId = `${VertexBillingQueueJob.UPDATE_TRACK_USER_ACTIVITY}:user<${indexer.account.walletAddress}>`;
          await this.billingSystemQueue.add(
            VertexBillingQueueJob.UPDATE_TRACK_USER_ACTIVITY,
            jobData,
            {
              jobId,
            },
          );
          this.logger.debug(
            `Added job UPDATE_TRACK_USER_ACTIVITY for user <${indexer.account.walletAddress}>, jobId:${jobId}`,
          );
        }

        pageNum++;
        indexers = await this.indexerTableService.findIndexersActive({
          pageNum,
          pageSize: 100,
        });
      }
    }
  }

  @Cron(SCHEDULER_SCAN_PENDING_BILLING)
  async startScanPendingBilling() {
    this.logger.info('Start scan pending billing');

    let pageNum = 0;
    let accounts = await this.accountService.findAccounts({
      pageNum,
      pageSize: SIZE_BATCH_HANDLE_PENDING_BILLING,
    });

    while (!isEmpty(accounts)) {
      for (const account of accounts) {
        const userVaultPubkey = PublicKey.findProgramAddressSync(
          seeds.userVault(new PublicKey(account.walletAddress)),
          this.program.programId,
        )[0];

        const userVault = new UserVault(userVaultPubkey);
        await userVault.load(this.program);

        if (!userVault.isPendingBilling()) {
          continue;
        }

        const jobData: IStartChargeFeeJob = {
          user: account.walletAddress,
          userVault: userVaultPubkey.toBase58(),
        };
        const jobId = `${VertexBillingQueueJob.START_CHARGE_FEE}:user<${account.walletAddress}>`;
        await this.billingSystemQueue.add(
          VertexBillingQueueJob.START_CHARGE_FEE,
          jobData,
          {
            jobId,
          },
        );
        this.logger.debug(
          `Added job START_CHARGE_FEE for user <${account.walletAddress}>, jobId:${jobId}`,
        );

        pageNum++;
        accounts = await this.accountService.findAccounts({
          pageNum,
          pageSize: SIZE_BATCH_HANDLE_PENDING_BILLING,
        });
      }
    }
  }
}
