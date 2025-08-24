import { EventData, Wallet } from '@coral-xyz/anchor';
import { IdlEventField } from '@coral-xyz/anchor/dist/cjs/idl';
import {
  Commitment,
  Connection,
  Transaction,
  TransactionInstruction,
  Signer,
  VersionedTransaction,
  AddressLookupTableAccount,
} from '@solana/web3.js';

export type FnGetPriorityFee = (
  rpcUrl: string,
  priorityLevel?: string,
  transaction?: Transaction,
) => Promise<number>;

export interface ISendTransactionWithRetryArgs {
  connection: Connection;
  wallet: Wallet;
  instructions: Array<TransactionInstruction>;
  signers: Array<Signer>;
  commitment?: Commitment;
  delays?: number;
  retries?: number;
  needSimulate?: boolean;
  addressLookupTableAccounts?: Array<AddressLookupTableAccount>;
  isAddComputeUnitIx?: boolean;
}

export interface ITransactionConfirmationResponse {
  txSig: string;
}

export interface ISendTransactionAndWaitConfirmationArgs {
  connection: Connection;
  transaction: Transaction | VersionedTransaction;
  commitment: Commitment;
  recentBlockhash: string;
  lastValidBlockHeight: number;
  timeWaitResendTransaction?: number;
}

export class Event {
  data: EventData<IdlEventField, Record<string, never>>;
  name: string;
}
