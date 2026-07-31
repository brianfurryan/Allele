// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PoolId} from "v4-core/src/types/PoolId.sol";
import {HookGene} from "./HookGene.sol";

contract LPPosition {
    struct Position {
        address lp;
        uint256 liquidity;
        int256 pnl;
        bytes32 dna;
        uint256 birthBlock;
        uint256 deathBlock;
        bool active;
        uint256 feesAccumulated;
    }

    mapping(PoolId => mapping(address => Position)) public positions;
    mapping(PoolId => address[]) public lpList;
    mapping(PoolId => mapping(address => uint256)) public lpIndex;

    event PositionBorn(PoolId indexed poolId, address indexed lp, bytes32 dna, uint256 blockNumber);
    event PositionDied(PoolId indexed poolId, address indexed lp, uint256 pnl, uint256 blockNumber);
    event FeesCompounded(PoolId indexed poolId, address indexed lp, uint256 amount);
    event Autopsy(PoolId indexed poolId, address indexed lp, int256 pnl, bytes32 dna, uint256 lifespan);

    function createPosition(PoolId poolId, address lp, uint256 liquidity, bytes32 dna) external {
        require(!positions[poolId][lp].active, "Position exists");
        positions[poolId][lp] = Position({
            lp: lp,
            liquidity: liquidity,
            pnl: 0,
            dna: dna,
            birthBlock: block.number,
            deathBlock: 0,
            active: true,
            feesAccumulated: 0
        });
        lpIndex[poolId][lp] = lpList[poolId].length;
        lpList[poolId].push(lp);
        emit PositionBorn(poolId, lp, dna, block.number);
    }

    function killPosition(PoolId poolId, address lp) external {
        Position storage pos = positions[poolId][lp];
        require(pos.active, "Position not active");
        pos.active = false;
        pos.deathBlock = block.number;
        emit PositionDied(poolId, lp, pos.pnl, block.number);
    }

    function updatePnl(PoolId poolId, address lp, int256 delta) external {
        Position storage pos = positions[poolId][lp];
        require(pos.active, "Position not active");
        pos.pnl += delta;
    }

    function compoundFees(PoolId poolId, address lp, uint256 amount) external {
        Position storage pos = positions[poolId][lp];
        require(pos.active, "Position not active");
        pos.feesAccumulated += amount;
        pos.liquidity += amount;
        emit FeesCompounded(poolId, lp, amount);
    }

    function autopsy(PoolId poolId, address lp) external returns (int256 pnl, bytes32 dna, uint256 lifespan) {
        Position storage pos = positions[poolId][lp];
        require(!pos.active, "Position still active");
        pnl = pos.pnl;
        dna = pos.dna;
        lifespan = pos.deathBlock - pos.birthBlock;
        emit Autopsy(poolId, lp, pnl, dna, lifespan);
    }

    function getActiveLps(PoolId poolId) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < lpList[poolId].length; i++) {
            if (positions[poolId][lpList[poolId][i]].active) count++;
        }
        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < lpList[poolId].length; i++) {
            if (positions[poolId][lpList[poolId][i]].active) {
                active[idx] = lpList[poolId][i];
                idx++;
            }
        }
        return active;
    }

    function getPosition(PoolId poolId, address lp) external view returns (Position memory) {
        return positions[poolId][lp];
    }

    function setDna(PoolId poolId, address lp, bytes32 dna) external {
        Position storage pos = positions[poolId][lp];
        require(pos.active, "Position not active");
        pos.dna = dna;
    }
}