import { SYSTEM_RATE_LIMITER } from './constant';
import { InjectQueue } from '@nestjs/bull';

export enum SystemQueue {
  BILLING = 'billing',
  PDA_SYSTEM = 'pda-system',
  INDEXER_SYSTEM = 'indexer-system',
  EXECUTE_TRANSFORMER = 'execute-transformer',
}

export enum VertexBillingQueueJob {
  INIT_USER_VAULT = 'init-user-vault',
  START_DELEGATE_USER_VAULT = 'start-delegate-user-vault',
  INIT_INDEXER = 'init-indexer',
  DEPOSIT_TO_VAULT = 'deposit-to-vault',
  WITHDRAW_INDEXER_FEE = 'withdraw-indexer-fee',
  START_CHARGE_FEE = 'start-charge-fee',
  CHARGED_FEE = 'charged-fee',

  // ER
  UPDATE_TRACK_USER_ACTIVITY = 'update-track-user-activity',
  TRACK_USER_ACTIVITY = 'track-user-activity',
  START_BILLING = 'start-billing',
}

export enum SystemQueueJob {
  SYNC_TRANSACTION_BILLING_PROGRAM = 'sync-transaction-billing-program',
  PDA_CHANGE = 'pda-change',
  UPDATE_INDEXER = 'update-indexer',
  EXECUTE_TRANSFORMER = 'execute-transformer',
}

export const InjectBillingSystemQueue = () => InjectQueue(SystemQueue.BILLING);

export const InjectPdaSystemQueue = () => InjectQueue(SystemQueue.PDA_SYSTEM);

export const InjectIndexerSystemQueue = () =>
  InjectQueue(SystemQueue.INDEXER_SYSTEM);

export const InjectExecuteTransformerQueue = () =>
  InjectQueue(SystemQueue.EXECUTE_TRANSFORMER);

export const BillingSystemQueueConfig = {
  name: SystemQueue.BILLING,
  limiter: SYSTEM_RATE_LIMITER,
};

export const PdaSystemQueueConfig = {
  name: SystemQueue.PDA_SYSTEM,
  limiter: SYSTEM_RATE_LIMITER,
};

export const IndexerSystemQueueConfig = {
  name: SystemQueue.INDEXER_SYSTEM,
  limiter: SYSTEM_RATE_LIMITER,
};

export const ExecuteTransformerQueueConfig = {
  name: SystemQueue.EXECUTE_TRANSFORMER,
  limiter: SYSTEM_RATE_LIMITER,
};
