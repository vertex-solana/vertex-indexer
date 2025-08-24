export enum VertexBillingEventName {
  InitSystemVaultEvent = 'InitSystemVaultEvent',
  InitUserVaultEvent = 'InitUserVaultEvent',
  DelegateUserVaultEvent = 'DelegateUserVaultEvent',
  DepositToVaultEvent = 'DepositToVaultEvent',
  TrackUserActivityEvent = 'TrackUserActivityEvent',
  StartBillingEvent = 'StartBillingEvent',
  CommitAndStartBillingEvent = 'CommitAndStartBillingEvent',
  InitIndexerEvent = 'InitIndexerEvent',
  WithdrawIndexerFeeEvent = 'WithdrawIndexerFeeEvent',
  ChargeFeeEvent = 'ChargeFeeEvent',
  WithdrawFeeEvent = 'WithdrawFeeEvent',
}
