// server/src/game/engine.ts
// Core game calculation engine for Agency Leadership simulation

import {
  TeamState,
  TeamInputs,
  GameEvent,
  QuarterResult,
  GameLevel,
  ClientOpportunity,
  ActiveClient,
  PitchDecision,
  LeaderboardEntry,
  QualityLevel,
} from '../types';
import { SeededRandom } from '../utils/randomSeed';

// =============================================================================
// CONSTANTS
// =============================================================================

const HOURS_PER_STAFF_PER_QUARTER = 520;
const STAFF_COST_PER_QUARTER = 12500; // £12.5k per staff per quarter (£50k/year)
const HIRING_COST = 15000; // £15k per hire
const FIRING_COST = 8000; // £8k severance per person
const MIN_STAFF = 5;
const MAX_STAFF = 40;
const CONTRACT_LENGTH_QUARTERS = 4;

// Client satisfaction thresholds
const SATISFACTION_CHURN_THRESHOLD = 30; // Below this, client may leave
const SATISFACTION_RENEW_THRESHOLD = 60; // Above this, client may renew
const SATISFACTION_BASE_DECAY = 5; // Natural decay if no investment

// Growth Focus constants
const PITCH_HOURS_BASE = 40; // Base hours to pitch for new client
const PROJECT_HOURS_BASE = 10; // Base hours to pitch for existing client project

// =============================================================================
// MAIN ENGINE FUNCTION
// =============================================================================

export function processQuarter(
  team: TeamState,
  inputs: TeamInputs,
  allTeams: TeamState[],
  opportunities: ClientOpportunity[],
  events: GameEvent[],
  level: GameLevel,
  random: SeededRandom
): TeamState {
  const quarter = team.quarter + 1;

  // Step 1: Calculate capacity and pitching overhead from Growth Focus
  const newStaff = Math.max(MIN_STAFF, Math.min(MAX_STAFF, 
    team.staff + inputs.hiringCount - inputs.firingCount));
  const totalCapacity = newStaff * HOURS_PER_STAFF_PER_QUARTER;
  
  // Growth Focus affects pitch hours (higher = more time on new biz pitching)
  const growthFocus = inputs.growthFocus; // 0-100
  const pitchOverheadMultiplier = 1 + (growthFocus / 100); // 1x to 2x
  
  // Step 2: Process client satisfaction and retention FIRST
  const { 
    retainedClients, 
    churnedClients, 
    renewedClients,
    existingClientRevenue,
    projectOpportunities // NEW: Organic project opportunities from existing clients
  } = processClientRetention(team, inputs, events, random);

  // Step 3: Process pitches - separate new client vs existing client projects
  const { 
    wonNewClients, 
    wonProjects,
    lostPitches, 
    totalPitchRevenue,
    pitchHoursUsed 
  } = processPitches(
    team,
    inputs,
    opportunities,
    projectOpportunities,
    events,
    random,
    pitchOverheadMultiplier
  );

  // Step 4: Calculate total revenue
  const totalRevenue = totalPitchRevenue + existingClientRevenue;

  // Step 5: Calculate workload
  const clientWorkload = calculateWorkload(retainedClients, wonNewClients);
  const totalWorkload = clientWorkload + pitchHoursUsed;
  const utilizationRate = totalCapacity > 0 ? (totalWorkload / totalCapacity) * 100 : 0;

  // Step 6: Calculate costs
  const costs = calculateCosts(team, inputs, newStaff, wonNewClients, events);

  // Step 7: Calculate profit
  const profit = totalRevenue - costs;

  // Step 8: Update burnout - Growth Focus affects this!
  const burnoutChange = calculateBurnoutChange(team, inputs, utilizationRate, growthFocus, events);
  const newBurnout = Math.max(0, Math.min(100, team.burnout + burnoutChange));

  // Step 9: Update reputation
  const reputationChange = calculateReputationChange(team, inputs, wonNewClients, wonProjects, utilizationRate, events);
  const newReputation = Math.max(0, Math.min(100, team.reputation + reputationChange));

  // Step 10: Update capability levels
  const newTechLevel = updateTechLevel(team, inputs);
  const newTrainingLevel = updateTrainingLevel(team, inputs);
  const newProcessLevel = team.processLevel || 1;

  // Step 11: Update market presence
  const newMarketPresence = updateMarketPresence(team, inputs, wonNewClients);

  // Step 12: Calculate new cash position
  const newCash = team.cash + profit;

  // Step 13: Combine client lists
  const allClients = [...retainedClients, ...renewedClients, ...wonNewClients];
  
  // Add project revenue to existing clients (one-off boost)
  // Projects don't create new client entries, they add revenue to existing relationships

  // Step 14: Create quarterly result
  const quarterResult: QuarterResult = {
    quarter,
    revenue: totalRevenue,
    costs,
    profit,
    clientsWon: wonNewClients.length,
    clientsLost: lostPitches,
    clientsChurned: churnedClients.length,
    clientsRenewed: renewedClients.length,
    staffChange: inputs.hiringCount - inputs.firingCount,
    reputationChange,
    burnoutChange,
    utilizationRate: utilizationRate / 100,
    hoursDelivered: totalWorkload,
    hoursCapacity: totalCapacity,
  };

  // Step 15: Create agency metrics snapshot
  const agencyMetricsSnapshot = {
    quarter,
    cash: newCash,
    reputation: newReputation,
    burnout: newBurnout,
    staff: newStaff,
    techLevel: newTechLevel,
    trainingLevel: newTrainingLevel,
    processLevel: newProcessLevel,
    marketPresence: newMarketPresence,
    activeClients: allClients.length,
  };

  // Step 16: Check for bankruptcy
  const isBankrupt = newCash < 0;

  return {
    ...team,
    quarter,
    cash: newCash,
    cumulativeProfit: team.cumulativeProfit + profit,
    staff: newStaff,
    burnout: newBurnout,
    reputation: newReputation,
    marketPresence: newMarketPresence,
    techLevel: newTechLevel,
    trainingLevel: newTrainingLevel,
    processLevel: newProcessLevel,
    clients: allClients,
    isBankrupt,
    submittedThisQuarter: false,
    currentInputs: getDefaultInputs(),
    quarterlyResults: [...(team.quarterlyResults || []), quarterResult],
    agencyMetrics: [...(team.agencyMetrics || []), agencyMetricsSnapshot],
  };
}

