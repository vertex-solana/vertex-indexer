import BN from 'bn.js';

export interface InitIndexerEvent {
  owner: string;
  indexer: string;
  indexerId: BN;
}
