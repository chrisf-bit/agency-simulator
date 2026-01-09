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
} from './types';
import GameBoard from './components/GameBoard';
import FacilitatorView from './components/FacilitatorView';

const SERVER_URL = import.meta.env.PROD 
  ? 'https://agency-simulator.onrender.com'
  : 'http://localhost:3001';

type AppState = 'landing' | 'joining' | 'playing' | 'facilitating' | 'ended';

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

    newSocket.on('gameEnded', (_leaderboard) => {
      console.log('🏆 Game ended');
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
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: `linear-gradient(135deg, ${AMBER_COLORS.darkGrey} 0%, #1a1a1a 100%)` }}>
        <div className="text-center text-white bg-white/10 rounded-xl p-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-2xl font-bold mb-2">Game Complete!</h1>
          <p className="text-white/70 mb-4">Thank you for playing Agency Simulator</p>
          <button
            onClick={handleLeaveGame}
            className="px-6 py-2 rounded-lg font-bold"
            style={{ background: AMBER_GRADIENT }}
          >
            Play Again
          </button>
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
        {mode === 'facilitator' && (
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
