import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HieroScheduleHelper } from '../src/schedule-helper';
import type { Schedule } from '../src/types';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: any) {
  return { ok: true, status: 200, statusText: 'OK', json: async () => data };
}

function createMockSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    admin_key: null,
    consensus_timestamp: '1234567890.000000000',
    creator_account_id: '0.0.1234',
    deleted: false,
    executed_timestamp: null,
    expiration_time: new Date(Date.now() + 60_000).toISOString(),
    memo: '',
    payer_account_id: '0.0.1234',
    schedule_id: '0.0.100',
    signatures: [],
    transaction_body: '',
    wait_for_expiry: false,
    ...overrides,
  };
}

describe('HieroScheduleHelper', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const helper = new HieroScheduleHelper();
      expect(helper).toBeInstanceOf(HieroScheduleHelper);
    });

    it('should accept custom config', () => {
      const helper = new HieroScheduleHelper({ network: 'mainnet' });
      expect(helper).toBeInstanceOf(HieroScheduleHelper);
    });
  });

  describe('classifyScheduleStatus', () => {
    const helper = new HieroScheduleHelper();

    it('should classify executed schedule as completed', () => {
      const schedule = createMockSchedule({ executed_timestamp: '1234567890.000' });
      expect(helper.classifyScheduleStatus(schedule)).toBe('completed');
    });

    it('should classify deleted schedule as failed', () => {
      const schedule = createMockSchedule({ deleted: true });
      expect(helper.classifyScheduleStatus(schedule)).toBe('failed');
    });

    it('should classify future schedule as active', () => {
      const futureTime = new Date(Date.now() + 120_000).toISOString();
      const schedule = createMockSchedule({ expiration_time: futureTime });
      expect(helper.classifyScheduleStatus(schedule)).toBe('active');
    });

    it('should classify expired non-executed schedule as failed', () => {
      const pastTime = new Date(Date.now() - 120_000).toISOString();
      const schedule = createMockSchedule({ expiration_time: pastTime });
      expect(helper.classifyScheduleStatus(schedule)).toBe('failed');
    });
  });

  describe('toExecution', () => {
    const helper = new HieroScheduleHelper();

    it('should convert schedule to CronExecution', () => {
      const schedule = createMockSchedule({ schedule_id: '0.0.200' });
      const execution = helper.toExecution(schedule, '0.0.1234');

      expect(execution.scheduleId).toBe('0.0.200');
      expect(execution.contractId).toBe('0.0.1234');
      expect(execution.executionCount).toBe(0);
    });

    it('should set executionCount to 1 for executed schedules', () => {
      const schedule = createMockSchedule({ executed_timestamp: '12345' });
      const execution = helper.toExecution(schedule, '0.0.1234');

      expect(execution.executionCount).toBe(1);
      expect(execution.status).toBe('completed');
    });
  });

  describe('getCronSummary', () => {
    it('should return a complete cron summary', async () => {
      const futureTime = new Date(Date.now() + 60_000).toISOString();
      const schedules = [
        createMockSchedule({
          schedule_id: '0.0.1',
          executed_timestamp: '123',
          expiration_time: futureTime,
        }),
        createMockSchedule({
          schedule_id: '0.0.2',
          expiration_time: futureTime,
        }),
        createMockSchedule({
          schedule_id: '0.0.3',
          expiration_time: futureTime,
        }),
      ];

      mockFetch.mockResolvedValueOnce(
        mockResponse({ schedules, links: { next: null } })
      );

      const helper = new HieroScheduleHelper({ network: 'testnet' });
      const summary = await helper.getCronSummary('0.0.1234');

      expect(summary.contractId).toBe('0.0.1234');
      expect(summary.totalScheduled).toBe(3);
      expect(summary.totalExecuted).toBe(1);
      expect(summary.totalPending).toBe(2);
      expect(summary.nextExecution).not.toBeNull();
    });

    it('should handle empty schedule list', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ schedules: [], links: { next: null } })
      );

      const helper = new HieroScheduleHelper({ network: 'testnet' });
      const summary = await helper.getCronSummary('0.0.9999');

      expect(summary.totalScheduled).toBe(0);
      expect(summary.totalExecuted).toBe(0);
      expect(summary.totalPending).toBe(0);
      expect(summary.nextExecution).toBeNull();
    });
  });

  describe('isActive', () => {
    it('should return true when pending schedules exist', async () => {
      const futureTime = new Date(Date.now() + 60_000).toISOString();
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          schedules: [createMockSchedule({ expiration_time: futureTime })],
          links: { next: null },
        })
      );

      const helper = new HieroScheduleHelper({ network: 'testnet' });
      expect(await helper.isActive('0.0.1234')).toBe(true);
    });

    it('should return false when no pending schedules', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ schedules: [], links: { next: null } })
      );

      const helper = new HieroScheduleHelper({ network: 'testnet' });
      expect(await helper.isActive('0.0.1234')).toBe(false);
    });
  });
});
