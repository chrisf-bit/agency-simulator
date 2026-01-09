// server/src/debrief.ts
// Facilitator debrief prompts and discussion questions

import { TeamState, GameState } from './types';

export interface DebriefPrompt {
  category: string;
  question: string;
  context: string;
}

export interface QuarterlyDebrief {
  quarter: number;
  highlights: string[];
  discussionPoints: DebriefPrompt[];
  keyMetrics: {
    highestProfit: { team: string; value: number };
    lowestBurnout: { team: string; value: number };
    highestReputation: { team: string; value: number };
    mostClients: { team: string; value: number };
  };
}

export interface FinalDebrief {
  winner: string;
  gameHighlights: string[];
  discussionTopics: DebriefPrompt[];
  teamRankings: {
    rank: number;
    companyName: string;
    cumulativeProfit: number;
    reputation: number;
    clients: number;
  }[];
}

/**
 * Generate quarterly discussion prompts for facilitator
 */
export function generateQuarterlyPrompts(gameState: GameState, quarter: number): QuarterlyDebrief {
  const teams = Array.from(gameState.teams.values());
  
  // Find key metrics leaders
  const highestProfit = teams.reduce((max, t) => {
    const latestResult = t.quarterlyResults?.[t.quarterlyResults.length - 1];
    const profit = latestResult?.profit || 0;
    return profit > (max.value || -Infinity) 
      ? { team: t.companyName, value: profit }
      : max;
  }, { team: '', value: -Infinity });

  const lowestBurnout = teams.reduce((min, t) => 
    t.burnout < (min.value || Infinity) 
      ? { team: t.companyName, value: t.burnout }
      : min,
    { team: '', value: Infinity }
  );

  const highestReputation = teams.reduce((max, t) => 
    t.reputation > (max.value || -Infinity)
      ? { team: t.companyName, value: t.reputation }
      : max,
    { team: '', value: -Infinity }
  );

  const mostClients = teams.reduce((max, t) => 
    t.clients.length > (max.value || -Infinity)
      ? { team: t.companyName, value: t.clients.length }
      : max,
    { team: '', value: -Infinity }
  );

  // Generate highlights
  const highlights: string[] = [];
  
  if (highestProfit.value > 0) {
    highlights.push(`${highestProfit.team} led with £${(highestProfit.value / 1000).toFixed(0)}k profit this quarter`);
  }
  
  const bankruptTeams = teams.filter(t => t.isBankrupt);
  if (bankruptTeams.length > 0) {
    highlights.push(`${bankruptTeams.map(t => t.companyName).join(', ')} went bankrupt`);
  }

  // Generate discussion points
  const discussionPoints: DebriefPrompt[] = [];

  // Strategy discussion
  discussionPoints.push({
    category: 'Strategy',
    question: 'What pricing strategies are teams using? Are discounts paying off?',
    context: 'Compare win rates vs. discount levels across teams',
  });

  // Client satisfaction discussion
  if (quarter >= 2) {
    discussionPoints.push({
      category: 'Client Retention',
      question: 'How are teams balancing new business vs. client satisfaction?',
      context: 'Client satisfaction spending varies significantly across teams',
    });
  }

  // Burnout discussion
  const highBurnoutTeams = teams.filter(t => t.burnout > 50);
  if (highBurnoutTeams.length > 0) {
    discussionPoints.push({
      category: 'Team Health',
      question: 'Some teams are showing high burnout. What are the tradeoffs?',
      context: `${highBurnoutTeams.map(t => t.companyName).join(', ')} have burnout >50%`,
    });
  }

  // Investment discussion
  discussionPoints.push({
    category: 'Investment',
    question: 'How are teams investing in capabilities? What\'s the ROI?',
    context: 'Compare tech, training, and marketing investment strategies',
  });

  return {
    quarter,
    highlights,
    discussionPoints,
    keyMetrics: {
      highestProfit,
      lowestBurnout,
      highestReputation,
      mostClients,
    },
  };
}

/**
 * Generate final game debrief for facilitator
 */
export function generateFacilitatorPrompts(gameState: GameState): FinalDebrief {
  const teams = Array.from(gameState.teams.values());
  
  // Sort teams by profit for rankings
  const sortedTeams = [...teams].sort((a, b) => 
    (b.cumulativeProfit || 0) - (a.cumulativeProfit || 0)
  );

  const winner = sortedTeams[0]?.companyName || 'No winner';

  // Generate game highlights
  const gameHighlights: string[] = [];
  
  if (sortedTeams[0]) {
    gameHighlights.push(
      `${winner} won with £${(sortedTeams[0].cumulativeProfit / 1000).toFixed(0)}k cumulative profit`
    );
  }

  const bankruptTeams = teams.filter(t => t.isBankrupt);
  if (bankruptTeams.length > 0) {
    gameHighlights.push(
      `${bankruptTeams.length} team${bankruptTeams.length > 1 ? 's' : ''} went bankrupt`
    );
  }

  const avgReputation = teams.reduce((sum, t) => sum + t.reputation, 0) / teams.length;
  gameHighlights.push(`Average final reputation: ${avgReputation.toFixed(0)}%`);

  // Generate discussion topics
  const discussionTopics: DebriefPrompt[] = [
    {
      category: 'Strategy',
      question: 'What differentiated the winning strategy from others?',
      context: 'Analyze decisions around pricing, quality, and investments',
    },
    {
      category: 'Client Management',
      question: 'How did client retention strategies affect final outcomes?',
      context: 'Compare teams that invested heavily in satisfaction vs. growth',
    },
    {
      category: 'Team Health',
      question: 'What was the impact of burnout on long-term performance?',
      context: 'Teams with high burnout often saw declining quality',
    },
    {
      category: 'Learning',
      question: 'What would you do differently if playing again?',
      context: 'Encourage reflection on key decision points',
    },
    {
      category: 'Real-World Application',
      question: 'How do these dynamics apply to your actual work?',
      context: 'Connect game learnings to real agency/business challenges',
    },
  ];

  // Build team rankings
  const teamRankings = sortedTeams.map((team, index) => ({
    rank: index + 1,
    companyName: team.companyName,
    cumulativeProfit: team.cumulativeProfit,
    reputation: team.reputation,
    clients: team.clients.length,
  }));

  return {
    winner,
    gameHighlights,
    discussionTopics,
    teamRankings,
  };
}
