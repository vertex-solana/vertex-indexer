import { BadRequestException, Injectable } from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import { PinoLogger } from 'nestjs-pino';
import { MAGIC_BLOCK_ER_RPC_URL, RPC_URL } from 'src/app.environment';
import { ISyncTransactionBillingJob } from './billing-job.interface';
import { ProgramEvent } from 'src/common/types/common.type';
import { ExecutionLayer } from 'src/common/enum/common.enum';
import { formatEvent, retryAsync } from 'src/common/utils';
import { getParsedTransaction } from 'src/common/solana';
import { DEFAULT_RETRIES, TIME_WAIT_RETRY_PARSE_TX } from 'src/common/constant';
import { isNil } from 'lodash';
import { EventParser } from 'anchor-v31';
import { getProgram } from '../sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventJob } from 'src/common/types/base-event-job.type';

@Injectable()
export class BillingSyncTransactionService {
  private readonly connection: Connection;
  private readonly connectionER: Connection;
  private readonly eventParser: EventParser;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: PinoLogger,
  ) {
    this.connection = new Connection(RPC_URL);
    this.connectionER = new Connection(MAGIC_BLOCK_ER_RPC_URL);

    const program = getProgram(this.connection);
    this.eventParser = new EventParser(program.programId, program.coder);

    this.logger.setContext(BillingSyncTransactionService.name);
  }

  async syncTransaction(payload: ISyncTransactionBillingJob): Promise<void> {
    const { executionLayer, signature } = payload;

    try {
      const events = await this.getTransactionEvents(signature, executionLayer);

      for (const event of events) {
        this.logger.debug(
          { event },
          `Vertex Billing Event data in ${executionLayer}`,
        );
        const data: IEventJob<any> = {
          name: event.name,
          signatures: [signature],
          timestamp: event.timestamp,
          data: event.data,
        };

        this.eventEmitter.emit(event.name, data);
      }
    } catch (error) {
      this.logger.error(error, 'Failed to sync transaction');
      throw new BadRequestException(error);
    }
  }

  private async getTransactionEvents(
    signature: string,
    executionLayer: ExecutionLayer,
  ): Promise<ProgramEvent[]> {
    const connection = this.getConnectionBaseOnExecutionLayer(executionLayer);

    const parsedTx = await retryAsync(
      () => getParsedTransaction(signature, connection),
      TIME_WAIT_RETRY_PARSE_TX,
      DEFAULT_RETRIES,
    );

    if (isNil(parsedTx)) {
      return [] as ProgramEvent[];
    }

    const blockTime = await connection.getBlockTime(parsedTx.slot);
    const events = this.eventParser.parseLogs(parsedTx.meta.logMessages);

    return Array.from(events, (event) => {
      const data = formatEvent(event);
      return {
        data,
        timestamp: new Date(blockTime * 1000),
        name: event.name,
      };
    });
  }

  private getConnectionBaseOnExecutionLayer(executionLayer: ExecutionLayer) {
    if (executionLayer === ExecutionLayer.BASE_CHAIN) {
      return this.connection;
    } else {
      return this.connectionER;
    }
  }
}
