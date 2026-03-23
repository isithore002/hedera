import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HieroCronTracker } from '../src/tracker';

describe('HieroCronTracker', () => {
  describe('constructor', () => {
    it('should initialize with testnet by default', () => {
      const tracker = new HieroCronTracker();
      expect(tracker).toBeInstanceOf(HieroCronTracker);
      expect(tracker.network).toBe('testnet');
    });

    it('should initialize with testnet correctly', () => {
      const tracker = new HieroCronTracker('testnet');
      expect(tracker).toBeInstanceOf(HieroCronTracker);
      expect(tracker.network).toBe('testnet');
    });

    it('should initialize with mainnet correctly', () => {
      const tracker = new HieroCronTracker('mainnet');
      expect(tracker).toBeInstanceOf(HieroCronTracker);
      expect(tracker.network).toBe('mainnet');
    });

    it('should initialize with previewnet correctly', () => {
      const tracker = new HieroCronTracker('previewnet');
      expect(tracker).toBeInstanceOf(HieroCronTracker);
      expect(tracker.network).toBe('previewnet');
    });
  });

  describe('getUpcomingExecutions', () => {
    it('should be a callable method', () => {
      const tracker = new HieroCronTracker('testnet');
      expect(typeof tracker.getUpcomingExecutions).toBe('function');
    });
  });

  describe('getCronSummary', () => {
    it('should be a callable method', () => {
      const tracker = new HieroCronTracker('testnet');
      expect(typeof tracker.getCronSummary).toBe('function');
    });
  });

  describe('isCronActive', () => {
    it('should be a callable method', () => {
      const tracker = new HieroCronTracker('testnet');
      expect(typeof tracker.isCronActive).toBe('function');
    });
  });

  describe('getBalance', () => {
    it('should be a callable method', () => {
      const tracker = new HieroCronTracker('testnet');
      expect(typeof tracker.getBalance).toBe('function');
    });
  });
});
