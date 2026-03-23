# 🕐 Hiero-Cron-Kit

> **Giving Smart Contracts a Heartbeat** — Production-ready toolkit for HIP-1215 native on-chain scheduling on Hedera.

[![CI](https://github.com/isithore002/hedera/actions/workflows/ci.yml/badge.svg)](https://github.com/isithore002/hedera/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)

---

## The Problem

Smart contracts on standard EVM chains are **reactive** — they sit idle until poked by external, centralized bot networks (Gelato, OpenZeppelin Defender, Chainlink Keepers). This introduces:

- 💸 **Extra gas costs** for keeper infrastructure
- 🎯 **Centralization risk** — your "decentralized" contract depends on a centralized trigger
- 🔧 **Structural complexity** — off-chain monitoring, uptime guarantees, key management

## The Solution

**Hedera is unique.** [HIP-1215](https://hips.hedera.com/hip/hip-1215) enables smart contracts to natively call the **Hedera Schedule Service precompile** (`0x16b`). A contract can literally **schedule its own next execution** — no external bots, no centralization, no extra gas for keepers.

**However**, the raw developer experience is difficult: manual ABI encoding, precompile interaction patterns, and no tooling for monitoring scheduled executions.

**`hiero-cron-kit` solves this** with:

| Component | Description |
|---|---|
| `HieroCron.sol` | Abstract Solidity contract — inherit it, implement `_executeTask()`, done. |
| `HieroMirrorClient` | Typed TypeScript client for the Hedera Mirror Node REST API |
| `HieroScheduleHelper` | High-level schedule management: status tracking, cron summaries |
| `HieroCronTracker` | Simple tracker for monitoring cron contract executions |
| Retry Utilities | Exponential backoff with jitter for resilient API calls |

---

## 📦 Installation

```bash
npm install hiero-cron-kit
```

## 🚀 Quickstart

### Solidity: Create an Autonomous Contract

Inherit `HieroCron` and implement your business logic in `_executeTask()`:

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./HieroCron.sol";

contract DailyVaultRebalancer is HieroCron {
    // Run every 24 hours, infinite executions
    constructor() HieroCron(86400, 0) {}

    function _executeTask() internal override {
        // Your business logic here:
        // - Rebalance DeFi vault allocations
        // - Distribute payroll
        // - Process airdrops
        // - Trigger oracle updates
    }
}
```

Then call `startCron()` once — the contract self-schedules forever via native Hedera consensus.

### TypeScript: Monitor Cron Contracts

```typescript
import { HieroCronTracker } from 'hiero-cron-kit';

const tracker = new HieroCronTracker('testnet');

// Get a full cron summary
const summary = await tracker.getCronSummary('0.0.1234');
console.log(`Total scheduled: ${summary.totalScheduled}`);
console.log(`Executed: ${summary.totalExecuted}`);
console.log(`Pending: ${summary.totalPending}`);
console.log(`Next execution: ${summary.nextExecution}`);
```

### TypeScript: Full Mirror Node Client

```typescript
import { HieroMirrorClient } from 'hiero-cron-kit';

const client = new HieroMirrorClient({ network: 'testnet' });

// Get account balance
const balance = await client.getBalance('0.0.1234');
console.log(`Balance: ${balance} tinybars`);

// Query scheduled transactions with automatic pagination
for await (const schedule of client.paginateSchedules('0.0.1234')) {
  console.log(`Schedule ${schedule.schedule_id}: expires ${schedule.expiration_time}`);
}

// Get transactions filtered by type
const txResponse = await client.getTransactions('0.0.1234', 25, 'SCHEDULECREATE');
console.log(`Found ${txResponse.transactions.length} schedule creation transactions`);
```

### TypeScript: Schedule Management

```typescript
import { HieroScheduleHelper } from 'hiero-cron-kit';

const helper = new HieroScheduleHelper({ network: 'testnet' });

// Check if a contract has active cron schedules
const isActive = await helper.isActive('0.0.1234');

// Get only pending schedules
const pending = await helper.getPendingSchedules('0.0.1234');

// Wait for a specific schedule to execute (useful for testing)
const executed = await helper.waitForExecution('0.0.5678', 5000, 120000);
console.log(`Executed at: ${executed.executed_timestamp}`);
```

### TypeScript: Resilient Retry Utilities

```typescript
import { withRetry, calculateBackoff } from 'hiero-cron-kit';

// Wrap any async operation with automatic retry + exponential backoff
const result = await withRetry(
  () => fetch('https://testnet.mirrornode.hedera.com/api/v1/schedules'),
  { maxRetries: 5, baseDelay: 500, jitter: 0.2 }
);
console.log(`Succeeded after ${result.attempts} attempts`);
```

---

## 📚 API Reference

### `HieroCron.sol` (Abstract Contract)

| Function | Description |
|---|---|
| `_executeTask()` | **Override this** — your recurring business logic |
| `startCron()` | Begin the self-scheduling loop |
| `stopCron()` | Pause the cron (can be restarted) |
| `executeCron()` | Called internally by the schedule service |
| `intervalSeconds` | Time between executions |
| `maxExecutions` | Max runs (0 = infinite) |
| `currentExecutions` | Counter of completed runs |
| `isCronActive` | Whether the cron is currently running |

### `HieroMirrorClient`

| Method | Description |
|---|---|
| `get<T>(path)` | Typed GET with retry |
| `getSchedules(accountId?, limit?)` | List schedules |
| `getSchedule(scheduleId)` | Get single schedule |
| `paginateSchedules(accountId?)` | Async generator for all schedules |
| `getTransactions(accountId?, limit?, type?)` | List transactions |
| `paginateTransactions(accountId?)` | Async generator for all transactions |
| `getAccount(accountId)` | Get account details |
| `getBalance(accountId)` | Get HBAR balance in tinybars |
| `getContract(contractId)` | Get contract info |
| `getContractLogs(contractId)` | Get contract event logs |
| `paginateContractLogs(contractId)` | Async generator for all logs |

### `HieroScheduleHelper`

| Method | Description |
|---|---|
| `getSchedules(contractId)` | Get all schedules (paginated) |
| `getCronSummary(contractId)` | Full cron activity summary |
| `isActive(contractId)` | Check for pending schedules |
| `getPendingSchedules(contractId)` | Only pending schedules |
| `getCompletedSchedules(contractId)` | Only completed schedules |
| `waitForExecution(scheduleId)` | Poll until executed |

### `HieroCronTracker`

| Method | Description |
|---|---|
| `getUpcomingExecutions(contractId)` | Get scheduled executions |
| `getCronSummary(contractId)` | Full cron summary |
| `isCronActive(contractId)` | Check if cron is running |
| `getBalance(accountId)` | Get HBAR balance |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     hiero-cron-kit                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Solidity Layer                    TypeScript SDK             │
│  ┌─────────────────┐              ┌────────────────────┐     │
│  │  HieroCron.sol   │              │ HieroMirrorClient  │     │
│  │  (Abstract Base) │              │ (Typed REST Client) │    │
│  │                  │              └────────┬───────────┘     │
│  │  • startCron()   │                       │                 │
│  │  • stopCron()    │              ┌────────┴───────────┐     │
│  │  • _executeTask()│              │ HieroScheduleHelper│     │
│  │  • _scheduleNext │              │ (Cron Management)  │     │
│  └────────┬─────────┘              └────────┬───────────┘     │
│           │                                 │                 │
│           │                        ┌────────┴───────────┐     │
│           │                        │ HieroCronTracker   │     │
│           │                        │ (Simple Monitoring) │    │
│           ▼                        └────────────────────┘     │
│  ┌─────────────────┐              ┌────────────────────┐     │
│  │ Hedera Schedule  │              │   Retry Utilities   │    │
│  │ Service (0x16b)  │              │ (Backoff + Jitter)  │    │
│  └─────────────────┘              └────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Build (ESM + CJS + type declarations)
npm run build

# Run tests
npm run test
```

### Project Structure

```
hiero-cron-kit/
├── contracts/
│   ├── HieroCron.sol                 # Abstract base contract (HIP-1215)
│   └── examples/
│       └── DailyVaultRebalancer.sol  # Example usage
├── src/
│   ├── index.ts                      # Library exports
│   ├── types.ts                      # Full TypeScript type definitions
│   ├── mirror-client.ts              # Typed Mirror Node REST client
│   ├── schedule-helper.ts            # Schedule management utilities
│   ├── tracker.ts                    # High-level cron tracker
│   └── retry.ts                      # Retry with exponential backoff
├── tests/
│   ├── tracker.test.ts               # Tracker unit tests
│   ├── mirror-client.test.ts         # Mirror client tests (mocked)
│   ├── schedule-helper.test.ts       # Schedule helper tests
│   └── retry.test.ts                 # Retry utility tests
├── .github/workflows/ci.yml          # GitHub Actions CI pipeline
├── CONTRIBUTING.md                   # DCO & GPG commit requirements
└── LICENSE                           # Apache 2.0
```

---

## 🔗 Hedera Resources

- [HIP-1215: Smart Contract Scheduling](https://hips.hedera.com/hip/hip-1215) — The core innovation enabling native contract self-scheduling
- [Hedera Mirror Node REST API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api) — The data source for the TypeScript SDK
- [Hedera Schedule Service](https://docs.hedera.com/hedera/core-concepts/scheduled-transactions) — Native scheduled transaction support
- [Hiero Enterprise Java](https://github.com/hiero-ledger/hiero-enterprise-java) — Reference for production-minded Hiero integration

## 📄 License

[Apache-2.0](LICENSE)
