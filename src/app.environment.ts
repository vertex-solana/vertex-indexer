import { CronExpression } from '@nestjs/schedule';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Environment
export const NODE_ENV: string = process.env.NODE_ENV || 'development';

// Server config
export const PORT: number = parseInt(process.env.PORT, 10) || 3000;
export const CONTEXT_PATH: string = process.env.CONTEXT_PATH || '/api';

// Logging config
export const LOGGING_CONSOLE_LEVEL =
  process.env.LOGGING_CONSOLE_LEVEL || 'debug';
export const LOGGING_FILE_LEVEL = process.env.LOGGING_FILE_LEVEL || 'silent';
export const LOG_FILE_PATH = process.env.LOG_FILE_PATH || './logger.log';

// Swagger config
export const SWAGGER_ENDPOINT = process.env.SWAGGER_ENDPOINT || 'docs';

// Database connection
export const DATABASE_HOST: string = process.env.DATABASE_HOST || '';
export const DATABASE_PORT: number =
  parseInt(process.env.DATABASE_PORT, 10) || 0;
export const DATABASE_USER: string = process.env.DATABASE_USER || '';
export const DATABASE_PASSWORD: string = process.env.DATABASE_PASSWORD || '';
export const DATABASE_NAME: string = process.env.DATABASE_NAME || '';

// Redis connection
export const REDIS_HOST: string = process.env.REDIS_HOST || '';
export const REDIS_PORT: number = parseInt(process.env.REDIS_PORT, 10) || 6379;
export const REDIS_DATABASE_NUMBER: number =
  parseInt(process.env.REDIS_DATABASE_NUMBER, 10) || 0;
export const REDIS_PASSWORD: string = process.env.REDIS_PASSWORD;
export const REDIS_TLS: boolean = process.env.REDIS_TLS
  ? JSON.parse(process.env.REDIS_TLS)
  : true;

// Queue Config
export const JOB_MAX_NUMBER_PROCESS = 200;
export const JOB_MAX_PROCESS_DURATION = 20000;
export const BULL_DEFAULT_ATTEMPTS_COUNT =
  parseInt(process.env.BULL_DEFAULT_ATTEMPTS_COUNT, 10) || 10;
export const BULL_DEFAULT_BACKOFF_MILLISECONDS =
  parseInt(process.env.BULL_DEFAULT_BACKOFF_MILISECONDS, 10) || 5000;
export const SYNC_TRANSACTION_JOB_ATTEMPTS =
  parseInt(process.env.SYNC_TRANSACTION_JOB_ATTEMPTS, 10) || 30;
export const SYNC_TRANSACTION_JOB_BACKOFF =
  parseInt(process.env.SYNC_TRANSACTION_JOB_BACKOFF, 10) || 10000;
export const BALANCE_UPDATE_DELAY = 500;
export const ACCOUNT_LEVEL_UPDATE_DELAY = 500;
export const SYNC_TRANSACTION_QUEUE_JOB_OPTIONS = {
  attempts: 3,
  delay: 1000,
};

// PDA Change
export const GET_INDEXER_PAGING =
  parseInt(process.env.GET_INDEXER_PAGING) || 10;

// Auth
export const WALLET_NONCE_TTL: number =
  parseInt(process.env.WALLET_NONCE_TTL, 10) || 3000000;
export const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'access-secret';

// Google
export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || 'google-client-id';
export const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || 'google-client-secret';
export const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'google-callback-url';
export const FE_REDIRECT_URL = process.env.FE_REDIRECT_URL || 'fe-redirect-url';

// Indexer connection
export const INDEXER_CONNECTION_TTL =
  parseInt(process.env.INDEXER_CONNECTION_TTL, 10) || 5 * 60 * 1000; // 5 minutes
export const CREDENTIAL_SECRET_KEY =
  process.env.CREDENTIAL_SECRET_KEY || 'credential-secret';

// RPC
export const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
export const MAGIC_BLOCK_ER_RPC_URL =
  process.env.MAGIC_BLOCK_ER_RPC_URL || 'https://devnet.magicblock.app/';
export const MAGIC_BLOCK_ER_RPC_WS =
  process.env.MAGIC_BLOCK_ER_RPC_WS || 'wss://devnet.magicblock.app/';

// Vertex Billing
export const OPERATOR_BILLING_SECRET_KEY =
  process.env.OPERATOR_BILLING_SECRET_KEY;
export const SCHEDULER_TRACKING_STORAGE_INDEXER =
  process.env.SCHEDULER_TRACKING_STORAGE_INDEXER ||
  CronExpression.EVERY_DAY_AT_MIDNIGHT;
export const SCHEDULER_SCAN_PENDING_BILLING =
  process.env.SCHEDULER_SCAN_PENDING_BILLING ||
  CronExpression.EVERY_DAY_AT_MIDNIGHT;
export const SIZE_BATCH_HANDLE_TRACKING_STORAGE =
  parseInt(process.env.SIZE_BATCH_HANDLE_TRACKING_STORAGE, 10) || 100;
export const SIZE_BATCH_HANDLE_PENDING_BILLING =
  parseInt(process.env.SIZE_BATCH_HANDLE_PENDING_BILLING, 10) || 100;
