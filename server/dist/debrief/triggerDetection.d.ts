import { TeamState, ClientOpportunity } from '../types';
import { TriggerResult } from './debriefQuestions';
export interface GameContext {
    totalTeams: number;
    opportunities: ClientOpportunity[];
    opportunitiesPerQuarter: Map<number, number>;
    leaderByQuarter: string[];
}
export declare function detectTriggers(team: TeamState, gameContext: GameContext): TriggerResult[];
//# sourceMappingURL=triggerDetection.d.ts.map