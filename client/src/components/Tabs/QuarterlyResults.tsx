// client/src/components/Tabs/QuarterlyResults.tsx
// Quarterly results tab - Dark theme

import { TeamState, formatCurrency } from '../../types';

interface QuarterlyResultsTabProps {
  teamState: TeamState;
}

export default function QuarterlyResultsTab({ teamState }: QuarterlyResultsTabProps) {
  const results = teamState.quarterlyResults || [];

  if (results.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No quarterly results yet. Complete your first quarter!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.slice().reverse().map((result) => (
        <div key={result.quarter} className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-cyan-400">Q{result.quarter} Results</h3>
            <span className={`text-lg font-bold ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {result.profit >= 0 ? '📈' : '📉'} {formatCurrency(result.profit)} profit
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-white/60 text-sm">Revenue</div>
              <div className="font-bold text-lg text-green-400">{formatCurrency(result.revenue)}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-white/60 text-sm">Costs</div>
              <div className="font-bold text-lg text-red-400">{formatCurrency(result.costs)}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-white/60 text-sm">Utilization</div>
              <div className="font-bold text-lg text-yellow-400">{Math.round(result.utilizationRate * 100)}%</div>
            </div>
          </div>

          <div className="flex gap-4 text-sm text-white/70">
            {result.clientsWon > 0 && <span className="text-green-400">✓ {result.clientsWon} clients won</span>}
            {result.clientsLost > 0 && <span className="text-red-400">✗ {result.clientsLost} clients lost</span>}
            {result.clientsChurned > 0 && <span className="text-red-400">🚪 {result.clientsChurned} churned</span>}
            {result.clientsRenewed > 0 && <span className="text-green-400">🔄 {result.clientsRenewed} renewed</span>}
            {result.staffChange !== 0 && (
              <span className={result.staffChange > 0 ? 'text-blue-400' : 'text-white/60'}>
                👥 {result.staffChange > 0 ? '+' : ''}{result.staffChange} staff
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
