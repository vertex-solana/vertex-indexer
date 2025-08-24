import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface DepositToVaultEvent {
  amount: BN;
  user: PublicKey;
  userVault: PublicKey;
}
