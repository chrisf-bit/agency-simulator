// server/src/index.ts
// Agency Leadership Server - with Test Mode support

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

import { GameConfig, TeamState, TeamInputs, GameEvent, ClientOpportunity, LeaderboardEntry } from './types';
import { GameRepository, gameRepository } from './repository/GameRepository';
import { reportsRepository } from './repository/ReportsRepository';
import { processQuarter, getLeaderboard, getDefaultInputs } from './game/engine';
import { generateOpportunities, generateExistingClientProjects } from './game/opportunities';
import { processRandomEvents, getEventConfig } from './game/events';
import { generateNotifications } from './game/notifications';
import { createInitialTeamState } from './game/initialState';
import { SeededRandom } from './utils/randomSeed';
import { generateTeamReport, generateAllTeamReports } from './game/insights';
import { generateFacilitatorPrompts, generateQuarterlyPrompts } from './debrief';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

const PORT = process.env.PORT || 3001;

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

interface TeamSession {
  sessionToken: string;
  teamId: string;
  gameId: string;
  companyName: string;
  teamNumber: number;
  socketId: string | null;
  lastSeen: number;
  isConnected: boolean;
}

const teamSessions = new Map<string, TeamSession>();
const gameSessions = new Map<string, Set<string>>();
const socketToSession = new Map<string, string>();

// Track team numbers per game
const gameTeamCounters = new Map<string, number>();

function generateSessionToken(): string {
  return uuidv4();
}

function getNextTeamNumber(gameId: string): number {
  const current = gameTeamCounters.get(gameId) || 0;
  const next = current + 1;
  gameTeamCounters.set(gameId, next);
  return next;
}

function createTeamSession(gameId: string, teamId: string, companyName: string, teamNumber: number, socketId: string): string {
  const sessionToken = generateSessionToken();

  const session: TeamSession = {
    sessionToken,
    teamId,
    gameId,
    companyName, // Custom name from user
    teamNumber,
    socketId,
    lastSeen: Date.now(),
    isConnected: true,
  };

  teamSessions.set(sessionToken, session);
  socketToSession.set(socketId, sessionToken);

  if (!gameSessions.has(gameId)) {
    gameSessions.set(gameId, new Set());
  }
  gameSessions.get(gameId)!.add(sessionToken);

  console.log(`🎫 Session created for ${companyName} in game ${gameId}`);
  return sessionToken;
}

function getSessionByToken(token: string): TeamSession | undefined {
  return teamSessions.get(token);
}

function getSessionBySocketId(socketId: string): TeamSession | undefined {
  const token = socketToSession.get(socketId);
  return token ? teamSessions.get(token) : undefined;
}

function updateSessionSocket(sessionToken: string, socketId: string): void {
  const session = teamSessions.get(sessionToken);
  if (session) {
    if (session.socketId) {
      socketToSession.delete(session.socketId);
    }
    session.socketId = socketId;
    session.lastSeen = Date.now();
    session.isConnected = true;
    socketToSession.set(socketId, sessionToken);
  }
}

