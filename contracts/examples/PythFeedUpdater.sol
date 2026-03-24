// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../HieroCron.sol";

interface IPyth {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }
    function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (Price memory price);
}

/**
 * @title PythFeedUpdater
 * @dev Autonomous oracle price feed contract using HieroCron and Pyth Network.
 * Periodically reads a price from the Pyth on-chain contract.
 *
 * Usage:
 * 1. Deploy with Pyth address, feed ID, interval, and deviation.
 * 2. Call startCron() — prices update autonomously!
 */
contract PythFeedUpdater is HieroCron {
    struct PriceData {
        int64 price;
        uint256 timestamp;
        uint256 roundId;
    }

    PriceData public latestPrice;
    PriceData[] public priceHistory;
    
    // Pyth Contract Address on Hedera
    address public pythContract;
    // The specific Pyth Price Feed ID (e.g. BTC/USD)
    bytes32 public priceFeedId;
    
    uint256 public roundCount;

    // Price deviation threshold in basis points (e.g., 100 = 1%)
    uint256 public deviationThresholdBps;

    event PriceUpdated(uint256 indexed roundId, int64 price, uint256 timestamp);
    event SignificantDeviation(uint256 indexed roundId, int64 oldPrice, int64 newPrice, uint256 deviationBps);

    constructor(
        address _pythContract,
        bytes32 _priceFeedId,
        uint256 _intervalSeconds,
        uint256 _deviationThresholdBps
    ) HieroCron(_intervalSeconds, 0) {
        pythContract = _pythContract;
        priceFeedId = _priceFeedId;
        deviationThresholdBps = _deviationThresholdBps;
    }

    function _executeTask() internal override {
        roundCount++;

        // Call the Pyth Price Feed
        // We accept prices up to 60 seconds old
        IPyth.Price memory ptPrice = IPyth(pythContract).getPriceNoOlderThan(priceFeedId, 60);
        
        require(ptPrice.price > 0, "Invalid or stale price returned from Pyth");
        int64 newPrice = ptPrice.price;

        // Check for significant deviation
        if (latestPrice.price > 0) {
            uint256 deviation = _calculateDeviationBps(latestPrice.price, newPrice);
            if (deviation >= deviationThresholdBps) {
                emit SignificantDeviation(roundCount, latestPrice.price, newPrice, deviation);
            }
        }

        latestPrice = PriceData(newPrice, block.timestamp, roundCount);
        priceHistory.push(latestPrice);

        emit PriceUpdated(roundCount, newPrice, block.timestamp);
    }

    function _calculateDeviationBps(int64 oldPrice, int64 newPrice) internal pure returns (uint256) {
        if (oldPrice == 0) return 10000;
        
        int64 diff = oldPrice > newPrice ? oldPrice - newPrice : newPrice - oldPrice;
        return (uint256(uint64(diff)) * 10000) / uint256(uint64(oldPrice));
    }

    function getLatestPrice() external view returns (int64 price, uint256 timestamp, uint256 roundId) {
        return (latestPrice.price, latestPrice.timestamp, latestPrice.roundId);
    }

    function getHistoryLength() external view returns (uint256) {
        return priceHistory.length;
    }

    function getPriceAt(uint256 index) external view returns (int64 price, uint256 timestamp) {
        require(index < priceHistory.length, "Index out of bounds");
        PriceData storage data = priceHistory[index];
        return (data.price, data.timestamp);
    }
}
