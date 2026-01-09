// client/src/components/TeamReport.tsx
// Visual team performance report

interface TeamReportData {
  teamId: string;
  companyName: string;
  generatedAt: string;
  summary: {
    finalRank: number;
    totalTeams: number;
    totalProfit: number;
    finalCash: number;
    finalReputation: number;
    totalClientsWon: number;
    totalPitches: number;
    winRate: number;
    peakBurnout: number;
    quarters: number;
    avgDiscount: number;
    totalRevenue: number;
    totalCosts: number;
  };
  quarterlyData: Array<{
    quarter: number;
    profit: number;
    revenue: number;
    costs: number;
    cash: number;
    reputation: number;
    burnout: number;
  }>;
  strengths: Insight[];
  warnings: Insight[];
  criticals: Insight[];
  developmentPlan: DevelopmentArea[];
}

interface Insight {
  id: string;
  title: string;
  severity: string;
  finding: string;
  detail: string;
}

interface DevelopmentArea {
  priority: number;
  title: string;
  description: string;
  skills: Array<{ name: string; description: string }>;
}

interface TeamReportProps {
  report: TeamReportData;
  onClose?: () => void;
}

export default function TeamReport({ report, onClose }: TeamReportProps) {
  const { summary, quarterlyData, strengths, warnings, criticals, developmentPlan } = report;
  
  const medals = ['🥇', '🥈', '🥉'];
  const rankDisplay = summary.finalRank <= 3 ? medals[summary.finalRank - 1] : `#${summary.finalRank}`;
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/90 overflow-auto z-50 print:relative print:bg-white">
      <div className="max-w-4xl mx-auto p-6 print:p-4">
        
        {/* Header with close/print buttons */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-2xl font-bold text-white">Team Performance Report</h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium"
            >
              🖨️ Print / PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white font-medium"
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white text-gray-900 rounded-lg shadow-xl print:shadow-none">
          
          {/* Company Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg print:rounded-none">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">{report.companyName}</h2>
                <p className="text-white/80">Performance Report • {summary.quarters} Quarters</p>
              </div>
              <div className="text-center">
                <div className="text-5xl">{rankDisplay}</div>
                <div className="text-sm text-white/80">of {summary.totalTeams} teams</div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b">
            <MetricCard 
              label="Total Profit" 
              value={`$${(summary.totalProfit / 1000).toFixed(0)}k`}
              color={summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <MetricCard 
              label="Final Cash" 
              value={`$${(summary.finalCash / 1000).toFixed(0)}k`}
              color={summary.finalCash >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <MetricCard 
              label="Reputation" 
              value={`${summary.finalReputation}/100`}
              color={summary.finalReputation >= 60 ? 'text-green-600' : summary.finalReputation >= 40 ? 'text-yellow-600' : 'text-red-600'}
            />
            <MetricCard 
              label="Win Rate" 
              value={`${summary.winRate}%`}
              color={summary.winRate >= 50 ? 'text-green-600' : 'text-yellow-600'}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50 border-b">
            <MiniMetric label="Clients Won" value={summary.totalClientsWon} />
            <MiniMetric label="Total Pitches" value={summary.totalPitches} />
            <MiniMetric label="Avg Discount" value={`${summary.avgDiscount?.toFixed(1) || 0}%`} />
            <MiniMetric label="Peak Burnout" value={`${summary.peakBurnout}%`} />
            <MiniMetric label="Total Revenue" value={`$${(summary.totalRevenue / 1000).toFixed(0)}k`} />
          </div>

          {/* Quarterly Performance Chart (Simple Text Version) */}
          {quarterlyData && quarterlyData.length > 0 && (
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4">📈 Quarterly Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Quarter</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Costs</th>
                      <th className="text-right py-2">Profit</th>
                      <th className="text-right py-2">Cash</th>
                      <th className="text-right py-2">Rep</th>
                      <th className="text-right py-2">Burnout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarterlyData.map((q) => (
                      <tr key={q.quarter} className="border-b">
                        <td className="py-2 font-medium">Q{q.quarter}</td>
                        <td className="text-right text-green-600">${(q.revenue / 1000).toFixed(0)}k</td>
                        <td className="text-right text-red-600">${(q.costs / 1000).toFixed(0)}k</td>
                        <td className={`text-right font-medium ${q.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${(q.profit / 1000).toFixed(0)}k
                        </td>
                        <td className="text-right">${(q.cash / 1000).toFixed(0)}k</td>
                        <td className="text-right">{q.reputation}</td>
                        <td className={`text-right ${q.burnout > 60 ? 'text-red-600' : ''}`}>{q.burnout}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {criticals && criticals.length > 0 && (
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4 text-red-600">🚨 Critical Issues</h3>
              <div className="space-y-3">
                {criticals.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} color="red" />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4 text-yellow-600">⚠️ Areas for Improvement</h3>
              <div className="space-y-3">
                {warnings.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} color="yellow" />
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4 text-green-600">✅ Strengths</h3>
              <div className="space-y-3">
                {strengths.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} color="green" />
                ))}
              </div>
            </div>
          )}

          {/* Development Plan */}
          {developmentPlan && developmentPlan.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">🎯 Development Priorities</h3>
              <div className="space-y-4">
                {developmentPlan.map((area) => (
                  <div key={area.priority} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {area.priority}
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-900">{area.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{area.description}</p>
                        {area.skills && area.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {area.skills.map((skill) => (
                              <span key={skill.name} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-100 p-4 rounded-b-lg text-center text-sm text-gray-500">
            Generated {new Date(report.generatedAt).toLocaleString()} • Pitch Perfect Simulation
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function InsightCard({ insight, color }: { insight: Insight; color: 'red' | 'yellow' | 'green' }) {
  const colors = {
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
  };
  
  return (
    <div className={`${colors[color]} border rounded-lg p-3`}>
      <div className="font-medium">{insight.title}</div>
      <div className="text-sm text-gray-700">{insight.finding}</div>
      <div className="text-sm text-gray-500 mt-1">{insight.detail}</div>
    </div>
  );
}
