"use strict";
// server/src/repository/GameRepository.ts
// In-memory storage with file-based persistence for Pitch Perfect
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameRepository = exports.GameRepository = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_DIR = '/opt/render/project/src/data/games';
class GameRepository {
    constructor() {
        this.games = new Map();
        this.ensureDataDir();
        this.restoreAllGames();
    }
    ensureDataDir() {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
                console.log('Created data directory:', DATA_DIR);
            }
        }
        catch (error) {
            console.error('Error creating data directory:', error);
        }
    }
    restoreAllGames() {
        try {
            if (!fs.existsSync(DATA_DIR))
                return;
            const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
            let restored = 0;
            files.forEach(file => {
                try {
                    const filePath = path.join(DATA_DIR, file);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    const gameId = file.replace('.json', '');
                    if (!data.gameEnded) {
                        this.importGame(gameId, data);
                        restored++;
                        console.log('Restored game:', gameId);
                    }
                    else {
                        const stats = fs.statSync(filePath);
                        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
                        if (ageHours > 24) {
                            fs.unlinkSync(filePath);
                            console.log('Cleaned up old game:', gameId);
                        }
                    }
                }
                catch (err) {
                    console.error('Error restoring game from', file, err);
                }
            });
            if (restored > 0) {
                console.log('Restored', restored, 'active game(s) from disk');
            }
        }
        catch (error) {
            console.error('Error restoring games:', error);
        }
    }
    persistGame(gameId) {
        try {
            const exported = this.exportGame(gameId);
            if (exported) {
                const filePath = path.join(DATA_DIR, gameId + '.json');
                fs.writeFileSync(filePath, JSON.stringify(exported, null, 2));
            }
        }
        catch (error) {
            console.error('Error persisting game', gameId, error);
        }
    }
    deleteGameFile(gameId) {
        try {
            const filePath = path.join(DATA_DIR, gameId + '.json');
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            console.error('Error deleting game file', gameId, error);
        }
    }
    createGame(config) {
        const gameState = {
            config,
            currentQuarter: 1,
            teams: new Map(),
            activeEvents: [],
            opportunities: [],
            allTeamsSubmitted: false,
            gameStarted: false,
            gameEnded: false,
        };
        this.games.set(config.gameId, gameState);
        this.persistGame(config.gameId);
        return gameState;
    }
    getGame(gameId) {
        return this.games.get(gameId);
    }
    updateGame(gameId, updates) {
        const game = this.games.get(gameId);
        if (game) {
            Object.assign(game, updates);
            this.persistGame(gameId);
        }
    }
    replaceGame(gameId, game) {
        if (game.teams && !(game.teams instanceof Map)) {
            const teamsMap = new Map();
            const teamsData = game.teams;
            if (Array.isArray(teamsData)) {
                teamsData.forEach((team) => {
                    teamsMap.set(team.teamId, team);
                });
            }
            else if (typeof teamsData === 'object' && teamsData !== null) {
                Object.entries(teamsData).forEach(([id, team]) => {
                    teamsMap.set(id, team);
                });
            }
            game.teams = teamsMap;
        }
        this.games.set(gameId, game);
        this.persistGame(gameId);
    }
    addTeam(gameId, team) {
        const game = this.games.get(gameId);
        if (game) {
            game.teams.set(team.teamId, team);
            this.persistGame(gameId);
        }
    }
    getTeam(gameId, teamId) {
        const game = this.games.get(gameId);
        return game?.teams.get(teamId);
    }
    updateTeam(gameId, teamId, updates) {
        const game = this.games.get(gameId);
        const team = game?.teams.get(teamId);
        if (team) {
            Object.assign(team, updates);
            game.teams.set(teamId, team);
            this.persistGame(gameId);
        }
    }
    getAllTeams(gameId) {
        const game = this.games.get(gameId);
        return game ? Array.from(game.teams.values()) : [];
    }
    checkAllTeamsSubmitted(gameId) {
        const game = this.games.get(gameId);
        if (!game)
            return false;
        const teams = Array.from(game.teams.values());
        if (teams.length === 0)
            return false;
        return teams.every(team => team.submittedThisQuarter || team.isBankrupt);
    }
    setOpportunities(gameId, opportunities) {
        const game = this.games.get(gameId);
        if (game) {
            game.opportunities = opportunities;
            this.persistGame(gameId);
        }
    }
    getOpportunities(gameId) {
        const game = this.games.get(gameId);
        return game?.opportunities || [];
    }
    setActiveEvents(gameId, events) {
        const game = this.games.get(gameId);
        if (game) {
            game.activeEvents = events;
            this.persistGame(gameId);
        }
    }
    getActiveEvents(gameId) {
        const game = this.games.get(gameId);
        return game?.activeEvents || [];
    }
    resetTeamsForNewQuarter(gameId) {
        const game = this.games.get(gameId);
        if (!game)
            return;
        const defaultInputs = {
            pitches: [],
            qualityLevel: 'standard',
            techInvestment: 0,
            trainingInvestment: 0,
            marketingSpend: 0,
            hiringCount: 0,
            firingCount: 0,
            wellbeingSpend: 0,
        };
        game.teams.forEach((team, teamId) => {
            if (!team.isBankrupt) {
                team.submittedThisQuarter = false;
                team.currentInputs = { ...defaultInputs };
                game.teams.set(teamId, team);
            }
        });
        game.allTeamsSubmitted = false;
        this.persistGame(gameId);
    }
    getLeaderboard(gameId) {
        const teams = this.getAllTeams(gameId);
        return teams.sort((a, b) => b.cumulativeProfit - a.cumulativeProfit);
    }
    exportGame(gameId) {
        const game = this.games.get(gameId);
        if (!game)
            return null;
        return {
            ...game,
            teams: Array.from(game.teams.values()),
            exportedAt: new Date().toISOString(),
        };
    }
    importGame(gameId, data) {
        try {
            const teamsMap = new Map();
            if (data.teams && Array.isArray(data.teams)) {
                data.teams.forEach((team) => {
                    teamsMap.set(team.teamId, team);
                });
            }
            const gameState = {
                config: data.config,
                currentQuarter: data.currentQuarter,
                teams: teamsMap,
                activeEvents: data.activeEvents || [],
                opportunities: data.opportunities || [],
                allTeamsSubmitted: data.allTeamsSubmitted || false,
                gameStarted: data.gameStarted || false,
                gameEnded: data.gameEnded || false,
                winner: data.winner,
            };
            this.games.set(gameId, gameState);
            return true;
        }
        catch (error) {
            console.error('Error importing game:', error);
            return false;
        }
    }
    deleteGame(gameId) {
        this.games.delete(gameId);
        this.deleteGameFile(gameId);
    }
    getGameCount() {
        return this.games.size;
    }
    getActiveGameIds() {
        return Array.from(this.games.keys());
    }
}
exports.GameRepository = GameRepository;
exports.gameRepository = new GameRepository();
//# sourceMappingURL=GameRepository.js.map