function markSessionDisconnected(socketId: string): void {
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

function getGameConnectionStatus(gameId: string): Array<{ teamId: string; companyName: string; teamNumber: number; isConnected: boolean; lastSeen: number }> {
  const sessionTokens = gameSessions.get(gameId);
  if (!sessionTokens) return [];

  return Array.from(sessionTokens).map(token => {
    const session = teamSessions.get(token)!;
    return {
      teamId: session.teamId,
      companyName: session.companyName,
      teamNumber: session.teamNumber,
      isConnected: session.isConnected,
      lastSeen: session.lastSeen,
    };
  });
}

// =============================================================================
// OPPORTUNITY HELPERS
// =============================================================================

/**
 * Get opportunities for a specific team, including project opportunities from their existing clients
 */
function getTeamOpportunities(gameId: string, team: TeamState, quarter: number): ClientOpportunity[] {
  const globalOpps = gameRepository.getOpportunities(gameId);
  
  // Generate project opportunities from team's existing satisfied clients
  const game = gameRepository.getGame(gameId);
  const random = new SeededRandom((game?.config.randomSeed || 0) + quarter + team.teamNumber);
  const projectOpps = generateExistingClientProjects(team.clients || [], quarter, random);
  
  return [...globalOpps, ...projectOpps];
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
    if (callback) callback();
  });

  // =====================================================
  // CREATE GAME (Facilitator)
  // =====================================================
  socket.on('createGame', (configData, callback) => {
    try {
      const gameId = uuidv4().slice(0, 8).toUpperCase();
      const randomSeed = Date.now();
      const numberOfTeams = configData.numberOfTeams || 4;
      
      // Test mode: 1 team = auto-advance enabled
      const testMode = numberOfTeams === 1;

      const config: GameConfig = {
        gameId,
        gameName: configData.gameName || 'Agency Leadership Game',
        level: configData.level || 2,
        numberOfTeams,
        maxQuarters: configData.maxQuarters || 8,
        randomSeed,
        events: getEventConfig(configData.level || 2),
        testMode,
      };

      const game = gameRepository.createGame(config);

      // Generate initial opportunities
      const random = new SeededRandom(randomSeed);
      const opportunities = generateOpportunities(1, config.level, random);
      gameRepository.setOpportunities(gameId, opportunities);

      // Initialize team counter
      gameTeamCounters.set(gameId, 0);

      // Join the facilitator room
      socket.join(gameId);
      socket.join(`${gameId}-facilitator`);

      console.log(`🎮 Game created: ${gameId} (Test Mode: ${testMode})`);

      callback({ gameId, testMode });
    } catch (error) {
      console.error('Error creating game:', error);
      callback({ error: 'Failed to create game' });
    }
  });

  // =====================================================
  // JOIN GAME (Team) - Now accepts custom company name
  // =====================================================
  socket.on('joinGame', (gameId: string, companyName: string, callback) => {
    try {
      const game = gameRepository.getGame(gameId);

      if (!game) {
        callback({ error: 'Game not found. Please check the Game ID.' });
        return;
      }

      if (game.gameEnded) {
        callback({ error: 'Game has ended' });
        return;
      }

      const existingTeams = gameRepository.getAllTeams(gameId);

      // Check max teams
      if (existingTeams.length >= game.config.numberOfTeams) {
        callback({ error: `Maximum ${game.config.numberOfTeams} teams allowed` });
        return;
      }

      // Validate company name
      const trimmedName = (companyName || '').trim();
      if (!trimmedName || trimmedName.length < 2) {
        callback({ error: 'Please enter a valid agency name (at least 2 characters)' });
        return;
      }

      // Check for duplicate names
      const nameExists = existingTeams.some(
        t => t.companyName.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        callback({ error: 'An agency with this name already exists. Please choose a different name.' });
        return;
      }

      // Create team with sequential number but custom name
      const teamId = uuidv4().slice(0, 8).toUpperCase();
      const teamNumber = getNextTeamNumber(gameId);
      const random = new SeededRandom(game.config.randomSeed); // Same seed = identical start
      const teamState = createInitialTeamState(teamId, trimmedName, teamNumber, game.config.level, random, game.config.maxQuarters);

      gameRepository.addTeam(gameId, teamState);

      // Create session with custom name
      const sessionToken = createTeamSession(gameId, teamId, trimmedName, teamNumber, socket.id);

      // Join socket rooms
      socket.join(gameId);
      socket.join(`${gameId}-${teamId}`);

      console.log(`👥 "${trimmedName}" (Team ${teamNumber}) joined game ${gameId}`);

      // Notify facilitator with updated teams list
      const allTeamsForFacilitator = gameRepository.getAllTeams(gameId);
      io.to(`${gameId}-facilitator`).emit('teamJoined', {
        teamId,
        companyName: teamState.companyName,
        teamNumber,
        teams: allTeamsForFacilitator,
        connectionStatus: getGameConnectionStatus(gameId),
      });

      // Get current opportunities (including team's existing client projects)
      const opportunities = getTeamOpportunities(gameId, teamState, game.currentQuarter);
      const activeEvents = gameRepository.getActiveEvents(gameId);

      callback({
        success: true,
        teamState,
        sessionToken,
        opportunities,
        activeEvents,
        testMode: game.config.testMode,
      });
    } catch (error) {
      console.error('Error joining game:', error);
      callback({ error: 'Failed to join game' });
    }
  });

  // =====================================================
  // JOIN TEST MODE - Quick single-player game
  // =====================================================
  socket.on('joinTestMode', (callback) => {
    try {
      // Auto-create a test game
      const gameId = `TEST-${uuidv4().slice(0, 4).toUpperCase()}`;
      const randomSeed = Date.now();

      const config: GameConfig = {
        gameId,
        gameName: 'Test Game',
        level: 2, // Normal difficulty
        numberOfTeams: 1,
        maxQuarters: 8,
        randomSeed,
        events: getEventConfig(2),
        testMode: true,
      };

      gameRepository.createGame(config);
      gameTeamCounters.set(gameId, 0);

      // Generate opportunities
      const random = new SeededRandom(randomSeed);
      const baseOpportunities = generateOpportunities(1, 2, random);
      gameRepository.setOpportunities(gameId, baseOpportunities);

      // Create team with test name
      const teamId = uuidv4().slice(0, 8).toUpperCase();
      const teamNumber = getNextTeamNumber(gameId);
      const companyName = 'Test Agency';
      const teamState = createInitialTeamState(teamId, companyName, teamNumber, 2, random, config.maxQuarters);

      gameRepository.addTeam(gameId, teamState);

      // Create session
      const sessionToken = createTeamSession(gameId, teamId, companyName, teamNumber, socket.id);

      // Join socket rooms
      socket.join(gameId);
      socket.join(`${gameId}-${teamId}`);

      console.log(`🧪 Test mode game created: ${gameId}`);

      const activeEvents = gameRepository.getActiveEvents(gameId);
      
      // Get opportunities including potential project opps from starter clients
      const opportunities = getTeamOpportunities(gameId, teamState, 1);

      callback({
        success: true,
        gameId,
        teamState,
        sessionToken,
        opportunities,
        activeEvents,
        testMode: true,
      });
    } catch (error) {
      console.error('Error creating test mode game:', error);
      callback({ error: 'Failed to create test game' });
    }
  });

  // =====================================================
  // RECONNECT TEAM (Using session token)
  // =====================================================
  socket.on('reconnectWithToken', (sessionToken: string, callback) => {
    try {
      const session = getSessionByToken(sessionToken);

      if (!session) {
        callback({ error: 'Session expired. Please rejoin the game.' });
        return;
      }

      const { gameId, teamId } = session;
      const game = gameRepository.getGame(gameId);

      if (!game) {
        callback({ error: 'Game no longer exists' });
        return;
      }

      const teamState = gameRepository.getTeam(gameId, teamId);

      if (!teamState) {
        callback({ error: 'Team no longer exists' });
        return;
      }

      // Update session with new socket
      updateSessionSocket(sessionToken, socket.id);

      // Rejoin socket rooms
      socket.join(gameId);
      socket.join(`${gameId}-${teamId}`);

      const opportunities = getTeamOpportunities(gameId, teamState, game.currentQuarter);
      const activeEvents = gameRepository.getActiveEvents(gameId);

      console.log(`🔄 Team ${session.teamNumber} reconnected to game ${gameId}`);

      // Notify facilitator of reconnection
      io.to(`${gameId}-facilitator`).emit('teamReconnected', {
        teamId,
        companyName: session.companyName,
        teamNumber: session.teamNumber,
        connectionStatus: getGameConnectionStatus(gameId),
      });

      callback({
        success: true,
        teamState,
        gameId,
        opportunities,
        activeEvents,
        gameEnded: game.gameEnded,
        testMode: game.config.testMode,
      });
    } catch (error) {
      console.error('Error reconnecting:', error);
      callback({ error: 'Failed to reconnect' });
    }
  });

  // =====================================================
  // FACILITATOR RECONNECT
  // =====================================================
  socket.on('reconnectFacilitator', (gameId: string, callback) => {
    try {
      const game = gameRepository.getGame(gameId);

      if (!game) {
        if (callback) callback({ error: 'Game not found' });
        return;
      }

      socket.join(gameId);
      socket.join(`${gameId}-facilitator`);

      const teams = gameRepository.getAllTeams(gameId);
      const opportunities = gameRepository.getOpportunities(gameId);
      const activeEvents = gameRepository.getActiveEvents(gameId);

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
    } catch (error) {
      console.error('Error reconnecting facilitator:', error);
      if (callback) callback({ error: 'Failed to reconnect' });
    }
  });

  // =====================================================
  // JOIN AS FACILITATOR (after creating game)
  // =====================================================
  socket.on('joinAsFacilitator', (gameId: string, callback) => {
    try {
      const game = gameRepository.getGame(gameId);

      if (!game) {
        if (callback) callback({ error: 'Game not found' });
        return;
      }

      socket.join(gameId);
      socket.join(`${gameId}-facilitator`);

      const teams = gameRepository.getAllTeams(gameId);
      const activeEvents = gameRepository.getActiveEvents(gameId);

      console.log(`🎮 Facilitator joined game ${gameId}`);

      if (callback) {
        callback({
          success: true,
          teams,
          currentQuarter: game.currentQuarter,
          activeEvents,
        });
      }
    } catch (error) {
      console.error('Error joining as facilitator:', error);
      if (callback) callback({ error: 'Failed to join as facilitator' });
    }
  });

  // =====================================================
  // GET FACILITATOR DATA (refresh teams, quarter, events)
  // =====================================================
  socket.on('getFacilitatorData', (gameId: string, callback) => {
    try {
      const game = gameRepository.getGame(gameId);

      if (!game) {
        if (callback) callback({ error: 'Game not found' });
        return;
      }

      const teams = gameRepository.getAllTeams(gameId);
      const activeEvents = gameRepository.getActiveEvents(gameId);

      if (callback) {
        callback({
          success: true,
          teams,
          currentQuarter: game.currentQuarter,
          activeEvents,
          allTeamsSubmitted: game.allTeamsSubmitted,
        });
      }
    } catch (error) {
      console.error('Error getting facilitator data:', error);
      if (callback) callback({ error: 'Failed to get data' });
    }
  });

  // =====================================================
  // FACILITATOR ADVANCE QUARTER
  // =====================================================
  socket.on('facilitatorAdvanceQuarter', (gameId: string) => {
    try {
      const game = gameRepository.getGame(gameId);

      if (!game) {
        console.error('Game not found for advance:', gameId);
        return;
      }

      // Check all teams submitted
      const teams = gameRepository.getAllTeams(gameId);
      const allSubmitted = teams.every(t => t.submittedThisQuarter);

      if (!allSubmitted) {
        console.log('Cannot advance - not all teams submitted');
        return;
      }

      // Process the quarter
      io.to(gameId).emit('processingQuarter');
      console.log(`📊 Facilitator advancing quarter for game ${gameId}`);
      
      // Call processQuarterInternal directly
      processQuarterInternal(gameId, socket);

    } catch (error) {
      console.error('Error advancing quarter:', error);
    }
  });

  // =====================================================
  // GET GAME STATE (Facilitator)
  // =====================================================
  socket.on('getGameState', (gameId: string, callback) => {
    try {
      const game = gameRepository.getGame(gameId);

      if (!game) {
        callback({ error: 'Game not found' });
        return;
      }

      const teams = gameRepository.getAllTeams(gameId);
      const opportunities = gameRepository.getOpportunities(gameId);
      const activeEvents = gameRepository.getActiveEvents(gameId);

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
        testMode: game.config.testMode,
      });
    } catch (error) {
      console.error('Error getting game state:', error);
      callback({ error: 'Failed to get game state' });
    }
  });

  // =====================================================
  // GET TEAM STATE
  // =====================================================
  socket.on('getTeamState', (gameId: string, teamId: string, callback) => {
    try {
      const teamState = gameRepository.getTeam(gameId, teamId);
      const game = gameRepository.getGame(gameId);

      if (!teamState) {
        callback({ error: 'Team not found' });
        return;
      }

      const opportunities = getTeamOpportunities(gameId, teamState, game?.currentQuarter || 1);
      const activeEvents = gameRepository.getActiveEvents(gameId);

      callback({
        teamState,
        opportunities,
        activeEvents,
        testMode: game?.config.testMode,
      });
    } catch (error) {
      console.error('Error getting team state:', error);
      callback({ error: 'Failed to get team state' });
    }
  });

  // =====================================================
  // SUBMIT INPUTS (Team)
  // =====================================================
  socket.on('submitInputs', (gameId: string, teamId: string, inputs: TeamInputs, callback) => {
    try {
      const game = gameRepository.getGame(gameId);
      const team = gameRepository.getTeam(gameId, teamId);

      if (!team) {
        if (callback) callback({ error: 'Team not found' });
        return;
      }

      if (team.submittedThisQuarter) {
        if (callback) callback({ error: 'Already submitted this quarter' });
        return;
      }

      // Update team with inputs
      gameRepository.updateTeam(gameId, teamId, {
        currentInputs: inputs,
        submittedThisQuarter: true,
      });

      console.log(`📤 Team ${team.teamNumber} submitted inputs for Q${team.quarter}`);

      // Notify facilitator with updated teams list
      const teamsAfterSubmit = gameRepository.getAllTeams(gameId);
      io.to(`${gameId}-facilitator`).emit('inputsSubmitted', { 
        teamId, 
        companyName: team.companyName,
        teamNumber: team.teamNumber,
        teams: teamsAfterSubmit,
      });

      const allSubmitted = gameRepository.checkAllTeamsSubmitted(gameId);
      
      if (allSubmitted) {
        io.to(`${gameId}-facilitator`).emit('allTeamsSubmitted');
        console.log(`✅ All teams submitted in game ${gameId}`);
        
        // Notify everyone that processing is starting
        io.to(gameId).emit('processingQuarter');
        
        // TEST MODE: Auto-process immediately
        if (game?.config.testMode) {
          console.log(`🧪 Test mode: Auto-processing quarter for game ${gameId}`);
          setTimeout(() => {
            processQuarterInternal(gameId, socket);
          }, 500);
        } else {
          // Normal mode: Auto-process after short delay
          setTimeout(() => {
            processQuarterInternal(gameId, socket);
          }, 1500);
        }
      }

      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error submitting inputs:', error);
      if (callback) callback({ error: 'Failed to submit inputs' });
    }
  });

  // =====================================================
  // PROCESS QUARTER (Internal function)
  // =====================================================
  function processQuarterInternal(gameId: string, triggerSocket: any) {
    try {
      const game = gameRepository.getGame(gameId);
      if (!game) return;

      const teams = gameRepository.getAllTeams(gameId);
      const opportunities = gameRepository.getOpportunities(gameId);
      const activeEvents = gameRepository.getActiveEvents(gameId);
      const random = new SeededRandom(game.config.randomSeed + game.currentQuarter);

      console.log(`⚙️ Processing Q${game.currentQuarter} for game ${gameId}`);

      // Process each team
      teams.forEach(team => {
        if (team.isBankrupt) return;

        const updatedTeam = processQuarter(
          team,
          team.currentInputs,
          teams,
          opportunities,
          activeEvents,
          game.config.level,
          random
        );

        gameRepository.updateTeam(gameId, team.teamId, updatedTeam);

        // Generate notifications
        const notifications = generateNotifications(updatedTeam, activeEvents);

        // Send results to team
        io.to(`${gameId}-${team.teamId}`).emit('resultsReady', {
          teamState: updatedTeam,
          notifications,
        });
      });

      // Notify facilitator with all updated team data
      const allUpdatedTeams = gameRepository.getAllTeams(gameId);
      io.to(`${gameId}-facilitator`).emit('quarterProcessed', {
        quarter: game.currentQuarter,
        teams: allUpdatedTeams,
        activeEvents: activeEvents,
      });

      // Generate debrief prompts for facilitator (skip in test mode)
      if (!game.config.testMode) {
        try {
          const updatedTeams = gameRepository.getAllTeams(gameId);
          const gameState = {
            teams: new Map(updatedTeams.map(t => [t.teamId, t])),
            opportunities: opportunities,
            currentQuarter: game.currentQuarter,
          };
          const debriefPrompts = generateQuarterlyPrompts(gameState as any, game.currentQuarter);
          io.to(`${gameId}-facilitator`).emit('debrief_prompts', debriefPrompts);
        } catch (debriefError) {
          console.error('Error generating debrief prompts:', debriefError);
        }
      }

      // Advance quarter
      const newQuarter = game.currentQuarter + 1;

      // Check if game should end
      if (newQuarter > game.config.maxQuarters) {
        endGame(gameId);
        return;
      }

      // Generate new opportunities and events for next quarter
      const newRandom = new SeededRandom(game.config.randomSeed + newQuarter);
      const newOpportunities = generateOpportunities(newQuarter, game.config.level, newRandom);
      const newEvents = processRandomEvents(newQuarter, game.config, activeEvents, newRandom);

      gameRepository.setOpportunities(gameId, newOpportunities);
      gameRepository.setActiveEvents(gameId, newEvents);
      gameRepository.resetTeamsForNewQuarter(gameId);
      gameRepository.updateGame(gameId, { currentQuarter: newQuarter });

      // Notify each team individually with their team-specific opportunities
      const marketBrief = generateMarketBrief(game, newQuarter);
      const freshTeams = gameRepository.getAllTeams(gameId);
      
      freshTeams.forEach(team => {
        const teamOpportunities = getTeamOpportunities(gameId, team, newQuarter);
        io.to(`${gameId}-${team.teamId}`).emit('quarterStarted', {
          quarter: newQuarter,
          brief: marketBrief,
          events: newEvents,
          opportunities: teamOpportunities,
        });
      });

      // Notify facilitator with fresh team data (global opportunities only)
      io.to(`${gameId}-facilitator`).emit('quarterStarted', {
        quarter: newQuarter,
        teams: freshTeams,
        activeEvents: newEvents,
      });

      // Test mode indicator
      if (game.config.testMode) {
        io.to(gameId).emit('testModeAdvanced', newQuarter);
      }

      console.log(`📅 Quarter ${newQuarter} started in game ${gameId}`);
    } catch (error) {
      console.error('Error processing quarter:', error);
    }
  }

  // =====================================================
  // PROCESS QUARTER (Socket event)
  // =====================================================
  socket.on('processQuarter', (gameId: string, callback) => {
    processQuarterInternal(gameId, socket);
    if (callback) callback({ success: true });
  });

  // =====================================================
  // END GAME (Facilitator)
  // =====================================================
  socket.on('endGame', (gameId: string, callback) => {
    try {
      endGame(gameId);
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error ending game:', error);
      if (callback) callback({ error: 'Failed to end game' });
    }
  });

  // =====================================================
  // FORCE REFRESH ALL TEAMS
  // =====================================================
  socket.on('forceRefreshAllTeams', (gameId: string) => {
    console.log(`🔄 Force refresh triggered for game ${gameId}`);
    io.to(gameId).emit('forceRefresh');
  });

  // =====================================================
  // RESET TEAM SUBMISSION
  // =====================================================
  socket.on('resetTeamSubmission', (gameId: string, teamId: string, callback) => {
    try {
      const team = gameRepository.getTeam(gameId, teamId);
      if (!team) {
        callback({ error: 'Team not found' });
        return;
      }

      gameRepository.updateTeam(gameId, teamId, {
        submittedThisQuarter: false,
        currentInputs: getDefaultInputs(),
      });

      // Notify the team
      io.to(`${gameId}-${teamId}`).emit('submissionReset');

      console.log(`🔄 Reset submission for Team ${team.teamNumber} in game ${gameId}`);
      callback({ success: true });
    } catch (error) {
      console.error('Error resetting submission:', error);
      callback({ error: 'Failed to reset submission' });
    }
  });

  // =====================================================
  // FORCE ADVANCE QUARTER
  // =====================================================
  socket.on('forceAdvanceQuarter', (gameId: string, callback) => {
    try {
      const game = gameRepository.getGame(gameId);
      if (!game) {
        callback({ error: 'Game not found' });
        return;
      }

      // Auto-submit default inputs for teams that haven't submitted
      const teams = gameRepository.getAllTeams(gameId);
      teams.forEach(team => {
        if (!team.submittedThisQuarter && !team.isBankrupt) {
          gameRepository.updateTeam(gameId, team.teamId, {
            submittedThisQuarter: true,
            currentInputs: team.currentInputs || getDefaultInputs(),
          });
        }
      });

      // Now process the quarter
      processQuarterInternal(gameId, socket);
      callback({ success: true });
    } catch (error) {
      console.error('Error force advancing:', error);
      callback({ error: 'Failed to force advance' });
    }
  });

  // =====================================================
  // EXPORT/IMPORT GAME
  // =====================================================
  socket.on('exportGame', (gameId: string, callback) => {
    try {
      const exportData = gameRepository.exportGame(gameId);
      if (!exportData) {
        callback({ error: 'Game not found' });
        return;
      }
      callback({ success: true, data: exportData });
    } catch (error) {
      console.error('Error exporting game:', error);
      callback({ error: 'Failed to export game' });
    }
  });

  socket.on('importGame', (gameId: string, data: any, callback) => {
    try {
      const success = gameRepository.importGame(gameId, data);
      if (success) {
        io.to(gameId).emit('gameRestored');
        callback({ success: true });
      } else {
        callback({ error: 'Failed to import game data' });
      }
    } catch (error) {
      console.error('Error importing game:', error);
      callback({ error: 'Failed to import game' });
    }
  });

  // =====================================================
  // TEAM REPORTS
  // =====================================================
  socket.on('generateTeamReport', (gameId: string, teamId: string, callback) => {
    try {
      const teams = gameRepository.getAllTeams(gameId);
      const team = teams.find(t => t.teamId === teamId);

      if (!team) {
        callback({ error: 'Team not found' });
        return;
      }

      const sortedTeams = [...teams].sort((a, b) =>
        (b.cumulativeProfit || 0) - (a.cumulativeProfit || 0)
      );
      const rank = sortedTeams.findIndex(t => t.teamId === teamId) + 1;

      const report = generateTeamReport(team, teams, rank);
      callback({ success: true, report });
    } catch (error) {
      console.error('Error generating team report:', error);
      callback({ error: 'Failed to generate report' });
    }
  });

  socket.on('generateAllReports', (gameId: string, callback) => {
    try {
      const teams = gameRepository.getAllTeams(gameId);

      if (teams.length === 0) {
        callback({ error: 'No teams found' });
        return;
      }

      const reports = generateAllTeamReports(teams);
      callback({ success: true, reports });
    } catch (error) {
      console.error('Error generating all reports:', error);
      callback({ error: 'Failed to generate reports' });
    }
  });

  // =====================================================
  // GET CONNECTION STATUS
  // =====================================================
  socket.on('getConnectionStatus', (gameId: string, callback) => {
    try {
      const status = getGameConnectionStatus(gameId);
      callback({ success: true, connectionStatus: status });
    } catch (error) {
      console.error('Error getting connection status:', error);
      callback({ error: 'Failed to get connection status' });
    }
  });

  // =====================================================
  // HEARTBEAT FROM TEAM
  // =====================================================
  socket.on('heartbeat', (sessionToken: string) => {
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
        teamNumber: session.teamNumber,
        connectionStatus: getGameConnectionStatus(session.gameId),
      });

      console.log(`🔴 Team ${session.teamNumber} disconnected from game ${session.gameId}`);
    }
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function endGame(gameId: string): void {
  const game = gameRepository.getGame(gameId);
  if (!game) return;

  const allTeams = gameRepository.getAllTeams(gameId);
  const leaderboard = getLeaderboard(allTeams);
  const winnerId = leaderboard.length > 0 ? leaderboard[0].teamId : '';

  gameRepository.updateGame(gameId, {
    gameEnded: true,
    winner: winnerId,
  });

  const winner = allTeams.find(t => t.teamId === winnerId);
  console.log(`🏆 Game ended: ${gameId}. Winner: ${winner?.companyName || 'Unknown'}`);

  // Generate final debrief prompts (skip in test mode)
  if (!game.config.testMode) {
    try {
      const opportunities = gameRepository.getOpportunities(gameId);
      const gameState = {
        teams: new Map(allTeams.map(t => [t.teamId, t])),
        opportunities: opportunities,
        currentQuarter: game.currentQuarter,
      };
      const finalDebrief = generateFacilitatorPrompts(gameState as any);
      io.to(`${gameId}-facilitator`).emit('final_debrief', finalDebrief);
    } catch (debriefError) {
      console.error('Error generating final debrief prompts:', debriefError);
    }
  }

  // Auto-generate and save reports
  try {
    const reports = generateAllTeamReports(allTeams);
    const gameName = game.config?.gameName || `Game ${gameId}`;
    reportsRepository.saveReports(gameId, gameName, winner?.companyName || '', reports);
    console.log(`📊 Reports saved for game ${gameId}`);
  } catch (error) {
    console.error(`Error saving reports for game ${gameId}:`, error);
  }

  io.to(gameId).emit('gameEnded', leaderboard);
}

