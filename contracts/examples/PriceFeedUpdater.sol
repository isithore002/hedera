// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../HieroCron.sol";

interface AggregatorV3Interface {
  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}

/**
 * @title PriceFeedUpdater
 * @dev Autonomous oracle price feed contract using HieroCron.
 * Periodically updates a stored price from an on-chain source.
 *
 * Usage:
 * 1. Deploy with interval (e.g., 60 = every minute) and a price source.
 * 2. Call startCron() — prices update autonomously.
 * 3. Other contracts read the latest price via getLatestPrice().
 */
contract PriceFeedUpdater is HieroCron {
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 roundId;
    }

    PriceData public latestPrice;
    PriceData[] public priceHistory;
    
    // Chainlink Data Feed Address (e.g. BTC/USD)
    address public chainlinkAggregator;
    
    uint256 public roundCount;

    // Price deviation threshold in basis points (e.g., 100 = 1%)
    uint256 public deviationThresholdBps;

    event PriceUpdated(uint256 indexed roundId, uint256 price, uint256 timestamp);
    event SignificantDeviation(uint256 indexed roundId, uint256 oldPrice, uint256 newPrice, uint256 deviationBps);

    constructor(
        address _chainlinkAggregator,
        uint256 _intervalSeconds,
        uint256 _deviationThresholdBps
    ) HieroCron(_intervalSeconds, 0) {
        chainlinkAggregator = _chainlinkAggregator;
        deviationThresholdBps = _deviationThresholdBps;
    }

    function _executeTask() internal override {
        roundCount++;

        // Call the Chainlink Price Feed (AggregatorV3Interface)
        (, int256 price, , , ) = AggregatorV3Interface(chainlinkAggregator).latestRoundData();
        
        require(price > 0, "Invalid price returned");
        uint256 newPrice = uint256(price);

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

    function _calculateDeviationBps(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        if (oldPrice == 0) return 10000;
        uint256 diff = oldPrice > newPrice ? oldPrice - newPrice : newPrice - oldPrice;
        return (diff * 10000) / oldPrice;
    }

    function getLatestPrice() external view returns (uint256 price, uint256 timestamp, uint256 roundId) {
        return (latestPrice.price, latestPrice.timestamp, latestPrice.roundId);
    }

    function getHistoryLength() external view returns (uint256) {
        return priceHistory.length;
    }

    function getPriceAt(uint256 index) external view returns (uint256 price, uint256 timestamp) {
        require(index < priceHistory.length, "Index out of bounds");
        PriceData storage data = priceHistory[index];
        return (data.price, data.timestamp);
    }
}
