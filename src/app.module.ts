import { Module } from '@nestjs/common';
import {
  bullModule,
  cacheModule,
  dbOrmModuleAsync,
  loggerModule,
} from './config';
import { RedisModule } from './redis/redis.module';
import {
  REDIS_DATABASE_NUMBER,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_TLS,
} from './app.environment';
import { WebsocketListenerModule } from './websocket-listener/websocket-listener.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IndexerModule } from './indexer/indexer.module';
import { IdlDappModule } from './idl-dapp/idl-dapp.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { RpcModule } from './rpc/rpc.module';
import { BillingModule } from './billing/billing.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    dbOrmModuleAsync,
    loggerModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    RedisModule.forRootAsync({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      db: REDIS_DATABASE_NUMBER,
      tls: REDIS_TLS === true ? {} : undefined,
    }),
    bullModule,
    cacheModule,
    WebsocketListenerModule,
    IndexerModule,
    IdlDappModule,
    AuthModule,
    AccountModule,
    RpcModule,
    BillingModule,
  ],
  providers: [],
})
export class AppModule {}
