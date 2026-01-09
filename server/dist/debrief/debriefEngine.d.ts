import { GameState } from '../types';
import { DebriefQuestion, FacilitatorPrompts } from './debriefQuestions';
export declare function generateFacilitatorPrompts(gameState: GameState): FacilitatorPrompts;
export interface QuarterlyPrompts {
    quarter: number;
    perTeam: {
        teamId: string;
        companyName: string;
        keyObservations: string[];
        suggestedQuestions: DebriefQuestion[];
    }[];
    allTeams: DebriefQuestion[];
}
export declare function generateQuarterlyPrompts(gameState: GameState, currentQuarter: number): QuarterlyPrompts;
//# sourceMappingURL=debriefEngine.d.ts.map