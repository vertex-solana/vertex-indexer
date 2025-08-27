import { Event } from 'anchor-v31';
import { IdlEvent } from 'anchor-v31/dist/cjs/idl';
import { PublicKey } from '@solana/web3.js';
import { isNil } from 'lodash';
import { BN } from 'bn.js';

export const formatEvent = (event: Event<IdlEvent, Record<string, never>>) => {
  if (isNil(event?.data)) return {};

  const formattedEvent = event.data;
  for (const [key, value] of Object.entries(event.data)) {
    if (value instanceof PublicKey) {
      formattedEvent[key] = value.toBase58();
    }
    if (value instanceof BN) {
      formattedEvent[key] = value.toString();
    }
  }

  return formattedEvent;
};
