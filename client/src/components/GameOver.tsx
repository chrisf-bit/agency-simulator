// client/src/components/GameOver.tsx
// Game over screen for bankrupt agencies in Pitch Perfect

import { TeamState } from '../types';

interface GameOverProps {
  teamState: TeamState;
  onDismiss: () => void;
}

export default function GameOver({ teamState, onDismiss }: GameOverProps) {
  const finalCash = teamState.cash;
  const finalReputation = teamState.reputation;
  const totalClients = teamState.clients.length;
  const peakCash = Math.max(...teamState.agencyMetrics.map(m => m.cash), 0);
  
  // Determine what went wrong
  const getFailureReason = () => {
    const _latestMetrics = teamState.agencyMetrics[teamState.agencyMetrics.length - 1];
    
    if (teamState.burnout >= 80) {
      return "Your team burned out from overwork, leading to poor performance and client losses.";
    }
    if (teamState.reputation < 20) {
      return "Your agency's reputation collapsed, making it impossible to win new business.";
    }
    if (totalClients === 0 && teamState.quarter > 2) {
      return "Without clients, there was no revenue to sustain operations.";
    }
    return "Expenses exceeded revenue for too long, depleting your cash reserves.";
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-red-900 to-gray-900 p-8 rounded-2xl shadow-2xl max-w-2xl w-full text-center border-4 border-red-500 relative">
        
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl"
          aria-label="Close"
        >
          ✕
        </button>
        
        <div className="text-8xl mb-4">💀</div>
        <h1 className="text-5xl md:text-6xl font-bold text-red-500 mb-4">BANKRUPT</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Agency Closed</h2>
        
        <div className="bg-black/30 rounded-lg p-6 mb-6">
          <p className="text-xl text-white mb-4">
            <span className="font-bold">{teamState.companyName}</span> ran out of cash in Quarter {teamState.bankruptQuarter || teamState.quarter}
          </p>
          <p className="text-lg text-red-300 mb-2">
            Final Cash: <span className="font-bold">${(finalCash / 1000).toFixed(0)}k</span>
          </p>
          <p className="text-sm text-white/60 italic">
            {getFailureReason()}
          </p>
        </div>

        {/* Final Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-white/50">Peak Cash</div>
            <div className="text-lg font-bold text-green-400">${(peakCash / 1000).toFixed(0)}k</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-white/50">Final Reputation</div>
            <div className={`text-lg font-bold ${finalReputation >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {finalReputation}/100
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-white/50">Total Clients</div>
            <div className="text-lg font-bold text-cyan-400">{totalClients}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-white/50">Quarters Survived</div>
            <div className="text-lg font-bold text-purple-400">{teamState.bankruptQuarter || teamState.quarter}</div>
          </div>
        </div>
        
        <div className="text-white/70 space-y-2 text-sm mb-6">
          <p>✅ You can still review your agency history</p>
          <p>❌ You cannot submit new decisions</p>
          <p>📊 The game continues for other agencies</p>
        </div>

        {/* Tips for next time */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6 text-left">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Tips for Next Time</h4>
          <ul className="text-xs text-white/70 space-y-1">
            <li>• Don't over-discount — protect your profit margins</li>
            <li>• Keep burnout under control with wellbeing investment</li>
            <li>• Build reputation through quality work and training</li>
            <li>• Balance growth with sustainable capacity</li>
          </ul>
        </div>
        
        {/* Big dismiss button */}
        <button
          onClick={onDismiss}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
        >
          View Agency History →
        </button>
        
        <div className="mt-4 text-white/50 text-xs">
          Better luck next time! 🎯
        </div>
      </div>
    </div>
  );
}
