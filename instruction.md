# Hackathon Execution Plan: Hiero-Cron-Kit

## Phase 1: Setup & Code (Hours 1-2)
1. Open terminal and run: `mkdir hiero-cron-kit && cd hiero-cron-kit`
2. Run: `npm init -y`
3. Install tools: `npm install -D typescript tsup vitest @types/node ethers`
4. Initialize TypeScript: `npx tsc --init`
5. Create folders: `mkdir contracts src tests .github .github/workflows`
6. Copy the contents from `implementation.md` into their respective files.

## Phase 2: Test & Build (Hour 3)
1. Run `npm run build` -> Ensure the `dist/` folder is generated without errors.
2. Run `npm run test` -> Ensure Vitest passes the tests successfully.

## Phase 3: "Hiero Hygiene" Git Commit (Hour 4)
*CRITICAL: You will fail the bounty if you skip DCO sign-offs.*
1. `git init`
2. `git add .`
3. Commit with DCO (-s) and GPG (-S if you have it):
   `git commit -s -S -m "feat: initial release of hiero-cron-kit with HIP-1215 abstract contract"`
4. Push to a **Public** GitHub repository.
5. Check the "Actions" tab on GitHub to ensure your `ci.yml` pipeline passes green.

## Phase 4: Video & Pitch Deck (Hours 5-8)
1. **The Deck (PDF):**
   - *Slide 1:* Intro: "Hiero Cron Kit - Giving Smart Contracts a Heartbeat."
   - *Slide 2:* The Problem: EVM contracts sit dead. Off-chain bots are centralized.
   - *Slide 3:* The Solution: Wrapping Hedera's HIP-1215 (0x16b) into an easy-to-use abstract contract & TS SDK.
   - *Slide 4:* Business Value: Guaranteed recurring TPS for Hedera as developers deploy infinite-looping contracts.
2. **The Video (Max 5 mins):**
   - Open your GitHub repo. Point out `CONTRIBUTING.md` and the passing CI/CD to prove "Hiero Hygiene."
   - Show `HieroCron.sol` and explain how it abstracts exponential backoff logic.
   - Run `npm test` in your terminal to prove it works.
   - Upload to YouTube as "Unlisted".

## Phase 5: Submission (Hour 9 - DO NOT WAIT UNTIL DEADLINE)
1. Go to https://hellofuturehackathon.dev/
2. Select Track: **Main Track (Open Track) + Hiero Bounty**.
3. Fill out the 20-30 minute mandatory questionnaire.
4. Submit your Repo URL, Video URL, and Pitch Deck PDF.
