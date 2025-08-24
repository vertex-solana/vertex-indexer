import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil } from 'lodash';
import {
  ExecutionLayer,
  VertexTransactionType,
} from 'src/common/enum/common.enum';
import { VertexTransactionEntity } from 'src/database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(VertexTransactionEntity)
    private readonly vertexTransactionRepository: Repository<VertexTransactionEntity>,
  ) {}

  async isSyncedTransaction(
    transactionHash: string,
    transactionType?: VertexTransactionType,
  ): Promise<boolean> {
    const where = !isNil(transactionType)
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
    amount?: number;
    bytes?: number;
    indexerId?: number;
  }): Promise<void> {
    const amount = isNil(payload.amount) ? null : payload.amount;
    const bytes = isNil(payload.bytes) ? null : payload.bytes;
    const indexerId = isNil(payload.indexerId) ? null : payload.indexerId;

    await this.vertexTransactionRepository.save({
      accountId: payload.accountId,
      executionLayer: payload.executionLayer,
      timestamp: payload.timestamp,
      transactionHash: payload.signature,
      transactionType: payload.transactionType,
      amount,
      bytes,
      indexerId,
    });
  }
}
