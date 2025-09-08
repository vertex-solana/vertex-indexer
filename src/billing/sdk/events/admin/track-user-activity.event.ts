export interface TrackUserActivityEvent {
  bytes: string;
  indexerId: string | null;
  user: string;
  userVault: string;
}
