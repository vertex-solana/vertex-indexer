import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import entities from 'src/database/entities/entities';
import { BillingService } from './billing.service';
import { BillingListenerService } from './listener/billing-listener.service';
import { BillingProcessor } from './processor/billing.processor';
import { BullModule } from '@nestjs/bull';
import { BillingSystemQueueConfig } from 'src/common/queue';
import { BillingSyncTransactionService } from './processor/billing-sync-transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    BullModule.registerQueue(BillingSystemQueueConfig),
  ],
  providers: [
    BillingService,

    // Listener
    BillingListenerService,

    // Processor
    BillingProcessor,
    BillingSyncTransactionService,
  ],
  exports: [BillingService],
})
export class BillingModule {}