// =============================================================================
// CLIENT RETENTION PROCESSING
// =============================================================================

interface ProjectOpportunity {
  clientId: string;
  clientName: string;
  budget: number; // £10k-£100k
  hoursRequired: number;
  winChance: number; // 75%+ for existing clients
}

interface RetentionResult {
  retainedClients: ActiveClient[];
  churnedClients: ActiveClient[];
  renewedClients: ActiveClient[];
  existingClientRevenue: number;
  projectOpportunities: ProjectOpportunity[];
}

function processClientRetention(
  team: TeamState,
  inputs: TeamInputs,
  events: GameEvent[],
  random: SeededRandom
): RetentionResult {
  const retainedClients: ActiveClient[] = [];
  const churnedClients: ActiveClient[] = [];
  const renewedClients: ActiveClient[] = [];
  const projectOpportunities: ProjectOpportunity[] = [];
  let existingClientRevenue = 0;

  // Calculate satisfaction factors
  const clientCount = team.clients.length;
  const satisfactionSpendPerClient = clientCount > 0 
    ? inputs.clientSatisfactionSpend / clientCount 
    : 0;
  
  // Satisfaction boost from investment (diminishing returns)
  const investmentBoost = Math.min(25, Math.sqrt(satisfactionSpendPerClient / 1000) * 8);
  
  // Utilization impact on satisfaction
  const capacity = team.staff * HOURS_PER_STAFF_PER_QUARTER;
  const clientHours = team.clients.reduce((sum, c) => sum + c.hoursPerQuarter, 0);
  const utilization = capacity > 0 ? clientHours / capacity : 0;
  
  // Over-utilization hurts satisfaction
  const utilizationPenalty = utilization > 1.1 ? (utilization - 1.1) * 30 : 0;
  
  // High burnout hurts satisfaction
  const burnoutPenalty = team.burnout > 50 ? (team.burnout - 50) * 0.3 : 0;
  
  // High growth focus = neglecting existing clients
  const growthFocusPenalty = (inputs.growthFocus / 100) * 10; // 0-10 penalty

  // Event impacts
  let eventModifier = 0;
  const activeEvents = events.filter(e => e.active).map(e => e.type);
  if (activeEvents.includes('economyTanks')) eventModifier -= 10;
  if (activeEvents.includes('aiBoom')) eventModifier += 5;

  for (const client of team.clients) {
    // Update satisfaction level
    let newSatisfaction = client.satisfactionLevel;
    
    // Natural decay
    newSatisfaction -= SATISFACTION_BASE_DECAY;
    
    // Apply modifiers
    newSatisfaction += investmentBoost;
    newSatisfaction -= utilizationPenalty;
    newSatisfaction -= burnoutPenalty;
    newSatisfaction -= growthFocusPenalty;
    newSatisfaction += eventModifier;
    
    // Clamp 0-100
    newSatisfaction = Math.max(0, Math.min(100, newSatisfaction));

    // Check if client was already on notice
    if (client.status === 'notice_given') {
      // Client leaves this quarter
      churnedClients.push(client);
      continue;
    }

    // Reduce quarters remaining
    const quartersRemaining = client.quartersRemaining - 1;

    // Check for contract end
    if (quartersRemaining <= 0) {
      // Contract ending - will they renew?
      if (newSatisfaction >= SATISFACTION_RENEW_THRESHOLD) {
        const renewChance = 0.5 + (newSatisfaction - SATISFACTION_RENEW_THRESHOLD) / 80;
        if (random.next() < renewChance) {
          renewedClients.push({
            ...client,
            quartersRemaining: CONTRACT_LENGTH_QUARTERS,
            satisfactionLevel: newSatisfaction,
            status: 'active',
          });
          existingClientRevenue += client.revenue / 4; // Quarterly revenue
        } else {
          churnedClients.push(client);
        }
      } else {
        churnedClients.push(client);
      }
      continue;
    }

    // Mid-contract - check for early termination
    if (newSatisfaction < SATISFACTION_CHURN_THRESHOLD) {
      const churnChance = (SATISFACTION_CHURN_THRESHOLD - newSatisfaction) / 60;
      if (random.next() < churnChance) {
        // Client gives notice
        retainedClients.push({
          ...client,
          quartersRemaining,
          satisfactionLevel: newSatisfaction,
          status: 'notice_given',
          noticeQuarter: team.quarter + 1,
        });
        existingClientRevenue += client.revenue / 4;
        continue;
      }
    }

    // Client stays - generate potential project opportunity
    if (newSatisfaction >= 45 && random.next() < 0.6) { // 60% chance if satisfied (was 40%)
      const projectBudget = Math.round(
        (client.budget * 0.15 + random.next() * client.budget * 0.25) / 5000
      ) * 5000; // 15-40% of retainer value (was 10-25%)
      
      projectOpportunities.push({
        clientId: client.opportunityId,
        clientName: client.clientName,
        budget: Math.max(20000, Math.min(150000, projectBudget)),
        hoursRequired: Math.round(projectBudget / 500), // ~£500 per hour (was £1000)
        winChance: 75 + (newSatisfaction - 50) * 0.5, // 75-100% based on satisfaction
      });
    }

    // Client stays
    retainedClients.push({
      ...client,
      quartersRemaining,
      satisfactionLevel: newSatisfaction,
      status: 'active',
    });
    existingClientRevenue += client.revenue / 4;
  }

  return { retainedClients, churnedClients, renewedClients, existingClientRevenue, projectOpportunities };
}

