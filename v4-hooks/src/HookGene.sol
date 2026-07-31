// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library HookGene {
    struct Genes {
        uint16 lookbackPeriod;
        uint16 threshold;
        uint16 positionSize;
        uint16 window;
        uint16 stdDevMultiplier;
        uint16 period;
        uint16 volumeThreshold;
        uint16 tickSpacing;
        uint16 feeTier;
        uint16 stressResponse;
        uint8 strategyType;
    }

    function encode(Genes memory g) internal pure returns (bytes32) {
        return bytes32(
            (uint256(g.lookbackPeriod) << 240) |
            (uint256(g.threshold) << 224) |
            (uint256(g.positionSize) << 208) |
            (uint256(g.window) << 192) |
            (uint256(g.stdDevMultiplier) << 176) |
            (uint256(g.period) << 160) |
            (uint256(g.volumeThreshold) << 144) |
            (uint256(g.tickSpacing) << 128) |
            (uint256(g.feeTier) << 112) |
            (uint256(g.stressResponse) << 96) |
            (uint256(g.strategyType) << 88)
        );
    }

    function decode(bytes32 dna) internal pure returns (Genes memory) {
        uint256 data = uint256(dna);
        return Genes({
            lookbackPeriod: uint16(data >> 240),
            threshold: uint16(data >> 224),
            positionSize: uint16(data >> 208),
            window: uint16(data >> 192),
            stdDevMultiplier: uint16(data >> 176),
            period: uint16(data >> 160),
            volumeThreshold: uint16(data >> 144),
            tickSpacing: uint16(data >> 128),
            feeTier: uint16(data >> 112),
            stressResponse: uint16(data >> 96),
            strategyType: uint8(data >> 88)
        });
    }

    function getRandomGenes(uint256 seed) internal view returns (Genes memory) {
        uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, seed)));
        return Genes({
            lookbackPeriod: uint16(10 + (r % 240)),
            threshold: uint16(100 + ((r >> 16) % 900)),
            positionSize: uint16(1000 + ((r >> 32) % 9000)),
            window: uint16(5 + ((r >> 48) % 55)),
            stdDevMultiplier: uint16(100 + ((r >> 64) % 400)),
            period: uint16(10 + ((r >> 80) % 110)),
            volumeThreshold: uint16(1000 + ((r >> 96) % 9000)),
            tickSpacing: uint16(1 + ((r >> 112) % 199)),
            feeTier: uint16(100 + ((r >> 128) % 9900)),
            stressResponse: uint16(1000 + ((r >> 144) % 9000)),
            strategyType: uint8(r % 3)
        });
    }

    function mutate(bytes32 dna) internal view returns (bytes32) {
        Genes memory g = decode(dna);
        uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, dna)));
        uint256 bit = r % 11;

        if (bit == 0) g.lookbackPeriod = uint16(10 + (r % 240));
        else if (bit == 1) g.threshold = uint16(100 + ((r >> 8) % 900));
        else if (bit == 2) g.positionSize = uint16(1000 + ((r >> 16) % 9000));
        else if (bit == 3) g.window = uint16(5 + ((r >> 24) % 55));
        else if (bit == 4) g.stdDevMultiplier = uint16(100 + ((r >> 32) % 400));
        else if (bit == 5) g.period = uint16(10 + ((r >> 40) % 110));
        else if (bit == 6) g.volumeThreshold = uint16(1000 + ((r >> 48) % 9000));
        else if (bit == 7) g.tickSpacing = uint16(1 + ((r >> 56) % 199));
        else if (bit == 8) g.feeTier = uint16(100 + ((r >> 64) % 9900));
        else if (bit == 9) g.stressResponse = uint16(1000 + ((r >> 72) % 9000));
        else if (bit == 10) g.strategyType = uint8(r % 3);

        return encode(g);
    }

    function crossover(bytes32 dna1, bytes32 dna2) internal pure returns (bytes32) {
        uint256 mask = uint256(keccak256(abi.encodePacked(dna1, dna2)));
        return bytes32((uint256(dna1) & mask) | (uint256(dna2) & ~mask));
    }

    function fitness(bytes32 dna, uint256 pnl, uint256 volume) internal pure returns (uint256) {
        Genes memory g = decode(dna);
        uint256 f = uint256(g.positionSize) * volume / 10000;
        if (pnl > 0) f += uint256(pnl) * 2;
        else f = f > uint256(-int256(pnl)) ? f - uint256(-int256(pnl)) : 0;
        return f;
    }
}