import { PublicKey } from '@solana/web3.js';

export interface StartBillingEvent {
  user: PublicKey;
  userVault: PublicKey;
}
