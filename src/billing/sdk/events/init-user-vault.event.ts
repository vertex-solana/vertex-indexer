import { PublicKey } from '@solana/web3.js';

export interface InitUserVaultEvent {
  owner: PublicKey;
  userVault: PublicKey;
}
