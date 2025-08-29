import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { isNil } from 'lodash';
import {
  ExecutionLayer,
  VertexTransactionType,
} from 'src/common/enum/common.enum';
import { InjectBillingSystemQueue, SystemQueueJob } from 'src/common/queue';
import { VertexTransactionEntity } from 'src/database/entities';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SyncTransactionBillingDto } from './dtos/request';
import { Program } from 'anchor-v31';
import { VertexProgram } from './sdk/idl/vertex_program';
import { getProgram } from './sdk';
import { Connection } from '@solana/web3.js';
import {
  RPC_URL,
  SYNC_TRANSACTION_QUEUE_JOB_OPTIONS,
} from 'src/app.environment';
import { ISyncTransactionBillingJob } from './processor/billing-job.interface';

@Injectable()
export class BillingService {
  private readonly program: Program<VertexProgram>;

  constructor(
    @InjectBillingSystemQueue()
    private readonly billingSystemQueue: Queue,
    @InjectRepository(VertexTransactionEntity)
    private readonly vertexTransactionRepository: Repository<VertexTransactionEntity>,
  ) {
    this.program = getProgram(new Connection(RPC_URL));
  }

  async syncTransaction(payload: SyncTransactionBillingDto): Promise<void> {
    const { txHash, executionLayer } = payload;

    const job: ISyncTransactionBillingJob = {
      signature: txHash,
      executionLayer,
      timestamp: Date.now(),
    };

    const jobId = `${SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM}:program<${this.program.programId.toBase58()}>:sig<${txHash}>`;
    await this.billingSystemQueue.add(
      SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM,
      job,
      {
        ...SYNC_TRANSACTION_QUEUE_JOB_OPTIONS,
        jobId,
      },
    );
  }

  async isSyncedTransaction(
    transactionHash: string,
    transactionType?: VertexTransactionType,
  ): Promise<boolean> {
    const where: FindOptionsWhere<VertexTransactionEntity> = !isNil(
      transactionType,
    )
      ? { transactionHash, transactionType }
      : { transactionHash };

    const transaction = await this.vertexTransactionRepository.findOneBy(where);

    return !isNil(transaction);
  }

  async saveTransaction(payload: {
    accountId: number;
    executionLayer: ExecutionLayer;
    timestamp: number;
    signature: string;
    transactionType: VertexTransactionType;
    amount?: BigInt;
    bytes?: BigInt;
    indexerId?: number;
  }): Promise<void> {
    const amount = payload.amount ?? null;
    const bytes = payload.bytes ?? null;
    const indexerId = payload.indexerId ?? null;

    await this.vertexTransactionRepository.save({
      accountId: payload.accountId,
      executionLayer: payload.executionLayer,
      timestamp: new Date(payload.timestamp),
      transactionHash: payload.signature,
      transactionType: payload.transactionType,
      amount,
      bytes,
      indexerId,
    });
  }
}
