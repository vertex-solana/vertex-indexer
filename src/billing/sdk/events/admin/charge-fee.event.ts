import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface ChargeFeeEvent {
  user: PublicKey;
  userVault: PublicKey;
  amount: BN;
}
