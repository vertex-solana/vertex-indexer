import BN from 'bn.js';

export interface WithdrawIndexerFeeEvent {
  amount: BN;
  indexer: string;
  indexerId: BN;
  indexerOwner: string;
}
