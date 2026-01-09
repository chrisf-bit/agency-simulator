// client/src/components/Tabs/AgencyMetrics.tsx
// Agency metrics tab - Dark theme

import { TeamState, formatCurrency } from '../../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AgencyMetricsTabProps {
  teamState: TeamState;
}

// Format chart values (already in thousands) for display
const formatChartValue = (valueInK: number): string => {
  if (Math.abs(valueInK) >= 1000) {
    return `£${(valueInK / 1000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  return `£${valueInK.toFixed(0)}k`;
};

export default function AgencyMetricsTab({ teamState }: AgencyMetricsTabProps) {
  const metrics = teamState.agencyMetrics || [];

  if (metrics.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No metrics recorded yet. Complete your first quarter!
      </div>
    );
  }

  const chartData = metrics.map(m => ({
    quarter: `Q${m.quarter}`,
    reputation: m.reputation,
    burnout: m.burnout,
    marketPresence: m.marketPresence,
    cash: m.cash / 1000, // Keep in thousands for chart scale
  }));

  const latest = metrics[metrics.length - 1];
  const prev = metrics.length > 1 ? metrics[metrics.length - 2] : null;

  const getTrend = (current: number, previous: number | undefined) => {
    if (!previous) return '→';
    return current > previous ? '↑' : current < previous ? '↓' : '→';
  };

  return (
    <div className="space-y-4">
      {/* Current Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox 
          label="Reputation" 
          value={latest.reputation} 
          trend={getTrend(latest.reputation, prev?.reputation)}
          color={latest.reputation >= 70 ? 'text-green-400' : latest.reputation >= 40 ? 'text-yellow-400' : 'text-red-400'}
        />
        <StatBox 
          label="Burnout" 
          value={`${latest.burnout}%`} 
          trend={getTrend(latest.burnout, prev?.burnout)}
          color={latest.burnout <= 30 ? 'text-green-400' : latest.burnout <= 60 ? 'text-yellow-400' : 'text-red-400'}
          invertTrend
        />
        <StatBox 
          label="Market" 
          value={`${Math.round(latest.marketPresence)}%`} 
          trend={getTrend(latest.marketPresence, prev?.marketPresence)}
          color="text-blue-400"
        />
        <StatBox 
          label="Cash" 
          value={formatCurrency(latest.cash)} 
          trend={getTrend(latest.cash, prev?.cash)}
          color={latest.cash > 200000 ? 'text-green-400' : latest.cash > 50000 ? 'text-yellow-400' : 'text-red-400'}
        />
      </div>

      {/* Reputation & Burnout Chart */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">Reputation & Burnout Over Time</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} width={30} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="reputation" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Reputation" />
              <Line type="monotone" dataKey="burnout" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} name="Burnout" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Position Chart */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">Cash Position Over Time</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} width={45} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [formatChartValue(value), '']}
              />
              <Line type="monotone" dataKey="cash" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} name="Cash" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, trend, color, invertTrend }: { 
  label: string; value: string | number; trend: string; color: string; invertTrend?: boolean 
}) {
  const trendColor = trend === '→' ? 'text-white/40' : 
    (invertTrend ? trend === '↓' : trend === '↑') ? 'text-green-400' : 'text-red-400';
  
  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
      <div className="text-xs text-white/60">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className={`text-sm ${trendColor}`}>{trend}</div>
    </div>
  );
}
