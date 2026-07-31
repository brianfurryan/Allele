// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AlleleHook} from "../src/AlleleHook.sol";
import {HookGene} from "../src/HookGene.sol";
import {AlleleNervousSystem} from "../src/AlleleNervousSystem.sol";
import {LPPosition} from "../src/LPPosition.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";

contract AlleleHookTest is Test {
    using PoolIdLibrary for PoolKey;

    AlleleHook hook;
    AlleleNervousSystem nervous;
    LPPosition positions;
    address poolManager = address(0x1234);
    address agent = address(0x5678);
    PoolKey key;

    function setUp() public {
        nervous = new AlleleNervousSystem();
        nervous.authorizeOracle(agent);
        hook = new AlleleHook(IPoolManager(poolManager), address(nervous), agent);
        positions = new LPPosition();
        key = PoolKey({
            currency0: address(0x1111),
            currency1: address(0x2222),
            fee: 3000,
            tickSpacing: 60,
            hooks: hook
        });
    }

    function testHeartbeat() public {
        vm.prank(agent);
        hook.heartbeat(key);
        (uint256 last,,,) = hook.poolStates(key.toId());
        assertEq(last, block.number);
    }

    function testStressMode() public {
        vm.prank(agent);
        hook.heartbeat(key);
        vm.roll(block.number + 301);
        (,, bool stress,) = hook.poolStates(key.toId());
        assertTrue(stress);
    }

    function testGeneEncoding() public pure {
        HookGene.Genes memory g = HookGene.Genes({
            lookbackPeriod: 50,
            threshold: 500,
            positionSize: 5000,
            window: 20,
            stdDevMultiplier: 200,
            period: 30,
            volumeThreshold: 5000,
            tickSpacing: 60,
            feeTier: 3000,
            stressResponse: 5000,
            strategyType: 1
        });
        bytes32 dna = HookGene.encode(g);
        HookGene.Genes memory decoded = HookGene.decode(dna);
        assertEq(decoded.lookbackPeriod, 50);
        assertEq(decoded.threshold, 500);
        assertEq(decoded.strategyType, 1);
    }

    function testMutation() public view {
        bytes32 dna = HookGene.encode(HookGene.Genes({
            lookbackPeriod: 50, threshold: 500, positionSize: 5000,
            window: 20, stdDevMultiplier: 200, period: 30,
            volumeThreshold: 5000, tickSpacing: 60, feeTier: 3000,
            stressResponse: 5000, strategyType: 1
        }));
        bytes32 mutated = HookGene.mutate(dna);
        assertTrue(mutated != dna);
    }

    function testCrossover() public pure {
        bytes32 dna1 = keccak256("parent1");
        bytes32 dna2 = keccak256("parent2");
        bytes32 child = HookGene.crossover(dna1, dna2);
        assertTrue(child != dna1 && child != dna2);
    }

    function testToxinList() public {
        vm.prank(agent);
        hook.addToxin(address(0x9999));
        assertTrue(hook.toxinList(address(0x9999)));
        vm.prank(agent);
        hook.removeToxin(address(0x9999));
        assertFalse(hook.toxinList(address(0x9999)));
    }

    function testPositionLifecycle() public {
        PoolId poolId = key.toId();
        bytes32 dna = HookGene.encode(HookGene.Genes({
            lookbackPeriod: 50, threshold: 500, positionSize: 5000,
            window: 20, stdDevMultiplier: 200, period: 30,
            volumeThreshold: 5000, tickSpacing: 60, feeTier: 3000,
            stressResponse: 5000, strategyType: 1
        }));
        positions.createPosition(poolId, address(this), 1000, dna);
        LPPosition.Position memory pos = positions.getPosition(poolId, address(this));
        assertTrue(pos.active);
        assertEq(pos.liquidity, 1000);
        positions.killPosition(poolId, address(this));
        pos = positions.getPosition(poolId, address(this));
        assertFalse(pos.active);
    }

    function testSentimentDecay() public {
        PoolId poolId = key.toId();
        vm.prank(agent);
        nervous.submitInference(poolId, 8000, 2000);
        (uint256 pain, uint256 rest) = nervous.getSentiment(poolId);
        assertTrue(pain > rest);
        vm.warp(block.timestamp + 300);
        (pain, rest) = nervous.getSentiment(poolId);
        assertTrue(pain < 8000);
    }
}