/**
 * @module schedule-helper
 * @description High-level helpers for working with Hedera scheduled transactions.
 * Provides ergonomic APIs for creating, tracking, and managing schedules via
 * both the Hedera SDK (ethers) and the Mirror Node.
 */

import type {
  Schedule,
  CronExecution,
  CronSummary,
  CronStatus,
  HieroConfig,
} from './types';
import { HieroMirrorClient } from './mirror-client';

/**
 * HieroScheduleHelper — High-level utilities for scheduled transaction management.
 *
 * @example
 * ```ts
 * import { HieroScheduleHelper } from 'hiero-cron-kit';
 *
 * const helper = new HieroScheduleHelper({ network: 'testnet' });
 *
 * // Get a full cron summary for a contract
 * const summary = await helper.getCronSummary('0.0.1234');
 * console.log(`Next execution: ${summary.nextExecution}`);
 * console.log(`Pending: ${summary.totalPending}, Executed: ${summary.totalExecuted}`);
 * ```
 */
export class HieroScheduleHelper {
  private readonly mirror: HieroMirrorClient;

  constructor(config: Partial<HieroConfig> = {}) {
    this.mirror = new HieroMirrorClient(config);
  }

  /**
   * Gets all scheduled transactions for a given contract/account.
   * @param contractId The contract or account ID
   */
  public async getSchedules(contractId: string): Promise<Schedule[]> {
    const schedules: Schedule[] = [];
    for await (const schedule of this.mirror.paginateSchedules(contractId)) {
      schedules.push(schedule);
    }
    return schedules;
  }

  /**
   * Gets a single schedule by ID.
   */
  public async getSchedule(scheduleId: string): Promise<Schedule> {
    return this.mirror.getSchedule(scheduleId);
  }

  /**
   * Determines the status of a schedule.
   */
  public classifyScheduleStatus(schedule: Schedule): CronStatus {
    if (schedule.deleted) return 'failed';
    if (schedule.executed_timestamp) return 'completed';
    
    const expiry = new Date(schedule.expiration_time).getTime();
    const now = Date.now();
    
    if (expiry < now && !schedule.executed_timestamp) return 'failed';
    return 'active';
  }

  /**
   * Converts a raw schedule into a CronExecution.
   */
  public toExecution(schedule: Schedule, contractId: string): CronExecution {
    return {
      scheduleId: schedule.schedule_id,
      contractId,
      executionTimestamp: schedule.executed_timestamp,
      expirationTime: schedule.expiration_time,
      status: this.classifyScheduleStatus(schedule),
      executionCount: schedule.executed_timestamp ? 1 : 0,
    };
  }

  /**
   * Generates a comprehensive cron summary for a contract, including
   * execution counts, pending schedules, and next execution time.
   *
   * @param contractId The contract ID to summarize
   * @returns Full CronSummary with schedule details
   */
  public async getCronSummary(contractId: string): Promise<CronSummary> {
    const rawSchedules = await this.getSchedules(contractId);
    const executions = rawSchedules.map((s) => this.toExecution(s, contractId));

    const totalExecuted = executions.filter((e) => e.status === 'completed').length;
    const totalPending = executions.filter((e) => e.status === 'active').length;

    // Find next upcoming execution
    const pendingSchedules = executions
      .filter((e) => e.status === 'active')
      .sort((a, b) => 
        new Date(a.expirationTime).getTime() - new Date(b.expirationTime).getTime()
      );

    return {
      contractId,
      totalScheduled: rawSchedules.length,
      totalExecuted,
      totalPending,
      nextExecution: pendingSchedules[0]?.expirationTime ?? null,
      schedules: executions,
    };
  }

  /**
   * Checks if a contract has any active (pending) cron schedules.
   */
  public async isActive(contractId: string): Promise<boolean> {
    const summary = await this.getCronSummary(contractId);
    return summary.totalPending > 0;
  }

  /**
   * Returns only the pending (not yet executed) schedules for a contract.
   */
  public async getPendingSchedules(contractId: string): Promise<CronExecution[]> {
    const summary = await this.getCronSummary(contractId);
    return summary.schedules.filter((s) => s.status === 'active');
  }

  /**
   * Returns only the completed (executed) schedules for a contract.
   */
  public async getCompletedSchedules(contractId: string): Promise<CronExecution[]> {
    const summary = await this.getCronSummary(contractId);
    return summary.schedules.filter((s) => s.status === 'completed');
  }

  /**
   * Waits for a specific schedule to be executed, polling at the given interval.
   * Useful for integration tests or CLI tools.
   *
   * @param scheduleId The schedule ID to watch
   * @param pollIntervalMs Polling interval in ms (default: 5000)
   * @param timeoutMs Maximum wait time in ms (default: 120000)
   * @returns The executed schedule
   * @throws Error if timeout is reached
   */
  public async waitForExecution(
    scheduleId: string,
    pollIntervalMs = 5000,
    timeoutMs = 120_000
  ): Promise<Schedule> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const schedule = await this.getSchedule(scheduleId);
      if (schedule.executed_timestamp) return schedule;
      if (schedule.deleted) throw new Error(`Schedule ${scheduleId} was deleted`);
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    throw new Error(`Timeout waiting for schedule ${scheduleId} after ${timeoutMs}ms`);
  }
}
