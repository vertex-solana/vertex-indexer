import BN from 'bn.js';

export interface DepositToVaultEvent {
  amount: BN;
  user: string;
  userVault: string;
}
