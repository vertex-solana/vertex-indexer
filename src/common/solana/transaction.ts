import {
  Connection,
  Transaction,
  ComputeBudgetProgram,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  ISendTransactionAndWaitConfirmationArgs,
  ISendTransactionWithRetryArgs,
  ITransactionConfirmationResponse,
} from './type';
import { retryAsync, wait } from '../utils';
import {
  DELAY_RETRY_TX,
  TIME_WAIT_RESEND_TX,
  DEFAULT_RETRIES,
  DEFAULT_TIMEOUT_SEND_TX,
  DEFAULT_TX_HASHES,
  PRIORITY_FEE_MICRO_LAMPORT,
} from '../constant';
import { PinoLogger } from 'nestjs-pino';
import { isNil } from 'lodash';

export const sendTransactionWithRetry = async (
  params: ISendTransactionWithRetryArgs,
): Promise<ITransactionConfirmationResponse> => {
  if (!params.commitment) {
    params.commitment = 'finalized';
  }

  if (!params.retries) {
    params.retries = DEFAULT_RETRIES;
  }

  if (!params.delays) {
    params.delays = DELAY_RETRY_TX;
  }

  if (isNil(params.needSimulate)) {
    params.needSimulate = true;
  }

  if (isNil(params.isAddComputeUnitIx)) {
    params.isAddComputeUnitIx = true;
  }

  const {
    connection,
    instructions,
    signers,
    wallet,
    commitment,
    retries,
    delays,
  } = params;

  const blockhashInfo = await connection.getLatestBlockhashAndContext();
  const lastValidBlockHeight = blockhashInfo.context.slot + 150;

  const transaction = new Transaction();

  instructions.forEach((instruction) => transaction.add(instruction));

  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = blockhashInfo.value.blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  if (params.isAddComputeUnitIx) {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: PRIORITY_FEE_MICRO_LAMPORT,
      }),
    );
  }

  await wallet.signTransaction(transaction);

  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }

  if (params.needSimulate) {
    await simulateSignedTransaction(transaction, connection);
  }

  return await retryAsync<ITransactionConfirmationResponse>(
    async () =>
      await sendTransactionAndWaitConfirmation({
        connection,
        transaction,
        recentBlockhash: blockhashInfo.value.blockhash,
        lastValidBlockHeight,
        commitment,
      }),
    delays,
    retries,
  );
};

export const sendVersionTransactionWithRetry = async (
  params: ISendTransactionWithRetryArgs,
): Promise<ITransactionConfirmationResponse> => {
  if (!params.commitment) {
    params.commitment = 'finalized';
  }

  if (!params.retries) {
    params.retries = DEFAULT_RETRIES;
  }

  if (!params.delays) {
    params.delays = DELAY_RETRY_TX;
  }

  if (isNil(params.needSimulate)) {
    params.needSimulate = true;
  }

  const {
    connection,
    instructions,
    signers,
    wallet,
    commitment,
    retries,
    delays,
    addressLookupTableAccounts,
  } = params;
  const transaction = new Transaction();

  if (params.isAddComputeUnitIx) {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: PRIORITY_FEE_MICRO_LAMPORT,
      }),
    );
  }
  instructions.forEach((instruction) => transaction.add(instruction));

  const blockhashInfo = await connection.getLatestBlockhashAndContext();
  const lastValidBlockHeight = blockhashInfo.context.slot + 150;

  const txMessage = new TransactionMessage({
    instructions: transaction.instructions,
    recentBlockhash: blockhashInfo.value.blockhash,
    payerKey: wallet.publicKey,
  }).compileToV0Message(addressLookupTableAccounts);
  const versionedTransaction = new VersionedTransaction(txMessage);

  await wallet.signTransaction(versionedTransaction);

  if (signers.length > 0) {
    versionedTransaction.sign(signers);
  }

  if (params.needSimulate) {
    await simulateSignedTransaction(versionedTransaction, connection);
  }

  return await retryAsync<ITransactionConfirmationResponse>(
    async () =>
      await sendTransactionAndWaitConfirmation({
        connection,
        transaction: versionedTransaction,
        recentBlockhash: blockhashInfo.value.blockhash,
        lastValidBlockHeight,
        commitment,
      }),
    delays,
    retries,
  );
};

