import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HieroMirrorClient } from '../src/mirror-client';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
  };
}

describe('HieroMirrorClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    it('should default to testnet', () => {
      const client = new HieroMirrorClient();
      expect(client).toBeInstanceOf(HieroMirrorClient);
    });

    it('should accept mainnet config', () => {
      const client = new HieroMirrorClient({ network: 'mainnet' });
      expect(client).toBeInstanceOf(HieroMirrorClient);
    });

    it('should accept custom mirror node URL', () => {
      const client = new HieroMirrorClient({ mirrorNodeUrl: 'https://custom.mirror.node' });
      expect(client).toBeInstanceOf(HieroMirrorClient);
    });
  });

  describe('get', () => {
    it('should make a GET request and return parsed JSON', async () => {
      const mockData = { foo: 'bar' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockData));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const result = await client.get('/api/v1/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on non-OK responses', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, false, 404));

      const client = new HieroMirrorClient({ network: 'testnet', maxRetries: 0 });
      await expect(client.get('/api/v1/test')).rejects.toThrow('Mirror Node 404');
    });

    it('should use correct base URL for testnet', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      const client = new HieroMirrorClient({ network: 'testnet' });
      await client.get('/api/v1/test');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://testnet.mirrornode.hedera.com/api/v1/test');
    });

    it('should use correct base URL for mainnet', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      const client = new HieroMirrorClient({ network: 'mainnet' });
      await client.get('/api/v1/test');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://mainnet.mirrornode.hedera.com/api/v1/test');
    });
  });

  describe('getSchedules', () => {
    it('should fetch schedules with account filter', async () => {
      const mockData = { schedules: [{ schedule_id: '0.0.100' }], links: { next: null } };
      mockFetch.mockResolvedValueOnce(mockResponse(mockData));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const result = await client.getSchedules('0.0.1234');

      expect(result.schedules).toHaveLength(1);
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('account.id=0.0.1234');
    });

    it('should fetch schedules without account filter', async () => {
      const mockData = { schedules: [], links: { next: null } };
      mockFetch.mockResolvedValueOnce(mockResponse(mockData));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const result = await client.getSchedules();

      expect(result.schedules).toHaveLength(0);
    });
  });

  describe('getSchedule', () => {
    it('should fetch a single schedule by ID', async () => {
      const mockSchedule = { schedule_id: '0.0.100', deleted: false };
      mockFetch.mockResolvedValueOnce(mockResponse(mockSchedule));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const result = await client.getSchedule('0.0.100');

      expect(result.schedule_id).toBe('0.0.100');
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions with account filter', async () => {
      const mockData = { transactions: [{ transaction_id: 'tx1' }], links: { next: null } };
      mockFetch.mockResolvedValueOnce(mockResponse(mockData));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const result = await client.getTransactions('0.0.1234');

      expect(result.transactions).toHaveLength(1);
    });

    it('should support transaction type filter', async () => {
      const mockData = { transactions: [], links: { next: null } };
      mockFetch.mockResolvedValueOnce(mockResponse(mockData));

      const client = new HieroMirrorClient({ network: 'testnet' });
      await client.getTransactions('0.0.1234', 25, 'SCHEDULECREATE');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('transactiontype=SCHEDULECREATE');
    });
  });

  describe('getAccount', () => {
    it('should fetch account details', async () => {
      const mockAccount = {
        account: '0.0.1234',
        balance: { balance: 1_000_000_000, timestamp: '1234', tokens: [] },
      };
      mockFetch.mockResolvedValueOnce(mockResponse(mockAccount));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const result = await client.getAccount('0.0.1234');

      expect(result.account).toBe('0.0.1234');
    });
  });

  describe('getBalance', () => {
    it('should return balance in tinybars', async () => {
      const mockAccount = {
        account: '0.0.1234',
        balance: { balance: 5_000_000_000, timestamp: '1234', tokens: [] },
      };
      mockFetch.mockResolvedValueOnce(mockResponse(mockAccount));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const balance = await client.getBalance('0.0.1234');

      expect(balance).toBe(5_000_000_000);
    });
  });

  describe('getContract', () => {
    it('should fetch contract info', async () => {
      const mockContract = { contract_id: '0.0.5678', deleted: false };
      mockFetch.mockResolvedValueOnce(mockResponse(mockContract));

      const client = new HieroMirrorClient({ network: 'testnet' });
      const result = await client.getContract('0.0.5678');

      expect(result.contract_id).toBe('0.0.5678');
    });
  });

  describe('pagination', () => {
    it('should paginate through all schedules', async () => {
      // Page 1
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          schedules: [{ schedule_id: '0.0.1' }, { schedule_id: '0.0.2' }],
          links: { next: 'https://testnet.mirrornode.hedera.com/api/v1/schedules?page=2' },
        })
      );
      // Page 2
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          schedules: [{ schedule_id: '0.0.3' }],
          links: { next: null },
        })
      );

      const client = new HieroMirrorClient({ network: 'testnet' });
      const allSchedules = [];
      for await (const schedule of client.paginateSchedules()) {
        allSchedules.push(schedule);
      }

      expect(allSchedules).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should paginate through transactions', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          transactions: [{ transaction_id: 'tx1' }],
          links: { next: null },
        })
      );

      const client = new HieroMirrorClient({ network: 'testnet' });
      const allTxs = [];
      for await (const tx of client.paginateTransactions()) {
        allTxs.push(tx);
      }

      expect(allTxs).toHaveLength(1);
    });
  });
});
