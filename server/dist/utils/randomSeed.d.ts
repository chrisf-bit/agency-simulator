/**
 * Seeded random number generator using mulberry32 algorithm
 * Allows replaying games with the same seed for testing/facilitation
 */
export declare class SeededRandom {
    private seed;
    constructor(seed: number);
    /**
     * Generate next random number between 0 and 1
     */
    next(): number;
    /**
     * Generate random integer between min (inclusive) and max (exclusive)
     */
    nextInt(min: number, max: number): number;
    /**
     * Generate random float between min and max
     */
    nextFloat(min: number, max: number): number;
    /**
     * Generate random boolean with given probability (0-1)
     */
    nextBool(probability?: number): boolean;
    /**
     * Reset seed to replay sequence
     */
    reset(newSeed?: number): void;
}
//# sourceMappingURL=randomSeed.d.ts.map