// =============================================================================
// PITCH PROCESSING
// =============================================================================

interface PitchResult {
  wonNewClients: ActiveClient[];
  wonProjects: { clientName: string; revenue: number }[];
  lostPitches: number;
  totalPitchRevenue: number;
  pitchHoursUsed: number;
}

function processPitches(
  team: TeamState,
  inputs: TeamInputs,
  opportunities: ClientOpportunity[],
  projectOpportunities: ProjectOpportunity[],
  events: GameEvent[],
  random: SeededRandom,
  pitchOverheadMultiplier: number
): PitchResult {
  const wonNewClients: ActiveClient[] = [];
  const wonProjects: { clientName: string; revenue: number }[] = [];
  let lostPitches = 0;
  let totalPitchRevenue = 0;
  let pitchHoursUsed = 0;

  const growthFocus = inputs.growthFocus;
  
  console.log(`📋 Processing ${inputs.pitches.length} pitches for team (growthFocus=${growthFocus})`);
  
  // Process all pitches - both new clients and existing client projects
  for (const pitch of inputs.pitches) {
    // Check if this is an existing client project pitch (ID starts with "project-")
    const isExistingClientProject = pitch.opportunityId.startsWith('project-');
    
    if (isExistingClientProject) {
      // Find in project opportunities
      const project = projectOpportunities.find(p => 
        `project-${p.clientId}-${team.quarter}` === pitch.opportunityId
      );
      
      if (!project) {
        console.log(`⚠️ Project opportunity not found: ${pitch.opportunityId}`);
        continue;
      }
      
      pitchHoursUsed += PROJECT_HOURS_BASE;
      
      // Existing client projects have very high win chance based on relationship
      let winChance = project.winChance;
      
      // Discount bonus
      winChance += pitch.discountPercent * 0.3;
      
      // Quality bonus
      if (pitch.qualityLevel === 'premium') winChance += 5;
      if (pitch.qualityLevel === 'budget') winChance -= 3;
      
      winChance = Math.max(50, Math.min(98, winChance)); // 50-98% range for existing clients
      
      const roll = random.next() * 100;
      console.log(`🔄 Project for ${project.clientName}: winChance=${winChance.toFixed(1)}%, roll=${roll.toFixed(1)}, ${roll < winChance ? 'WON!' : 'LOST'}`);
      
      if (roll < winChance) {
        totalPitchRevenue += project.budget;
        wonProjects.push({
          clientName: project.clientName,
          revenue: project.budget,
        });
      } else {
        lostPitches++;
      }
    } else {
      // New client pitch - look in global opportunities
      const opportunity = opportunities.find(o => o.id === pitch.opportunityId);
      if (!opportunity) {
        console.log(`⚠️ Opportunity not found: ${pitch.opportunityId}`);
        continue;
      }

      // New client pitching takes more hours when growth focused
      pitchHoursUsed += PITCH_HOURS_BASE * pitchOverheadMultiplier;

      // Calculate win chance - lower when heavily growth focused (spreading thin)
      let winChance = calculateNewClientWinChance(team, pitch, opportunity, events);
      
      // Growth focus penalty: when >70%, you're spreading too thin
      if (growthFocus > 70) {
        winChance -= (growthFocus - 70) * 0.3; // Up to 9% penalty
      }
      
      winChance = Math.max(5, Math.min(95, winChance));

      const roll = random.next() * 100;
      console.log(`🎯 Pitch for ${opportunity.clientName}: winChance=${winChance.toFixed(1)}%, roll=${roll.toFixed(1)}, ${roll < winChance ? 'WON!' : 'LOST'}`);

      if (roll < winChance) {
        const effectiveRevenue = opportunity.budget * (1 - pitch.discountPercent / 100);
        totalPitchRevenue += effectiveRevenue / 4; // First quarter revenue

        wonNewClients.push({
          opportunityId: opportunity.id,
          clientName: opportunity.clientName,
          clientType: opportunity.clientType,
          serviceLine: opportunity.serviceLine,
          budget: opportunity.budget,
          discount: pitch.discountPercent,
          revenue: effectiveRevenue,
          complexity: opportunity.complexity,
          hoursPerQuarter: opportunity.hoursRequired,
          quartersRemaining: CONTRACT_LENGTH_QUARTERS,
          wonInQuarter: team.quarter + 1,
          status: 'active',
          satisfactionLevel: 70,
        });
      } else {
        lostPitches++;
      }
    }
  }

  // Note: Project opportunities from existing clients are now handled above
  // when the user explicitly selects them (identified by opportunityId starting with "project-")

  console.log(`📊 Pitch results: ${wonNewClients.length} new clients won, ${wonProjects.length} projects won, ${lostPitches} lost`);

  return { wonNewClients, wonProjects, lostPitches, totalPitchRevenue, pitchHoursUsed };
}

