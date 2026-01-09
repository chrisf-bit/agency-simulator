"use strict";
// server/src/index.ts
// Pitch Perfect Server - Market Masters style with session tokens and heartbeat
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const GameRepository_1 = require("./repository/GameRepository");
const ReportsRepository_1 = require("./repository/ReportsRepository");
const engine_1 = require("./game/engine");
const opportunities_1 = require("./game/opportunities");
const events_1 = require("./game/events");
const notifications_1 = require("./game/notifications");
const initialState_1 = require("./game/initialState");
const randomSeed_1 = require("./utils/randomSeed");
const insights_1 = require("./game/insights");
const debrief_1 = require("./debrief");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});
const PORT = process.env.PORT || 3001;
// Map: sessionToken -> TeamSession
const teamSessions = new Map();
// Map: gameId -> Set of sessionTokens
const gameSessions = new Map();
// Map: socketId -> sessionToken (for quick lookup on disconnect)
const socketToSession = new Map();
function generateSessionToken() {
    return (0, uuid_1.v4)();
}
function createTeamSession(gameId, teamId, companyName, socketId) {
    const sessionToken = generateSessionToken();
    const session = {
        sessionToken,
        teamId,
        gameId,
        companyName,
        socketId,
        lastSeen: Date.now(),
        isConnected: true,
    };
    teamSessions.set(sessionToken, session);
    socketToSession.set(socketId, sessionToken);
    // Track sessions per game
    if (!gameSessions.has(gameId)) {
        gameSessions.set(gameId, new Set());
    }
    gameSessions.get(gameId).add(sessionToken);
    console.log(`🎫 Session created for ${companyName} in game ${gameId}`);
    return sessionToken;
}
function getSessionByToken(token) {
    return teamSessions.get(token);
}
function getSessionBySocketId(socketId) {
    const token = socketToSession.get(socketId);
    return token ? teamSessions.get(token) : undefined;
}
function updateSessionSocket(sessionToken, socketId) {
    const session = teamSessions.get(sessionToken);
    if (session) {
        // Remove old socket mapping if exists
        if (session.socketId) {
            socketToSession.delete(session.socketId);
        }
        session.socketId = socketId;
        session.lastSeen = Date.now();
        session.isConnected = true;
        socketToSession.set(socketId, sessionToken);
    }
}
function markSessionDisconnected(socketId) {
    const token = socketToSession.get(socketId);
    if (token) {
        const session = teamSessions.get(token);
        if (session) {
            session.isConnected = false;
            session.lastSeen = Date.now();
        }
        socketToSession.delete(socketId);
    }
}
function getGameConnectionStatus(gameId) {
    const sessionTokens = gameSessions.get(gameId);
    if (!sessionTokens)
        return [];
    return Array.from(sessionTokens).map(token => {
        const session = teamSessions.get(token);
        return {
            teamId: session.teamId,
            companyName: session.companyName,
            isConnected: session.isConnected,
            lastSeen: session.lastSeen,
        };
    });
}
// =============================================================================
// SOCKET HANDLERS
// =============================================================================
io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    // =====================================================
    // PING/PONG for heartbeat
    // =====================================================
    socket.on('ping', (callback) => {
        if (callback)
            callback();
    });
    // =====================================================
    // CREATE GAME (Facilitator)
    // =====================================================
    socket.on('createGame', (configData, callback) => {
        try {
            const gameId = (0, uuid_1.v4)().slice(0, 8).toUpperCase();
            const randomSeed = Date.now();
            const config = {
                gameId,
                gameName: configData.gameName || 'Pitch Perfect Game',
                level: configData.level || 2,
                numberOfTeams: configData.numberOfTeams || 4,
                maxQuarters: configData.maxQuarters || 8,
                randomSeed,
                events: (0, events_1.getEventConfig)(configData.level || 2),
            };
            const game = GameRepository_1.gameRepository.createGame(config);
            // Generate initial opportunities
            const random = new randomSeed_1.SeededRandom(randomSeed);
            const opportunities = (0, opportunities_1.generateOpportunities)(1, config.level, random);
            GameRepository_1.gameRepository.setOpportunities(gameId, opportunities);
            // Join the facilitator room
            socket.join(gameId);
            socket.join(`${gameId}-facilitator`);
            console.log(`🎮 Game created: ${gameId} by facilitator ${socket.id}`);
            callback({ gameId });
        }
        catch (error) {
            console.error('Error creating game:', error);
            callback({ error: 'Failed to create game' });
        }
    });
    // =====================================================
    // JOIN GAME (Team)
    // =====================================================
    socket.on('joinGame', (gameId, companyName, callback) => {
        try {
            const game = GameRepository_1.gameRepository.getGame(gameId);
            if (!game) {
                callback({ error: 'Game not found. Please check the Game ID.' });
                return;
            }
            if (game.gameEnded) {
                callback({ error: 'Game has ended' });
                return;
            }
            // Check if team name already exists
            const existingTeams = GameRepository_1.gameRepository.getAllTeams(gameId);
            const existingTeam = existingTeams.find(t => t.companyName.toLowerCase() === companyName.toLowerCase());
            if (existingTeam) {
                callback({ error: 'Agency name already taken. Please choose a different name.' });
                return;
            }
            // Check max teams
            if (existingTeams.length >= game.config.numberOfTeams) {
                callback({ error: `Maximum ${game.config.numberOfTeams} teams allowed` });
                return;
            }
            // Create team
            const teamId = (0, uuid_1.v4)().slice(0, 8).toUpperCase();
            const random = new randomSeed_1.SeededRandom(game.config.randomSeed + existingTeams.length);
            const teamState = (0, initialState_1.createInitialTeamState)(teamId, companyName, game.config.level, random);
            GameRepository_1.gameRepository.addTeam(gameId, teamState);
            // Create session
            const sessionToken = createTeamSession(gameId, teamId, companyName, socket.id);
            // Join socket rooms
            socket.join(gameId);
            socket.join(`${gameId}-${teamId}`);
            console.log(`👥 Team joined: ${companyName} (${teamId}) in game ${gameId}`);
            // Notify facilitator
            io.to(`${gameId}-facilitator`).emit('teamJoined', {
                teamId,
                companyName,
                connectionStatus: getGameConnectionStatus(gameId),
            });
            // Get current opportunities
            const opportunities = GameRepository_1.gameRepository.getOpportunities(gameId);
            const activeEvents = GameRepository_1.gameRepository.getActiveEvents(gameId);
            callback({
                success: true,
                teamState,
                sessionToken,
                opportunities,
                activeEvents,
            });
        }
        catch (error) {
            console.error('Error joining game:', error);
            callback({ error: 'Failed to join game' });
        }
    });
    // =====================================================
    // RECONNECT TEAM (Using session token)
    // =====================================================
    socket.on('reconnectWithToken', (sessionToken, callback) => {
        try {
            const session = getSessionByToken(sessionToken);
            if (!session) {
                callback({ error: 'Session expired. Please rejoin the game.' });
                return;
            }
            const { gameId, teamId } = session;
            const game = GameRepository_1.gameRepository.getGame(gameId);
            if (!game) {
                callback({ error: 'Game no longer exists' });
                return;
            }
            const teamState = GameRepository_1.gameRepository.getTeam(gameId, teamId);
            if (!teamState) {
                callback({ error: 'Team no longer exists' });
                return;
            }
            // Update session with new socket
            updateSessionSocket(sessionToken, socket.id);
            // Rejoin socket rooms
            socket.join(gameId);
            socket.join(`${gameId}-${teamId}`);
            const opportunities = GameRepository_1.gameRepository.getOpportunities(gameId);
            const activeEvents = GameRepository_1.gameRepository.getActiveEvents(gameId);
            console.log(`🔄 Team reconnected: ${session.companyName} (${teamId}) in game ${gameId}`);
            // Notify facilitator of reconnection
            io.to(`${gameId}-facilitator`).emit('teamReconnected', {
                teamId,
                companyName: session.companyName,
                connectionStatus: getGameConnectionStatus(gameId),
            });
            callback({
                success: true,
                teamState,
                gameId,
                opportunities,
                activeEvents,
                gameEnded: game.gameEnded,
            });
        }
        catch (error) {
            console.error('Error reconnecting:', error);
            callback({ error: 'Failed to reconnect' });
        }
    });
    // =====================================================
    // FACILITATOR RECONNECT
    // =====================================================
    socket.on('reconnectFacilitator', (gameId, callback) => {
        try {
            const game = GameRepository_1.gameRepository.getGame(gameId);
            if (!game) {
                if (callback)
                    callback({ error: 'Game not found' });
                return;
            }
            socket.join(gameId);
            socket.join(`${gameId}-facilitator`);
            const teams = GameRepository_1.gameRepository.getAllTeams(gameId);
            const opportunities = GameRepository_1.gameRepository.getOpportunities(gameId);
            const activeEvents = GameRepository_1.gameRepository.getActiveEvents(gameId);
            console.log(`🔄 Facilitator reconnected to game ${gameId}`);
            if (callback) {
                callback({
                    success: true,
                    gameState: {
                        config: game.config,
                        currentQuarter: game.currentQuarter,
                        teams,
                        opportunities,
                        activeEvents,
                        allTeamsSubmitted: game.allTeamsSubmitted,
                        gameStarted: game.gameStarted,
                        gameEnded: game.gameEnded,
                        winner: game.winner,
                        connectionStatus: getGameConnectionStatus(gameId),
                    },
                });
            }
        }
        catch (error) {
            console.error('Error reconnecting facilitator:', error);
            if (callback)
                callback({ error: 'Failed to reconnect' });
        }
    });
    // =====================================================
    // GET GAME STATE (Facilitator)
    // =====================================================
    socket.on('getGameState', (gameId, callback) => {
        try {
            const game = GameRepository_1.gameRepository.getGame(gameId);
            if (!game) {
                callback({ error: 'Game not found' });
                return;
            }
            const teams = GameRepository_1.gameRepository.getAllTeams(gameId);
            const opportunities = GameRepository_1.gameRepository.getOpportunities(gameId);
            const activeEvents = GameRepository_1.gameRepository.getActiveEvents(gameId);
            callback({
                config: game.config,
                currentQuarter: game.currentQuarter,
                teams,
                opportunities,
                activeEvents,
                allTeamsSubmitted: game.allTeamsSubmitted,
                gameStarted: game.gameStarted,
                gameEnded: game.gameEnded,
                winner: game.winner,
                connectionStatus: getGameConnectionStatus(gameId),
            });
        }
        catch (error) {
            console.error('Error getting game state:', error);
            callback({ error: 'Failed to get game state' });
        }
    });
    // =====================================================
    // GET TEAM STATE
    // =====================================================
    socket.on('getTeamState', (gameId, teamId, callback) => {
        try {
            const teamState = GameRepository_1.gameRepository.getTeam(gameId, teamId);
            if (!teamState) {
                callback({ error: 'Team not found' });
                return;
            }
            const opportunities = GameRepository_1.gameRepository.getOpportunities(gameId);
            const activeEvents = GameRepository_1.gameRepository.getActiveEvents(gameId);
            callback({
                teamState,
                opportunities,
                activeEvents,
            });
        }
        catch (error) {
            console.error('Error getting team state:', error);
            callback({ error: 'Failed to get team state' });
        }
    });
    // =====================================================
    // SUBMIT INPUTS (Team)
    // =====================================================
    socket.on('submitInputs', (gameId, teamId, inputs, callback) => {
        try {
            const team = GameRepository_1.gameRepository.getTeam(gameId, teamId);
            if (!team) {
                if (callback)
                    callback({ error: 'Team not found' });
                return;
            }
            if (team.submittedThisQuarter) {
                if (callback)
                    callback({ error: 'Already submitted this quarter' });
                return;
            }
            // Update team with inputs
            GameRepository_1.gameRepository.updateTeam(gameId, teamId, {
                currentInputs: inputs,
                submittedThisQuarter: true,
            });
            console.log(`📤 Team ${team.companyName} submitted inputs for Q${team.quarter}`);
            // Notify facilitator
            io.to(`${gameId}-facilitator`).emit('inputsSubmitted', { teamId, companyName: team.companyName });
            const allSubmitted = GameRepository_1.gameRepository.checkAllTeamsSubmitted(gameId);
            if (allSubmitted) {
                io.to(`${gameId}-facilitator`).emit('allTeamsSubmitted');
                console.log(`✅ All teams submitted in game ${gameId}`);
                // Auto-process quarter
                setTimeout(() => {
                    socket.emit('processQuarter', gameId);
                    console.log(`⚙️ Auto-processing quarter for game ${gameId}`);
                }, 1500); // 1.5 second delay for UI feedback
            }
            if (callback)
                callback({ success: true });
        }
        catch (error) {
            console.error('Error submitting inputs:', error);
            if (callback)
                callback({ error: 'Failed to submit inputs' });
        }
    });
    // =====================================================
    // PROCESS QUARTER (Facilitator)
    // =====================================================
    socket.on('processQuarter', (gameId, callback) => {
        try {
            const game = GameRepository_1.gameRepository.getGame(gameId);
            if (!game) {
                if (callback)
                    callback({ error: 'Game not found' });
                return;
            }
            const teams = GameRepository_1.gameRepository.getAllTeams(gameId);
            const opportunities = GameRepository_1.gameRepository.getOpportunities(gameId);
            const activeEvents = GameRepository_1.gameRepository.getActiveEvents(gameId);
            const random = new randomSeed_1.SeededRandom(game.config.randomSeed + game.currentQuarter);
            console.log(`⚙️ Processing Q${game.currentQuarter} for game ${gameId}`);
            // Process each team
            teams.forEach(team => {
                if (team.isBankrupt)
                    return;
                const updatedTeam = (0, engine_1.processQuarter)(team, team.currentInputs, teams, opportunities, activeEvents, game.config.level, random);
                GameRepository_1.gameRepository.updateTeam(gameId, team.teamId, updatedTeam);
                // Generate notifications
                const notifications = (0, notifications_1.generateNotifications)(updatedTeam, activeEvents);
                // Send results to team
                io.to(`${gameId}-${team.teamId}`).emit('resultsReady', {
                    teamState: updatedTeam,
                    notifications,
                });
            });
            // Generate debrief prompts for facilitator
            try {
                const updatedTeams = GameRepository_1.gameRepository.getAllTeams(gameId);
                const gameState = {
                    teams: new Map(updatedTeams.map(t => [t.teamId, t])),
                    opportunities: opportunities,
                    currentQuarter: game.currentQuarter,
                };
                const debriefPrompts = (0, debrief_1.generateQuarterlyPrompts)(gameState, game.currentQuarter);
                io.to(`${gameId}-facilitator`).emit('debrief_prompts', debriefPrompts);
                console.log(`📋 Debrief prompts sent for Q${game.currentQuarter}`);
            }
            catch (debriefError) {
                console.error('Error generating debrief prompts:', debriefError);
            }
            // Advance quarter
            const newQuarter = game.currentQuarter + 1;
            // Check if game should end
            if (newQuarter > game.config.maxQuarters) {
                endGame(gameId);
                if (callback)
                    callback({ success: true, gameEnded: true });
                return;
            }
            // Generate new opportunities and events for next quarter
            const newRandom = new randomSeed_1.SeededRandom(game.config.randomSeed + newQuarter);
            const newOpportunities = (0, opportunities_1.generateOpportunities)(newQuarter, game.config.level, newRandom);
            const newEvents = (0, events_1.processRandomEvents)(newQuarter, game.config, activeEvents, newRandom);
            GameRepository_1.gameRepository.setOpportunities(gameId, newOpportunities);
            GameRepository_1.gameRepository.setActiveEvents(gameId, newEvents);
            GameRepository_1.gameRepository.resetTeamsForNewQuarter(gameId);
            GameRepository_1.gameRepository.updateGame(gameId, { currentQuarter: newQuarter });
            // Notify all clients about new quarter
            const marketBrief = generateMarketBrief(game, newQuarter);
            io.to(gameId).emit('quarterStarted', {
                quarter: newQuarter,
                brief: marketBrief,
                events: newEvents,
                opportunities: newOpportunities,
            });
            console.log(`📅 Quarter ${newQuarter} started in game ${gameId}`);
            if (callback)
                callback({ success: true, newQuarter });
        }
        catch (error) {
            console.error('Error processing quarter:', error);
            if (callback)
                callback({ error: 'Failed to process quarter' });
        }
    });
    // =====================================================
    // END GAME (Facilitator)
    // =====================================================
    socket.on('endGame', (gameId, callback) => {
        try {
            endGame(gameId);
            if (callback)
                callback({ success: true });
        }
        catch (error) {
            console.error('Error ending game:', error);
            if (callback)
                callback({ error: 'Failed to end game' });
        }
    });
    // =====================================================
    // FORCE REFRESH ALL TEAMS
    // =====================================================
    socket.on('forceRefreshAllTeams', (gameId) => {
        console.log(`🔄 Force refresh triggered for game ${gameId}`);
        io.to(gameId).emit('forceRefresh');
    });
    // =====================================================
    // RESET TEAM SUBMISSION
    // =====================================================
    socket.on('resetTeamSubmission', (gameId, teamId, callback) => {
        try {
            const team = GameRepository_1.gameRepository.getTeam(gameId, teamId);
            if (!team) {
                callback({ error: 'Team not found' });
                return;
            }
            GameRepository_1.gameRepository.updateTeam(gameId, teamId, {
                submittedThisQuarter: false,
                currentInputs: (0, engine_1.getDefaultInputs)(),
            });
            // Notify the team
            io.to(`${gameId}-${teamId}`).emit('submissionReset');
            console.log(`🔄 Reset submission for ${team.companyName} in game ${gameId}`);
            callback({ success: true });
        }
        catch (error) {
            console.error('Error resetting submission:', error);
            callback({ error: 'Failed to reset submission' });
        }
    });
    // =====================================================
    // FORCE ADVANCE QUARTER
    // =====================================================
    socket.on('forceAdvanceQuarter', (gameId, callback) => {
        try {
            const game = GameRepository_1.gameRepository.getGame(gameId);
            if (!game) {
                callback({ error: 'Game not found' });
                return;
            }
            // Auto-submit default inputs for teams that haven't submitted
            const teams = GameRepository_1.gameRepository.getAllTeams(gameId);
            teams.forEach(team => {
                if (!team.submittedThisQuarter && !team.isBankrupt) {
                    GameRepository_1.gameRepository.updateTeam(gameId, team.teamId, {
                        submittedThisQuarter: true,
                        currentInputs: team.currentInputs || (0, engine_1.getDefaultInputs)(),
                    });
                }
            });
            // Now process the quarter
            socket.emit('processQuarter', gameId, callback);
        }
        catch (error) {
            console.error('Error force advancing:', error);
            callback({ error: 'Failed to force advance' });
        }
    });
    // =====================================================
    // EXPORT/IMPORT GAME
    // =====================================================
    socket.on('exportGame', (gameId, callback) => {
        try {
            const exportData = GameRepository_1.gameRepository.exportGame(gameId);
            if (!exportData) {
                callback({ error: 'Game not found' });
                return;
            }
            callback({ success: true, data: exportData });
        }
        catch (error) {
            console.error('Error exporting game:', error);
            callback({ error: 'Failed to export game' });
        }
    });
    socket.on('importGame', (gameId, data, callback) => {
        try {
            const success = GameRepository_1.gameRepository.importGame(gameId, data);
            if (success) {
                io.to(gameId).emit('gameRestored');
                callback({ success: true });
            }
            else {
                callback({ error: 'Failed to import game data' });
            }
        }
        catch (error) {
            console.error('Error importing game:', error);
            callback({ error: 'Failed to import game' });
        }
    });
    // =====================================================
    // TEAM REPORTS
    // =====================================================
    socket.on('generateTeamReport', (gameId, teamId, callback) => {
        try {
            const teams = GameRepository_1.gameRepository.getAllTeams(gameId);
            const team = teams.find(t => t.teamId === teamId);
            if (!team) {
                callback({ error: 'Team not found' });
                return;
            }
            // Calculate rank
            const sortedTeams = [...teams].sort((a, b) => (b.cumulativeProfit || 0) - (a.cumulativeProfit || 0));
            const rank = sortedTeams.findIndex(t => t.teamId === teamId) + 1;
            const report = (0, insights_1.generateTeamReport)(team, teams, rank);
            callback({ success: true, report });
        }
        catch (error) {
            console.error('Error generating team report:', error);
            callback({ error: 'Failed to generate report' });
        }
    });
    socket.on('generateAllReports', (gameId, callback) => {
        try {
            const teams = GameRepository_1.gameRepository.getAllTeams(gameId);
            if (teams.length === 0) {
                callback({ error: 'No teams found' });
                return;
            }
            const reports = (0, insights_1.generateAllTeamReports)(teams);
            callback({ success: true, reports });
        }
        catch (error) {
            console.error('Error generating all reports:', error);
            callback({ error: 'Failed to generate reports' });
        }
    });
    // =====================================================
    // SAVED REPORTS ACCESS
    // =====================================================
    socket.on('getSavedReports', (gameId, callback) => {
        try {
            const savedReports = ReportsRepository_1.reportsRepository.getReports(gameId);
            if (!savedReports) {
                callback({ error: 'No saved reports found for this game' });
                return;
            }
            callback({ success: true, data: savedReports });
        }
        catch (error) {
            console.error('Error getting saved reports:', error);
            callback({ error: 'Failed to get saved reports' });
        }
    });
    socket.on('getSavedTeamReport', (gameId, teamId, callback) => {
        try {
            const report = ReportsRepository_1.reportsRepository.getTeamReport(gameId, teamId);
            if (!report) {
                callback({ error: 'Report not found' });
                return;
            }
            callback({ success: true, report });
        }
        catch (error) {
            console.error('Error getting saved team report:', error);
            callback({ error: 'Failed to get report' });
        }
    });
    socket.on('listSavedReports', (callback) => {
        try {
            const list = ReportsRepository_1.reportsRepository.listReports();
            callback({ success: true, reports: list });
        }
        catch (error) {
            console.error('Error listing reports:', error);
            callback({ error: 'Failed to list reports' });
        }
    });
    // =====================================================
    // GET CONNECTION STATUS
    // =====================================================
    socket.on('getConnectionStatus', (gameId, callback) => {
        try {
            const status = getGameConnectionStatus(gameId);
            callback({ success: true, connectionStatus: status });
        }
        catch (error) {
            console.error('Error getting connection status:', error);
            callback({ error: 'Failed to get connection status' });
        }
    });
    // =====================================================
    // HEARTBEAT FROM TEAM
    // =====================================================
    socket.on('heartbeat', (sessionToken) => {
        const session = getSessionByToken(sessionToken);
        if (session) {
            session.lastSeen = Date.now();
            session.isConnected = true;
        }
    });
    // =====================================================
    // DISCONNECT
    // =====================================================
    socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
        const session = getSessionBySocketId(socket.id);
        if (session) {
            markSessionDisconnected(socket.id);
            // Notify facilitator
            io.to(`${session.gameId}-facilitator`).emit('teamDisconnected', {
                teamId: session.teamId,
                companyName: session.companyName,
                connectionStatus: getGameConnectionStatus(session.gameId),
            });
            console.log(`🔴 Team ${session.companyName} disconnected from game ${session.gameId}`);
        }
    });
});
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function endGame(gameId) {
    const game = GameRepository_1.gameRepository.getGame(gameId);
    if (!game)
        return;
    const allTeams = GameRepository_1.gameRepository.getAllTeams(gameId);
    const leaderboard = (0, engine_1.getLeaderboard)(allTeams);
    const winnerId = leaderboard.length > 0 ? leaderboard[0].teamId : '';
    GameRepository_1.gameRepository.updateGame(gameId, {
        gameEnded: true,
        winner: winnerId,
    });
    const winnerName = allTeams.find(t => t.teamId === winnerId)?.companyName || 'Unknown';
    console.log(`🏆 Game ended: ${gameId}. Winner: ${winnerName}`);
    // Generate final debrief prompts
    try {
        const opportunities = GameRepository_1.gameRepository.getOpportunities(gameId);
        const gameState = {
            teams: new Map(allTeams.map(t => [t.teamId, t])),
            opportunities: opportunities,
            currentQuarter: game.currentQuarter,
        };
        const finalDebrief = (0, debrief_1.generateFacilitatorPrompts)(gameState);
        io.to(`${gameId}-facilitator`).emit('final_debrief', finalDebrief);
        console.log(`📋 Final debrief prompts sent for game ${gameId}`);
    }
    catch (debriefError) {
        console.error('Error generating final debrief prompts:', debriefError);
    }
    // Auto-generate and save reports
    try {
        const reports = (0, insights_1.generateAllTeamReports)(allTeams);
        const gameName = game.config?.gameName || `Game ${gameId}`;
        ReportsRepository_1.reportsRepository.saveReports(gameId, gameName, winnerName, reports);
        console.log(`📊 Reports saved for game ${gameId}`);
    }
    catch (error) {
        console.error(`Error saving reports for game ${gameId}:`, error);
    }
    io.to(gameId).emit('gameEnded', leaderboard);
}
function generateMarketBrief(game, quarter) {
    let brief = `**Quarter ${quarter} Market Brief**\n\n`;
    brief += `The agency landscape continues to evolve.\n\n`;
    if (quarter === 2) {
        brief += `💡 **Tip**: Consider investing in tools and training to improve your win rates.\n\n`;
    }
    if (quarter === 3 || quarter === 4) {
        brief += `📈 **Growth Phase**: Now is a good time to expand your team and market presence.\n\n`;
    }
    if (quarter >= 5) {
        brief += `⚠️ **Late Game**: Focus on profitability and protecting your reputation.\n\n`;
    }
    if (quarter === 7) {
        brief += `🏁 **Final Stretch**: Last chance to make strategic moves!\n\n`;
    }
    return brief;
}
// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        games: GameRepository_1.gameRepository.getGameCount(),
        sessions: teamSessions.size,
    });
});
// =============================================================================
// REPORTS API
// =============================================================================
// List all available reports
app.get('/api/reports', (req, res) => {
    try {
        const list = ReportsRepository_1.reportsRepository.listReports();
        res.json({ success: true, reports: list });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to list reports' });
    }
});
// Get all reports for a game
app.get('/api/reports/:gameId', (req, res) => {
    try {
        const { gameId } = req.params;
        // First try saved reports
        const savedReports = ReportsRepository_1.reportsRepository.getReports(gameId);
        if (savedReports) {
            return res.json({ success: true, ...savedReports });
        }
        // Otherwise generate from live game data
        const game = GameRepository_1.gameRepository.getGame(gameId);
        if (!game) {
            return res.status(404).json({ success: false, error: 'Game not found' });
        }
        const allTeams = GameRepository_1.gameRepository.getAllTeams(gameId);
        if (allTeams.length === 0) {
            return res.status(404).json({ success: false, error: 'No teams found' });
        }
        const reports = (0, insights_1.generateAllTeamReports)(allTeams);
        const leaderboard = (0, engine_1.getLeaderboard)(allTeams);
        const winner = leaderboard.length > 0
            ? allTeams.find(t => t.teamId === leaderboard[0].teamId)?.companyName || ''
            : '';
        return res.json({
            success: true,
            gameId,
            gameName: game.config?.gameName || `Game ${gameId}`,
            endedAt: new Date().toISOString(),
            totalTeams: reports.length,
            winner,
            reports,
        });
    }
    catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ error: 'Failed to get reports' });
    }
});
// Get single team report
app.get('/api/reports/:gameId/:teamId', (req, res) => {
    try {
        const { gameId, teamId } = req.params;
        // First try saved
        const savedReport = ReportsRepository_1.reportsRepository.getTeamReport(gameId, teamId);
        if (savedReport) {
            return res.json({ success: true, report: savedReport });
        }
        // Otherwise generate from live game data
        const allTeams = GameRepository_1.gameRepository.getAllTeams(gameId);
        if (allTeams.length === 0) {
            return res.status(404).json({ success: false, error: 'Game not found' });
        }
        const reports = (0, insights_1.generateAllTeamReports)(allTeams);
        const report = reports.find(r => r.teamId === teamId);
        if (!report) {
            return res.status(404).json({ success: false, error: 'Team not found' });
        }
        return res.json({ success: true, report });
    }
    catch (error) {
        console.error('Error getting team report:', error);
        res.status(500).json({ error: 'Failed to get report' });
    }
});
// =============================================================================
// START SERVER
// =============================================================================
server.listen(PORT, () => {
    console.log(`🚀 Pitch Perfect server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map