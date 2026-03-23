// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../HieroCron.sol";

/**
 * @title DailyVaultRebalancer
 * @dev Example contract showing how to use HieroCron for automated DeFi vault rebalancing.
 * Inherits HieroCron and implements _executeTask() with custom business logic.
 *
 * Usage:
 * 1. Deploy with desired interval (e.g., 86400 for daily) and max executions (0 for infinite).
 * 2. Call startCron() to begin the self-scheduling loop.
 * 3. The contract will autonomously rebalance at each interval via HIP-1215.
 */
contract DailyVaultRebalancer is HieroCron {
    uint256 public lastRebalanceTimestamp;
    uint256 public targetAllocationBps; // Basis points (e.g., 5000 = 50%)

    event Rebalanced(uint256 timestamp, uint256 targetBps);

    constructor(
        uint256 _intervalSeconds,
        uint256 _maxExecutions,
        uint256 _targetAllocationBps
    ) HieroCron(_intervalSeconds, _maxExecutions) {
        targetAllocationBps = _targetAllocationBps;
    }

    /**
     * @dev Core business logic: rebalance the vault.
     * In production, this would interact with DEX contracts, move tokens, etc.
     */
    function _executeTask() internal override {
        lastRebalanceTimestamp = block.timestamp;
        // In a real implementation:
        // 1. Read current token balances
        // 2. Calculate deviation from target allocation
        // 3. Swap tokens via DEX to rebalance
        emit Rebalanced(block.timestamp, targetAllocationBps);
    }

    /**
     * @dev Update the target allocation (governance function).
     */
    function setTargetAllocation(uint256 _newTargetBps) external {
        require(_newTargetBps <= 10000, "Invalid basis points");
        targetAllocationBps = _newTargetBps;
    }
}
