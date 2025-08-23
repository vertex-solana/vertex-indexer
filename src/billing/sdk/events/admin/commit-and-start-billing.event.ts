import { PublicKey } from '@solana/web3.js';

export interface CommitAndStartBillingEvent {
  user: PublicKey;
  userVault: PublicKey;
}
