import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VertexBillingEventName } from '../billing.constant';
import {
  InjectBillingSystemQueue,
  VertexBillingQueueJob,
} from 'src/common/queue';
import { Queue } from 'bull';
import { IEventJob } from 'src/common/types/base-event-job.type';
import {
  ChargeFeeEvent,
  DepositToVaultEvent,
  InitIndexerEvent,
  InitUserVaultEvent,
  StartBillingEvent,
  TrackUserActivityEvent,
  WithdrawIndexerFeeEvent,
} from '../sdk/events';
import {
  IInitUserVaultJob,
  IInitIndexerJob,
  IDepositToVaultJob,
  IWithdrawIndexerFeeJob,
  ITrackUserActivityJob,
  IStartBillingJob,
  IChargedFeeJob,
} from './billing-job.interface';

@Injectable()
export class BillingEventService {
  constructor(
    @InjectBillingSystemQueue()
    private readonly billingSystemQueue: Queue,
  ) {}

  @OnEvent(VertexBillingEventName.InitUserVaultEvent)
  async handleInitUserVaultEvent(event: IEventJob<InitUserVaultEvent>) {
    const data: IInitUserVaultJob = {
      ...event.data,
      timestamp: event.timestamp.getTime(),
      signature: event.signatures[0],
    };

    await this.billingSystemQueue.add(
      VertexBillingQueueJob.INIT_USER_VAULT,
      data,
      {
        jobId: `${VertexBillingEventName.InitUserVaultEvent}:sig<${data.signature}>`,
      },
    );
  }

  @OnEvent(VertexBillingEventName.InitIndexerEvent)
  async handleInitIndexerEvent(event: IEventJob<InitIndexerEvent>) {
    const data: IInitIndexerJob = {
      ...event.data,
      timestamp: event.timestamp.getTime(),
      signature: event.signatures[0],
    };

    await this.billingSystemQueue.add(
      VertexBillingQueueJob.INIT_INDEXER,
      data,
      {
        jobId: `${VertexBillingEventName.InitIndexerEvent}:sig<${data.signature}>`,
      },
    );
  }

  @OnEvent(VertexBillingEventName.DepositToVaultEvent)
  async handleUserDepositToVaultEvent(event: IEventJob<DepositToVaultEvent>) {
    const data: IDepositToVaultJob = {
      ...event.data,
      timestamp: event.timestamp.getTime(),
      signature: event.signatures[0],
    };

    await this.billingSystemQueue.add(
      VertexBillingQueueJob.DEPOSIT_TO_VAULT,
      data,
      {
        jobId: `${VertexBillingEventName.DepositToVaultEvent}:sig<${data.signature}>`,
      },
    );
  }

  @OnEvent(VertexBillingEventName.WithdrawIndexerFeeEvent)
  async handleWithdrawIndexerFee(event: IEventJob<WithdrawIndexerFeeEvent>) {
    const data: IWithdrawIndexerFeeJob = {
      ...event.data,
      timestamp: event.timestamp.getTime(),
      signature: event.signatures[0],
    };

    await this.billingSystemQueue.add(
      VertexBillingQueueJob.WITHDRAW_INDEXER_FEE,
      data,
      {
        jobId: `${VertexBillingEventName.WithdrawIndexerFeeEvent}:sig<${data.signature}>`,
      },
    );
  }

  @OnEvent(VertexBillingEventName.TrackUserActivityEvent)
  async handleTrackUserActivityEvent(event: IEventJob<TrackUserActivityEvent>) {
    const data: ITrackUserActivityJob = {
      ...event.data,
      timestamp: event.timestamp.getTime(),
      signature: event.signatures[0],
    };

    await this.billingSystemQueue.add(
      VertexBillingQueueJob.TRACK_USER_ACTIVITY,
      data,
      {
        jobId: `${VertexBillingEventName.TrackUserActivityEvent}:sig<${data.signature}>`,
      },
    );
  }

  @OnEvent(VertexBillingEventName.StartBillingEvent)
  async handleStartBillingEvent(event: IEventJob<StartBillingEvent>) {
    const data: IStartBillingJob = {
      ...event.data,
      timestamp: event.timestamp.getTime(),
      signature: event.signatures[0],
    };

    await this.billingSystemQueue.add(
      VertexBillingQueueJob.START_BILLING,
      data,
      {
        jobId: `${VertexBillingEventName.StartBillingEvent}:sig<${data.signature}>`,
      },
    );
  }

  @OnEvent(VertexBillingEventName.ChargeFeeEvent)
  async handleChargedFeeEvent(event: IEventJob<ChargeFeeEvent>) {
    const data: IChargedFeeJob = {
      ...event.data,
      timestamp: event.timestamp.getTime(),
      signature: event.signatures[0],
    };

    await this.billingSystemQueue.add(VertexBillingQueueJob.CHARGED_FEE, data, {
      jobId: `${VertexBillingEventName.ChargeFeeEvent}:sig<${data.signature}>`,
    });
  }
}
