"use strict";
// server/src/utils/randomSeed.ts
// Seeded random number generator for deterministic gameplay
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeededRandom = void 0;
/**
 * Seeded random number generator using mulberry32 algorithm
 * Allows replaying games with the same seed for testing/facilitation
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    /**
     * Generate next random number between 0 and 1
     */
    next() {
        let t = (this.seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    /**
     * Generate random integer between min (inclusive) and max (exclusive)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }
    /**
     * Generate random float between min and max
     */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }
    /**
     * Generate random boolean with given probability (0-1)
     */
    nextBool(probability = 0.5) {
        return this.next() < probability;
    }
    /**
     * Reset seed to replay sequence
     */
    reset(newSeed) {
        if (newSeed !== undefined) {
            this.seed = newSeed;
        }
    }
}
exports.SeededRandom = SeededRandom;
//# sourceMappingURL=randomSeed.js.map