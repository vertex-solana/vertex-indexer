export enum VertexBillingEventName {
  InitSystemVaultEvent = 'initSystemVaultEvent',
  InitUserVaultEvent = 'initUserVaultEvent',
  DelegateUserVaultEvent = 'delegateUserVaultEvent',
  DepositToVaultEvent = 'depositToVaultEvent',
  TrackUserActivityEvent = 'trackUserActivityEvent',
  StartBillingEvent = 'startBillingEvent',
  CommitAndStartBillingEvent = 'commitAndStartBillingEvent',
  InitIndexerEvent = 'initIndexerEvent',
  WithdrawIndexerFeeEvent = 'withdrawIndexerFeeEvent',
  ChargeFeeEvent = 'chargeFeeEvent',
  WithdrawFeeEvent = 'withdrawFeeEvent',
}
