// client/src/components/FacilitatorView.tsx
// Facilitator dashboard - team overview and facilitation prompts

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { TeamState, GameEvent, AMBER_COLORS, formatCurrency } from '../types';

interface FacilitatorViewProps {
  socket: Socket | null;
  gameId: string;
  teams: TeamState[];
  currentQuarter: number;
  activeEvents: GameEvent[];
  onAdvanceQuarter?: () => void;
}

type ViewTab = 'overview' | 'prompts' | 'leaderboard';

export default function FacilitatorView({
  socket,
  gameId,
  teams,
  currentQuarter,
  activeEvents,
}: FacilitatorViewProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const allSubmitted = teams.length > 0 && teams.every(t => t.submittedThisQuarter);
  const submittedCount = teams.filter(t => t.submittedThisQuarter).length;

  // Listen for processing events
  useEffect(() => {
    if (!socket) return;

    const handleProcessing = () => {
      setIsProcessing(true);
    };

    const handleQuarterProcessed = () => {
      setIsProcessing(false);
    };

    const handleQuarterStarted = () => {
      setIsProcessing(false);
    };

    socket.on('processingQuarter', handleProcessing);
    socket.on('quarterProcessed', handleQuarterProcessed);
    socket.on('quarterStarted', handleQuarterStarted);

    return () => {
      socket.off('processingQuarter', handleProcessing);
      socket.off('quarterProcessed', handleQuarterProcessed);
      socket.off('quarterStarted', handleQuarterStarted);
    };
  }, [socket]);

  // Sort teams by profit for leaderboard
  const rankedTeams = [...teams].sort((a, b) => {
    const profitA = (a.quarterlyResults || []).reduce((sum, r) => sum + r.profit, 0);
    const profitB = (b.quarterlyResults || []).reduce((sum, r) => sum + r.profit, 0);
    return profitB - profitA;
  });

  // Status indicator
  const getStatusDisplay = () => {
    if (teams.length === 0) {
      return { text: 'Waiting for teams to join...', color: 'bg-gray-400', pulse: true };
    }
    if (isProcessing) {
      return { text: '⚙️ Processing...', color: 'bg-blue-500', pulse: true };
    }
    if (allSubmitted) {
      return { text: '✓ All submitted - Auto-processing...', color: 'bg-green-500', pulse: true };
    }
    return { text: `Waiting (${submittedCount}/${teams.length})`, color: 'bg-yellow-500', pulse: false };
  };

  const status = getStatusDisplay();

  return (
    <div className="min-h-screen text-white p-4" style={{ backgroundColor: AMBER_COLORS.darkGrey }}>
      {/* Header */}
      <header className="bg-white rounded-lg px-4 py-3 mb-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h1 className="text-xl font-bold" style={{ color: AMBER_COLORS.darkGrey }}>Facilitator Dashboard</h1>
              <p className="text-sm text-gray-500">Game: <span className="font-mono font-bold">{gameId}</span> • {teams.length} team{teams.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: AMBER_COLORS.orange }}>Q{currentQuarter}</div>
              <div className="text-sm text-gray-500">{submittedCount}/{teams.length} submitted</div>
            </div>
            
            <div className={`px-4 py-2 rounded font-bold ${status.color} text-white ${status.pulse ? 'animate-pulse' : ''}`}>
              {status.text}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'overview', icon: '📊', label: 'Team Overview' },
          { id: 'prompts', icon: '💬', label: 'Facilitation Prompts' },
          { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ViewTab)}
            className={`px-4 py-2 rounded font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-800'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Active Events Banner */}
      {activeEvents.filter(e => e.active).length > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 mb-4">
          <span className="font-bold text-yellow-400">📢 Active Events: </span>
          {activeEvents.filter(e => e.active).map((e, i) => (
            <span key={i} className="text-yellow-200 ml-2">{e.name || e.type}</span>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <TeamOverviewGrid teams={teams} onSelectTeam={setSelectedTeam} selectedTeam={selectedTeam} />
      )}
      
      {activeTab === 'prompts' && (
        <FacilitationPrompts teams={teams} currentQuarter={currentQuarter} />
      )}
      
      {activeTab === 'leaderboard' && (
        <LeaderboardView teams={rankedTeams} />
      )}
    </div>
  );
}

// =============================================================================
// TEAM OVERVIEW GRID
// =============================================================================

function TeamOverviewGrid({ teams, onSelectTeam, selectedTeam }: { 
  teams: TeamState[]; 
  onSelectTeam: (id: string | null) => void;
  selectedTeam: string | null;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {teams.map(team => {
        const profit = (team.quarterlyResults || []).reduce((sum, r) => sum + r.profit, 0);
        const lastResult = team.quarterlyResults?.[team.quarterlyResults.length - 1];
        const clients = team.clients || [];
        const atRiskClients = clients.filter(c => c.satisfactionLevel < 40 || c.status === 'notice_given').length;
        
        return (
          <div
            key={team.teamId}
            onClick={() => onSelectTeam(selectedTeam === team.teamId ? null : team.teamId)}
            className={`rounded-lg p-3 cursor-pointer transition-all border-2 ${
              team.isBankrupt 
                ? 'bg-red-900/50 border-red-500' 
                : selectedTeam === team.teamId
                  ? 'bg-white/20 border-cyan-400'
                  : 'bg-white/5 border-transparent hover:bg-white/10'
            }`}
          >
            {/* Team Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏢</span>
                <span className="font-bold text-white truncate">{team.companyName}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                team.submittedThisQuarter ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`} title={team.submittedThisQuarter ? 'Submitted' : 'Pending'} />
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <MetricCell 
                label="Cash" 
                value={formatCurrency(team.cash || 0)}
                status={team.cash > 200000 ? 'good' : team.cash > 50000 ? 'warn' : 'bad'}
              />
              <MetricCell 
                label="Profit" 
                value={formatCurrency(profit)}
                status={profit > 0 ? 'good' : profit > -50000 ? 'warn' : 'bad'}
              />
              <MetricCell 
                label="Rep" 
                value={`${team.reputation || 0}`}
                status={(team.reputation || 0) >= 70 ? 'good' : (team.reputation || 0) >= 40 ? 'warn' : 'bad'}
              />
              <MetricCell 
                label="Burnout" 
                value={`${Math.round(team.burnout || 0)}%`}
                status={(team.burnout || 0) <= 30 ? 'good' : (team.burnout || 0) <= 60 ? 'warn' : 'bad'}
              />
              <MetricCell 
                label="Staff" 
                value={`${team.staff || 0}`}
                status="neutral"
              />
              <MetricCell 
                label="Clients" 
                value={`${clients.length}${atRiskClients > 0 ? ` (${atRiskClients}⚠)` : ''}`}
                status={atRiskClients > 0 ? 'warn' : 'good'}
              />
            </div>

            {/* Last Quarter Summary */}
            {lastResult && (
              <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60">
                Q{lastResult.quarter}: {lastResult.clientsWon > 0 && `+${lastResult.clientsWon} won `}
                {lastResult.clientsLost > 0 && `-${lastResult.clientsLost} lost `}
                {lastResult.clientsChurned > 0 && `${lastResult.clientsChurned} churned`}
              </div>
            )}

            {/* Bankrupt Badge */}
            {team.isBankrupt && (
              <div className="mt-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded text-center">
                💀 BANKRUPT
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricCell({ label, value, status }: { label: string; value: string; status: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colors = {
    good: 'text-green-400',
    warn: 'text-yellow-400',
    bad: 'text-red-400',
    neutral: 'text-white',
  };
  
  return (
    <div className="bg-black/20 rounded p-1.5">
      <div className="text-white/50">{label}</div>
      <div className={`font-bold ${colors[status]}`}>{value}</div>
    </div>
  );
}

// =============================================================================
// FACILITATION PROMPTS
// =============================================================================

function FacilitationPrompts({ teams, currentQuarter }: { teams: TeamState[]; currentQuarter: number }) {
  const prompts = generateFacilitationPrompts(teams, currentQuarter);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">💬 Discussion Prompts for Q{currentQuarter}</h3>
        <p className="text-white/60 text-sm mb-4">
          Use these questions to spark discussion. Each prompt is tailored to the team's specific situation.
        </p>
      </div>

      {teams.map(team => {
        const teamPrompts = prompts.filter(p => p.teamId === team.teamId);
        if (teamPrompts.length === 0) return null;

        return (
          <div key={team.teamId} className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🏢</span>
              <h4 className="font-bold text-white">{team.companyName}</h4>
              <span className="text-white/40 text-sm">Team {team.teamNumber}</span>
            </div>
            <div className="space-y-2">
              {teamPrompts.map((prompt, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <span className={`text-lg ${prompt.icon}`}>{prompt.icon}</span>
                  <div>
                    <p className="text-white">{prompt.question}</p>
                    {prompt.context && (
                      <p className="text-white/50 text-sm mt-1">{prompt.context}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* General Discussion Prompts */}
      <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
        <h4 className="font-bold text-cyan-400 mb-3">🎯 Cross-Team Discussion</h4>
        <div className="space-y-2 text-white/80">
          {generateCrossTeamPrompts(teams, currentQuarter).map((prompt, idx) => (
            <p key={idx}>• {prompt}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FacilitationPrompt {
  teamId: string;
  category: string;
  icon: string;
  question: string;
  context?: string;
}

function generateFacilitationPrompts(teams: TeamState[], quarter: number): FacilitationPrompt[] {
  const prompts: FacilitationPrompt[] = [];
  
  // Use quarter AND a rotating category focus to ensure variety
  // Different quarters emphasize different aspects
  const quarterFocus = [
    ['financial', 'strategy'],      // Q1
    ['clients', 'burnout'],         // Q2
    ['reputation', 'staffing'],     // Q3
    ['strategy', 'financial'],      // Q4
    ['growth', 'clients'],          // Q5
    ['sustainability', 'reputation'], // Q6
    ['competitive', 'staffing'],    // Q7
    ['endgame', 'financial'],       // Q8
  ];
  
  const focusCategories = quarterFocus[(quarter - 1) % quarterFocus.length];

  // Seeded random that changes each quarter
  const seededRandom = (teamId: string, salt: string) => {
    const str = `${teamId}-Q${quarter}-${salt}-v2`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Shuffle array based on seed
  const shuffleWithSeed = <T,>(arr: T[], teamId: string, salt: string): T[] => {
    const shuffled = [...arr];
    const seed = seededRandom(teamId, salt);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed * (i + 1) * 31) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  teams.forEach(team => {
    const allPossiblePrompts: FacilitationPrompt[] = [];
    const results = team.quarterlyResults || [];
    const lastResult = results[results.length - 1];
    const prevResult = results[results.length - 2];
    const clients = team.clients || [];
    const inputs = team.currentInputs;
    const atRiskClients = clients.filter(c => c.satisfactionLevel < 40 || c.status === 'notice_given');

    // ============================================
    // FINANCIAL PROMPTS (many variations)
    // ============================================
    const cashStr = formatCurrency(team.cash || 0);
    
    if (team.cash < 100000) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'financial', icon: '💰', question: `With only ${cashStr} in the bank, what's your survival strategy?`, context: 'Cash critically low' },
        { teamId: team.teamId, category: 'financial', icon: '💰', question: `You're operating on thin margins. What would you cut if you had to?`, context: `Cash: ${cashStr}` },
        { teamId: team.teamId, category: 'financial', icon: '💰', question: `How many quarters can you sustain at this cash level?`, context: `Cash: ${cashStr}` },
        { teamId: team.teamId, category: 'financial', icon: '💰', question: `What's your break-even point and how close are you?`, context: `Cash: ${cashStr}` },
        { teamId: team.teamId, category: 'financial', icon: '💰', question: `If a client left tomorrow, could you survive?`, context: `Cash: ${cashStr}` },
      );
    } else if (team.cash > 400000) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'financial', icon: '💎', question: `You're cash-rich at ${cashStr}. Is this strategic or overly cautious?`, context: 'Strong reserves' },
        { teamId: team.teamId, category: 'financial', icon: '💎', question: `What's holding you back from investing more aggressively?`, context: `Cash: ${cashStr}` },
        { teamId: team.teamId, category: 'financial', icon: '💎', question: `Could competitors outpace you while you sit on cash?`, context: `Cash: ${cashStr}` },
        { teamId: team.teamId, category: 'financial', icon: '💎', question: `What's your ideal cash reserve, and why?`, context: `Cash: ${cashStr}` },
      );
    } else {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'financial', icon: '💵', question: `Your cash position is stable. What would make you more aggressive?`, context: `Cash: ${cashStr}` },
        { teamId: team.teamId, category: 'financial', icon: '💵', question: `How do you balance growth investment with financial security?`, context: `Cash: ${cashStr}` },
      );
    }

    // ============================================
    // PROFITABILITY PROMPTS
    // ============================================
    if (lastResult) {
      const profitStr = formatCurrency(Math.abs(lastResult.profit));
      
      if (lastResult.profit < -50000) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'profit', icon: '📉', question: `A ${profitStr} loss is significant. Was this planned investment or a warning sign?` },
          { teamId: team.teamId, category: 'profit', icon: '📉', question: `What specific decisions led to this quarter's loss?` },
          { teamId: team.teamId, category: 'profit', icon: '📉', question: `How quickly do you expect to return to profitability?` },
        );
      } else if (lastResult.profit < 0) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'profit', icon: '📉', question: `Small loss this quarter. Deliberate or unexpected?`, context: `Loss: ${profitStr}` },
          { teamId: team.teamId, category: 'profit', icon: '📉', question: `What would need to change to break even next quarter?` },
        );
      } else if (prevResult && lastResult.profit > prevResult.profit * 1.3) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'profit', icon: '🚀', question: `Profit jumped from ${formatCurrency(prevResult.profit)} to ${formatCurrency(lastResult.profit)}. What drove this?` },
          { teamId: team.teamId, category: 'profit', icon: '🚀', question: `Can you sustain this profit growth, or was it a one-off?` },
          { teamId: team.teamId, category: 'profit', icon: '🚀', question: `What would you do differently to maintain this momentum?` },
        );
      } else if (prevResult && lastResult.profit < prevResult.profit * 0.7) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'profit', icon: '⚠️', question: `Profit dropped from ${formatCurrency(prevResult.profit)} to ${formatCurrency(lastResult.profit)}. What happened?` },
          { teamId: team.teamId, category: 'profit', icon: '⚠️', question: `Is the profit decline a trend or a blip?` },
        );
      }
    }

    // ============================================
    // BURNOUT PROMPTS
    // ============================================
    const burnout = Math.round(team.burnout || 0);
    
    if (burnout > 70) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'burnout', icon: '🔥', question: `${burnout}% burnout is critical. What's the human cost of your strategy?` },
        { teamId: team.teamId, category: 'burnout', icon: '🔥', question: `At this burnout level, what's the risk of staff leaving?` },
        { teamId: team.teamId, category: 'burnout', icon: '🔥', question: `Is the burnout from overwork, understaffing, or poor morale?` },
        { teamId: team.teamId, category: 'burnout', icon: '🔥', question: `What would you need to sacrifice to reduce burnout?` },
      );
    } else if (burnout > 50) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'burnout', icon: '😰', question: `Burnout at ${burnout}% is elevated. Is this a temporary push or systemic?` },
        { teamId: team.teamId, category: 'burnout', icon: '😰', question: `How long can your team sustain this pace?` },
      );
    } else if (burnout < 20 && (team.staff || 0) >= 8) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'burnout', icon: '😌', question: `Very low burnout with ${team.staff} staff. Are you overstaffed?` },
        { teamId: team.teamId, category: 'burnout', icon: '😌', question: `Could you take on more work without burning out the team?` },
        { teamId: team.teamId, category: 'burnout', icon: '😌', question: `Is low utilization costing you money?` },
      );
    }

    // ============================================
    // CLIENT PROMPTS
    // ============================================
    if (atRiskClients.length > 0) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'clients', icon: '⚠️', question: `${atRiskClients.length} of ${clients.length} clients are at risk. Is this acceptable churn or a red flag?` },
        { teamId: team.teamId, category: 'clients', icon: '⚠️', question: `What specifically is causing client dissatisfaction?` },
        { teamId: team.teamId, category: 'clients', icon: '⚠️', question: `How much revenue would you lose if these at-risk clients left?` },
        { teamId: team.teamId, category: 'clients', icon: '⚠️', question: `Are you investing enough in client satisfaction?` },
      );
    }

    if (lastResult && lastResult.clientsChurned > 0) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'clients', icon: '🚪', question: `You lost ${lastResult.clientsChurned} client(s) to churn. What could you have done differently?` },
        { teamId: team.teamId, category: 'clients', icon: '🚪', question: `Was the client churn predictable or a surprise?` },
      );
    }

    if (lastResult && lastResult.clientsWon >= 2) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'clients', icon: '🎯', question: `Won ${lastResult.clientsWon} clients! Can you maintain service quality with the growth?` },
        { teamId: team.teamId, category: 'clients', icon: '🎯', question: `What made your pitches successful this quarter?` },
      );
    }

    if (clients.length > 10) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'clients', icon: '📊', question: `Managing ${clients.length} clients is complex. How do you ensure quality across all?` },
      );
    } else if (clients.length <= 3) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'clients', icon: '📊', question: `With only ${clients.length} clients, how concentrated is your revenue risk?` },
      );
    }

    // ============================================
    // REPUTATION PROMPTS
    // ============================================
    const rep = team.reputation || 0;
    
    if (rep < 35) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'reputation', icon: '📢', question: `Reputation at ${rep} hurts your pitch success. How will you rebuild?` },
        { teamId: team.teamId, category: 'reputation', icon: '📢', question: `What's damaging your reputation - quality, service, or market perception?` },
      );
    } else if (rep >= 85) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'reputation', icon: '⭐', question: `Top reputation at ${rep}. Are you charging premium prices to match?` },
        { teamId: team.teamId, category: 'reputation', icon: '⭐', question: `How do you maintain excellence while growing?` },
      );
    }

    // ============================================
    // STRATEGY PROMPTS (based on inputs)
    // ============================================
    if (inputs) {
      const totalInvest = (inputs.techInvestment || 0) + (inputs.trainingInvestment || 0) + 
                         (inputs.marketingSpend || 0) + (inputs.wellbeingSpend || 0);
      
      if (totalInvest > 80000) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'strategy', icon: '📊', question: `Heavy investment of £${Math.round(totalInvest/1000)}k. What ROI do you expect?` },
          { teamId: team.teamId, category: 'strategy', icon: '📊', question: `How do you prioritize between tech, training, and marketing spend?` },
        );
      } else if (totalInvest < 15000 && team.cash > 150000) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'strategy', icon: '🤔', question: `You have cash but aren't investing. What's the strategy?` },
          { teamId: team.teamId, category: 'strategy', icon: '🤔', question: `Are you saving for something specific?` },
        );
      }

      if (inputs.growthFocus >= 75) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'growth', icon: '🎯', question: `Aggressive new business focus at ${inputs.growthFocus}%. How are existing clients feeling?` },
          { teamId: team.teamId, category: 'growth', icon: '🎯', question: `What's your pitch win rate? Is the chase worth it?` },
        );
      } else if (inputs.growthFocus <= 25) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'growth', icon: '🔒', question: `Organic growth only. How will you replace natural client churn?` },
          { teamId: team.teamId, category: 'growth', icon: '🔒', question: `What would make you shift to more aggressive new business?` },
        );
      }

      if (inputs.hiringCount >= 2) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'staffing', icon: '👥', question: `Hiring ${inputs.hiringCount} people. Do you have the work to keep them busy?` },
          { teamId: team.teamId, category: 'staffing', icon: '👥', question: `How will rapid hiring affect your culture?` },
        );
      }

      if (inputs.firingCount > 0) {
        allPossiblePrompts.push(
          { teamId: team.teamId, category: 'staffing', icon: '✂️', question: `Letting ${inputs.firingCount} go. What led to this decision?` },
          { teamId: team.teamId, category: 'staffing', icon: '✂️', question: `How does downsizing affect team morale?` },
        );
      }
    }

    // ============================================
    // QUARTER-SPECIFIC STRATEGIC PROMPTS
    // ============================================
    const quarterPrompts: { [key: number]: FacilitationPrompt[] } = {
      1: [
        { teamId: team.teamId, category: 'general', icon: '🎬', question: `What's your 3-year vision for this agency?` },
        { teamId: team.teamId, category: 'general', icon: '🎬', question: `How will you differentiate from competitors?` },
        { teamId: team.teamId, category: 'general', icon: '🎬', question: `What metric matters most to you: profit, reputation, or growth?` },
      ],
      2: [
        { teamId: team.teamId, category: 'general', icon: '📈', question: `Q2: Early patterns emerging. What's working and what isn't?` },
        { teamId: team.teamId, category: 'general', icon: '📈', question: `Are you on track for where you expected to be by now?` },
      ],
      3: [
        { teamId: team.teamId, category: 'general', icon: '🔄', question: `Halfway through Year 1. Any strategic pivots needed?` },
        { teamId: team.teamId, category: 'general', icon: '🔄', question: `What's surprised you most about running this agency?` },
      ],
      4: [
        { teamId: team.teamId, category: 'general', icon: '📅', question: `End of Year 1: How does your agency compare to your expectations?` },
        { teamId: team.teamId, category: 'general', icon: '📅', question: `What would you do differently if you started over?` },
      ],
      5: [
        { teamId: team.teamId, category: 'general', icon: '🚀', question: `Year 2 begins. What's your strategic focus this year?` },
        { teamId: team.teamId, category: 'general', icon: '🚀', question: `What lessons from Year 1 are you applying?` },
      ],
      6: [
        { teamId: team.teamId, category: 'general', icon: '⚖️', question: `Mid-game: Are you building for sustainability or short-term gains?` },
        { teamId: team.teamId, category: 'general', icon: '⚖️', question: `What's your biggest competitive advantage right now?` },
      ],
      7: [
        { teamId: team.teamId, category: 'general', icon: '🏁', question: `Approaching endgame. Are you positioned where you want to be?` },
        { teamId: team.teamId, category: 'general', icon: '🏁', question: `Any big moves planned for the final stretch?` },
      ],
      8: [
        { teamId: team.teamId, category: 'general', icon: '🏆', question: `Final quarter. What defines success for your agency?` },
        { teamId: team.teamId, category: 'general', icon: '🏆', question: `If you could change one decision, what would it be?` },
      ],
    };
    
    if (quarterPrompts[quarter]) {
      allPossiblePrompts.push(...quarterPrompts[quarter]);
    }

    // ============================================
    // COMPETITIVE PROMPTS (compare to others)
    // ============================================
    const avgCash = teams.reduce((sum, t) => sum + (t.cash || 0), 0) / teams.length;
    const avgRep = teams.reduce((sum, t) => sum + (t.reputation || 0), 0) / teams.length;
    
    if (team.cash > avgCash * 1.5) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'competitive', icon: '💪', question: `You have more cash than average. How are you leveraging this advantage?` },
      );
    } else if (team.cash < avgCash * 0.6) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'competitive', icon: '🎯', question: `Other teams have more cash reserves. Does this worry you?` },
      );
    }

    if (rep > avgRep + 15) {
      allPossiblePrompts.push(
        { teamId: team.teamId, category: 'competitive', icon: '⭐', question: `You lead in reputation. How does this translate to business advantage?` },
      );
    }

    // ============================================
    // SELECT PROMPTS - prioritize focus categories, ensure variety
    // ============================================
    // Shuffle all prompts with quarter-based seed
    const shuffled = shuffleWithSeed(allPossiblePrompts, team.teamId, `selection-${quarter}`);
    
    // Select up to 3 prompts, prioritizing focus categories
    const selected: FacilitationPrompt[] = [];
    const usedCategories = new Set<string>();
    
    // First, try to get prompts from focus categories
    for (const cat of focusCategories) {
      const catPrompts = shuffled.filter(p => p.category === cat && !usedCategories.has(p.category));
      if (catPrompts.length > 0 && selected.length < 3) {
        selected.push(catPrompts[0]);
        usedCategories.add(catPrompts[0].category);
      }
    }
    
    // Fill remaining slots from other categories
    for (const prompt of shuffled) {
      if (selected.length >= 3) break;
      if (!usedCategories.has(prompt.category)) {
        selected.push(prompt);
        usedCategories.add(prompt.category);
      }
    }

    prompts.push(...selected);
  });

  return prompts;
}

