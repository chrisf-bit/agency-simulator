// client/src/components/Dashboard.tsx
// Agency metrics dashboard - Dark theme with readable sizes

import { TeamState, formatCurrency } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  teamState: TeamState;
}

// Format chart values (already in thousands) for display
const formatChartValue = (valueInK: number): string => {
  if (Math.abs(valueInK) >= 1000) {
    // 1000k = 1m
    return `£${(valueInK / 1000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  return `£${valueInK.toFixed(0)}k`;
};

export default function Dashboard({ teamState }: DashboardProps) {
  const quarterlyResults = teamState.quarterlyResults || [];
  const agencyMetrics = teamState.agencyMetrics || [];
  const clients = teamState.clients || [];

  // Chart data - keep in thousands for chart scale
  const profitData = quarterlyResults.map((result) => ({
    quarter: `Q${result.quarter}`,
    profit: result.profit / 1000,
    revenue: result.revenue / 1000,
  }));

  const metricsData = agencyMetrics.map((metrics) => ({
    quarter: `Q${metrics.quarter}`,
    reputation: metrics.reputation,
    burnout: metrics.burnout,
  }));

  // Client health
  const healthyClients = clients.filter(c => c.satisfactionLevel >= 60).length;
  const atRiskClients = clients.filter(c => c.satisfactionLevel < 40 || c.status === 'notice_given').length;
  const avgSatisfaction = clients.length > 0 
    ? Math.round(clients.reduce((sum, c) => sum + (c.satisfactionLevel || 50), 0) / clients.length)
    : 0;

  // Calculate utilization
  const capacity = (teamState.staff || 0) * 520;
  const clientHours = clients.reduce((sum, c) => sum + (c.hoursPerQuarter || 0), 0);
  const utilization = capacity > 0 ? Math.round((clientHours / capacity) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Key Metrics */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">Agency Health</h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Cash Position"
            value={formatCurrency(teamState.cash || 0)}
            color={(teamState.cash || 0) > 200000 ? 'text-green-400' : (teamState.cash || 0) > 50000 ? 'text-yellow-400' : 'text-red-400'}
          />
          <MetricCard
            label="Reputation"
            value={`${teamState.reputation || 0}/100`}
            color={(teamState.reputation || 0) >= 70 ? 'text-green-400' : (teamState.reputation || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'}
          />
          <MetricCard
            label="Team Burnout"
            value={`${Math.round(teamState.burnout || 0)}%`}
            color={(teamState.burnout || 0) <= 30 ? 'text-green-400' : (teamState.burnout || 0) <= 60 ? 'text-yellow-400' : 'text-red-400'}
          />
          <MetricCard
            label="Utilization"
            value={`${utilization}%`}
            color={utilization > 100 ? 'text-red-400' : utilization > 80 ? 'text-green-400' : 'text-yellow-400'}
          />
        </div>
      </div>

      {/* Client Health */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-cyan-400">Client Health</h3>
          <span className="text-sm text-white/60">{clients.length} clients</span>
        </div>
        <div className="flex gap-4 text-sm mb-3">
          <span className="text-green-400">✓ {healthyClients} healthy</span>
          <span className="text-yellow-400">○ {clients.length - healthyClients - atRiskClients} neutral</span>
          <span className="text-red-400">⚠ {atRiskClients} at risk</span>
        </div>
        {/* Satisfaction bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">Avg Satisfaction:</span>
          <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${avgSatisfaction}%`,
                backgroundColor: avgSatisfaction >= 60 ? '#4ade80' : avgSatisfaction >= 40 ? '#facc15' : '#f87171'
              }}
            />
          </div>
          <span className="text-sm font-bold text-white">{avgSatisfaction}%</span>
        </div>
      </div>

      {/* Revenue Chart */}
      {profitData.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="text-sm font-bold mb-3 text-cyan-400">Revenue & Profit</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} width={40} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatChartValue(value), '']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rep & Burnout Chart */}
      {metricsData.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="text-sm font-bold mb-3 text-cyan-400">Reputation & Burnout</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData}>
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
      )}

      {/* Agency Capabilities - with individual progress bars */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">Agency Capabilities</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-white/60 w-28">Tech Level</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{ width: `${((teamState.techLevel || 1) / 10) * 100}%` }}
              />
            </div>
            <span className="font-bold text-cyan-400 w-12 text-right">{(teamState.techLevel || 1).toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 w-28">Training Level</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-purple-400 transition-all"
                style={{ width: `${((teamState.trainingLevel || 1) / 10) * 100}%` }}
              />
            </div>
            <span className="font-bold text-purple-400 w-12 text-right">{(teamState.trainingLevel || 1).toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 w-28">Market Presence</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-yellow-400 transition-all"
                style={{ width: `${teamState.marketPresence || 0}%` }}
              />
            </div>
            <span className="font-bold text-yellow-400 w-12 text-right">{Math.round(teamState.marketPresence || 0)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 w-28">Active Clients</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-green-400 transition-all"
                style={{ width: `${(clients.length / 20) * 100}%` }}
              />
            </div>
            <span className="font-bold text-green-400 w-12 text-right">{clients.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric card for dark theme
function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-xs text-white/60 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
