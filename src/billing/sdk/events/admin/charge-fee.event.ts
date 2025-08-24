import BN from 'bn.js';

export interface ChargeFeeEvent {
  user: string;
  userVault: string;
  amount: BN;
}
