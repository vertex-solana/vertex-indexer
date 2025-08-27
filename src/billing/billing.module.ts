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

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    BullModule.registerQueue(BillingSystemQueueConfig),
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
  ],
  exports: [BillingService],
})
export class BillingModule {}