function generateMarketBrief(game: any, quarter: number): string {
  let brief = `**Quarter ${quarter} Market Brief**\n\n`;
  brief += `The agency landscape continues to evolve.\n\n`;

  if (quarter === 2) {
    brief += `💡 **Tip**: Consider investing in client satisfaction to retain existing business.\n\n`;
  }

  if (quarter === 3 || quarter === 4) {
    brief += `📈 **Growth Phase**: Balance between retaining clients and winning new ones.\n\n`;
  }

  if (quarter >= 5) {
    brief += `⚠️ **Late Game**: Focus on profitability and client relationships.\n\n`;
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
    games: gameRepository.getGameCount(),
    sessions: teamSessions.size,
  });
});

// =============================================================================
// REPORTS API
// =============================================================================

app.get('/api/reports', (req, res) => {
  try {
    const list = reportsRepository.listReports();
    res.json({ success: true, reports: list });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

app.get('/api/reports/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;

    const savedReports = reportsRepository.getReports(gameId);
    if (savedReports) {
      return res.json({ success: true, ...savedReports });
    }

    const game = gameRepository.getGame(gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const allTeams = gameRepository.getAllTeams(gameId);
    if (allTeams.length === 0) {
      return res.status(404).json({ success: false, error: 'No teams found' });
    }

    const reports = generateAllTeamReports(allTeams);
    const leaderboard = getLeaderboard(allTeams);
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
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

app.get('/api/reports/:gameId/:teamId', (req, res) => {
  try {
    const { gameId, teamId } = req.params;

    const savedReport = reportsRepository.getTeamReport(gameId, teamId);
    if (savedReport) {
      return res.json({ success: true, report: savedReport });
    }

    const allTeams = gameRepository.getAllTeams(gameId);
    if (allTeams.length === 0) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const reports = generateAllTeamReports(allTeams);
    const report = reports.find(r => r.teamId === teamId);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    return res.json({ success: true, report });
  } catch (error) {
    console.error('Error getting team report:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

server.listen(PORT, () => {
  console.log(`🚀 Agency Leadership server running on port ${PORT}`);
});
