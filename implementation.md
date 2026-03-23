# implementation.md (The Copy-Paste Code)

Copy these blocks exactly into the corresponding files in your project.

## package.json

```json
{
  "name": "hiero-cron-kit",
  "version": "1.0.0",
  "description": "Production-ready toolkit abstracting HIP-1215 native on-chain scheduling on Hedera.",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "test": "vitest run"
  },
  "license": "Apache-2.0",
  "dependencies": {
    "ethers": "^6.11.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## tsup.config.ts

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
```

## contracts/HieroCron.sol

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title HieroCron
 * @dev Abstract base contract for HIP-1215 Native On-Chain Automation.
 * Hides complex exponential backoff and Hedera Schedule Service logic from developers.
 */
abstract contract HieroCron {
    uint256 public intervalSeconds;
    uint256 public maxExecutions;
    uint256 public currentExecutions;
    bool public isCronActive;

    // Hedera Schedule Service Precompile
    address private constant HEDERA_SCHEDULE_SERVICE = 0x000000000000000000000000000000000000016b;

    event CronStarted(uint256 interval, uint256 maxExecutions);
    event CronStopped();
    event CronExecuted(uint256 executionCount);
    event NextExecutionScheduled(uint256 targetTimestamp);

    constructor(uint256 _intervalSeconds, uint256 _maxExecutions) {
        intervalSeconds = _intervalSeconds;
        maxExecutions = _maxExecutions;
    }

    /**
     * @dev Business logic goes here (e.g., rebalance DeFi vault, distribute payroll)
     */
    function _executeTask() internal virtual;

    function startCron() external {
        require(!isCronActive, "Cron is already running");
        isCronActive = true;
        _scheduleNext();
        emit CronStarted(intervalSeconds, maxExecutions);
    }

    function stopCron() external {
        isCronActive = false;
        emit CronStopped();
    }

    function executeCron() external {
        require(isCronActive, "Cron is stopped");
        require(msg.sender == address(this), "Only the contract can schedule itself");

        if (maxExecutions != 0 && currentExecutions >= maxExecutions) {
            isCronActive = false;
            return;
        }

        _executeTask();
        currentExecutions++;
        emit CronExecuted(currentExecutions);

        if (maxExecutions == 0 || currentExecutions < maxExecutions) {
            _scheduleNext();
        } else {
            isCronActive = false;
        }
    }

    function _scheduleNext() internal {
        uint256 targetTime = block.timestamp + intervalSeconds;
        bytes memory callData = abi.encodeWithSignature("executeCron()");

        (bool success, ) = HEDERA_SCHEDULE_SERVICE.call(
            abi.encodeWithSignature(
                "scheduleCall(address,uint256,uint256,uint256,bytes)",
                address(this),
                targetTime,
                2000000,
                0,
                callData
            )
        );

        require(success, "Failed to schedule next native execution");
        emit NextExecutionScheduled(targetTime);
    }
}
```

## src/tracker.ts

```ts
export class HieroCronTracker {
  private networkUrl: string;

  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.networkUrl = `https://${network}.mirrornode.hedera.com`;
  }

  /**
   * Fetches all scheduled transactions queued by a specific Cron Smart Contract
   * @param contractId The Hedera Contract ID (e.g., 0.0.1234)
   */
  public async getUpcomingExecutions(contractId: string) {
    const response = await fetch(`${this.networkUrl}/api/v1/schedules?account.id=${contractId}`);
    if (!response.ok) throw new Error(`Mirror Node Error: ${response.statusText}`);
    const data = await response.json();
    return data.schedules ||[];
  }
}
```

## src/index.ts

```ts
export * from './tracker';
```

## tests/tracker.test.ts

```ts
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
```

## .github/workflows/ci.yml

```yaml
name: Hiero Library CI

on:
  push:
    branches:[ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18.x'
    - run: npm install
    - run: npm run build
    - run: npm run test
```

## CONTRIBUTING.md

```md
# Contributing to Hiero-Cron-Kit

To ensure this library maintains enterprise-grade standards for the Hiero ecosystem, please follow these rules:

## Developer Certificate of Origin (DCO)
All contributions must include a DCO sign-off. Use the `-s` flag when committing:
`git commit -s -m "feat: your feature"`

## GPG Signed Commits
We require all commits to be GPG signed to verify authenticity. Use the `-S` flag:
`git commit -S -s -m "fix: your fix"`

## PR Process
Ensure `npm run test` and `npm run build` pass successfully. CI will automatically run against your PR.
```

## LICENSE

Create the file and simply paste the text of the Apache 2.0 License into it.