export const sendTransactionAndWaitConfirmation = async (
  input: ISendTransactionAndWaitConfirmationArgs,
): Promise<ITransactionConfirmationResponse> => {
  if (!input.timeWaitResendTransaction) {
    input.timeWaitResendTransaction = TIME_WAIT_RESEND_TX;
  }

  const {
    connection,
    transaction,
    timeWaitResendTransaction,
    commitment,
    recentBlockhash,
    lastValidBlockHeight,
  } = input;

  const serializedTransaction = Buffer.from(transaction.serialize());

  const txSig = await connection.sendRawTransaction(serializedTransaction, {
    skipPreflight: true,
  });

  const abortController = new AbortController();
  const abortSignal = abortController.signal;

  const resendTransaction = async () => {
    while (true) {
      await wait(timeWaitResendTransaction);
      if (abortSignal.aborted) return;
      try {
        await connection.sendRawTransaction(serializedTransaction, {
          skipPreflight: true,
        });
      } catch (error) {
        PinoLogger.root
          .child({ context: resendTransaction.name })
          .error(error, `Error to resend transaction`);
      }
    }
  };

  try {
    resendTransaction();

    await Promise.race([
      connection.confirmTransaction(
        {
          blockhash: recentBlockhash,
          lastValidBlockHeight,
          signature: txSig,
          abortSignal,
        },
        commitment,
      ),
      new Promise(async (resolve) => {
        if (!abortSignal.aborted) {
          await wait(2_000); // 2 seconds
          const tx = await connection.getSignatureStatus(txSig, {
            searchTransactionHistory: false,
          });
          if (
            tx?.value?.confirmationStatus == commitment ||
            tx?.value?.confirmationStatus == 'finalized'
          ) {
            PinoLogger.root
              .child({ context: sendTransactionAndWaitConfirmation.name })
              .info(`resolve send tx ${tx.value.confirmationStatus}`);
            resolve(tx);
          } else if (tx?.value?.err) {
            PinoLogger.root
              .child({ context: sendTransactionAndWaitConfirmation.name })
              .error(`Error send tx ${tx.value.err}`);
            throw new Error('Error send transaction');
          }
        }
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject('Transaction timeout'),
          DEFAULT_TIMEOUT_SEND_TX,
        ),
      ),
    ]);
  } catch (error) {
    PinoLogger.root
      .child({ context: sendTransactionAndWaitConfirmation.name })
      .error(error, `Error to confirm transaction`);

    throw error;
  } finally {
    abortController.abort();
  }

  PinoLogger.root
    .child({ context: sendTransactionAndWaitConfirmation.name })
    .debug({ txSig }, `Send transaction with tx`);

  return { txSig };
};

export const simulateSignedTransaction = async (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
): Promise<void> => {
  let simulateResult;
  if (transaction instanceof VersionedTransaction) {
    simulateResult = await connection.simulateTransaction(transaction, {});
  } else {
    simulateResult = await connection.simulateTransaction(transaction);
  }
  const { err, logs } = simulateResult.value;

  if (err) {
    const programLog = logs?.find((log) => log.startsWith('Program log: '));
    let errMsg = ` ${programLog} failed: ${JSON.stringify(err)}`;

    if (programLog) {
      errMsg = `${programLog} failed: ${logs.join('\n')}`;
    }

    throw new Error(errMsg);
  }
};

export const buildTransaction = async (params: {
  connection: Connection;
  transaction: Transaction;
  feePayer: PublicKey;
}): Promise<Transaction> => {
  const { connection, transaction, feePayer } = params;

  const blockhashInfo = await connection.getLatestBlockhashAndContext();
  const lastValidBlockHeight = blockhashInfo.context.slot + 150;

  transaction.recentBlockhash = blockhashInfo.value.blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = feePayer;

  return transaction;
};

export const getParsedTransaction = async (
  signature: string,
  connection: Connection,
) => {
  if (DEFAULT_TX_HASHES.includes(signature)) {
    return null;
  }

  const tx = await connection.getParsedTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    throw new Error(`Could not get transaction ${signature}`);
  }

  return tx;
};
