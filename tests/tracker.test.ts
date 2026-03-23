import { describe, it, expect } from 'vitest';
import { HieroCronTracker } from '../src/tracker';

describe('HieroCronTracker Integration', () => {
  it('should initialize with testnet correctly', () => {
    const tracker = new HieroCronTracker('testnet');
    expect(tracker).toBeInstanceOf(HieroCronTracker);
  });

  it('should initialize with mainnet correctly', () => {
    const tracker = new HieroCronTracker('mainnet');
    expect(tracker).toBeInstanceOf(HieroCronTracker);
  });
});
