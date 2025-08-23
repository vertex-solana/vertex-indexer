import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface InitIndexerEvent {
  owner: PublicKey;
  indexer: PublicKey;
  indexerId: BN;
}
