// server/src/repository/GameRepository.ts
// In-memory game state repository

import { GameConfig, TeamState, GameEvent, ClientOpportunity, GameState } from '../types';
import { getDefaultInputs } from '../game/initialState';

interface StoredGame {
  config: GameConfig;
  currentQuarter: number;
  teams: Map<string, TeamState>;
  opportunities: ClientOpportunity[];
  activeEvents: GameEvent[];
  allTeamsSubmitted: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
}

export class GameRepository {
  private games: Map<string, StoredGame> = new Map();

  /**
   * Create a new game
   */
  createGame(config: GameConfig): StoredGame {
    const game: StoredGame = {
      config,
      currentQuarter: 1,
      teams: new Map(),
      opportunities: [],
      activeEvents: [],
      allTeamsSubmitted: false,
      gameStarted: false,
      gameEnded: false,
    };

    this.games.set(config.gameId, game);
    return game;
  }

  /**
   * Get game by ID
   */
  getGame(gameId: string): StoredGame | undefined {
    return this.games.get(gameId);
  }

  /**
   * Update game properties
   */
  updateGame(gameId: string, updates: Partial<StoredGame>): void {
    const game = this.games.get(gameId);
    if (game) {
      Object.assign(game, updates);
    }
  }

  /**
   * Delete a game
   */
  deleteGame(gameId: string): void {
    this.games.delete(gameId);
  }

  /**
   * Get count of active games
   */
  getGameCount(): number {
    return this.games.size;
  }

  // =========================================================================
  // TEAM OPERATIONS
  // =========================================================================

  /**
   * Add team to game
   */
  addTeam(gameId: string, team: TeamState): void {
    const game = this.games.get(gameId);
    if (game) {
      game.teams.set(team.teamId, team);
    }
  }

  /**
   * Get team by ID
   */
  getTeam(gameId: string, teamId: string): TeamState | undefined {
    const game = this.games.get(gameId);
    return game?.teams.get(teamId);
  }

  /**
   * Update team properties
   */
  updateTeam(gameId: string, teamId: string, updates: Partial<TeamState>): void {
    const game = this.games.get(gameId);
    const team = game?.teams.get(teamId);
    if (team) {
      Object.assign(team, updates);
    }
  }

  /**
   * Get all teams for a game
   */
  getAllTeams(gameId: string): TeamState[] {
    const game = this.games.get(gameId);
    return game ? Array.from(game.teams.values()) : [];
  }

  /**
   * Check if all teams have submitted for the quarter
   */
  checkAllTeamsSubmitted(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    const teams = Array.from(game.teams.values());
    const activeTeams = teams.filter(t => !t.isBankrupt);
    
    const allSubmitted = activeTeams.every(t => t.submittedThisQuarter);
    game.allTeamsSubmitted = allSubmitted;
    
    return allSubmitted;
  }

  /**
   * Reset all teams for a new quarter
   */
  resetTeamsForNewQuarter(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    game.teams.forEach(team => {
      team.submittedThisQuarter = false;
      team.currentInputs = getDefaultInputs();
    });

    game.allTeamsSubmitted = false;
  }

  // =========================================================================
  // OPPORTUNITIES
  // =========================================================================

  /**
   * Set opportunities for a quarter
   */
  setOpportunities(gameId: string, opportunities: ClientOpportunity[]): void {
    const game = this.games.get(gameId);
    if (game) {
      game.opportunities = opportunities;
    }
  }

  /**
   * Get current opportunities
   */
  getOpportunities(gameId: string): ClientOpportunity[] {
    const game = this.games.get(gameId);
    return game?.opportunities || [];
  }

  // =========================================================================
  // EVENTS
  // =========================================================================

  /**
   * Set active events
   */
  setActiveEvents(gameId: string, events: GameEvent[]): void {
    const game = this.games.get(gameId);
    if (game) {
      game.activeEvents = events;
    }
  }

  /**
   * Get active events
   */
  getActiveEvents(gameId: string): GameEvent[] {
    const game = this.games.get(gameId);
    return game?.activeEvents || [];
  }

  // =========================================================================
  // EXPORT/IMPORT
  // =========================================================================

  /**
   * Export game state for backup
   */
  exportGame(gameId: string): object | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    return {
      config: game.config,
      currentQuarter: game.currentQuarter,
      teams: Array.from(game.teams.entries()),
      opportunities: game.opportunities,
      activeEvents: game.activeEvents,
      allTeamsSubmitted: game.allTeamsSubmitted,
      gameStarted: game.gameStarted,
      gameEnded: game.gameEnded,
      winner: game.winner,
    };
  }

  /**
   * Import game state from backup
   */
  importGame(gameId: string, data: any): boolean {
    try {
      const game = this.games.get(gameId);
      if (!game) return false;

      game.config = data.config;
      game.currentQuarter = data.currentQuarter;
      game.teams = new Map(data.teams);
      game.opportunities = data.opportunities;
      game.activeEvents = data.activeEvents;
      game.allTeamsSubmitted = data.allTeamsSubmitted;
      game.gameStarted = data.gameStarted;
      game.gameEnded = data.gameEnded;
      game.winner = data.winner;

      return true;
    } catch (error) {
      console.error('Error importing game:', error);
      return false;
    }
  }
}

// Singleton instance
export const gameRepository = new GameRepository();
