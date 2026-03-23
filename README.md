# 🕐 Hiero-Cron-Kit

> **Giving Smart Contracts a Heartbeat** — Production-ready toolkit for HIP-1215 native on-chain scheduling on Hedera. Built for the Hello Future Hackathon (DeFi & Tokenization / Open Track).

[![CI](https://github.com/isithore002/hedera/actions/workflows/ci.yml/badge.svg)](https://github.com/isithore002/hedera/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)

---

## 🌟 What's New
- **Live Monitoring Dashboard**: Beautiful UI to monitor your contract's cron executions via native Mirror Node queries.
- **CLI Tool**: Zero-config terminal monitoring (`npx hiero-cron summary 0.0.1234`).
- **DeFi & Tokenization Examples**: Ready-to-use smart contracts for `AutoPayroll`, `ScheduledAirdrop`, and `PriceFeedUpdater`.

## The Problem

Smart contracts on standard EVM chains are **reactive** — they sit idle until poked by external, centralized bot networks (Gelato, OpenZeppelin Defender, Chainlink Keepers). This introduces:

- 💸 **Extra gas costs** for keeper infrastructure
- 🎯 **Centralization risk** — your "decentralized" contract depends on a centralized trigger
- 🔧 **Structural complexity** — off-chain monitoring, uptime guarantees, key management

## The Solution

**Hedera is unique.** [HIP-1215](https://hips.hedera.com/hip/hip-1215) enables smart contracts to natively call the **Hedera Schedule Service precompile** (`0x16b`). A contract can literally **schedule its own next execution** — no external bots, no centralization, no extra gas for keepers.

**`hiero-cron-kit` solves DX friction** with:
1. `HieroCron.sol` — Abstract contract that handles all parsing and scheduling.
2. **TypeScript SDK** — Typed clients, auto-pagination, and retry utils.
3. **CLI & Dashboard** — Monitor executions instantly.

---

## 📦 Installation

```bash
npm install hiero-cron-kit
```

## 🚀 Quickstarts

### 1. Smart Contracts (DeFi & Tokenization)
Inherit `HieroCron.sol` and override `_executeTask()`. Great for tokenomics, payroll, or Oracle price feeds!

**Example: Auto-Payroll (Weekly Salary Distribution)**
```solidity
import "hiero-cron-kit/contracts/HieroCron.sol";

contract AutoPayroll is HieroCron {
    constructor() HieroCron(604800, 0) {} // Weekly, Infinite Runs

    function _executeTask() internal override {
        // Distribute weekly HBAR or Tokens to employees automatically!
    }
}
```

Check out the `contracts/examples` directory for:
- `DailyVaultRebalancer.sol`
- `AutoPayroll.sol`
- `ScheduledAirdrop.sol`
- `PriceFeedUpdater.sol`

### 2. Monitor using the Dashboard
Run a local tracker UI with native Mirror Node integration:
```bash
npx http-server ./dashboard -c-1
```

### 3. Monitor using the CLI
Use the built-in CLI to check up on your autonomous contracts:
```bash
npx hiero-cron summary 0.0.1234 --network testnet

# Output:
# 📊 HieroCron Summary [0.0.1234]
#    ├─ Total Scheduled : 12
#    ├─ Total Executed  : 9
#    ├─ Total Pending   : 3
#    └─ Next Execution  : 11/12/2026, 4:00 PM
```

### 4. SDK Usage in Web/Node Apps
```typescript
import { HieroMirrorClient, HieroCronTracker } from 'hiero-cron-kit';

// Powerful Mirror Node Client with retries built-in
const client = new HieroMirrorClient({ network: 'mainnet' });
for await (const schedule of client.paginateSchedules('0.0.1234')) {
  console.log(schedule);
}

// Or use the high-level Tracker
const tracker = new HieroCronTracker('testnet');
const summary = await tracker.getCronSummary('0.0.1234');
console.log(`Pending schedules: ${summary.totalPending}`);
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

### SDK Modules exported
- `HieroMirrorClient`: Typed Mirror Node REST Client with backoff
- `HieroScheduleHelper`: Status checking, polling, summarization
- `HieroCronTracker`: Friendly wrapper for DApps
- All Type definitions (`Schedule`, `Account`, etc.)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     hiero-cron-kit                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Solidity Layer                    TypeScript SDK            │
│  ┌─────────────────┐              ┌────────────────────┐     │
│  │  HieroCron.sol  │              │ HieroMirrorClient  │     │
│  │  (Abstract Base)│              │ (Typed REST Client)│     │
│  └────────┬────────┘              └────────┬───────────┘     │
│           │                                │                 │
│           ▼                       ┌────────┴───────────┐     │
│  ┌─────────────────┐              │ Hiero Cron CLI /   │     │
│  │ Hedera Schedule │ <────────────┤ UI Dashboard       │     │
│  │ Service (0x16b) │              └────────────────────┘     │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Build (ESM + CJS + CLI + Types)
npm run build

# Run robust test suite (57 tests)
npm run test
```

## 📄 License & Contribution
[Apache-2.0](LICENSE). Refer to `CONTRIBUTING.md` for our strict DCO and GPG commit signatures policy.
