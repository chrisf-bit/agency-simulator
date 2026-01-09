// client/src/components/client/FacilitatorView.tsx
// Facilitator dashboard with connection monitoring and debrief prompts

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { TeamState, GameEvent, ClientOpportunity, LeaderboardEntry, SERVICE_LINE_INFO, CLIENT_TYPE_INFO } from '../types';
import ConnectionIndicator from './ConnectionIndicator';
import FacilitatorDebriefView from './FacilitatorDebriefView';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ConnectionStatus {
  teamId: string;
  companyName: string;
  isConnected: boolean;
  lastSeen: number;
}

interface GameState {
  config: any;
  currentQuarter: number;
  teams: TeamState[];
  opportunities: ClientOpportunity[];
  activeEvents: GameEvent[];
  allTeamsSubmitted: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
  connectionStatus: ConnectionStatus[];
}

interface FacilitatorViewProps {
  gameId: string;
}

export default function FacilitatorView({ gameId }: FacilitatorViewProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [opportunities, setOpportunities] = useState<ClientOpportunity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debriefPrompts, setDebriefPrompts] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Facilitator connected:', newSocket.id);
      setIsConnected(true);
      
      // Reconnect to game
      newSocket.emit('reconnectFacilitator', gameId, (response: any) => {
        if (response.error) {
          setError(response.error);
          setLoading(false);
          return;
        }
        
        if (response.success && response.gameState) {
          setGameState(response.gameState);
          setTeams(response.gameState.teams || []);
          setOpportunities(response.gameState.opportunities || []);
          setConnectionStatus(response.gameState.connectionStatus || []);
        }
        setLoading(false);
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Facilitator disconnected');
      setIsConnected(false);
    });

    // Team events
    newSocket.on('teamJoined', ({ teamId, companyName, connectionStatus: status }) => {
      console.log(`👥 Team joined: ${companyName}`);
      setConnectionStatus(status || []);
      refreshGameState(newSocket);
    });

    newSocket.on('teamDisconnected', ({ teamId, companyName, connectionStatus: status }) => {
      console.log(`📴 Team disconnected: ${companyName}`);
      setConnectionStatus(status || []);
    });

    newSocket.on('teamReconnected', ({ teamId, companyName, connectionStatus: status }) => {
      console.log(`🔄 Team reconnected: ${companyName}`);
      setConnectionStatus(status || []);
    });

    newSocket.on('inputsSubmitted', ({ teamId, companyName }) => {
      console.log(`📤 Inputs submitted by: ${companyName}`);
      refreshGameState(newSocket);
    });

    newSocket.on('allTeamsSubmitted', () => {
      console.log('✅ All teams submitted');
      refreshGameState(newSocket);
    });

    newSocket.on('quarterStarted', () => {
      console.log('📅 Quarter started');
      refreshGameState(newSocket);
    });

    newSocket.on('gameEnded', () => {
      console.log('🏆 Game ended');
      refreshGameState(newSocket);
    });

    // Debrief prompts
    newSocket.on('debrief_prompts', (prompts) => {
      console.log('📋 Debrief prompts received');
      setDebriefPrompts(prompts);
    });

    newSocket.on('final_debrief', (prompts) => {
      console.log('📋 Final debrief received');
      setDebriefPrompts(prompts);
    });

    setSocket(newSocket);

    // Periodic refresh
    const refreshInterval = setInterval(() => {
      if (newSocket.connected) {
        refreshGameState(newSocket);
      }
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
      newSocket.close();
    };
  }, [gameId]);

  const refreshGameState = (sock: Socket) => {
    sock.emit('getGameState', gameId, (state: any) => {
      if (state && !state.error) {
        setGameState(state);
        setTeams(state.teams || []);
        setOpportunities(state.opportunities || []);
        setConnectionStatus(state.connectionStatus || []);
      }
    });
  };

  const handleProcessQuarter = () => {
    if (!socket) return;
    
    if (!confirm('Process this quarter? This will calculate results for all teams.')) return;
    
    socket.emit('processQuarter', gameId, (response: any) => {
      if (response.error) {
        alert(`Error: ${response.error}`);
      } else if (response.gameEnded) {
        alert('🏆 Game has ended!');
        refreshGameState(socket);
      } else {
        alert(`✅ Quarter processed! Now on Q${response.newQuarter}`);
        refreshGameState(socket);
      }
    });
  };

  const handleEndGame = () => {
    if (!socket) return;
    
    if (!confirm('End the game now? This will calculate final rankings.')) return;
    
    socket.emit('endGame', gameId, (response: any) => {
      if (response.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert('🏆 Game ended!');
        refreshGameState(socket);
      }
    });
  };

  const handleForceRefreshAll = () => {
    if (!socket) return;
    socket.emit('forceRefreshAllTeams', gameId);
    alert('✅ Refresh signal sent to all teams');
  };

  const handleForceAdvance = () => {
    if (!socket) return;
    
    if (!confirm('Force advance quarter? Teams that haven\'t submitted will use default decisions.')) return;
    
    socket.emit('forceAdvanceQuarter', gameId, (response: any) => {
      if (response.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert('✅ Quarter advanced');
        refreshGameState(socket);
      }
    });
  };

  const handleResetSubmission = (teamId: string, teamName: string) => {
    if (!socket) return;
    
    if (!confirm(`Reset submission for ${teamName}? They will be able to edit and resubmit.`)) return;
    
    socket.emit('resetTeamSubmission', gameId, teamId, (response: any) => {
      if (response.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert(`✅ Submission reset for ${teamName}`);
        refreshGameState(socket);
      }
    });
  };

  const handleExport = () => {
    if (!socket) return;
    
    socket.emit('exportGame', gameId, (response: any) => {
      if (response.error) {
        alert(`Error: ${response.error}`);
        return;
      }
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitchperfect-${gameId}-backup.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleImport = () => {
    if (!socket) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          socket.emit('importGame', gameId, data, (response: any) => {
            if (response.error) {
              alert(`Error: ${response.error}`);
            } else {
              alert('✅ Game restored from backup');
              refreshGameState(socket);
            }
          });
        } catch (err) {
          alert('Invalid backup file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Connecting to game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">❌ {error}</p>
          <a href="/" className="bg-purple-600 px-4 py-2 rounded-lg">Return to Lobby</a>
        </div>
      </div>
    );
  }

  const currentQuarter = gameState?.currentQuarter || 1;
  const allSubmitted = teams.length > 0 && teams.every(t => t.submittedThisQuarter || t.isBankrupt);
  const activeEvents = gameState?.activeEvents?.filter(e => e.active) || [];

  // Get connection status for a team
  const getTeamConnection = (teamId: string) => {
    return connectionStatus.find(c => c.teamId === teamId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">🎯 Pitch Perfect</h1>
              <p className="text-white/70">Facilitator Dashboard</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">Q{currentQuarter}</div>
              <div className="text-sm text-white/70">of {gameState?.config?.maxQuarters || 8}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 rounded p-3">
              <div className="text-xs text-white/70">Game ID</div>
              <div className="font-mono text-lg font-bold">{gameId}</div>
            </div>
            <div className="bg-white/5 rounded p-3">
              <div className="text-xs text-white/70">Teams Joined</div>
              <div className="text-lg font-bold">{teams.length} / {gameState?.config?.numberOfTeams || 4}</div>
            </div>
            <div className="bg-white/5 rounded p-3">
              <div className="text-xs text-white/70">Submitted</div>
              <div className="text-lg font-bold">{teams.filter(t => t.submittedThisQuarter).length} / {teams.length}</div>
            </div>
            <div className="bg-white/5 rounded p-3">
              <div className="text-xs text-white/70">Connected</div>
              <div className="text-lg font-bold text-green-400">
                {connectionStatus.filter(c => c.isConnected).length} / {teams.length}
              </div>
            </div>
            <div className="bg-white/5 rounded p-3">
              <div className="text-xs text-white/70">Status</div>
              <div className="text-lg font-bold">
                {gameState?.gameEnded ? '🏁 Ended' : allSubmitted ? '✅ Ready' : '⏳ Waiting'}
              </div>
            </div>
          </div>

          <ConnectionIndicator isConnected={isConnected} />
        </div>

        {/* Game Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Game Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleProcessQuarter}
              disabled={!allSubmitted || gameState?.gameEnded}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-all"
            >
              ▶️ Process Quarter
            </button>
            <button
              onClick={handleEndGame}
              disabled={gameState?.gameEnded}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-all"
            >
              🏁 End Game
            </button>
            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-bold transition-all"
            >
              📥 Export Backup
            </button>
            <button
              onClick={handleImport}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-bold transition-all"
            >
              📤 Restore Backup
            </button>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-2 text-red-400">⚠️ Emergency Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleForceRefreshAll}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              🔄 Force Refresh All
            </button>
            <button
              onClick={handleForceAdvance}
              disabled={gameState?.gameEnded}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              ⏭️ Force Next Quarter
            </button>
          </div>
        </div>

        {/* Debrief Questions Section */}
        {debriefPrompts && (
          <div className="mb-6">
            <FacilitatorDebriefView 
              prompts={debriefPrompts} 
              mode={debriefPrompts.quarter ? 'quarterly' : 'end_of_game'} 
            />
          </div>
        )}

        {/* Teams Grid */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Teams ({teams.length})</h2>
          
          {teams.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <p className="text-xl mb-2">Waiting for teams to join...</p>
              <p className="text-sm">Share the Game ID: <span className="font-mono font-bold text-white">{gameId}</span></p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => {
                const conn = getTeamConnection(team.teamId);
                return (
                  <div
                    key={team.teamId}
                    className={`rounded-lg p-4 border-2 transition-all ${
                      team.isBankrupt ? 'bg-red-900/30 border-red-500/50' :
                      team.submittedThisQuarter ? 'bg-green-900/30 border-green-500/50' :
                      'bg-white/5 border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{team.companyName}</h3>
                        <p className="text-xs text-white/50 font-mono">{team.teamId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Connection indicator */}
                        <div className={`w-3 h-3 rounded-full ${conn?.isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                          title={conn?.isConnected ? 'Connected' : 'Disconnected'} />
                        {/* Status badge */}
                        {team.isBankrupt ? (
                          <span className="bg-red-500 text-xs px-2 py-1 rounded">💀 Bankrupt</span>
                        ) : team.submittedThisQuarter ? (
                          <span className="bg-green-500 text-xs px-2 py-1 rounded">✓ Submitted</span>
                        ) : (
                          <span className="bg-yellow-500/80 text-xs px-2 py-1 rounded">⏳ Pending</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                      <div className="bg-white/5 rounded p-2 text-center">
                        <div className="text-white/50 text-xs">Cash</div>
                        <div className={team.cash >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${(team.cash / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div className="bg-white/5 rounded p-2 text-center">
                        <div className="text-white/50 text-xs">Rep</div>
                        <div>{team.reputation}</div>
                      </div>
                      <div className="bg-white/5 rounded p-2 text-center">
                        <div className="text-white/50 text-xs">Staff</div>
                        <div>{team.staff}</div>
                      </div>
                    </div>

                    {!team.isBankrupt && team.submittedThisQuarter && (
                      <button
                        onClick={() => handleResetSubmission(team.teamId, team.companyName)}
                        className="w-full text-xs bg-white/10 hover:bg-white/20 py-1 rounded transition-all"
                      >
                        🔄 Reset Submission
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🎲 Active Events</h2>
            <div className="flex flex-wrap gap-2">
              {activeEvents.map((event, idx) => (
                <div key={idx} className="bg-purple-500/30 border border-purple-500/50 px-4 py-2 rounded-lg">
                  <div className="font-medium">{event.type}</div>
                  <div className="text-xs text-white/70">{event.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🎯 Available Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {opportunities.map(opp => {
                const serviceInfo = SERVICE_LINE_INFO?.[opp.serviceLine] || { icon: '📋', name: opp.serviceLine };
                const clientInfo = CLIENT_TYPE_INFO?.[opp.clientType] || { icon: '🏢', name: opp.clientType };
                
                return (
                  <div key={opp.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{clientInfo.icon}</span>
                      <span className="font-medium">{opp.clientName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{serviceInfo.icon} {serviceInfo.name}</span>
                      <span className="text-green-400 font-bold">${(opp.budget / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Ended */}
        {gameState?.gameEnded && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">🏆 Game Ended!</h2>
            <p className="text-white/70">
              Winner: <span className="text-yellow-400 font-bold">
                {teams.find(t => t.teamId === gameState.winner)?.companyName || 'TBD'}
              </span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}