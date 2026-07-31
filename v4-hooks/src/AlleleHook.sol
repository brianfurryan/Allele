// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {LPPosition} from "./LPPosition.sol";
import {HookGene} from "./HookGene.sol";
import {AlleleNervousSystem} from "./AlleleNervousSystem.sol";

contract AlleleHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    uint256 public constant HEARTBEAT_INTERVAL = 300;
    uint256 public constant REPRODUCTION_THRESHOLD = 1 ether;
    uint256 public constant APOPTOSIS_THRESHOLD = 500;
    uint256 public constant METABOLISM_RATE = 3000;
    uint256 public constant BASE_FEE = 3000;

    struct PoolState {
        uint256 lastHeartbeat;
        bool stressMode;
        uint256 accumulatedFees;
        uint256 generation;
        bytes32 dna;
    }

    mapping(PoolId => PoolState) public poolStates;
    mapping(address => bool) public toxinList;
    mapping(PoolId => mapping(address => LPPosition.Position)) public positions;

    AlleleNervousSystem public nervousSystem;
    address public alleleAgent;

    event Heartbeat(PoolId indexed poolId, uint256 blockNumber);
    event StressModeEntered(PoolId indexed poolId, uint256 blockNumber);
    event DaughterSpawned(PoolId indexed motherId, PoolId indexed daughterId, bytes32 dna);
    event Apoptosis(PoolId indexed poolId, address indexed lp, uint256 pnl);
    event ToxinDetected(address indexed toxin, uint256 feeMultiplier);
    event GeneExchanged(PoolId indexed poolId, address indexed parent1, address indexed parent2, bytes32 childDna);

    constructor(IPoolManager _poolManager, address _nervousSystem, address _agent) BaseHook(_poolManager) {
        nervousSystem = AlleleNervousSystem(_nervousSystem);
        alleleAgent = _agent;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: true,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: true,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeInitialize(address, PoolKey calldata key, uint160, bytes calldata hookData)
        external
        override
        returns (bytes4)
    {
        PoolId poolId = key.toId();
        bytes32 initialDna = hookData.length > 0 ? abi.decode(hookData, (bytes32)) : keccak256(abi.encodePacked(block.timestamp));
        poolStates[poolId] = PoolState({
            lastHeartbeat: block.number,
            stressMode: false,
            accumulatedFees: 0,
            generation: 1,
            dna: initialDna
        });
        return this.beforeInitialize.selector;
    }

    function beforeSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, bytes calldata)
        external
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        PoolId poolId = key.toId();
        PoolState storage state = poolStates[poolId];

        if (block.number > state.lastHeartbeat + HEARTBEAT_INTERVAL) {
            state.stressMode = true;
            emit StressModeEntered(poolId, block.number);
        }

        uint24 fee = BASE_FEE;
        if (state.stressMode) {
            fee = uint24(BASE_FEE * 10);
        }

        (uint256 pain, uint256 rest) = nervousSystem.getSentiment(poolId);
        if (pain > 5000) {
            fee = uint24(fee * (10000 + pain) / 10000);
        } else if (rest > 5000) {
            fee = uint24(fee * 10000 / (10000 + rest));
        }

        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, fee);
    }

    function afterSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, BalanceDelta delta, bytes calldata)
        external
        override
        returns (bytes4, int128)
    {
        PoolId poolId = key.toId();
        PoolState storage state = poolStates[poolId];

        uint256 swapFee = uint256(uint128(-delta.amount0())) * BASE_FEE / 100000;
        state.accumulatedFees += swapFee;

        if (state.accumulatedFees >= REPRODUCTION_THRESHOLD) {
            _reproduce(poolId, state);
        }

        _crossover(poolId);

        return (this.afterSwap.selector, 0);
    }

    function beforeAddLiquidity(address, PoolKey calldata key, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external
        view
        override
        returns (bytes4)
    {
        PoolId poolId = key.toId();
        require(!poolStates[poolId].stressMode, "Stress mode: liquidity locked");
        return this.beforeAddLiquidity.selector;
    }

    function beforeRemoveLiquidity(address, PoolKey calldata key, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external
        view
        override
        returns (bytes4)
    {
        PoolId poolId = key.toId();
        if (poolStates[poolId].stressMode) {
            require(msg.sender == alleleAgent, "Stress mode: only agent can remove");
        }
        return this.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(address, PoolKey calldata key, IPoolManager.ModifyLiquidityParams calldata, BalanceDelta, bytes calldata)
        external
        override
        returns (bytes4, BalanceDelta)
    {
        PoolId poolId = key.toId();
        _apoptosis(poolId);
        return (this.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function heartbeat(PoolKey calldata key) external {
        PoolId poolId = key.toId();
        PoolState storage state = poolStates[poolId];
        state.lastHeartbeat = block.number;
        state.stressMode = false;
        emit Heartbeat(poolId, block.number);
    }

    function addToxin(address toxin) external {
        require(msg.sender == alleleAgent, "Only agent");
        toxinList[toxin] = true;
    }

    function removeToxin(address toxin) external {
        require(msg.sender == alleleAgent, "Only agent");
        toxinList[toxin] = false;
    }

    function _reproduce(PoolId poolId, PoolState storage state) internal {
        bytes32 daughterDna = HookGene.mutate(state.dna);
        state.accumulatedFees = 0;
        state.generation += 1;

        PoolId daughterId = PoolId.wrap(uint256(keccak256(abi.encodePacked(poolId, state.generation, block.timestamp))));
        emit DaughterSpawned(poolId, daughterId, daughterDna);
    }

    function _apoptosis(PoolId poolId) internal {
        LPPosition.Position storage pos = positions[poolId][msg.sender];
        if (pos.active && pos.pnl < -int256(APOPTOSIS_THRESHOLD)) {
            pos.active = false;
            emit Apoptosis(poolId, msg.sender, uint256(-pos.pnl));
        }
    }

    function _crossover(PoolId poolId) internal {
        address[] memory activeLps = _getActiveLps(poolId);
        if (activeLps.length < 2) return;

        uint256 idx1 = uint256(keccak256(abi.encodePacked(block.timestamp))) % activeLps.length;
        uint256 idx2 = uint256(keccak256(abi.encodePacked(block.number))) % activeLps.length;
        if (idx1 == idx2) idx2 = (idx2 + 1) % activeLps.length;

        bytes32 childDna = HookGene.crossover(
            positions[poolId][activeLps[idx1]].dna,
            positions[poolId][activeLps[idx2]].dna
        );

        emit GeneExchanged(poolId, activeLps[idx1], activeLps[idx2], childDna);
    }

    function _getActiveLps(PoolId) internal pure returns (address[] memory) {
        address[] memory lps = new address[](2);
        lps[0] = address(0x1);
        lps[1] = address(0x2);
        return lps;
    }
}