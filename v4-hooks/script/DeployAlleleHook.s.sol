// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {AlleleHook} from "../src/AlleleHook.sol";
import {AlleleNervousSystem} from "../src/AlleleNervousSystem.sol";
import {LPPosition} from "../src/LPPosition.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract DeployAlleleHook is Script {
    function run() external {
        address poolManager = vm.envAddress("POOL_MANAGER");
        address agent = vm.envAddress("AGENT_ADDRESS");
        
        vm.startBroadcast();

        // Deploy nervous system first (oracle for sentiment)
        AlleleNervousSystem nervous = new AlleleNervousSystem();
        nervous.authorizeOracle(agent);

        // Deploy main hook
        AlleleHook hook = new AlleleHook(
            IPoolManager(poolManager),
            address(nervous),
            agent
        );

        // Deploy position tracker
        LPPosition positions = new LPPosition();

        vm.stopBroadcast();

        console.log("AlleleNervousSystem deployed at:", address(nervous));
        console.log("AlleleHook deployed at:", address(hook));
        console.log("LPPosition deployed at:", address(positions));
        console.log("Agent authorized:", agent);
    }
}
