import { PublicKey } from '@solana/web3.js';
import { Program } from 'anchor-v31';
import BN from 'bn.js';
import { VertexProgram } from '../idl/vertex_program';
import { DEFAULT_INDEXER_ID } from '../common';

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
  address: PublicKey;

  constructor(address: PublicKey) {
    this.address = address;
  }

  async load(program: Program<VertexProgram>): Promise<void> {
    this.state = await program.account.userVault.fetch(this.address);
  }

  isAvailableToReadDataFromAnotherIndex(): boolean {
    const availableReadDebts = this.state.readDebts.filter(
      (readDebt) => readDebt.indexerId.toNumber() === DEFAULT_INDEXER_ID,
    );

    return availableReadDebts.length > 0;
  }
}
