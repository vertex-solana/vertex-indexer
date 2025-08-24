import { Event } from 'anchor-v31';
import { IdlEvent } from 'anchor-v31/dist/cjs/idl';

export type ObjectType = {
  [key: string]: any;
};

export interface ProgramEvent {
  data: Event<IdlEvent, Record<string, never>>;
  timestamp: Date;
  name: string;
}
