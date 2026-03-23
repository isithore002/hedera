// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../HieroCron.sol";

/**
 * @title ScheduledAirdrop
 * @dev Automated token airdrop contract using HieroCron.
 * Distributes tokens to registered recipients at fixed intervals.
 *
 * Usage:
 * 1. Deploy with interval and max rounds.
 * 2. Register recipients with registerRecipient().
 * 3. Approve this contract to spend tokens.
 * 4. Call startCron() — airdrops execute autonomously.
 */
contract ScheduledAirdrop is HieroCron {
    address public tokenAddress;
    uint256 public amountPerRecipient;
    address[] public recipients;
    mapping(address => bool) public isRegistered;
    uint256 public airdropRound;

    event AirdropExecuted(uint256 indexed round, uint256 recipientCount, uint256 totalAmount);
    event RecipientRegistered(address indexed recipient);
    event RecipientRemoved(address indexed recipient);

    constructor(
        address _tokenAddress,
        uint256 _amountPerRecipient,
        uint256 _intervalSeconds,
        uint256 _maxRounds
    ) HieroCron(_intervalSeconds, _maxRounds) {
        tokenAddress = _tokenAddress;
        amountPerRecipient = _amountPerRecipient;
    }

    function registerRecipient(address _recipient) external {
        require(!isRegistered[_recipient], "Already registered");
        recipients.push(_recipient);
        isRegistered[_recipient] = true;
        emit RecipientRegistered(_recipient);
    }

    function _executeTask() internal override {
        airdropRound++;
        uint256 distributed = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            if (isRegistered[recipients[i]]) {
                // In production: call token transfer via HTS precompile
                // IHederaTokenService(0x167).transferToken(tokenAddress, address(this), recipients[i], int64(int256(amountPerRecipient)));
                distributed++;
            }
        }

        emit AirdropExecuted(airdropRound, distributed, distributed * amountPerRecipient);
    }

    function getRecipientCount() external view returns (uint256) {
        return recipients.length;
    }
}
