import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import entities from 'src/database/entities/entities';
import { BillingService } from './billing.service';
import { BillingListenerService } from './listener/billing-listener.service';
import { BillingProcessor } from './processor/billing.processor';
import { BullModule } from '@nestjs/bull';
import { BillingSystemQueueConfig } from 'src/common/queue';
import { BillingSyncTransactionService } from './processor/billing-sync-transaction.service';
import { BillingEventService } from './processor/billing-event.service';
import { BillingController } from './billing.controller';
import { BillingScheduler } from './billing.scheduler';
import { IndexerModule } from 'src/indexer/indexer.module';
import { AccountModule } from 'src/account/account.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    BullModule.registerQueue(BillingSystemQueueConfig),
    IndexerModule,
    AccountModule,
  ],
  controllers: [BillingController],
  providers: [
    BillingService,

    // Listener
    BillingListenerService,

    // Processor
    BillingProcessor,
    BillingSyncTransactionService,
    BillingEventService,

    // Scheduler
    BillingScheduler,
  ],
  exports: [BillingService],
})
export class BillingModule {}
