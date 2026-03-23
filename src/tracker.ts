/**
 * @module tracker
 * @description Enhanced HieroCronTracker with typed responses, pagination,
 * and resilient retry handling for tracking scheduled contract executions.
 */

import type { HieroNetwork, Schedule, CronSummary } from './types';
import { HieroMirrorClient } from './mirror-client';
import { HieroScheduleHelper } from './schedule-helper';

/**
 * HieroCronTracker — Track and monitor HIP-1215 cron contract executions
 * via the Hedera Mirror Node.
 *
 * @example
 * ```ts
 * import { HieroCronTracker } from 'hiero-cron-kit';
 *
 * const tracker = new HieroCronTracker('testnet');
 *
 * // Get upcoming scheduled executions
 * const upcoming = await tracker.getUpcomingExecutions('0.0.1234');
 *
 * // Get full cron summary with status
 * const summary = await tracker.getCronSummary('0.0.1234');
 * console.log(`Pending: ${summary.totalPending}`);
 * ```
 */
export class HieroCronTracker {
  private readonly mirror: HieroMirrorClient;
  private readonly helper: HieroScheduleHelper;
  public readonly network: HieroNetwork;

  constructor(network: HieroNetwork = 'testnet') {
    this.network = network;
    this.mirror = new HieroMirrorClient({ network });
    this.helper = new HieroScheduleHelper({ network });
  }

  /**
   * Fetches all scheduled transactions for a given contract.
   * @param contractId The Hedera Contract ID (e.g., 0.0.1234)
   * @returns Array of typed Schedule objects
   */
  public async getUpcomingExecutions(contractId: string): Promise<Schedule[]> {
    return this.helper.getSchedules(contractId);
  }

  /**
   * Gets a comprehensive summary of a contract's cron activity.
   * @param contractId The contract to summarize
   */
  public async getCronSummary(contractId: string): Promise<CronSummary> {
    return this.helper.getCronSummary(contractId);
  }

  /**
   * Checks if a contract currently has active cron schedules.
   */
  public async isCronActive(contractId: string): Promise<boolean> {
    return this.helper.isActive(contractId);
  }

  /**
   * Gets the HBAR balance of a contract/account in tinybars.
   */
  public async getBalance(accountId: string): Promise<number> {
    return this.mirror.getBalance(accountId);
  }

  /**
   * Waits for a specific schedule to be executed.
   * Useful for testing and monitoring.
   */
  public async waitForExecution(
    scheduleId: string,
    pollIntervalMs = 5000,
    timeoutMs = 120_000
  ): Promise<Schedule> {
    return this.helper.waitForExecution(scheduleId, pollIntervalMs, timeoutMs);
  }
}
