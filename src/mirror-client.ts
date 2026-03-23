/**
 * @module mirror-client
 * @description Production-grade Hedera Mirror Node REST API client with
 * typed queries, automatic pagination, and resilient retry handling.
 */

import type {
  HieroConfig,
  HieroNetwork,
  ScheduleListResponse,
  Schedule,
  TransactionListResponse,
  Transaction,
  Account,
  AccountListResponse,
  ContractInfo,
  ContractLog,
  ContractLogListResponse,
} from './types';
import { withRetry } from './retry';

/** Default Mirror Node URLs per network */
const MIRROR_NODE_URLS: Record<HieroNetwork, string> = {
  mainnet: 'https://mainnet.mirrornode.hedera.com',
  testnet: 'https://testnet.mirrornode.hedera.com',
  previewnet: 'https://previewnet.mirrornode.hedera.com',
};

/**
 * HieroMirrorClient — A typed, resilient client for the Hedera Mirror Node REST API.
 *
 * Features:
 * - Fully typed responses for schedules, transactions, accounts, contracts
 * - Automatic pagination with async generators
 * - Exponential backoff retry for transient failures
 * - Configurable timeout and network selection
 *
 * @example
 * ```ts
 * import { HieroMirrorClient } from 'hiero-cron-kit';
 *
 * const client = new HieroMirrorClient({ network: 'testnet' });
 *
 * // Get account info
 * const account = await client.getAccount('0.0.1234');
 *
 * // Paginate through all transactions
 * for await (const tx of client.paginateTransactions('0.0.1234')) {
 *   console.log(tx.transaction_id, tx.result);
 * }
 * ```
 */
export class HieroMirrorClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelay: number;

  constructor(config: Partial<HieroConfig> = {}) {
    const network = config.network ?? 'testnet';
    this.baseUrl = config.mirrorNodeUrl ?? MIRROR_NODE_URLS[network];
    this.timeout = config.timeout ?? 10_000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryBaseDelay = config.retryBaseDelay ?? 1000;
  }

  // ─── Core HTTP ───────────────────────────────────────────────────────

  /**
   * Performs a typed GET request against the Mirror Node with retry logic.
   * @param path API path (e.g., `/api/v1/accounts/0.0.1234`)
   */
  public async get<T>(path: string): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    const result = await withRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            const error: any = new Error(`Mirror Node ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
          }
          return response.json() as Promise<T>;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      { maxRetries: this.maxRetries, baseDelay: this.retryBaseDelay }
    );

    return result.data;
  }

  // ─── Schedules ───────────────────────────────────────────────────────

  /**
   * Lists scheduled transactions, optionally filtered by account.
   * @param accountId Filter by creator/payer account ID
   * @param limit Max results per page (default: 25, max: 100)
   */
  public async getSchedules(accountId?: string, limit = 25): Promise<ScheduleListResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (accountId) params.set('account.id', accountId);
    return this.get<ScheduleListResponse>(`/api/v1/schedules?${params}`);
  }

  /**
   * Gets a single schedule by its ID.
   * @param scheduleId The schedule entity ID (e.g., 0.0.5678)
   */
  public async getSchedule(scheduleId: string): Promise<Schedule> {
    return this.get<Schedule>(`/api/v1/schedules/${scheduleId}`);
  }

  /**
   * Async generator that paginates through all schedules for an account.
   * @param accountId The account to query schedules for
   * @param limit Results per page
   */
  public async *paginateSchedules(accountId?: string, limit = 25): AsyncGenerator<Schedule> {
    let response = await this.getSchedules(accountId, limit);
    for (const schedule of response.schedules) yield schedule;

    while (response.links?.next) {
      response = await this.get<ScheduleListResponse>(response.links.next);
      for (const schedule of response.schedules) yield schedule;
    }
  }

  // ─── Transactions ────────────────────────────────────────────────────

  /**
   * Lists transactions, optionally filtered by account.
   * @param accountId Filter by account ID
   * @param limit Max results per page
   * @param type Transaction type filter (e.g., 'SCHEDULECREATE')
   */
  public async getTransactions(
    accountId?: string,
    limit = 25,
    type?: string
  ): Promise<TransactionListResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (accountId) params.set('account.id', accountId);
    if (type) params.set('transactiontype', type);
    return this.get<TransactionListResponse>(`/api/v1/transactions?${params}`);
  }

  /**
   * Gets a specific transaction by its ID.
   * @param transactionId The transaction ID (e.g., 0.0.1234-1234567890-123456789)
   */
  public async getTransaction(transactionId: string): Promise<TransactionListResponse> {
    return this.get<TransactionListResponse>(`/api/v1/transactions/${transactionId}`);
  }

  /**
   * Async generator that paginates through all transactions for an account.
   */
  public async *paginateTransactions(
    accountId?: string,
    limit = 25,
    type?: string
  ): AsyncGenerator<Transaction> {
    let response = await this.getTransactions(accountId, limit, type);
    for (const tx of response.transactions) yield tx;

    while (response.links?.next) {
      response = await this.get<TransactionListResponse>(response.links.next);
      for (const tx of response.transactions) yield tx;
    }
  }

  // ─── Accounts ────────────────────────────────────────────────────────

  /**
   * Gets detailed account information.
   * @param accountId The account ID (e.g., 0.0.1234)
   */
  public async getAccount(accountId: string): Promise<Account> {
    return this.get<Account>(`/api/v1/accounts/${accountId}`);
  }

  /**
   * Lists accounts with optional filters.
   * @param params Query parameters
   * @param limit Max results per page
   */
  public async getAccounts(
    params?: Record<string, string>,
    limit = 25
  ): Promise<AccountListResponse> {
    const searchParams = new URLSearchParams({ limit: String(limit), ...params });
    return this.get<AccountListResponse>(`/api/v1/accounts?${searchParams}`);
  }

  /**
   * Gets the HBAR balance of an account in tinybars.
   * @param accountId The account ID
   * @returns Balance in tinybars
   */
  public async getBalance(accountId: string): Promise<number> {
    const account = await this.getAccount(accountId);
    return account.balance.balance;
  }

  // ─── Contracts ───────────────────────────────────────────────────────

  /**
   * Gets detailed contract information.
   * @param contractId The contract ID (e.g., 0.0.5678)
   */
  public async getContract(contractId: string): Promise<ContractInfo> {
    return this.get<ContractInfo>(`/api/v1/contracts/${contractId}`);
  }

  /**
   * Gets contract event logs.
   * @param contractId The contract ID
   * @param limit Max results per page
   */
  public async getContractLogs(
    contractId: string,
    limit = 25
  ): Promise<ContractLogListResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    return this.get<ContractLogListResponse>(`/api/v1/contracts/${contractId}/results/logs?${params}`);
  }

  /**
   * Async generator that paginates through all contract logs.
   */
  public async *paginateContractLogs(
    contractId: string,
    limit = 25
  ): AsyncGenerator<ContractLog> {
    let response = await this.getContractLogs(contractId, limit);
    for (const log of response.logs) yield log;

    while (response.links?.next) {
      response = await this.get<ContractLogListResponse>(response.links.next);
      for (const log of response.logs) yield log;
    }
  }

  // ─── Network Info ────────────────────────────────────────────────────

  /**
   * Gets the network supply information (total HBAR supply).
   */
  public async getNetworkSupply(): Promise<{ total_supply: string; released_supply: string }> {
    return this.get('/api/v1/network/supply');
  }

  /**
   * Gets the list of network nodes.
   */
  public async getNetworkNodes(): Promise<{ nodes: any[]; links: { next: string | null } }> {
    return this.get('/api/v1/network/nodes');
  }
}
