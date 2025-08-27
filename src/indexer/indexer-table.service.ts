import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DataSource, Repository } from 'typeorm';
import { ResultExecuteQueryResponse } from './dtos/response.dto';
import { ExecuteQueryDto } from './dtos/request.dto';
import { getIndexerRole } from 'src/database/entities/indexer-schema-credential.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountEntity, IndexerEntity } from 'src/database/entities';
import { Program } from 'anchor-v31';
import { VertexProgram } from 'src/billing/sdk/idl/vertex_program';
import { getProgram, seeds, UserVault } from 'src/billing/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_URL } from 'src/app.environment';
import { Queue } from 'bull';
import {
  InjectBillingSystemQueue,
  VertexBillingQueueJob,
} from 'src/common/queue';
import { UpdateTrackUserActivityJob } from 'src/billing/processor/billing-job.interface';

@Injectable()
export class IndexerTableService {
  private readonly program: Program<VertexProgram>;

  constructor(
    @InjectBillingSystemQueue()
    private readonly billingSystemQueue: Queue,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(IndexerEntity)
    private readonly indexerRepository: Repository<IndexerEntity>,
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    this.program = getProgram(new Connection(RPC_URL));

    this.logger.setContext(IndexerTableService.name);
  }

  async executeQuery(
    { indexerId, query }: ExecuteQueryDto,
    account: AccountEntity,
  ): Promise<ResultExecuteQueryResponse> {
    const indexer = await this.indexerRepository.findOne({
      where: { id: indexerId },
    });
    if (!indexer) {
      throw new NotFoundException(`Indexer not found`);
    }

    const neededRecordDataQuery = indexer.accountId !== account.id;
    if (neededRecordDataQuery) {
      const userVaultPubkey = PublicKey.findProgramAddressSync(
        seeds.userVault(new PublicKey(account.walletAddress)),
        this.program.programId,
      )[0];

      const userVault = new UserVault(userVaultPubkey);
      await userVault.load(this.program);
      console.log('userVault', userVault.state);

      if (!userVault.isAvailableToReadDataFromAnotherIndex()) {
        throw new NotFoundException(
          `User not available to read data from another index`,
        );
      }
    }

    const readRole = getIndexerRole(indexerId, 'reader');
    await this.dataSource.query(`SET ROLE ${readRole}`);

    try {
      const result = await this.dataSource.query(query);
      const schema =
        result.length === 0
          ? {}
          : Object.keys(result[0]).reduce((acc, key) => {
              acc[key] = typeof result[0][key];
              return acc;
            }, {});
      const rows =
        result.length === 0
          ? []
          : result.map((row) => {
              const newRow = {};
              Object.keys(row).forEach((key) => {
                newRow[key] = row[key];
              });
              return newRow;
            });

      if (neededRecordDataQuery) {
        const bytes = this.measureDataQueryToBytes(rows);

        const jobData: UpdateTrackUserActivityJob = {
          userWallet: account.walletAddress,
          indexerId,
          bytes,
        };
        const jobId = `${VertexBillingQueueJob.UPDATE_TRACK_USER_ACTIVITY}:user<${account.walletAddress}>`;
        await this.billingSystemQueue.add(
          VertexBillingQueueJob.UPDATE_TRACK_USER_ACTIVITY,
          jobData,
          {
            jobId,
          },
        );
        this.logger.debug(
          `Added job UPDATE_TRACK_USER_ACTIVITY for user <${account.walletAddress}>, jobId:${jobId}`,
        );
      }

      return {
        query,
        schema,
        rows,
      };
    } finally {
      await this.dataSource.query(`RESET ROLE`);
    }
  }

  private measureDataQueryToBytes(rows: any): number {
    return Buffer.byteLength(JSON.stringify(rows), 'utf8');
  }
}
