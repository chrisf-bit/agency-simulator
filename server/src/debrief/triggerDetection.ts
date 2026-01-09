// =============================================================================
// PITCH PERFECT - TRIGGER DETECTION
// Analyzes team state to fire relevant debrief triggers
// =============================================================================

import { TeamState, QuarterResult, TeamInputs, ClientOpportunity } from '../types';
import { TriggerType, TriggerResult } from './debriefQuestions';

// =============================================================================
// THRESHOLDS - Tune these based on your game balance
// =============================================================================

const THRESHOLDS = {
  // Discounting
  HEAVY_DISCOUNT_PCT: 15,
  HEAVY_DISCOUNT_COUNT: 2,

  // Pitching behavior
  AGGRESSIVE_PITCH_PCT: 75,
  SELECTIVE_PITCH_PCT: 40,

  // Burnout
  HIGH_BURNOUT: 60,
  CRITICAL_BURNOUT: 80,
  BURNOUT_SPIKE: 20,
  BURNOUT_RECOVERY: 15,

  // Reputation
  REPUTATION_GROWTH: 10,
  REPUTATION_DAMAGE: 10,
  LOW_REPUTATION: 40,

  // Utilization
  HIGH_UTILIZATION: 90,
  LOW_UTILIZATION: 50,

  // Cash
  LOW_CASH: 20000,
  CRITICAL_CASH: 5000,

  // Investment
  SIGNIFICANT_INVESTMENT: 5000,
  EARLY_INVESTMENT_TOTAL: 10000,

  // Wellbeing
  SIGNIFICANT_WELLBEING: 3000,
};

// =============================================================================
// MAIN DETECTION FUNCTION
// =============================================================================

export interface GameContext {
  totalTeams: number;
  opportunities: ClientOpportunity[];
  opportunitiesPerQuarter: Map<number, number>;
  leaderByQuarter: string[];
}

