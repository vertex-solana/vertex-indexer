import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface IIndexer {
  owner: PublicKey;
  bump: number;
  indexerId: BN;
  pricePerGbLamports: BN;
  rentLamports: BN;
}

export class Indexer {
  state: IIndexer;

  constructor(data: IIndexer) {
    this.state = data;
  }
}
