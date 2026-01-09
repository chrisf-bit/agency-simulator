// server/src/game/insights.ts
// Team performance insights and report generation

import { TeamState } from '../types';

export interface TeamReport {
  teamId: string;
  companyName: string;
  teamNumber: number;
  rank: number;
  totalTeams: number;
  summary: string;
  keyMetrics: {
    finalCash: number;
    cumulativeProfit: number;
    finalReputation: number;
    finalBurnout: number;
    totalClientsWon: number;
    totalClientsLost: number;
    averageUtilization: number;
  };
  quarterByQuarter: {
    quarter: number;
    profit: number;
    revenue: number;
    costs: number;
    clientsWon: number;
    utilization: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

/**
 * Generate a comprehensive report for a single team
 */
export function generateTeamReport(
  team: TeamState,
  allTeams: TeamState[],
  rank: number
): TeamReport {
  const results = team.quarterlyResults || [];
  
  // Calculate key metrics
  const totalClientsWon = results.reduce((sum, r) => sum + r.clientsWon, 0);
  const totalClientsLost = results.reduce((sum, r) => sum + r.clientsLost, 0);
  const averageUtilization = results.length > 0
    ? results.reduce((sum, r) => sum + r.utilizationRate, 0) / results.length
    : 0;

  // Generate quarter-by-quarter breakdown
  const quarterByQuarter = results.map(r => ({
    quarter: r.quarter,
    profit: r.profit,
    revenue: r.revenue,
    costs: r.costs,
    clientsWon: r.clientsWon,
    utilization: r.utilizationRate,
  }));

  // Analyze performance
  const strengths = analyzeStrengths(team, results);
  const weaknesses = analyzeWeaknesses(team, results);
  const recommendations = generateRecommendations(team, results);

  // Generate summary
  const summary = generateSummary(team, rank, allTeams.length);

  return {
    teamId: team.teamId,
    companyName: team.companyName,
    teamNumber: team.teamNumber,
    rank,
    totalTeams: allTeams.length,
    summary,
    keyMetrics: {
      finalCash: team.cash,
      cumulativeProfit: team.cumulativeProfit,
      finalReputation: team.reputation,
      finalBurnout: team.burnout,
      totalClientsWon,
      totalClientsLost,
      averageUtilization,
    },
    quarterByQuarter,
    strengths,
    weaknesses,
    recommendations,
  };
}

/**
 * Generate reports for all teams
 */
export function generateAllTeamReports(teams: TeamState[]): TeamReport[] {
  // Sort by cumulative profit to determine ranks
  const sortedTeams = [...teams].sort((a, b) => 
    (b.cumulativeProfit || 0) - (a.cumulativeProfit || 0)
  );

  return sortedTeams.map((team, index) => 
    generateTeamReport(team, teams, index + 1)
  );
}

// =============================================================================
// ANALYSIS HELPERS
// =============================================================================

function analyzeStrengths(team: TeamState, results: typeof team.quarterlyResults): string[] {
  const strengths: string[] = [];

  // High reputation
  if (team.reputation >= 70) {
    strengths.push('Strong brand reputation in the market');
  }

  // Low burnout
  if (team.burnout <= 30) {
    strengths.push('Healthy team culture with low burnout');
  }

  // Good profitability
  const profitableQuarters = results.filter(r => r.profit > 0).length;
  if (profitableQuarters >= results.length * 0.7) {
    strengths.push('Consistent profitability across quarters');
  }

  // High win rate
  const totalPitches = results.reduce((sum, r) => sum + r.clientsWon + r.clientsLost, 0);
  const totalWins = results.reduce((sum, r) => sum + r.clientsWon, 0);
  if (totalPitches > 0 && totalWins / totalPitches >= 0.5) {
    strengths.push('Strong pitch win rate');
  }

  // Good cash management
  if (team.cash > 300000) {
    strengths.push('Excellent cash reserves');
  }

  // Capability investment
  if (team.techLevel >= 3 || team.trainingLevel >= 3) {
    strengths.push('Investment in team capabilities');
  }

  // Market presence
  if (team.marketPresence >= 50) {
    strengths.push('Strong market presence and visibility');
  }

  return strengths.length > 0 ? strengths : ['Steady performance throughout the game'];
}

function analyzeWeaknesses(team: TeamState, results: typeof team.quarterlyResults): string[] {
  const weaknesses: string[] = [];

  // Low reputation
  if (team.reputation < 40) {
    weaknesses.push('Reputation has suffered');
  }

  // High burnout
  if (team.burnout >= 60) {
    weaknesses.push('Team burnout is dangerously high');
  }

  // Unprofitable quarters
  const unprofitableQuarters = results.filter(r => r.profit < 0).length;
  if (unprofitableQuarters >= results.length * 0.3) {
    weaknesses.push('Struggled with profitability');
  }

  // Low cash
  if (team.cash < 100000 && !team.isBankrupt) {
    weaknesses.push('Cash reserves are concerning');
  }

  // Over-utilization pattern
  const overworkedQuarters = results.filter(r => r.utilizationRate > 1.2).length;
  if (overworkedQuarters >= 2) {
    weaknesses.push('Consistent pattern of overworking the team');
  }

  // Under-utilization pattern
  const underutilizedQuarters = results.filter(r => r.utilizationRate < 0.6).length;
  if (underutilizedQuarters >= 2) {
    weaknesses.push('Underutilized team capacity');
  }

  // Bankruptcy
  if (team.isBankrupt) {
    weaknesses.push('Went bankrupt during the game');
  }

  return weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified'];
}

function generateRecommendations(team: TeamState, results: typeof team.quarterlyResults): string[] {
  const recommendations: string[] = [];

  if (team.burnout >= 50) {
    recommendations.push('Invest more in team wellbeing to reduce burnout');
  }

  if (team.reputation < 50) {
    recommendations.push('Focus on quality and training to rebuild reputation');
  }

  if (team.techLevel < 2) {
    recommendations.push('Technology investment would improve efficiency');
  }

  if (team.trainingLevel < 2) {
    recommendations.push('Training investment would improve output quality');
  }

  if (team.marketPresence < 30) {
    recommendations.push('Increase marketing spend to boost visibility');
  }

  const avgUtilization = results.length > 0
    ? results.reduce((sum, r) => sum + r.utilizationRate, 0) / results.length
    : 0;

  if (avgUtilization > 1.1) {
    recommendations.push('Consider hiring to reduce workload pressure');
  } else if (avgUtilization < 0.7) {
    recommendations.push('Win more clients or optimize staffing levels');
  }

  // Client satisfaction
  const atRiskClients = team.clients.filter(c => 
    c.satisfactionLevel && c.satisfactionLevel < 50
  ).length;
  if (atRiskClients > 0) {
    recommendations.push('Increase client satisfaction investment to retain business');
  }

  return recommendations.length > 0 
    ? recommendations 
    : ['Continue current strategy and monitor metrics'];
}

function generateSummary(team: TeamState, rank: number, totalTeams: number): string {
  if (team.isBankrupt) {
    return `${team.companyName} went bankrupt during the game. Review cash management and cost control strategies.`;
  }

  if (rank === 1) {
    return `${team.companyName} finished in first place! Strong performance with £${(team.cumulativeProfit / 1000).toFixed(0)}k cumulative profit and ${team.reputation}% reputation.`;
  }

  if (rank <= Math.ceil(totalTeams / 3)) {
    return `${team.companyName} performed well, finishing ${rank}/${totalTeams}. Solid foundation for growth.`;
  }

  if (rank <= Math.ceil(totalTeams * 2 / 3)) {
    return `${team.companyName} finished mid-pack at ${rank}/${totalTeams}. Room for improvement in key areas.`;
  }

  return `${team.companyName} finished ${rank}/${totalTeams}. Significant opportunities to improve strategy.`;
}
