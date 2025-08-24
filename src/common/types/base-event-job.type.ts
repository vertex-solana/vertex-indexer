export interface IEventJob<T> {
  name: string;
  signatures: string[];
  timestamp: Date;
  data: T;
}
