/**
 * @module types
 * @description Fully typed interfaces for Hedera Mirror Node REST API responses
 * and Hiero Cron Kit configuration.
 */

// ─── Network Configuration ───────────────────────────────────────────────────

/** Supported Hiero/Hedera networks */
export type HieroNetwork = 'mainnet' | 'testnet' | 'previewnet';

/** Configuration for the Hiero client */
export interface HieroConfig {
  /** Target network */
  network: HieroNetwork;
  /** Custom Mirror Node base URL (overrides default) */
  mirrorNodeUrl?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Maximum retry attempts for transient failures (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryBaseDelay?: number;
}

// ─── Mirror Node: Common ─────────────────────────────────────────────────────

/** Standard pagination links returned by the Mirror Node */
export interface PaginationLinks {
  next: string | null;
}

/** Timestamp object as returned by Mirror Node */
export interface MirrorTimestamp {
  from: string;
  to: string | null;
}

/** A key structure as returned by Mirror Node */
export interface MirrorKey {
  _type: string;
  key: string;
}

// ─── Mirror Node: Schedules ──────────────────────────────────────────────────

/** A single scheduled transaction as returned by Mirror Node */
export interface Schedule {
  admin_key: MirrorKey | null;
  consensus_timestamp: string;
  creator_account_id: string;
  deleted: boolean;
  executed_timestamp: string | null;
  expiration_time: string;
  memo: string;
  payer_account_id: string;
  schedule_id: string;
  signatures: ScheduleSignature[];
  transaction_body: string;
  wait_for_expiry: boolean;
}

/** Signature on a scheduled transaction */
export interface ScheduleSignature {
  consensus_timestamp: string;
  public_key_prefix: string;
  signature: string;
  type: string;
}

/** Paginated schedule list response */
export interface ScheduleListResponse {
  schedules: Schedule[];
  links: PaginationLinks;
}

// ─── Mirror Node: Transactions ───────────────────────────────────────────────

/** Transfer within a transaction */
export interface Transfer {
  account: string;
  amount: number;
  is_approval: boolean;
}

/** Token transfer within a transaction */
export interface TokenTransfer {
  token_id: string;
  account: string;
  amount: number;
  is_approval: boolean;
}

/** NFT transfer within a transaction */
export interface NftTransfer {
  is_approval: boolean;
  receiver_account_id: string;
  sender_account_id: string;
  serial_number: number;
  token_id: string;
}

/** A single transaction as returned by Mirror Node */
export interface Transaction {
  bytes: string | null;
  charged_tx_fee: number;
  consensus_timestamp: string;
  entity_id: string | null;
  max_fee: string;
  memo_base64: string;
  name: string;
  nft_transfers: NftTransfer[];
  node: string;
  nonce: number;
  parent_consensus_timestamp: string | null;
  result: string;
  scheduled: boolean;
  staking_reward_transfers: Transfer[];
  token_transfers: TokenTransfer[];
  transaction_hash: string;
  transaction_id: string;
  transfers: Transfer[];
  valid_duration_seconds: string;
  valid_start_timestamp: string;
}

/** Paginated transaction list response */
export interface TransactionListResponse {
  transactions: Transaction[];
  links: PaginationLinks;
}

// ─── Mirror Node: Accounts ───────────────────────────────────────────────────

/** Account balance */
export interface AccountBalance {
  balance: number;
  timestamp: string;
  tokens: TokenBalance[];
}

/** Token balance entry */
export interface TokenBalance {
  token_id: string;
  balance: number;
}

/** A Hedera account as returned by Mirror Node */
export interface Account {
  account: string;
  alias: string | null;
  auto_renew_period: number;
  balance: AccountBalance;
  created_timestamp: string;
  decline_reward: boolean;
  deleted: boolean;
  ethereum_nonce: number;
  evm_address: string;
  expiry_timestamp: string;
  key: MirrorKey;
  max_automatic_token_associations: number;
  memo: string;
  pending_reward: number;
  receiver_sig_required: boolean;
  staked_account_id: string | null;
  staked_node_id: number | null;
  stake_period_start: string | null;
}

/** Paginated account list response */
export interface AccountListResponse {
  accounts: Account[];
  links: PaginationLinks;
}

// ─── Mirror Node: Contracts ──────────────────────────────────────────────────

/** Contract info as returned by Mirror Node */
export interface ContractInfo {
  admin_key: MirrorKey | null;
  auto_renew_account: string | null;
  auto_renew_period: number;
  contract_id: string;
  created_timestamp: string;
  deleted: boolean;
  evm_address: string;
  expiration_timestamp: string;
  file_id: string;
  max_automatic_token_associations: number;
  memo: string;
  obtainer_id: string | null;
  permanent_removal: boolean | null;
  proxy_account_id: string | null;
  timestamp: MirrorTimestamp;
}

/** Contract log entry */
export interface ContractLog {
  address: string;
  bloom: string;
  contract_id: string;
  data: string;
  index: number;
  topics: string[];
  block_hash: string;
  block_number: number;
  root_contract_id: string;
  timestamp: string;
  transaction_hash: string;
  transaction_index: number;
}

/** Paginated contract log list response */
export interface ContractLogListResponse {
  logs: ContractLog[];
  links: PaginationLinks;
}

// ─── Cron-specific Types ─────────────────────────────────────────────────────

/** Status of a cron schedule */
export type CronStatus = 'active' | 'paused' | 'completed' | 'failed';

/** Represents a tracked cron execution */
export interface CronExecution {
  scheduleId: string;
  contractId: string;
  executionTimestamp: string | null;
  expirationTime: string;
  status: CronStatus;
  executionCount: number;
}

/** Summary of a contract's cron activity */
export interface CronSummary {
  contractId: string;
  totalScheduled: number;
  totalExecuted: number;
  totalPending: number;
  nextExecution: string | null;
  schedules: CronExecution[];
}

// ─── Retry / Resilience ──────────────────────────────────────────────────────

/** Options for retry behavior */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelay: number;
  /** Maximum delay cap in ms (default: 30000) */
  maxDelay: number;
  /** Jitter factor 0-1 to add randomness to backoff (default: 0.1) */
  jitter: number;
  /** Function to determine if an error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

/** Result of a retry operation */
export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalDelay: number;
}
