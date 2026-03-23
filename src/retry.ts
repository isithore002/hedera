/**
 * @module retry
 * @description Resilient retry utilities with exponential backoff and jitter.
 * Used internally by the Mirror Node client, but also exported for consumers.
 */

import type { RetryOptions, RetryResult } from './types';

/** Default retry options */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
  jitter: 0.1,
  isRetryable: defaultIsRetryable,
};

/**
 * Default retryable error check.
 * Retries on network errors, 429 (rate limit), and 5xx server errors.
 */
export function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    // Network / fetch errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
  }
  // HTTP status-based errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 429 || (status >= 500 && status < 600);
  }
  return false;
}

/**
 * Calculates backoff delay with exponential increase and optional jitter.
 * @param attempt Current attempt number (0-indexed)
 * @param options Retry options
 * @returns Delay in milliseconds
 */
export function calculateBackoff(attempt: number, options: Partial<RetryOptions> = {}): number {
  const { baseDelay = 1000, maxDelay = 30_000, jitter = 0.1 } = options;

  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const clampedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: random +/- jitter%
  const jitterAmount = clampedDelay * jitter * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(clampedDelay + jitterAmount));
}

/**
 * Pause execution for the specified duration.
 * @param ms Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an async function with automatic retry and exponential backoff.
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('https://testnet.mirrornode.hedera.com/api/v1/schedules'),
 *   { maxRetries: 5, baseDelay: 500 }
 * );
 * console.log(`Succeeded after ${result.attempts} attempts`);
 * ```
 *
 * @param fn The async function to execute
 * @param options Retry configuration
 * @returns Result with data, attempt count, and total delay
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let totalDelay = 0;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const data = await fn();
      return { data, attempts: attempt + 1, totalDelay };
    } catch (error) {
      lastError = error;

      // Don't retry if not retryable or last attempt
      if (attempt === opts.maxRetries || (opts.isRetryable && !opts.isRetryable(error))) {
        break;
      }

      const delay = calculateBackoff(attempt, opts);
      totalDelay += delay;
      await sleep(delay);
    }
  }

  throw lastError;
}