export function detectTriggers(
  team: TeamState,
  gameContext: GameContext
): TriggerResult[] {
  const triggers: TriggerResult[] = [];
  const results = team.quarterlyResults;
  const numQuarters = results.length;
  const currentQuarter = team.quarter;

  // --- FIRST QUARTER TRIGGER (always fires in Q1) ---
  triggers.push({
    type: 'first_quarter',
    fired: currentQuarter <= 2,
    intensity: currentQuarter === 1 ? 1 : 0.5,
    context: currentQuarter === 1 ? 'First quarter of the game' : 'Early game phase',
    quarters: [currentQuarter]
  });

  // If no results yet, return early game triggers only
  if (numQuarters === 0) {
    // Check for early investment from current inputs
    const techInvest = team.currentInputs?.techInvestment || 0;
    const trainingInvest = team.currentInputs?.trainingInvestment || 0;
    const totalInvest = techInvest + trainingInvest;

    triggers.push({
      type: 'early_investment',
      fired: totalInvest > THRESHOLDS.SIGNIFICANT_INVESTMENT,
      intensity: Math.min(1, totalInvest / THRESHOLDS.EARLY_INVESTMENT_TOTAL),
      context: totalInvest > 0 
        ? `Invested $${(totalInvest / 1000).toFixed(0)}k in tech/training`
        : 'No investment yet',
      quarters: [1]
    });

    triggers.push({
      type: 'no_investment',
      fired: totalInvest === 0,
      intensity: totalInvest === 0 ? 0.8 : 0,
      context: 'No investment in tech or training',
      quarters: [1]
    });

    return triggers;
  }

  // --- DISCOUNTING ---
  const discountsByQuarter = getDiscountsByQuarter(team);
  const heavyDiscountQuarters = discountsByQuarter.filter(
    d => d.avgDiscount > THRESHOLDS.HEAVY_DISCOUNT_PCT
  );

  triggers.push({
    type: 'heavy_discounting',
    fired: heavyDiscountQuarters.length >= 1, // Lower threshold for early game
    intensity: Math.min(1, heavyDiscountQuarters.length / Math.max(1, numQuarters)),
    context: heavyDiscountQuarters.length > 0
      ? `Avg ${Math.round(avg(heavyDiscountQuarters.map(d => d.avgDiscount)))}% discount in Q${heavyDiscountQuarters.map(d => d.quarter).join(', Q')}`
      : 'Conservative discounting',
    quarters: heavyDiscountQuarters.map(d => d.quarter)
  });

  // --- PITCHING BEHAVIOR ---
  const pitchRates = getPitchRatesByQuarter(team, gameContext);
  const avgPitchRate = avg(pitchRates.map(p => p.rate));

  triggers.push({
    type: 'aggressive_pitching',
    fired: avgPitchRate > THRESHOLDS.AGGRESSIVE_PITCH_PCT,
    intensity: Math.min(1, avgPitchRate / 100),
    context: `Pitched on ${Math.round(avgPitchRate)}% of opportunities on average`,
    quarters: pitchRates.filter(p => p.rate > THRESHOLDS.AGGRESSIVE_PITCH_PCT).map(p => p.quarter)
  });

  triggers.push({
    type: 'selective_pitching',
    fired: avgPitchRate < THRESHOLDS.SELECTIVE_PITCH_PCT,
    intensity: 1 - (avgPitchRate / 100),
    context: `Pitched on only ${Math.round(avgPitchRate)}% of opportunities`,
    quarters: pitchRates.filter(p => p.rate < THRESHOLDS.SELECTIVE_PITCH_PCT).map(p => p.quarter)
  });

  // --- BURNOUT ---
  const burnoutHistory = team.agencyMetrics?.map(m => ({ quarter: m.quarter, burnout: m.burnout })) || [];
  const highBurnoutQuarters = burnoutHistory.filter(b => b.burnout > THRESHOLDS.HIGH_BURNOUT);
  const criticalBurnoutQuarters = burnoutHistory.filter(b => b.burnout > THRESHOLDS.CRITICAL_BURNOUT);

  triggers.push({
    type: 'high_burnout',
    fired: highBurnoutQuarters.length > 0,
    intensity: highBurnoutQuarters.length > 0
      ? Math.max(...highBurnoutQuarters.map(b => b.burnout)) / 100
      : 0,
    context: highBurnoutQuarters.length > 0
      ? `Burnout hit ${Math.max(...highBurnoutQuarters.map(b => b.burnout))} in Q${highBurnoutQuarters.map(b => b.quarter).join(', Q')}`
      : 'Burnout stayed manageable',
    quarters: highBurnoutQuarters.map(b => b.quarter)
  });

  // Burnout spiral (sustained high burnout across multiple quarters)
  const burnoutSpiral = detectBurnoutSpiral(burnoutHistory);
  triggers.push({
    type: 'burnout_spiral',
    fired: burnoutSpiral.detected,
    intensity: burnoutSpiral.detected ? 0.9 : 0,
    context: burnoutSpiral.detected
      ? `Burnout spiral from Q${burnoutSpiral.startQuarter} to Q${burnoutSpiral.endQuarter}`
      : 'No sustained burnout spiral',
    quarters: burnoutSpiral.quarters
  });

  // Burnout recovery
  const burnoutRecovery = detectBurnoutRecovery(burnoutHistory);
  triggers.push({
    type: 'burnout_recovery',
    fired: burnoutRecovery.detected,
    intensity: burnoutRecovery.detected ? 0.8 : 0,
    context: burnoutRecovery.detected
      ? `Recovered from ${burnoutRecovery.peakBurnout} burnout in Q${burnoutRecovery.quarter}`
      : 'No significant burnout recovery',
    quarters: burnoutRecovery.detected ? [burnoutRecovery.quarter] : []
  });

  // --- REPUTATION ---
  const reputationHistory = team.agencyMetrics?.map(m => ({ quarter: m.quarter, reputation: m.reputation })) || [];
  const reputationChange = reputationHistory.length >= 2
    ? reputationHistory[reputationHistory.length - 1].reputation - reputationHistory[0].reputation
    : 0;

  triggers.push({
    type: 'reputation_growth',
    fired: reputationChange > THRESHOLDS.REPUTATION_GROWTH,
    intensity: Math.min(1, reputationChange / 30),
    context: reputationChange > 0
      ? `Reputation grew by ${reputationChange} points`
      : 'Reputation flat or declined',
    quarters: []
  });

  triggers.push({
    type: 'reputation_damage',
    fired: reputationChange < -THRESHOLDS.REPUTATION_DAMAGE,
    intensity: Math.min(1, Math.abs(reputationChange) / 30),
    context: reputationChange < 0
      ? `Reputation dropped by ${Math.abs(reputationChange)} points`
      : 'Reputation maintained or grew',
    quarters: []
  });

  // --- QUALITY LEVEL ---
  const qualityChoices = getQualityChoices(team);
  const premiumCount = qualityChoices.filter(q => q.quality === 'premium').length;
  const budgetCount = qualityChoices.filter(q => q.quality === 'budget').length;

  triggers.push({
    type: 'premium_quality',
    fired: premiumCount >= 1,
    intensity: premiumCount / Math.max(1, numQuarters),
    context: premiumCount > 0
      ? `Chose premium delivery in ${premiumCount} quarter(s)`
      : 'Did not use premium delivery',
    quarters: qualityChoices.filter(q => q.quality === 'premium').map(q => q.quarter)
  });

  triggers.push({
    type: 'budget_quality',
    fired: budgetCount >= 1,
    intensity: budgetCount / Math.max(1, numQuarters),
    context: budgetCount > 0
      ? `Chose budget delivery in ${budgetCount} quarter(s)`
      : 'Avoided budget delivery',
    quarters: qualityChoices.filter(q => q.quality === 'budget').map(q => q.quarter)
  });

  // --- UTILIZATION ---
  const utilizationHistory = results.map(r => ({ quarter: r.quarter, utilization: (r.utilizationRate || 0) * 100 }));
  const highUtilQuarters = utilizationHistory.filter(u => u.utilization > THRESHOLDS.HIGH_UTILIZATION);
  const lowUtilQuarters = utilizationHistory.filter(u => u.utilization < THRESHOLDS.LOW_UTILIZATION);

  triggers.push({
    type: 'high_utilization',
    fired: highUtilQuarters.length > 0,
    intensity: highUtilQuarters.length / Math.max(1, numQuarters),
    context: highUtilQuarters.length > 0
      ? `Utilization hit ${Math.max(...highUtilQuarters.map(u => Math.round(u.utilization)))}% in Q${highUtilQuarters.map(u => u.quarter).join(', Q')}`
      : 'Utilization well managed',
    quarters: highUtilQuarters.map(u => u.quarter)
  });

  triggers.push({
    type: 'low_utilization',
    fired: lowUtilQuarters.length >= 1,
    intensity: lowUtilQuarters.length / Math.max(1, numQuarters),
    context: lowUtilQuarters.length > 0
      ? `Utilization below ${THRESHOLDS.LOW_UTILIZATION}% in Q${lowUtilQuarters.map(u => u.quarter).join(', Q')}`
      : 'Good utilization',
    quarters: lowUtilQuarters.map(u => u.quarter)
  });

  // --- STAFFING ---
  const staffHistory = team.agencyMetrics?.map(m => ({ quarter: m.quarter, staff: m.staff })) || [];
  const avgStaff = avg(staffHistory.map(s => s.staff));
  const avgUtilization = avg(utilizationHistory.map(u => u.utilization));

  triggers.push({
    type: 'overstaffed',
    fired: avgUtilization < 60 && avgStaff > 5,
    intensity: avgUtilization < 60 ? (60 - avgUtilization) / 60 : 0,
    context: avgUtilization < 60 ? `Average utilization only ${Math.round(avgUtilization)}%` : 'Staffing balanced',
    quarters: []
  });

  triggers.push({
    type: 'understaffed',
    fired: avgUtilization > 85,
    intensity: avgUtilization > 85 ? (avgUtilization - 85) / 15 : 0,
    context: avgUtilization > 85 ? `Average utilization ${Math.round(avgUtilization)}%` : 'Staffing adequate',
    quarters: []
  });

  // --- HIRED/FIRED STAFF ---
  const hiredStaff = staffHistory.length >= 2 && staffHistory[staffHistory.length - 1].staff > staffHistory[0].staff;
  const firedStaff = staffHistory.length >= 2 && staffHistory[staffHistory.length - 1].staff < staffHistory[0].staff;
  const staffChange = staffHistory.length >= 2 
    ? staffHistory[staffHistory.length - 1].staff - staffHistory[0].staff 
    : 0;

  triggers.push({
    type: 'hired_staff',
    fired: hiredStaff,
    intensity: Math.min(1, Math.abs(staffChange) / 3),
    context: staffChange > 0 ? `Hired ${staffChange} staff` : 'No hiring',
    quarters: [currentQuarter]
  });

  triggers.push({
    type: 'fired_staff',
    fired: firedStaff,
    intensity: Math.min(1, Math.abs(staffChange) / 3),
    context: staffChange < 0 ? `Let go ${Math.abs(staffChange)} staff` : 'No layoffs',
    quarters: [currentQuarter]
  });

  // --- CASH ---
  const currentCash = team.cash;
  triggers.push({
    type: 'cash_crunch',
    fired: currentCash < THRESHOLDS.LOW_CASH,
    intensity: currentCash < THRESHOLDS.LOW_CASH ? 1 - (currentCash / THRESHOLDS.LOW_CASH) : 0,
    context: currentCash < THRESHOLDS.LOW_CASH
      ? `Cash at $${(currentCash / 1000).toFixed(0)}k`
      : `Cash healthy at $${(currentCash / 1000).toFixed(0)}k`,
    quarters: [currentQuarter]
  });

  triggers.push({
    type: 'near_bankruptcy',
    fired: currentCash < THRESHOLDS.CRITICAL_CASH,
    intensity: currentCash < THRESHOLDS.CRITICAL_CASH ? 1 : 0,
    context: currentCash < THRESHOLDS.CRITICAL_CASH
      ? `Near bankruptcy with $${(currentCash / 1000).toFixed(0)}k`
      : 'Financially stable',
    quarters: currentCash < THRESHOLDS.CRITICAL_CASH ? [currentQuarter] : []
  });

  // --- INVESTMENT ---
  const investments = getInvestmentsByQuarter(team);
  const totalInvestment = investments.reduce((sum, i) => sum + i.total, 0);
  const earlyInvestment = investments
    .filter(i => i.quarter <= 2)
    .reduce((sum, i) => sum + i.total, 0);

  triggers.push({
    type: 'early_investment',
    fired: earlyInvestment > THRESHOLDS.SIGNIFICANT_INVESTMENT,
    intensity: Math.min(1, earlyInvestment / (THRESHOLDS.EARLY_INVESTMENT_TOTAL * 2)),
    context: earlyInvestment > 0
      ? `Invested $${(earlyInvestment / 1000).toFixed(0)}k in tech/training in Q1-Q2`
      : 'No early investment',
    quarters: [1, 2]
  });

  triggers.push({
    type: 'no_investment',
    fired: totalInvestment < THRESHOLDS.SIGNIFICANT_INVESTMENT,
    intensity: 1 - Math.min(1, totalInvestment / THRESHOLDS.EARLY_INVESTMENT_TOTAL),
    context: totalInvestment < THRESHOLDS.SIGNIFICANT_INVESTMENT
      ? 'Minimal investment in tech/training'
      : `Invested $${(totalInvestment / 1000).toFixed(0)}k total`,
    quarters: []
  });

  // --- WELLBEING ---
  const wellbeingSpend = getWellbeingByQuarter(team);
  const totalWellbeing = wellbeingSpend.reduce((sum, w) => sum + w.amount, 0);
  const wellbeingQuarters = wellbeingSpend.filter(w => w.amount > THRESHOLDS.SIGNIFICANT_WELLBEING);

  triggers.push({
    type: 'wellbeing_focus',
    fired: wellbeingQuarters.length >= 1,
    intensity: wellbeingQuarters.length / Math.max(1, numQuarters),
    context: wellbeingQuarters.length > 0
      ? `Invested in wellbeing in ${wellbeingQuarters.length} quarter(s)`
      : 'Limited wellbeing investment',
    quarters: wellbeingQuarters.map(w => w.quarter)
  });

  triggers.push({
    type: 'wellbeing_neglect',
    fired: totalWellbeing < THRESHOLDS.SIGNIFICANT_WELLBEING && highBurnoutQuarters.length > 0,
    intensity: highBurnoutQuarters.length > 0 && totalWellbeing < 1000 ? 0.8 : 0,
    context: totalWellbeing < THRESHOLDS.SIGNIFICANT_WELLBEING
      ? 'Minimal wellbeing spend despite burnout'
      : 'Invested in staff wellbeing',
    quarters: []
  });

  // --- GROWTH & POSITION ---
  const profits = results.map(r => r.profit);
  const profitGrowth = profits.length >= 2
    ? (profits[profits.length - 1] - profits[0]) / Math.max(1, Math.abs(profits[0]))
    : 0;

  triggers.push({
    type: 'strong_growth',
    fired: profitGrowth > 0.5 && team.cumulativeProfit > 0,
    intensity: Math.min(1, profitGrowth),
    context: team.cumulativeProfit > 0
      ? `Cumulative profit of $${team.cumulativeProfit.toLocaleString()}`
      : 'Struggled to achieve profitability',
    quarters: []
  });

  // Client churn
  const totalChurn = results.reduce((sum, r) => sum + (r.clientsLost || 0), 0);
  triggers.push({
    type: 'client_churn',
    fired: totalChurn >= 2,
    intensity: Math.min(1, totalChurn / 5),
    context: totalChurn > 0
      ? `Lost ${totalChurn} client(s) over the game`
      : 'Strong client retention',
    quarters: results.filter(r => (r.clientsLost || 0) > 0).map(r => r.quarter)
  });

  // Market leader (based on final profit ranking)
  const isLeader = gameContext.leaderByQuarter.length > 0 && 
    gameContext.leaderByQuarter[gameContext.leaderByQuarter.length - 1] === team.teamId;
  triggers.push({
    type: 'market_leader',
    fired: isLeader,
    intensity: isLeader ? 1 : 0,
    context: isLeader ? 'Currently leading the market' : `Cumulative profit: $${team.cumulativeProfit.toLocaleString()}`,
    quarters: []
  });

  // Comeback / Early lead lost (only relevant after Q3)
  if (numQuarters >= 3) {
    const earlyLeader = gameContext.leaderByQuarter.slice(0, 2).includes(team.teamId);
    const finalLeader = isLeader;
    const wasBottom = detectWasBottom(team, gameContext);

    triggers.push({
      type: 'comeback',
      fired: wasBottom && finalLeader,
      intensity: wasBottom && finalLeader ? 0.9 : 0,
      context: wasBottom && finalLeader ? 'Staged a comeback to lead' : 'No major comeback',
      quarters: []
    });

    triggers.push({
      type: 'early_lead_lost',
      fired: earlyLeader && !finalLeader,
      intensity: earlyLeader && !finalLeader ? 0.9 : 0,
      context: earlyLeader && !finalLeader ? 'Led early but fell behind' : 'Maintained position',
      quarters: []
    });
  }

  return triggers;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function avg(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function getDiscountsByQuarter(team: TeamState): { quarter: number; avgDiscount: number }[] {
  const results: { quarter: number; avgDiscount: number }[] = [];
  
  // Current inputs
  if (team.currentInputs?.pitches?.length > 0) {
    const discounts = team.currentInputs.pitches.map(p => p.discountPercent || 0);
    results.push({
      quarter: team.quarter,
      avgDiscount: avg(discounts)
    });
  }

  return results;
}

function getPitchRatesByQuarter(
  team: TeamState,
  gameContext: GameContext
): { quarter: number; rate: number }[] {
  const results: { quarter: number; rate: number }[] = [];
  
  for (const qr of team.quarterlyResults) {
    const opportunityCount = gameContext.opportunitiesPerQuarter.get(qr.quarter) || 5;
    const pitchCount = (qr.clientsWon || 0) + (qr.clientsLost || 0); // Approximate
    const rate = (pitchCount / opportunityCount) * 100;
    results.push({ quarter: qr.quarter, rate: Math.min(100, rate) });
  }

  return results;
}

function getQualityChoices(team: TeamState): { quarter: number; quality: string }[] {
  const results: { quarter: number; quality: string }[] = [];
  
  // Current inputs
  if (team.currentInputs?.qualityLevel) {
    results.push({
      quarter: team.quarter,
      quality: team.currentInputs.qualityLevel
    });
  }

  return results;
}

function getInvestmentsByQuarter(team: TeamState): { quarter: number; total: number }[] {
  const results: { quarter: number; total: number }[] = [];
  
  // From current inputs
  if (team.currentInputs) {
    const tech = team.currentInputs.techInvestment || 0;
    const training = team.currentInputs.trainingInvestment || 0;
    results.push({
      quarter: team.quarter,
      total: tech + training
    });
  }

  return results;
}

function getWellbeingByQuarter(team: TeamState): { quarter: number; amount: number }[] {
  const results: { quarter: number; amount: number }[] = [];
  
  // Current inputs
  if (team.currentInputs?.wellbeingSpend) {
    results.push({
      quarter: team.quarter,
      amount: team.currentInputs.wellbeingSpend
    });
  }

  return results;
}

function detectBurnoutSpiral(history: { quarter: number; burnout: number }[]): {
  detected: boolean;
  startQuarter: number;
  endQuarter: number;
  quarters: number[];
} {
  let consecutiveHigh = 0;
  let startQuarter = 0;
  const quarters: number[] = [];

  for (const h of history) {
    if (h.burnout > THRESHOLDS.HIGH_BURNOUT) {
      if (consecutiveHigh === 0) startQuarter = h.quarter;
      consecutiveHigh++;
      quarters.push(h.quarter);
    } else {
      consecutiveHigh = 0;
      quarters.length = 0;
    }
  }

  return {
    detected: consecutiveHigh >= 2,
    startQuarter,
    endQuarter: quarters[quarters.length - 1] || 0,
    quarters
  };
}

function detectBurnoutRecovery(history: { quarter: number; burnout: number }[]): {
  detected: boolean;
  quarter: number;
  peakBurnout: number;
} {
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    
    if (prev.burnout > THRESHOLDS.HIGH_BURNOUT && 
        curr.burnout < prev.burnout - THRESHOLDS.BURNOUT_RECOVERY) {
      return {
        detected: true,
        quarter: curr.quarter,
        peakBurnout: prev.burnout
      };
    }
  }

  return { detected: false, quarter: 0, peakBurnout: 0 };
}

function detectWasBottom(team: TeamState, gameContext: GameContext): boolean {
  // Check if team was in last place at any point
  return team.quarterlyResults.some(r => r.profit < 0);
}
