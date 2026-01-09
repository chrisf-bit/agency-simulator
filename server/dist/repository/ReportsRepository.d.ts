import { TeamReport } from '../game/insights';
export interface SavedGameReports {
    gameId: string;
    gameName: string;
    endedAt: string;
    totalTeams: number;
    winner: string;
    reports: TeamReport[];
}
declare class ReportsRepository {
    constructor();
    /**
     * Ensure reports directory exists
     */
    private ensureDir;
    /**
     * Clean up reports older than retention period
     */
    private cleanupOldReports;
    /**
     * Save reports for a game
     */
    saveReports(gameId: string, gameName: string, winner: string, reports: TeamReport[]): boolean;
    /**
     * Get reports for a game
     */
    getReports(gameId: string): SavedGameReports | null;
    /**
     * Get a single team's report
     */
    getTeamReport(gameId: string, teamId: string): TeamReport | null;
    /**
     * List all available report game IDs
     */
    listReports(): {
        gameId: string;
        gameName: string;
        endedAt: string;
        totalTeams: number;
    }[];
    /**
     * Check if reports exist for a game
     */
    hasReports(gameId: string): boolean;
}
export declare const reportsRepository: ReportsRepository;
export {};
//# sourceMappingURL=ReportsRepository.d.ts.map