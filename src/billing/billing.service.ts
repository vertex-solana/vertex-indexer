import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil } from 'lodash';
import {
  ExecutionLayer,
  VertexTransactionType,
} from 'src/common/enum/common.enum';
import { VertexTransactionEntity } from 'src/database/entities';
import { FindOptionsWhere, Repository } from 'typeorm';

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
    amount?: number;
    bytes?: number;
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
