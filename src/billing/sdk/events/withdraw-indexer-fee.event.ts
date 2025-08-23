import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface WithdrawIndexerFeeEvent {
  amount: BN;
  indexer: PublicKey;
  indexerId: BN;
  indexerOwner: PublicKey;
}
