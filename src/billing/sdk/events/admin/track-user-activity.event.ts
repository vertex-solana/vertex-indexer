import BN from 'bn.js';

export interface TrackUserActivityEvent {
  bytes: BN;
  indexerId: BN | null;
  user: string;
  userVault: string;
}
