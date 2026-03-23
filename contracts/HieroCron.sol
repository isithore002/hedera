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
