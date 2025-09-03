import { Injectable, OnModuleInit } from '@nestjs/common';
import { Program } from 'anchor-v31';
import { VertexProgram } from '../sdk/idl/vertex_program';
import { PinoLogger } from 'nestjs-pino';
import { getProgram } from '../sdk';
import { Connection } from '@solana/web3.js';
import {
  MAGIC_BLOCK_ER_RPC_URL,
  RPC_URL,
  SYNC_TRANSACTION_QUEUE_JOB_OPTIONS,
} from 'src/app.environment';
import { WebSocket } from 'ws';
import {
  LogsNotificationRPCResponse,
  Result,
} from './billing-listener.interface';
import { Queue } from 'bull';
import { InjectBillingSystemQueue, SystemQueueJob } from 'src/common/queue';
import { ISyncTransactionBillingJob } from '../processor/billing-job.interface';
import { ExecutionLayer } from 'src/common/enum/common.enum';

@Injectable()
export class BillingListenerService implements OnModuleInit {
  private readonly program: Program<VertexProgram>;
  private readonly rpcSocket: WebSocket;
  private readonly rpcSocketER: WebSocket;
  protected interval: NodeJS.Timeout | null;
  protected readonly KEEP_ALIVE_INTERVAL = 5000; // 5 seconds

  constructor(
    @InjectBillingSystemQueue()
    private readonly billingSystemQueue: Queue,
    private readonly logger: PinoLogger,
  ) {
    this.program = getProgram(new Connection(RPC_URL));
    this.rpcSocket = new WebSocket(RPC_URL);
    this.rpcSocketER = new WebSocket(MAGIC_BLOCK_ER_RPC_URL);

    this.logger.setContext(BillingListenerService.name);
  }

  async onModuleInit() {
    this.logger.info(
      `
      Start init listen log event Vertex Billing at ${new Date()}
      - RPC Base chain : ${RPC_URL}
      - RPC ER         : ${MAGIC_BLOCK_ER_RPC_URL}
      `,
    );

    const logger = this.logger;
    const rpcSocket = this.rpcSocket;
    const rpcSocketER = this.rpcSocketER;
    const subscribe = this.subscribeLogsSubscribe.bind(this);
    const process = this.processAccountNotification.bind(this);

    this.rpcSocket.onopen = async function (greeting) {
      logger.info({ greeting }, 'Connect to RPC Base Chain');
      await subscribe(rpcSocket);
    };

    this.rpcSocketER.onopen = async function (greeting) {
      logger.info({ greeting }, 'Connect to RPC ER');
      await subscribe(rpcSocketER);
    };

    this.rpcSocket.onmessage = async (event) => {
      let eventData: LogsNotificationRPCResponse | null = null;
      try {
        eventData = JSON.parse(event.data as any);
      } catch {
        return;
      }

      if (eventData.method !== 'logsNotification') {
        return;
      }

      await process(eventData.params.result, ExecutionLayer.BASE_CHAIN);
    };

    this.rpcSocketER.onmessage = async (event) => {
      let eventData: LogsNotificationRPCResponse | null = null;
      try {
        eventData = JSON.parse(event.data as any);
      } catch {
        return;
      }

      if (eventData.method !== 'logsNotification') {
        return;
      }

      await process(eventData.params.result, ExecutionLayer.EPHEMERAL_ROLLUP);
    };

    // Keep the connection alive
    const keepAliveHandler = () => {
      if (this.rpcSocket.readyState === this.rpcSocket.OPEN)
        this.rpcSocket.send('ping');
      if (this.rpcSocketER.readyState === this.rpcSocketER.OPEN)
        this.rpcSocketER.send('ping');
    };

    this.interval = setInterval(
      keepAliveHandler.bind(this),
      this.KEEP_ALIVE_INTERVAL,
    );
  }

  private subscribeLogsSubscribe(rpcSocket: WebSocket) {
    rpcSocket.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'logsSubscribe',
        params: [
          {
            mentions: [this.program.programId.toBase58()],
          },
          {
            commitment: 'finalized',
          },
        ],
      }),
    );
  }

  private async processAccountNotification(
    notification: Result,
    executionLayer: ExecutionLayer,
  ) {
    const signature = notification?.value?.signature;

    if (!signature) {
      return;
    }

    const job: ISyncTransactionBillingJob = {
      signature,
      executionLayer,
      timestamp: Date.now(),
    };

    const jobId = `${SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM}:program<${this.program.programId.toBase58()}>:sig<${signature}>`;
    await this.billingSystemQueue.add(
      SystemQueueJob.SYNC_TRANSACTION_BILLING_PROGRAM,
      job,
      {
        ...SYNC_TRANSACTION_QUEUE_JOB_OPTIONS,
        jobId,
      },
    );
    this.logger.debug(
      `Added job sync transaction billing program, jobId:${jobId}`,
    );
  }
}
