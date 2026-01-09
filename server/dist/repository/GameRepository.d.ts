import { GameState, GameConfig, TeamState, ClientOpportunity, GameEvent } from '../types';
export declare class GameRepository {
    private games;
    constructor();
    private ensureDataDir;
    private restoreAllGames;
    private persistGame;
    private deleteGameFile;
    createGame(config: GameConfig): GameState;
    getGame(gameId: string): GameState | undefined;
    updateGame(gameId: string, updates: Partial<GameState>): void;
    replaceGame(gameId: string, game: GameState): void;
    addTeam(gameId: string, team: TeamState): void;
    getTeam(gameId: string, teamId: string): TeamState | undefined;
    updateTeam(gameId: string, teamId: string, updates: Partial<TeamState>): void;
    getAllTeams(gameId: string): TeamState[];
    checkAllTeamsSubmitted(gameId: string): boolean;
    setOpportunities(gameId: string, opportunities: ClientOpportunity[]): void;
    getOpportunities(gameId: string): ClientOpportunity[];
    setActiveEvents(gameId: string, events: GameEvent[]): void;
    getActiveEvents(gameId: string): GameEvent[];
    resetTeamsForNewQuarter(gameId: string): void;
    getLeaderboard(gameId: string): TeamState[];
    exportGame(gameId: string): object | null;
    importGame(gameId: string, data: any): boolean;
    deleteGame(gameId: string): void;
    getGameCount(): number;
    getActiveGameIds(): string[];
}
export declare const gameRepository: GameRepository;
//# sourceMappingURL=GameRepository.d.ts.map