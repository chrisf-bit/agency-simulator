// client/src/components/GameComplete.tsx
// End of game screen showing final standings

import { LeaderboardEntry } from '../types';

interface GameCompleteProps {
  leaderboard: LeaderboardEntry[];
  teamId: string;
  gameId: string;
  onPlayAgain: () => void;
}

export default function GameComplete({ leaderboard, teamId, _gameId, onPlayAgain }: GameCompleteProps) {
  const teamRank = leaderboard.findIndex(t => t.teamId === teamId) + 1;
  const teamEntry = leaderboard.find(t => t.teamId === teamId);
  const winner = leaderboard[0];
  const isWinner = teamId === winner?.teamId;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4 overflow-auto">
      <div className="max-w-2xl w-full">
        {/* Winner Celebration or Your Result */}
        <div className="text-center mb-8">
          {isWinner ? (
            <>
              <div className="text-8xl mb-4 animate-bounce">🏆</div>
              <h1 className="text-5xl font-bold text-yellow-400 mb-2">VICTORY!</h1>
              <p className="text-2xl text-white/80">{teamEntry?.companyName} wins!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">
                {teamRank <= 3 ? medals[teamRank - 1] : '🎯'}
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Game Complete</h1>
              <p className="text-xl text-white/80">
                {teamEntry?.companyName} finished {teamRank}{getOrdinalSuffix(teamRank)}
              </p>
            </>
          )}
        </div>

        {/* Final Leaderboard */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-center">🏆 Final Standings</h2>
          <div className="space-y-2">
            {leaderboard.map((team, idx) => {
              const isCurrentTeam = team.teamId === teamId;
              const rank = idx + 1;
              
              return (
                <div
                  key={team.teamId}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                    isCurrentTeam
                      ? 'bg-purple-500/30 border-2 border-purple-400'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="text-2xl w-10 text-center">
                    {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      {team.companyName}
                      {isCurrentTeam && (
                        <span className="text-xs bg-purple-500 px-2 py-0.5 rounded-full">YOU</span>
                      )}
                    </div>
                    <div className="text-sm text-white/60">
                      Rep: {team.reputation} • Clients: {team.clientCount}
                    </div>
                  </div>
                  
                  <div className={`text-right font-bold ${
                    team.cumulativeProfit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${(team.cumulativeProfit / 1000).toFixed(0)}k
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your Performance Summary */}
        {teamEntry && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-center">📊 Your Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-400">{teamRank}{getOrdinalSuffix(teamRank)}</div>
                <div className="text-xs text-white/60">Final Rank</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className={`text-2xl font-bold ${teamEntry.cumulativeProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(teamEntry.cumulativeProfit / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-white/60">Total Profit</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">{teamEntry.reputation}</div>
                <div className="text-xs text-white/60">Reputation</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-cyan-400">{teamEntry.clientCount}</div>
                <div className="text-xs text-white/60">Clients</div>
              </div>
            </div>
          </div>
        )}

        {/* Back to Lobby */}
        <div className="text-center">
          <button
            onClick={onPlayAgain}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3 rounded-lg font-bold transition-all"
          >
            🏠 Back to Lobby
          </button>
        </div>

        <div className="text-center mt-6 text-white/50 text-sm">
          <p>Thanks for playing Pitch Perfect! 🎯</p>
          <p className="mt-1">Your facilitator will share detailed reports.</p>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}