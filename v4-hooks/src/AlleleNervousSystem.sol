// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PoolId} from "v4-core/src/types/PoolId.sol";

contract AlleleNervousSystem {
    struct Sentiment {
        uint256 pain;
        uint256 rest;
        uint256 timestamp;
        address oracle;
    }

    mapping(PoolId => Sentiment) public sentiments;
    mapping(address => bool) public authorizedOracles;
    address public owner;

    uint256 public constant DECAY_RATE = 100;
    uint256 public constant MAX_SENTIMENT = 10000;

    event SentimentUpdated(PoolId indexed poolId, uint256 pain, uint256 rest, address oracle);
    event OracleAuthorized(address oracle);
    event OracleRevoked(address oracle);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "Only oracle");
        _;
    }

    function authorizeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = true;
        emit OracleAuthorized(oracle);
    }

    function revokeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = false;
        emit OracleRevoked(oracle);
    }

    function submitInference(PoolId poolId, uint256 pain, uint256 rest) external onlyOracle {
        require(pain <= MAX_SENTIMENT && rest <= MAX_SENTIMENT, "Invalid range");
        sentiments[poolId] = Sentiment({
            pain: pain,
            rest: rest,
            timestamp: block.timestamp,
            oracle: msg.sender
        });
        emit SentimentUpdated(poolId, pain, rest, msg.sender);
    }

    function getSentiment(PoolId poolId) external view returns (uint256 pain, uint256 rest) {
        Sentiment memory s = sentiments[poolId];
        if (s.timestamp == 0) return (0, 5000);

        uint256 elapsed = block.timestamp - s.timestamp;
        uint256 decay = elapsed * DECAY_RATE;

        if (s.pain > s.rest) {
            pain = decay >= s.pain ? 0 : s.pain - decay;
            rest = (s.rest + decay / 2) > MAX_SENTIMENT ? MAX_SENTIMENT : s.rest + decay / 2;
        } else {
            rest = decay >= s.rest ? 0 : s.rest - decay;
            pain = (s.pain + decay / 2) > MAX_SENTIMENT ? MAX_SENTIMENT : s.pain + decay / 2;
        }
    }

    function isStale(PoolId poolId) external view returns (bool) {
        return block.timestamp - sentiments[poolId].timestamp > 600;
    }
}