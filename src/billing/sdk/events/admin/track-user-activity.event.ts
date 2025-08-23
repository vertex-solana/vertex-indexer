import { PublicKey } from '@solana/web3.js';

export interface TrackUserActivityEvent {
  user: PublicKey;
  userVault: PublicKey;
}