function calculateNewClientWinChance(
  team: TeamState,
  pitch: PitchDecision,
  opportunity: ClientOpportunity,
  events: GameEvent[]
): number {
  let chance = opportunity.baseWinChance;

  // Discount bonus
  chance += pitch.discountPercent * 0.5;

  // Reputation impact
  if (team.reputation > 60) {
    chance += (team.reputation - 60) * 0.4;
  } else if (team.reputation < 40) {
    chance -= (40 - team.reputation) * 0.4;
  }

  // Market presence bonus
  chance += team.marketPresence * 0.1;

  // Tech level bonus for digital/social
  if (['digital', 'social'].includes(opportunity.serviceLine)) {
    chance += (team.techLevel - 1) * 3;
  }

  // Training bonus for brand/content
  if (['brand', 'content'].includes(opportunity.serviceLine)) {
    chance += (team.trainingLevel - 1) * 3;
  }

  // Burnout penalty
  if (team.burnout > 50) {
    chance -= (team.burnout - 50) * 0.3;
  }

  // Per-pitch quality level impact
  if (pitch.qualityLevel === 'premium') {
    chance += 8;
  } else if (pitch.qualityLevel === 'budget') {
    chance -= 5;
  }

  // Event modifiers
  const activeEvents = events.filter(e => e.active).map(e => e.type);
  
  if (activeEvents.includes('viralTrend') && opportunity.serviceLine === 'social') chance += 15;
  if (activeEvents.includes('budgetCuts')) chance -= 8;
  if (activeEvents.includes('economyTanks')) chance -= 12;
  if (activeEvents.includes('referralSurge')) chance += 10;
  if (activeEvents.includes('prAwards') && team.reputation >= 70) chance += 15;
  if (activeEvents.includes('aiBoom')) chance += 8;

  return chance;
}

