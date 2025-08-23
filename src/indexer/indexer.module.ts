import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import entities from 'src/database/entities/entities';
import { IndexerService } from './indexer.service';
import { IndexerController } from './indexer.controller';
import { BullModule } from '@nestjs/bull';
import {
  ExecuteTransformerQueueConfig,
  IndexerSystemQueueConfig,
  PdaSystemQueueConfig,
} from 'src/common/queue';
import { PdaProcessor } from './processor/pda.processor';
import { IndexerProcessor } from './processor/indexer.processor';
import { IndexerTableService } from './indexer-table.service';
import { RpcModule } from 'src/rpc/rpc.module';
import { AccountModule } from 'src/account/account.module';
import { ExecuteTransformerProcessor } from './processor/execute-transformer.processor';
import { IndexerConnectionManagerService } from './indexer-connection-manager.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    BullModule.registerQueue(
      PdaSystemQueueConfig,
      IndexerSystemQueueConfig,
      ExecuteTransformerQueueConfig,
    ),
    RpcModule,
    AccountModule,
  ],
  controllers: [IndexerController],
  providers: [
    IndexerService,
    IndexerTableService,
    PdaProcessor,
    IndexerProcessor,
    ExecuteTransformerProcessor,
    IndexerConnectionManagerService,
  ],
})
export class IndexerModule {}
