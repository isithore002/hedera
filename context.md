# Context & Hedera Resources: Hiero Cron Kit

## Hackathon Context
- **Event:** Hedera Hello Future Apex Hackathon 2026
- **Deadline:** March 23, 2026, 11:59 PM ET
- **Target Bounty:** Hiero ($8,000)
- **Bounty Requirement:** Build a "production-minded," open-source utility kit with clean API, CI/CD, and strict contribution hygiene (DCO/GPG) that can be realistically adopted by the ecosystem.

## The Problem
Smart contracts on standard EVM chains (like Ethereum) are reactive. They require external, off-chain, centralized bot networks (like Gelato or OpenZeppelin Defender) to "poke" them to execute scheduled tasks (like daily DeFi vault rebalancing, or airdrops). This adds gas costs, centralization risk, and structural complexity.

## The Solution & Innovation (HIP-1215)
Hedera is unique because of **HIP-1215**. It allows smart contracts to natively call the Hedera Schedule Service precompile (`0x16b`). A contract can literally schedule its own next execution.
**However**, the developer experience (DX) is difficult. Developers must implement exponential backoff logic and handle precompile ABI encoding.

`Hiero-Cron-Kit` solves this by offering an abstract Solidity contract `HieroCron.sol`. Developers simply inherit it, write their logic in `_executeTask()`, and the contract autonomously loops forever via native Hedera consensus.

## Judging Criteria Alignment
* **Innovation (10%):** Does not exist cross-chain. Leverages a Hedera-exclusive EVM capability.
* **Execution (20%):** Production-ready MVP. Has a CI pipeline, tests, and strict open-source contributing standards.
* **Success (20%):** HIGH IMPACT. Every contract deployed using this toolkit will generate continuous, recurring TPS on the Hedera network indefinitely without human intervention.
* **Integration (15%):** Deep native integration utilizing the `0x16b` system contract.

## Official Hedera Resources Used
1. **HIP-1215 (Smart Contract Schedule Service):** Enables contracts to authorize scheduled transactions.
2. **Hedera System Contracts (`@hiero/system-contracts`):** Used to interface with precompiles.
3. **Hedera Mirror Node REST API:** Utilized in the TypeScript SDK (`src/tracker.ts`) to query `/api/v1/schedules` and track future automated executions.

Your Immediate Next Steps:
Open your terminal.
Create the folders.
Paste the code.
Run npm install, then npm run build, then npm run test.
Run your Git commands (git commit -S -s -m "init").
Push to GitHub and record the video.
