// client/src/components/ReportsPage.tsx
// Browse and view saved game reports

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeamReport from './TeamReport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ReportsPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      fetchGameReports(gameId);
    } else {
      setLoading(false);
    }
  }, [gameId]);

  const fetchGameReports = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data);
      } else {
        setError(data.error || 'Reports not found');
      }
    } catch (err) {
      setError('Failed to load reports');
    }
    setLoading(false);
  };

  // Show individual report
  if (selectedReport) {
    return (
      <TeamReport 
        report={selectedReport} 
        onClose={() => setSelectedReport(null)} 
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">❌ {error}</p>
          <button onClick={() => navigate('/')} className="bg-purple-600 px-4 py-2 rounded-lg">
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // No game selected - prompt for game ID
  if (!gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">📊 Game Reports</h1>
          <p className="text-white/70 mb-6">Enter a Game ID to view reports</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const id = (e.target as any).gameId.value.trim().toUpperCase();
            if (id) navigate(`/reports/${id}`);
          }}>
            <input
              name="gameId"
              type="text"
              placeholder="Enter Game ID (e.g., ABC123)"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 mb-4"
            />
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-bold">
              View Reports
            </button>
          </form>
          <button onClick={() => navigate('/')} className="mt-4 text-white/50 hover:text-white">
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Show game reports
  const teamReports = reports?.reports || [];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/')} className="text-white/50 hover:text-white mb-4 inline-block">
            ← Back to Lobby
          </button>
          <h1 className="text-3xl font-bold">📊 Game Reports</h1>
          <p className="text-white/70">Game: {gameId} • {reports?.gameName || ''}</p>
          {reports?.endedAt && (
            <p className="text-white/50 text-sm">Ended: {new Date(reports.endedAt).toLocaleString()}</p>
          )}
        </div>

        {/* Team Reports Grid */}
        {teamReports.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <p className="text-xl">No reports found for this game</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {teamReports.map((report: any, idx: number) => {
              const rank = report.summary?.finalRank || idx + 1;
              return (
                <button
                  key={report.teamId}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg p-4 text-left transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="text-3xl w-12 text-center">
                      {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                    </div>
                    
                    {/* Team Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{report.companyName}</h3>
                      <div className="text-sm text-white/60">
                        Win Rate: {report.summary?.winRate || 0}% • 
                        Clients: {report.summary?.totalClientsWon || 0} • 
                        Rep: {report.summary?.finalReputation || 0}
                      </div>
                    </div>
                    
                    {/* Profit */}
                    <div className={`text-right ${(report.summary?.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="text-2xl font-bold">
                        ${((report.summary?.totalProfit || 0) / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-white/50">Total Profit</div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="text-white/30 text-2xl">→</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Winner Banner */}
        {reports?.winner && (
          <div className="mt-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-bold">
              Winner: {teamReports.find((r: any) => r.teamId === reports.winner)?.companyName || reports.winner}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
