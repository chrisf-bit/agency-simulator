// server/src/repository/ReportsRepository.ts
// In-memory storage for end-game reports

import { TeamReport } from '../game/insights';

interface SavedGameReports {
  gameId: string;
  gameName: string;
  endedAt: string;
  winner: string;
  totalTeams: number;
  reports: TeamReport[];
}

export class ReportsRepository {
  private savedReports: Map<string, SavedGameReports> = new Map();

  /**
   * Save reports for a completed game
   */
  saveReports(
    gameId: string,
    gameName: string,
    winner: string,
    reports: TeamReport[]
  ): void {
    this.savedReports.set(gameId, {
      gameId,
      gameName,
      endedAt: new Date().toISOString(),
      winner,
      totalTeams: reports.length,
      reports,
    });

    console.log(`📊 Saved reports for game ${gameId} with ${reports.length} teams`);
  }

  /**
   * Get reports for a game
   */
  getReports(gameId: string): SavedGameReports | undefined {
    return this.savedReports.get(gameId);
  }

  /**
   * Get report for a specific team
   */
  getTeamReport(gameId: string, teamId: string): TeamReport | undefined {
    const gameReports = this.savedReports.get(gameId);
    return gameReports?.reports.find(r => r.teamId === teamId);
  }

  /**
   * List all saved report summaries
   */
  listReports(): Array<{
    gameId: string;
    gameName: string;
    endedAt: string;
    winner: string;
    totalTeams: number;
  }> {
    return Array.from(this.savedReports.values()).map(r => ({
      gameId: r.gameId,
      gameName: r.gameName,
      endedAt: r.endedAt,
      winner: r.winner,
      totalTeams: r.totalTeams,
    }));
  }

  /**
   * Delete reports for a game
   */
  deleteReports(gameId: string): void {
    this.savedReports.delete(gameId);
  }

  /**
   * Clear all reports (for testing)
   */
  clearAll(): void {
    this.savedReports.clear();
  }
}

// Singleton instance
export const reportsRepository = new ReportsRepository();