// =============================================================================
// WORKLOAD & COSTS
// =============================================================================

function calculateWorkload(existingClients: ActiveClient[], newClients: ActiveClient[]): number {
  const existingHours = existingClients
    .filter(c => c.status !== 'notice_given' || c.quartersRemaining > 0)
    .reduce((sum, c) => sum + c.hoursPerQuarter, 0);
  
  const newHours = newClients.reduce((sum, c) => sum + c.hoursPerQuarter, 0);
  
  return existingHours + newHours;
}

function calculateCosts(
  team: TeamState,
  inputs: TeamInputs,
  newStaff: number,
  wonClients: ActiveClient[],
  events: GameEvent[]
): number {
  let staffCost = newStaff * STAFF_COST_PER_QUARTER;

  // Event modifiers
  const activeEvents = events.filter(e => e.active).map(e => e.type);
  if (activeEvents.includes('talentPoaching')) staffCost *= 1.15;
  if (activeEvents.includes('teamExodus')) staffCost *= 0.8; // Lost 4 people

  const hiringCost = inputs.hiringCount * HIRING_COST;
  const firingCost = inputs.firingCount * FIRING_COST;

  const investmentCosts = 
    inputs.techInvestment + 
    inputs.trainingInvestment + 
    inputs.marketingSpend + 
    inputs.wellbeingSpend +
    inputs.clientSatisfactionSpend;

  // Quality cost modifier
  let qualityCostMultiplier = 0;
  for (const pitch of inputs.pitches) {
    const won = wonClients.some(c => c.opportunityId === pitch.opportunityId);
    if (won) {
      if (pitch.qualityLevel === 'premium') qualityCostMultiplier += 0.2;
      else if (pitch.qualityLevel === 'budget') qualityCostMultiplier -= 0.1;
    }
  }

  const deliveryStaffCost = staffCost * 0.5;
  const qualityAdjustedDeliveryCost = deliveryStaffCost * (1 + qualityCostMultiplier / Math.max(1, wonClients.length));

  return (staffCost * 0.5) + qualityAdjustedDeliveryCost + hiringCost + firingCost + investmentCosts;
}

// =============================================================================
// BURNOUT CALCULATION
// =============================================================================

function calculateBurnoutChange(
  team: TeamState,
  inputs: TeamInputs,
  utilizationRate: number,
  growthFocus: number,
  events: GameEvent[]
): number {
  let change = 0;

  // Utilization impact
  if (utilizationRate > 130) change += 15;
  else if (utilizationRate > 110) change += 8;
  else if (utilizationRate > 90) change += 3;
  else if (utilizationRate < 60) change -= 5;

  // Growth Focus impact - chasing new business is stressful!
  if (growthFocus > 70) {
    change += (growthFocus - 70) * 0.3; // Up to +9 burnout
  } else if (growthFocus < 30) {
    change -= 2; // Calm focus on existing clients
  }

  // Wellbeing investment reduces burnout
  if (inputs.wellbeingSpend >= 30000) change -= 12;
  else if (inputs.wellbeingSpend >= 15000) change -= 7;
  else if (inputs.wellbeingSpend >= 5000) change -= 3;

  // Firing increases burnout
  change += inputs.firingCount * 3;

  // Events
  const activeEvents = events.filter(e => e.active).map(e => e.type);
  if (activeEvents.includes('keyDeparture')) change += 10;
  if (activeEvents.includes('teamExodus')) change += 20;

  // Premium quality pitches are stressful
  const premiumPitches = inputs.pitches.filter(p => p.qualityLevel === 'premium').length;
  change += premiumPitches * 1.5;

  return change;
}

// =============================================================================
// REPUTATION CALCULATION
// =============================================================================

