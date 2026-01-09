import { TeamState, TeamInputs, GameEvent, GameLevel, ClientOpportunity, LeaderboardEntry } from '../types';
import { SeededRandom } from '../utils/randomSeed';
export declare function processQuarter(team: TeamState, inputs: TeamInputs, allTeams: TeamState[], opportunities: ClientOpportunity[], events: GameEvent[], level: GameLevel, random: SeededRandom): TeamState;
export declare function getDefaultInputs(): TeamInputs;
export declare function calculateWinner(teams: TeamState[]): string;
export declare function getLeaderboard(teams: TeamState[]): LeaderboardEntry[];
export declare function checkBankruptcy(team: TeamState): boolean;
//# sourceMappingURL=engine.d.ts.map