// client/src/App.tsx
// Main application component with routing and socket management

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  TeamState, 
  ClientOpportunity, 
  GameEvent, 
  Notification,
  AMBER_COLORS,
  AMBER_GRADIENT,
  formatCurrency,
} from './types';
import GameBoard from './components/GameBoard';
import FacilitatorView from './components/FacilitatorView';

const SERVER_URL = import.meta.env.PROD 
  ? 'https://agency-simulator.onrender.com'
  : 'http://localhost:3001';

// Access code for facilitator game creation - change this to control access
const ACCESS_CODE = 'AMBER2025';

type AppState = 'landing' | 'joining' | 'playing' | 'facilitating' | 'ended';

interface LeaderboardEntry {
  rank: number;
  teamId: string;
  companyName: string;
  teamNumber: number;
  cumulativeProfit: number;
  reputation: number;
  clients: number;
  clientCount: number;
  cash: number;
  burnout: number;
  staff: number;
  isBankrupt: boolean;
  totalScore: number;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [appState, setAppState] = useState<AppState>('landing');
  const [gameId, setGameId] = useState('');
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [opportunities, setOpportunities] = useState<ClientOpportunity[]>([]);
  const [activeEvents, setActiveEvents] = useState<GameEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [_sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Facilitator state
  const [allTeams, setAllTeams] = useState<TeamState[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState(1);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      
      // Try to reconnect with session token
      const savedToken = localStorage.getItem('sessionToken');
      if (savedToken) {
        newSocket.emit('reconnectWithToken', savedToken, (response: any) => {
          if (response.success) {
            setTeamState(response.teamState);
            setOpportunities(response.opportunities || []);
            setActiveEvents(response.activeEvents || []);
            setGameId(response.gameId);
            setSessionToken(savedToken);
            setTestMode(response.testMode || false);
            setAppState(response.gameEnded ? 'ended' : 'playing');
          } else {
            localStorage.removeItem('sessionToken');
          }
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    // Game events
    newSocket.on('quarterStarted', (data) => {
      console.log('📅 Quarter started:', data.quarter);
      setOpportunities(data.opportunities || []);
      setActiveEvents(data.events || []);
      
      // Refresh team state
      if (teamState) {
        newSocket.emit('getTeamState', gameId, teamState.teamId, (response: any) => {
          if (response.teamState) {
            setTeamState(response.teamState);
          }
        });
      }
    });

    newSocket.on('resultsReady', (data) => {
      console.log('📊 Results ready');
      setTeamState(data.teamState);
      if (data.notifications) {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
    });

    newSocket.on('gameEnded', (leaderboardData: LeaderboardEntry[]) => {
      console.log('🏆 Game ended', leaderboardData);
      setLeaderboard(leaderboardData);
      setAppState('ended');
    });

    newSocket.on('forceRefresh', () => {
      if (teamState && gameId) {
        newSocket.emit('getTeamState', gameId, teamState.teamId, (response: any) => {
          if (response.teamState) {
            setTeamState(response.teamState);
            setOpportunities(response.opportunities || []);
            setActiveEvents(response.activeEvents || []);
          }
        });
      }
    });

    newSocket.on('testModeAdvanced', (quarter) => {
      console.log('🧪 Test mode advanced to quarter:', quarter);
    });

    // Facilitator-specific events - these handlers receive all needed data in the event
    newSocket.on('teamJoined', ({ companyName, teams }) => {
      console.log('👋 Team joined:', companyName);
      if (teams) {
        setAllTeams(teams);
      }
    });

    newSocket.on('teamDisconnected', ({ companyName }) => {
      console.log('🔌 Team disconnected:', companyName);
    });

    newSocket.on('teamReconnected', ({ companyName }) => {
      console.log('🔌 Team reconnected:', companyName);
    });

    newSocket.on('inputsSubmitted', ({ companyName, teams }) => {
      console.log('✅ Team submitted:', companyName);
      if (teams) {
        setAllTeams(teams);
      }
    });

    newSocket.on('allTeamsSubmitted', () => {
      console.log('✅ All teams submitted!');
    });

    newSocket.on('quarterProcessed', (data) => {
      console.log('📊 Quarter processed:', data.quarter);
      if (data.teams) {
        setAllTeams(data.teams);
        setCurrentQuarter(data.quarter + 1);
        setActiveEvents(data.activeEvents || []);
      }
    });

    // Facilitator receives fresh team data when quarter starts
    newSocket.on('facilitatorQuarterStarted', (data) => {
      console.log('📅 New quarter started:', data.quarter);
      if (data.teams) {
        setAllTeams(data.teams);
        setCurrentQuarter(data.quarter);
        setActiveEvents(data.activeEvents || []);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join game handler
  const handleJoinGame = useCallback((inputGameId: string, companyName: string) => {
    if (!socket) return;
    
    setError(null);
    setAppState('joining');

    socket.emit('joinGame', inputGameId.toUpperCase(), companyName, (response: any) => {
      if (response.error) {
        setError(response.error);
        setAppState('landing');
        return;
      }

      if (response.success) {
        setTeamState(response.teamState);
        setOpportunities(response.opportunities || []);
        setActiveEvents(response.activeEvents || []);
        setGameId(inputGameId.toUpperCase());
        setSessionToken(response.sessionToken);
        setTestMode(response.testMode || false);
        localStorage.setItem('sessionToken', response.sessionToken);
        setAppState('playing');
      }
    });
  }, [socket]);

  // Quick test mode
  const handleTestMode = useCallback(() => {
    if (!socket) return;
    
    setError(null);
    setAppState('joining');

    socket.emit('joinTestMode', (response: any) => {
      if (response.error) {
        setError(response.error);
        setAppState('landing');
        return;
      }

      if (response.success) {
        setTeamState(response.teamState);
        setOpportunities(response.opportunities || []);
        setActiveEvents(response.activeEvents || []);
        setGameId(response.gameId);
        setSessionToken(response.sessionToken);
        setTestMode(true);
        localStorage.setItem('sessionToken', response.sessionToken);
        setAppState('playing');
      }
    });
  }, [socket]);

  // Create game handler (facilitator)
  const handleCreateGame = useCallback((numberOfTeams: number, maxQuarters: number) => {
    if (!socket) return;
    
    setError(null);
    
    socket.emit('createGame', { 
      level: 2, 
      numberOfTeams,
      maxQuarters,
      gameName: 'Agency Simulator'
    }, (response: any) => {
      if (response.error) {
        setError(response.error);
        return;
      }
      
      const createdGameId = response.gameId;
      setGameId(createdGameId);
      
      // Join as facilitator
      socket.emit('joinAsFacilitator', createdGameId, (facResponse: any) => {
        if (facResponse.success) {
          setAllTeams(facResponse.teams || []);
          setCurrentQuarter(facResponse.currentQuarter || 1);
          setActiveEvents(facResponse.activeEvents || []);
          setAppState('facilitating');
          
          // Show game code
          alert(`Game Created!\n\nGame ID: ${createdGameId}\nLength: ${maxQuarters} quarters\n\nShare this code with your teams.`);
        } else {
          setError(facResponse.error || 'Failed to join as facilitator');
        }
      });
    });
  }, [socket]);

  // Leave game
  const handleLeaveGame = useCallback(() => {
    localStorage.removeItem('sessionToken');
    setTeamState(null);
    setOpportunities([]);
    setActiveEvents([]);
    setNotifications([]);
    setGameId('');
    setSessionToken(null);
    setTestMode(false);
    setAppState('landing');
  }, []);

  // Render based on app state
  if (appState === 'landing') {
    return (
      <LandingPage 
        onJoinGame={handleJoinGame}
        onCreateGame={handleCreateGame}
        onTestMode={handleTestMode}
        error={error}
        isConnected={isConnected}
      />
    );
  }

  if (appState === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: `linear-gradient(135deg, ${AMBER_COLORS.darkGrey} 0%, #1a1a1a 100%)` }}>
        <div className="text-center text-white">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Joining game...</p>
        </div>
      </div>
    );
  }

  if (appState === 'facilitating') {
    return (
      <FacilitatorView
        socket={socket}
        gameId={gameId}
        teams={allTeams}
        currentQuarter={currentQuarter}
        activeEvents={activeEvents}
        onAdvanceQuarter={() => {
          // Refresh data after advancing
          socket?.emit('getFacilitatorData', gameId, (response: any) => {
            if (response.teams) {
              setAllTeams(response.teams);
              setCurrentQuarter(response.currentQuarter || currentQuarter);
              setActiveEvents(response.activeEvents || []);
            }
          });
        }}
      />
    );
  }

  if (appState === 'playing' && teamState) {
    return (
      <GameBoard
        socket={socket}
        gameId={gameId}
        teamState={teamState}
        notifications={notifications}
        opportunities={opportunities}
        activeEvents={activeEvents}
        onUpdateTeam={setTeamState}
        testMode={testMode}
      />
    );
  }

  if (appState === 'ended') {
    const winner = leaderboard[0];
    const myTeam = teamState ? leaderboard.find(t => t.teamId === teamState.teamId) : null;
    const isWinner = myTeam && winner && myTeam.teamId === winner.teamId;
    
    return (
      <div className="min-h-screen p-6"
           style={{ background: `linear-gradient(135deg, ${AMBER_COLORS.darkGrey} 0%, #1a1a1a 100%)` }}>
        <div className="max-w-4xl mx-auto">
          
          {/* Winner Celebration */}
          {winner && (
            <div className="text-center mb-8">
              <div className="text-7xl mb-4">{isWinner ? '🎉' : '🏆'}</div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {isWinner ? 'You Won!' : 'Game Complete!'}
              </h1>
              <p className="text-xl text-amber-400">
                🏆 {winner.companyName} takes the crown!
              </p>
              <p className="text-white/60 mt-2">
                Final Score: {formatCurrency(winner.totalScore)} • Profit: {formatCurrency(winner.cumulativeProfit)}
              </p>
            </div>
          )}
          
          {/* Leaderboard */}
          <div className="bg-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📊 Final Standings
            </h2>
            
            <div className="space-y-3">
              {leaderboard.map((team, index) => {
                const isMyTeam = myTeam && team.teamId === myTeam.teamId;
                const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                
                return (
                  <div 
                    key={team.teamId}
                    className={`rounded-lg p-4 ${
                      isMyTeam 
                        ? 'bg-amber-500/30 border-2 border-amber-500' 
                        : team.isBankrupt 
                          ? 'bg-red-900/30 border border-red-500/50'
                          : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl w-10">{rankEmoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">{team.companyName}</span>
                            {isMyTeam && <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded">YOU</span>}
                            {team.isBankrupt && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">BANKRUPT</span>}
                          </div>
                          <span className="text-white/50 text-sm">Team {team.teamNumber}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-6 text-right">
                        <div>
                          <div className="text-white/50 text-xs">Profit</div>
                          <div className={`font-bold ${team.cumulativeProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(team.cumulativeProfit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/50 text-xs">Cash</div>
                          <div className={`font-bold ${team.cash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(team.cash)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/50 text-xs">Rep</div>
                          <div className="font-bold text-blue-400">{team.reputation}/100</div>
                        </div>
                        <div>
                          <div className="text-white/50 text-xs">Clients</div>
                          <div className="font-bold text-purple-400">{team.clientCount}</div>
                        </div>
                        <div>
                          <div className="text-white/50 text-xs">Staff</div>
                          <div className="font-bold text-cyan-400">{team.staff}</div>
                        </div>
                        <div>
                          <div className="text-white/50 text-xs">Score</div>
                          <div className="font-bold text-amber-400">{formatCurrency(team.totalScore)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Your Performance Summary (if you're a player) */}
          {myTeam && (
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">📈 Your Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-1">{myTeam.rank === 1 ? '🥇' : myTeam.rank === 2 ? '🥈' : myTeam.rank === 3 ? '🥉' : '🏅'}</div>
                  <div className="text-2xl font-bold text-white">#{myTeam.rank}</div>
                  <div className="text-white/50 text-sm">Final Rank</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-1">💰</div>
                  <div className={`text-2xl font-bold ${myTeam.cumulativeProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(myTeam.cumulativeProfit)}
                  </div>
                  <div className="text-white/50 text-sm">Total Profit</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-1">⭐</div>
                  <div className="text-2xl font-bold text-blue-400">{myTeam.reputation}/100</div>
                  <div className="text-white/50 text-sm">Reputation</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-1">🤝</div>
                  <div className="text-2xl font-bold text-purple-400">{myTeam.clientCount}</div>
                  <div className="text-white/50 text-sm">Active Clients</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Thank You & Play Again */}
          <div className="text-center">
            <p className="text-white/60 mb-4">Thank you for playing Agency Simulator</p>
            <button
              onClick={handleLeaveGame}
              className="px-8 py-3 rounded-lg font-bold text-lg"
              style={{ background: AMBER_GRADIENT }}
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Landing page component
interface LandingPageProps {
  onJoinGame: (gameId: string, companyName: string) => void;
  onCreateGame: (numberOfTeams: number, maxQuarters: number) => void;
  onTestMode: () => void;
  error: string | null;
  isConnected: boolean;
}

function LandingPage({ onJoinGame, onCreateGame, onTestMode, error, isConnected }: LandingPageProps) {
  const [gameIdInput, setGameIdInput] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [mode, setMode] = useState<'player' | 'facilitator'>('player');
  const [numberOfTeams, setNumberOfTeams] = useState(4);
  const [numberOfQuarters, setNumberOfQuarters] = useState(8);
  
  // Facilitator access code state
  const [facilitatorAuthenticated, setFacilitatorAuthenticated] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessError, setAccessError] = useState('');
  
  // Check for stored facilitator access on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('agency-sim-facilitator');
    if (stored === 'granted') {
      setFacilitatorAuthenticated(true);
    }
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameIdInput.trim() && companyNameInput.trim()) {
      onJoinGame(gameIdInput.trim(), companyNameInput.trim());
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGame(numberOfTeams, numberOfQuarters);
  };
  
  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCodeInput.toUpperCase() === ACCESS_CODE) {
      setFacilitatorAuthenticated(true);
      sessionStorage.setItem('agency-sim-facilitator', 'granted');
      setAccessError('');
    } else {
      setAccessError('Invalid access code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <img src="/amber-logo.jpg" alt="The Amber Group" className="h-24 mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1"
              style={{ color: AMBER_COLORS.darkGrey, fontFamily: 'Libre Franklin, sans-serif' }}>
            AGENCY SIMULATOR
          </h1>
          <p style={{ color: AMBER_COLORS.midGrey }}>Business Simulation Game</p>
          
          {/* Connection status */}
          <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('player')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'player' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 Join as Player
          </button>
          <button
            onClick={() => setMode('facilitator')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'facilitator' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎮 Facilitator
          </button>
        </div>

        {/* Join Form (Player Mode) */}
        {mode === 'player' && (
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Game ID</label>
                <input
                  type="text"
                  value={gameIdInput}
                  onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                  placeholder="Enter Game ID"
                  className="w-full px-4 py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-400 border border-gray-300 focus:border-orange-500 focus:outline-none text-center text-xl tracking-widest"
                  maxLength={8}
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Your Agency Name</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="e.g. Creative Sparks Agency"
                  className="w-full px-4 py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-400 border border-gray-300 focus:border-orange-500 focus:outline-none"
                  maxLength={30}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-2 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isConnected || !gameIdInput.trim() || !companyNameInput.trim()}
                className="w-full py-2.5 rounded-lg font-bold text-white transition-all disabled:opacity-50"
                style={{ background: AMBER_COLORS.orange }}
              >
                Join Game
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={onTestMode}
                disabled={!isConnected}
                className="w-full py-2.5 rounded-lg font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                🧪 Quick Test Mode
              </button>
              <p className="text-gray-400 text-xs text-center mt-1">
                Practice without a facilitator
              </p>
            </div>
          </div>
        )}

        {/* Create Game Form (Facilitator Mode) */}
        {mode === 'facilitator' && !facilitatorAuthenticated && (
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <form onSubmit={handleAccessSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Facilitator Access Code</label>
                <input
                  type="text"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                  placeholder="ACCESS CODE"
                  className="w-full px-4 py-2.5 text-center tracking-widest rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-orange-500 focus:outline-none"
                  style={{ borderColor: accessError ? '#ef4444' : undefined }}
                  autoFocus
                />
                {accessError && (
                  <p className="text-red-500 text-sm text-center mt-2">{accessError}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-bold text-white transition-all"
                style={{ background: AMBER_COLORS.orange }}
              >
                🔓 Unlock Facilitator Mode
              </button>
            </form>
            
            <p className="text-gray-400 text-xs text-center mt-3">
              Contact chris@rapid-learn.co.uk for access
            </p>
          </div>
        )}
        
        {mode === 'facilitator' && facilitatorAuthenticated && (
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Number of Teams</label>
                <select
                  value={numberOfTeams}
                  onChange={(e) => setNumberOfTeams(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-orange-500 focus:outline-none"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} Teams</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Game Length</label>
                <select
                  value={numberOfQuarters}
                  onChange={(e) => setNumberOfQuarters(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white text-gray-800 border border-gray-300 focus:border-orange-500 focus:outline-none"
                >
                  <option value={4}>4 Quarters (1 year) - Quick</option>
                  <option value={6}>6 Quarters (1.5 years) - Standard</option>
                  <option value={8}>8 Quarters (2 years) - Full</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-2 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isConnected}
                className="w-full py-2.5 rounded-lg font-bold text-white transition-all disabled:opacity-50"
                style={{ background: AMBER_COLORS.orange }}
              >
                🎮 Create Game
              </button>
            </form>

            <p className="text-gray-400 text-xs text-center mt-3">
              Creates a game code for teams to join
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Powered by Amber Group
          </p>
        </div>
      </div>
    </div>
  );
}
