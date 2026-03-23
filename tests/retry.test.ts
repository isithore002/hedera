import { describe, it, expect } from 'vitest';
import {
  calculateBackoff,
  defaultIsRetryable,
  withRetry,
  sleep,
  DEFAULT_RETRY_OPTIONS,
} from '../src/retry';

describe('Retry Utilities', () => {
  describe('DEFAULT_RETRY_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_OPTIONS.baseDelay).toBe(1000);
      expect(DEFAULT_RETRY_OPTIONS.maxDelay).toBe(30_000);
      expect(DEFAULT_RETRY_OPTIONS.jitter).toBe(0.1);
      expect(typeof DEFAULT_RETRY_OPTIONS.isRetryable).toBe('function');
    });
  });

  describe('calculateBackoff', () => {
    it('should return base delay for first attempt', () => {
      const delay = calculateBackoff(0, { baseDelay: 1000, jitter: 0 });
      expect(delay).toBe(1000);
    });

    it('should double delay for each subsequent attempt', () => {
      const delay1 = calculateBackoff(1, { baseDelay: 1000, jitter: 0 });
      const delay2 = calculateBackoff(2, { baseDelay: 1000, jitter: 0 });
      expect(delay1).toBe(2000);
      expect(delay2).toBe(4000);
    });

    it('should respect maxDelay cap', () => {
      const delay = calculateBackoff(10, { baseDelay: 1000, maxDelay: 5000, jitter: 0 });
      expect(delay).toBe(5000);
    });

    it('should add jitter when configured', () => {
      const delays = new Set<number>();
      for (let i = 0; i < 20; i++) {
        delays.add(calculateBackoff(0, { baseDelay: 1000, jitter: 0.5 }));
      }
      // With 50% jitter, we should see some variation
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should never return negative values', () => {
      for (let i = 0; i < 100; i++) {
        const delay = calculateBackoff(0, { baseDelay: 100, jitter: 1 });
        expect(delay).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('defaultIsRetryable', () => {
    it('should retry on network errors', () => {
      expect(defaultIsRetryable(new Error('network error occurred'))).toBe(true);
      expect(defaultIsRetryable(new Error('fetch failed'))).toBe(true);
    });

    it('should retry on 429 rate limit', () => {
      expect(defaultIsRetryable({ status: 429 })).toBe(true);
    });

    it('should retry on 500 server error', () => {
      expect(defaultIsRetryable({ status: 500 })).toBe(true);
    });

    it('should retry on 502 bad gateway', () => {
      expect(defaultIsRetryable({ status: 502 })).toBe(true);
    });

    it('should retry on 503 service unavailable', () => {
      expect(defaultIsRetryable({ status: 503 })).toBe(true);
    });

    it('should NOT retry on 400 bad request', () => {
      expect(defaultIsRetryable({ status: 400 })).toBe(false);
    });

    it('should NOT retry on 404 not found', () => {
      expect(defaultIsRetryable({ status: 404 })).toBe(false);
    });

    it('should NOT retry on unknown errors', () => {
      expect(defaultIsRetryable(new Error('some random error'))).toBe(false);
      expect(defaultIsRetryable('string error')).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should resolve after the specified duration', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow small timer inaccuracy
    });
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = async () => 'success';
      const result = await withRetry(fn, { maxRetries: 3 });
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(result.totalDelay).toBe(0);
    });

    it('should retry and succeed on second attempt', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts === 1) {
          const err: any = new Error('fail');
          err.status = 500;
          throw err;
        }
        return 'success';
      };

      const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(2);
    });

    it('should throw after exhausting all retries', async () => {
      const fn = async () => {
        const err: any = new Error('always fails');
        err.status = 500;
        throw err;
      };

      await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow('always fails');
    });

    it('should not retry non-retryable errors', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        const err: any = new Error('bad request');
        err.status = 400;
        throw err;
      };

      await expect(withRetry(fn, { maxRetries: 3, baseDelay: 10 })).rejects.toThrow('bad request');
      expect(attempts).toBe(1);
    });

    it('should use custom isRetryable function', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new Error('custom retriable');
      };

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          baseDelay: 10,
          isRetryable: (e) => e instanceof Error && e.message.includes('custom'),
        })
      ).rejects.toThrow('custom retriable');
      expect(attempts).toBe(3); // 1 initial + 2 retries
    });
  });
});
