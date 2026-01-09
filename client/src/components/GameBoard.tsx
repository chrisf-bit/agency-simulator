// client/src/components/GameBoard.tsx
// Main game interface - Agency Leadership
// WHITE header, dark panels for content

import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { 
  TeamState, 
  Notification, 
  ClientOpportunity,
  GameEvent,
  EVENT_INFO,
  AMBER_COLORS,
  formatCurrency,
} from '../types';
import InputPanel from './InputPanel';
import Dashboard from './Dashboard';
import NotificationsTab from './Tabs/Notifications';
import ConnectionIndicator from './ConnectionIndicator';
import AgencyMetricsTab from './Tabs/AgencyMetrics';
import QuarterlyResultsTab from './Tabs/QuarterlyResults';
import ClientPipelineTab from './Tabs/ClientPipeline';

interface GameBoardProps {
  socket: Socket | null;
  gameId: string;
  teamState: TeamState;
  notifications?: Notification[];
  opportunities?: ClientOpportunity[];
  activeEvents?: GameEvent[];
  onUpdateTeam?: (team: TeamState) => void;
  testMode?: boolean;
}

type TabType = 'dashboard' | 'notifications' | 'results' | 'metrics' | 'clients';

export default function GameBoard({
  socket,
  gameId,
  teamState,
  notifications = [],
  opportunities = [],
  activeEvents = [],
  testMode = false,
}: GameBoardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [bankruptPopupDismissed, setBankruptPopupDismissed] = useState(false);

  if (!teamState) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center"
           style={{ background: `linear-gradient(135deg, ${AMBER_COLORS.darkGrey} 0%, #1a1a1a 50%, ${AMBER_COLORS.amberBrown}30 100%)` }}>
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading game state...</p>
        </div>
      </div>
    );
  }

  const clients = teamState.clients || [];

  const handleSubmit = () => {
    if (!socket) return;
    socket.emit('submitInputs', gameId, teamState.teamId, teamState.currentInputs);
    if (!testMode) {
      alert('Decisions submitted! Waiting for other teams...');
    }
  };

  const getBurnoutColor = (b: number) => b <= 30 ? 'text-green-600' : b <= 60 ? 'text-yellow-600' : 'text-red-600';
  const getRepColor = (r: number) => r >= 70 ? 'text-green-600' : r >= 40 ? 'text-yellow-600' : 'text-red-600';
  const getUtilColor = (u: number) => u > 100 ? 'text-red-600' : u > 80 ? 'text-green-600' : 'text-yellow-600';

  // Count clients at risk
  const clientsAtRisk = clients.filter(c => 
    c.status === 'notice_given' || (c.satisfactionLevel && c.satisfactionLevel < 40)
  ).length;

  // Calculate utilization
  const capacity = (teamState.staff || 0) * 520;
  const clientHours = clients.reduce((sum, c) => sum + (c.hoursPerQuarter || 0), 0);
  const utilization = capacity > 0 ? Math.round((clientHours / capacity) * 100) : 0;

  return (
    <div className="h-screen text-white p-3 flex flex-col overflow-hidden"
         style={{ background: `linear-gradient(135deg, ${AMBER_COLORS.darkGrey} 0%, #1a1a1a 50%, ${AMBER_COLORS.amberBrown}20 100%)` }}>
      
      {/* Bankruptcy Popup */}
      {teamState.isBankrupt && !bankruptPopupDismissed && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-sm text-center" style={{ backgroundColor: AMBER_COLORS.amberRed }}>
            <div className="text-5xl mb-3">💀</div>
            <h2 className="text-xl font-bold mb-2">BANKRUPT</h2>
            <p className="text-white/80 mb-3">{teamState.companyName} has run out of cash.</p>
            <button 
              onClick={() => setBankruptPopupDismissed(true)} 
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded"
            >
              Continue Watching
            </button>
          </div>
        </div>
      )}

      {/* WHITE Header */}
      <header className="bg-white rounded-lg px-4 py-3 mb-3 flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Agency Name */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: AMBER_COLORS.darkGrey }}>{teamState.companyName}</h1>
              <p className="text-sm text-gray-500">Team {teamState.teamNumber} • {gameId}</p>
            </div>
          </div>

          {/* Center: Key Stats */}
          <div className="flex gap-2">
            <Stat label="Cash" value={formatCurrency(teamState.cash || 0)} color={teamState.cash >= 0 ? 'text-green-600' : 'text-red-600'} />
            <Stat label="Reputation" value={`${teamState.reputation || 0}/100`} color={getRepColor(teamState.reputation || 0)} />
            <Stat label="Staff" value={`${teamState.staff || 0}`} color="text-blue-600" />
            <Stat label="Utilisation" value={`${utilization}%`} color={getUtilColor(utilization)} />
            <Stat label="Burnout" value={`${Math.round(teamState.burnout || 0)}%`} color={getBurnoutColor(teamState.burnout || 0)} />
            <Stat 
              label="Clients" 
              value={`${clients.length}`} 
              color="text-cyan-600" 
              warning={clientsAtRisk > 0 ? `${clientsAtRisk} at risk` : undefined}
            />
          </div>

          {/* Right: Quarter & Submit */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-bold leading-none" style={{ color: AMBER_COLORS.orange }}>Q{teamState.quarter}</div>
              <div className={`text-sm ${teamState.submittedThisQuarter ? 'text-green-600' : 'text-yellow-600'}`}>
                {teamState.submittedThisQuarter ? '✓ Submitted' : '⏳ Pending'}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={teamState.submittedThisQuarter || teamState.isBankrupt}
              className={`px-4 py-2 rounded font-bold transition-all ${
                teamState.submittedThisQuarter
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'text-white hover:opacity-90'
              }`}
              style={!teamState.submittedThisQuarter ? { backgroundColor: AMBER_COLORS.orange } : {}}
            >
              {teamState.submittedThisQuarter ? '✓ Submitted' : '📤 Submit'}
            </button>
            <ConnectionIndicator isConnected={!!socket?.connected} />
          </div>
        </div>

        {/* Events Banner */}
        {activeEvents.filter(e => e.active).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 flex gap-2 flex-wrap">
            <span className="text-sm text-gray-500">📢 Active Events:</span>
            {activeEvents.filter(e => e.active).map((event, idx) => {
              const info = EVENT_INFO?.[event.type] || { icon: '📌', name: event.type };
              return (
                <span key={idx} className="rounded px-2 py-0.5 text-sm text-white" style={{ backgroundColor: AMBER_COLORS.orange }}>
                  {info.icon} {info.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Test Mode Indicator */}
        {testMode && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              🧪 Test Mode - Single team, auto-advance enabled
            </span>
          </div>
        )}
      </header>

      {/* Bankruptcy Banner */}
      {teamState.isBankrupt && bankruptPopupDismissed && (
        <div className="rounded px-3 py-2 mb-3 text-center flex-shrink-0 border"
             style={{ backgroundColor: `${AMBER_COLORS.amberRed}50`, borderColor: AMBER_COLORS.amberRed }}>
          💀 <strong>{teamState.companyName}</strong> is bankrupt
        </div>
      )}

      {/* Main Content - Dark panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 overflow-hidden">
        
        {/* LEFT: Tabs/Dashboard */}
        <div className="rounded-lg overflow-hidden flex flex-col min-h-0"
             style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {/* Tab Nav */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            {[
              { id: 'dashboard', icon: '📈', label: 'Dashboard' },
              { id: 'notifications', icon: '🔔', label: 'Updates' },
              { id: 'results', icon: '💰', label: 'Results' },
              { id: 'metrics', icon: '📊', label: 'Metrics' },
              { id: 'clients', icon: '🤝', label: 'Clients' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 py-2.5 px-2 text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
                style={activeTab === tab.id ? { 
                  backgroundColor: AMBER_COLORS.orange + '20',
                } : {}}
              >
                {tab.icon} {tab.label}
                {/* Active indicator line */}
                {activeTab === tab.id && (
                  <span 
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ backgroundColor: AMBER_COLORS.orange }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'dashboard' && (
              <Dashboard teamState={teamState} />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab notifications={notifications} activeEvents={activeEvents} currentQuarter={teamState.quarter} />
            )}
            {activeTab === 'results' && (
              <QuarterlyResultsTab teamState={teamState} />
            )}
            {activeTab === 'metrics' && (
              <AgencyMetricsTab teamState={teamState} />
            )}
            {activeTab === 'clients' && (
              <ClientPipelineTab teamState={teamState} />
            )}
          </div>
        </div>

        {/* RIGHT: Input Panel */}
        <div className="rounded-lg p-3 overflow-y-auto"
             style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <InputPanel
            teamState={teamState}
            opportunities={opportunities}
            onSubmit={handleSubmit}
            disabled={teamState.submittedThisQuarter || teamState.isBankrupt}
          />
        </div>
      </div>
    </div>
  );
}

// Stat display component - for WHITE header
function Stat({ label, value, color, warning }: { label: string; value: string; color: string; warning?: string }) {
  return (
    <div className="bg-gray-100 rounded px-3 py-1.5 min-w-[70px] text-center">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className={`font-bold ${color}`}>{value}</div>
      {warning && <div className="text-xs text-red-500">⚠️ {warning}</div>}
    </div>
  );
}
