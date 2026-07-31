// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HookGene} from "./HookGene.sol";

contract LPPosition {
    struct Position {
        uint256 birthBlock;
        uint256 deathBlock;
        int256 pnl;
        uint256 volumeGenerated;
        bytes32 gene;
        bool alive;
    }
    mapping(address => Position) public positions;
    mapping(address => bytes32[]) public autopsyLog;
    event PositionBorn(address indexed lp, bytes32 gene, uint256 blockNumber);
    event PositionDied(address indexed lp, int256 pnl, uint256 volumeGenerated, bytes32 gene);
    event PnLUpdated(address indexed lp, int256 pnl);
    event GeneUpdated(address indexed lp, bytes32 newGene);
    function createPosition(address lp, bytes32 gene) external {
        require(!positions[lp].alive, "Position exists");
        positions[lp] = Position({ birthBlock: block.number, deathBlock: 0, pnl: 0, volumeGenerated: 0, gene: gene, alive: true });
        emit PositionBorn(lp, gene, block.number);
    }
    function killPosition(address lp) external {
        Position storage p = positions[lp];
        require(p.alive, "Not alive");
        p.alive = false;
        p.deathBlock = block.number;
        autopsyLog[lp].push(p.gene);
        emit PositionDied(lp, p.pnl, p.volumeGenerated, p.gene);
    }
    function updatePnL(address lp, int256 delta) external {
        Position storage p = positions[lp];
        require(p.alive, "Not alive");
        p.pnl += delta;
        emit PnLUpdated(lp, p.pnl);
    }
    function addVolume(address lp, uint256 vol) external { positions[lp].volumeGenerated += vol; }
    function setGene(address lp, bytes32 gene) external { positions[lp].gene = gene; emit GeneUpdated(lp, gene); }
    function getGene(address lp) external view returns (bytes32) { return positions[lp].gene; }
    function getPnL(address lp) external view returns (int256) { return positions[lp].pnl; }
    function exists(address lp) external view returns (bool) { return positions[lp].alive; }
    function getAutopsy(address lp) external view returns (bytes32[] memory) { return autopsyLog[lp]; }
    function getFitness(address lp) external view returns (uint256) {
        Position memory p = positions[lp];
        HookGene.Gene memory g = HookGene.decode(p.gene);
        return HookGene.fitness(g, uint256(p.pnl > 0 ? p.pnl : 0), p.volumeGenerated);
    }
}
