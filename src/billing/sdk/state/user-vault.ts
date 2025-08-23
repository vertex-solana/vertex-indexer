import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

interface IReadDebt {
  indexerId: BN;
  bytesAccumulated: BN;
  pricePerGbLamports: BN;
}

interface IUserVault {
  owner: PublicKey;
  bump: number;
  storageBytes: BN;
  storageBytesLastBilled: BN;
  readDebts: IReadDebt[];
  billingStatus: number;
  rentLamports: BN;
}

export class UserVault {
  state: IUserVault;

  constructor(data: IUserVault) {
    this.state = data;
  }
}