function calculateReputationChange(
  team: TeamState,
  inputs: TeamInputs,
  wonClients: ActiveClient[],
  wonProjects: { clientName: string; revenue: number }[],
  utilizationRate: number,
  events: GameEvent[]
): number {
  let change = 0;

  // Winning new clients builds reputation
  change += wonClients.length * 3;
  
  // Winning projects from existing clients (good relationships)
  change += wonProjects.length * 1;

  // Quality impacts
  for (const client of wonClients) {
    const pitch = inputs.pitches.find(p => p.opportunityId === client.opportunityId);
    if (pitch?.qualityLevel === 'premium') change += 2;
    else if (pitch?.qualityLevel === 'budget') change -= 1;
  }

  // Overwork hurts quality
  if (utilizationRate > 130) change -= 8;
  else if (utilizationRate > 110) change -= 3;

  // High burnout hurts reputation
  if (team.burnout > 70) change -= 5;

  // Training investment helps
  if (inputs.trainingInvestment >= 20000) change += 3;

  // Events
  const activeEvents = events.filter(e => e.active).map(e => e.type);
  if (activeEvents.includes('industryAward')) change += 10;
  if (activeEvents.includes('prAwards')) change += 12;
  if (activeEvents.includes('keyDeparture')) change -= 5;
  if (activeEvents.includes('teamExodus')) change -= 10;

  return change;
}

// =============================================================================
// CAPABILITY UPDATES
// =============================================================================

function updateTechLevel(team: TeamState, inputs: TeamInputs): number {
  let level = team.techLevel;
  if (inputs.techInvestment >= 40000) level += 0.5;
  else if (inputs.techInvestment >= 25000) level += 0.3;
  else if (inputs.techInvestment >= 10000) level += 0.15;
  return Math.min(5, level);
}

function updateTrainingLevel(team: TeamState, inputs: TeamInputs): number {
  let level = team.trainingLevel;
  if (inputs.trainingInvestment >= 30000) level += 0.4;
  else if (inputs.trainingInvestment >= 15000) level += 0.2;
  else if (inputs.trainingInvestment >= 5000) level += 0.1;
  if (inputs.firingCount >= 2) level -= 0.2;
  return Math.max(1, Math.min(5, level));
}

function updateMarketPresence(
  team: TeamState,
  inputs: TeamInputs,
  wonClients: ActiveClient[]
): number {
  let presence = team.marketPresence;
  presence += inputs.marketingSpend / 5000;
  presence += wonClients.length * 3;
  if (inputs.marketingSpend < 10000) presence -= 2;
  return Math.max(0, Math.min(100, presence));
}

// =============================================================================
// DEFAULT INPUTS & HELPERS
// =============================================================================

export function getDefaultInputs(): TeamInputs {
  return {
    pitches: [],
    techInvestment: 0,
    trainingInvestment: 0,
    marketingSpend: 0,
    hiringCount: 0,
    firingCount: 0,
    wellbeingSpend: 0,
    clientSatisfactionSpend: 0,
    growthFocus: 50,
  };
}

export function calculateWinner(teams: TeamState[]): string {
  const validTeams = teams.filter(t => !t.isBankrupt);
  if (validTeams.length === 0) return teams[0]?.teamId || '';

  const maxProfit = Math.max(...validTeams.map(t => t.cumulativeProfit), 1);
  const maxClients = Math.max(...validTeams.map(t => t.clients.length), 1);
  const maxCash = Math.max(...validTeams.map(t => t.cash), 1);

  let bestScore = -Infinity;
  let winnerId = '';

  for (const team of validTeams) {
    const profitScore = (team.cumulativeProfit / maxProfit) * 40; // Profit is king!
    const reputationScore = team.reputation * 0.20;
    const clientScore = (team.clients.length / maxClients) * 15;
    const cashScore = (team.cash / maxCash) * 10;
    const wellbeingScore = (100 - team.burnout) * 0.15;

    const totalScore = profitScore + reputationScore + clientScore + cashScore + wellbeingScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      winnerId = team.teamId;
    }
  }

  return winnerId;
}

export function getLeaderboard(teams: TeamState[]): LeaderboardEntry[] {
  return teams
    .map(team => ({
      teamId: team.teamId,
      companyName: team.companyName,
      teamNumber: team.teamNumber,
      cumulativeProfit: team.cumulativeProfit,
      reputation: team.reputation,
      staff: team.staff,
      isBankrupt: team.isBankrupt,
    }))
    .sort((a, b) => b.cumulativeProfit - a.cumulativeProfit);
}

export function checkBankruptcy(team: TeamState): boolean {
  return team.cash < 0;
}
