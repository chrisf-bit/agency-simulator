import { ClientOpportunity, GameLevel } from '../types';
import { SeededRandom } from '../utils/randomSeed';
export declare function generateOpportunities(quarter: number, level: GameLevel, random: SeededRandom): ClientOpportunity[];
export interface PitchEvaluation {
    won: boolean;
    winChance: number;
    roll: number;
    factors: string[];
}
export declare function evaluatePitch(opportunity: ClientOpportunity, discountPercent: number, teamReputation: number, teamMarketPresence: number, techLevel: number, trainingLevel: number, qualityLevel: 'budget' | 'standard' | 'premium', activeEvents: string[], random: SeededRandom): PitchEvaluation;
//# sourceMappingURL=opportunities.d.ts.map