function generateCrossTeamPrompts(teams: TeamState[], quarter: number): string[] {
  // Rotate through different comparison prompts each quarter
  const allCrossTeamPrompts = [
    // Performance comparisons
    () => {
      const cashLeader = teams.reduce((max, t) => (t.cash || 0) > (max?.cash || 0) ? t : max, teams[0]);
      return `${cashLeader?.companyName} has the strongest cash position. What are they doing right?`;
    },
    () => {
      const repLeader = teams.reduce((max, t) => (t.reputation || 0) > (max?.reputation || 0) ? t : max, teams[0]);
      return `${repLeader?.companyName} leads in reputation. How important is brand vs. profit?`;
    },
    () => {
      const mostClients = teams.reduce((max, t) => (t.clients?.length || 0) > (max?.clients?.length || 0) ? t : max, teams[0]);
      return `${mostClients?.companyName} has the most clients. Is bigger always better?`;
    },
    () => {
      const lowestBurnout = teams.reduce((min, t) => (t.burnout || 100) < (min?.burnout || 100) ? t : min, teams[0]);
      return `${lowestBurnout?.companyName} has the healthiest team. What's their secret?`;
    },
    // Strategic questions
    () => `Looking at the leaderboard, what would it take to change positions?`,
    () => `Which team's strategy would you most like to understand?`,
    () => `What's the biggest risk you see other teams taking?`,
    () => `Who do you think is best positioned for the long term?`,
    () => `If you could trade one thing with another team, what would it be?`,
    () => `What's one thing you've learned from watching other teams?`,
    // Quarter-specific
    () => quarter <= 2 ? `It's early - what patterns are you noticing across teams?` : 
          quarter >= 7 ? `In the final stretch, who's making the boldest moves?` :
          `At this stage, which strategies seem to be working best?`,
    () => `Are teams converging on similar strategies or diverging?`,
  ];

  // Select 3 prompts based on quarter, ensuring variety
  const startIdx = ((quarter - 1) * 3) % allCrossTeamPrompts.length;
  const selected: string[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = (startIdx + i * 4) % allCrossTeamPrompts.length; // Skip by 4 for more variety
    selected.push(allCrossTeamPrompts[idx]());
  }
  
  return selected;
}

// =============================================================================
// LEADERBOARD VIEW
// =============================================================================

function LeaderboardView({ teams }: { teams: TeamState[] }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-bold text-cyan-400 mb-4">🏆 Leaderboard</h3>
      <div className="space-y-2">
        {teams.map((team, idx) => {
          const totalProfit = (team.quarterlyResults || []).reduce((sum, r) => sum + r.profit, 0);
          const clients = team.clients || [];
          
          return (
            <div 
              key={team.teamId}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                idx === 1 ? 'bg-gray-400/20 border border-gray-400/50' :
                idx === 2 ? 'bg-orange-700/20 border border-orange-700/50' :
                'bg-white/5'
              }`}
            >
              <div className="text-2xl font-bold w-10 text-center">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white">{team.companyName}</div>
                <div className="text-sm text-white/60">Team {team.teamNumber}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totalProfit)} profit
                </div>
                <div className="text-sm text-white/60">
                  Rep: {team.reputation} • {clients.length} clients • {formatCurrency(team.cash || 0)} cash
                </div>
              </div>
              {team.isBankrupt && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">BANKRUPT</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
