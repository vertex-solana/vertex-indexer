export interface Context {
  slot: number;
}

export interface Value {
  signature: string;
  err: any;
  logs: string[];
}

export interface Result {
  context: Context;
  value: Value;
}

export interface Params {
  result: Result;
  subscription: number;
}

export interface LogsNotificationRPCResponse {
  jsonrpc: string;
  method: string;
  params: Params;
}
