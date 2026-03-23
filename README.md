# Hiero-Cron-Kit

Giving smart contracts a heartbeat.

`hiero-cron-kit` is a production-minded toolkit that abstracts HIP-1215 native on-chain scheduling on Hedera. It includes:

- `contracts/HieroCron.sol`: Abstract Solidity contract that wraps native self-scheduling behavior.
- `src/tracker.ts`: TypeScript helper to query Mirror Node schedules for a contract.
- CI, tests, and contribution hygiene rules (DCO + GPG).

## Why It Matters

Most EVM contracts are reactive and rely on centralized off-chain automation bots for recurring execution. Hedera's HIP-1215 enables native contract scheduling via the Schedule Service precompile (`0x16b`), but the DX is non-trivial.

This kit offers a clean abstraction so developers can ship autonomous recurring smart-contract workflows with less friction.

## Quickstart

```bash
npm install
npm run build
npm run test
```

## Usage

### Solidity

Inherit `HieroCron` and implement `_executeTask()` with your business logic.

### TypeScript Tracker

```ts
import { HieroCronTracker } from 'hiero-cron-kit';

const tracker = new HieroCronTracker('testnet');
const schedules = await tracker.getUpcomingExecutions('0.0.1234');
console.log(schedules);
```

## Project Scripts

- `npm run build` builds ESM/CJS bundles and type declarations via `tsup`.
- `npm run test` runs unit tests via `vitest`.

## License

Apache-2.0
