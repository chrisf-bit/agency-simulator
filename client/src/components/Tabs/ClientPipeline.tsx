// client/src/components/Tabs/ClientPipeline.tsx
// Client pipeline tab - Dark theme

import { TeamState, SERVICE_LINE_INFO, formatCurrency } from '../../types';

interface ClientPipelineTabProps {
  teamState: TeamState;
}

export default function ClientPipelineTab({ teamState }: ClientPipelineTabProps) {
  const clients = teamState.clients || [];

  if (clients.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        No active clients. Win some pitches!
      </div>
    );
  }

  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);
  const totalHours = clients.reduce((sum, c) => sum + c.hoursPerQuarter, 0);
  const avgSatisfaction = Math.round(clients.reduce((sum, c) => sum + (c.satisfactionLevel || 50), 0) / clients.length);

  const healthyClients = clients.filter(c => c.satisfactionLevel >= 60).length;
  const atRiskClients = clients.filter(c => c.satisfactionLevel < 40 || c.status === 'notice_given').length;

  const getSatisfactionColor = (sat: number) => {
    if (sat >= 60) return 'bg-green-500';
    if (sat >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSatisfactionEmoji = (sat: number) => {
    if (sat >= 70) return '😊';
    if (sat >= 50) return '😐';
    if (sat >= 30) return '😟';
    return '😠';
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-xs text-white/60">Clients</div>
          <div className="text-lg font-bold text-cyan-400">{clients.length}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-xs text-white/60">Quarterly Revenue</div>
          <div className="text-lg font-bold text-green-400">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-xs text-white/60">Hours/Quarter</div>
          <div className="text-lg font-bold text-blue-400">{totalHours.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-xs text-white/60">Avg Satisfaction</div>
          <div className={`text-lg font-bold ${avgSatisfaction >= 60 ? 'text-green-400' : avgSatisfaction >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {avgSatisfaction}%
          </div>
        </div>
      </div>

      {/* Health Summary */}
      <div className="flex gap-3">
        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">✓ {healthyClients} healthy</span>
        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">○ {clients.length - healthyClients - atRiskClients} neutral</span>
        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">⚠ {atRiskClients} at risk</span>
      </div>

      {/* Client List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {clients.map((client) => {
          const serviceInfo = SERVICE_LINE_INFO[client.serviceLine] || { icon: '📋', name: client.serviceLine };
          const satisfaction = Math.round(client.satisfactionLevel || 50);
          
          return (
            <div key={client.opportunityId} className={`rounded-lg p-3 border ${
              client.status === 'notice_given' ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{client.clientName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">
                    {serviceInfo.icon} {serviceInfo.name}
                  </span>
                  {client.status === 'notice_given' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">NOTICE GIVEN</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-green-400">{formatCurrency(client.revenue)}</span>
                  <span className="text-white/60 text-sm">/qtr</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Satisfaction bar */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{getSatisfactionEmoji(satisfaction)}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getSatisfactionColor(satisfaction)}`}
                        style={{ width: `${satisfaction}%` }}
                      />
                    </div>
                    <span className="text-sm text-white/60 w-10">{satisfaction}%</span>
                  </div>
                </div>
                
                <span className="text-sm text-white/60">{Math.round(client.quartersRemaining)}Q left</span>
                <span className="text-sm text-white/60">{Math.round(client.hoursPerQuarter)} hrs/Q</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
