import { ExecutionLayer } from 'src/common/enum/common.enum';
import {
  ChargeFeeEvent,
  DepositToVaultEvent,
  InitIndexerEvent,
  InitUserVaultEvent,
  StartBillingEvent,
  TrackUserActivityEvent,
  WithdrawIndexerFeeEvent,
} from '../sdk/events';

export interface ISyncTransactionBillingJob {
  signature: string;
  executionLayer: ExecutionLayer;
  timestamp: number;
}

interface IBaseJob {
  signature: string;
  timestamp: number;
}

export interface IInitUserVaultJob extends InitUserVaultEvent, IBaseJob {}

export interface IStartDelegateUserVaultJob {
  user: string;
  accountId: number;
}

export interface IInitIndexerJob extends InitIndexerEvent, IBaseJob {}

export interface IDepositToVaultJob extends DepositToVaultEvent, IBaseJob {}

export interface IWithdrawIndexerFeeJob
  extends WithdrawIndexerFeeEvent,
    IBaseJob {}

export interface UpdateTrackUserActivityJob {
  userWallet: string;
  indexerId: number | null;
  bytes: number;
}

export interface ITrackUserActivityJob
  extends TrackUserActivityEvent,
    IBaseJob {}

export interface IStartBillingJob extends StartBillingEvent, IBaseJob {}

export interface IStartChargeFeeJob {
  user: string;
  userVault: string;
}

export interface IChargedFeeJob extends ChargeFeeEvent, IBaseJob {}
