// server/src/game/initialState.ts
// Initial state generation for new teams - Agency Leadership
// All teams start with IDENTICAL data for fair competition

import { TeamState, TeamInputs, GameLevel, ServiceLine, ClientType, ActiveClient } from '../types';
import { SeededRandom } from '../utils/randomSeed';

// =============================================================================
// FIXED STARTER CLIENTS (Same for all teams)
// Total: £1.2m retained revenue per year
// =============================================================================

const STARTER_CLIENTS: Omit<ActiveClient, 'opportunityId'>[] = [
  // 3x £100k retainers
  {
    clientName: 'TechStart Solutions',
    clientType: 'startup' as ClientType,
    serviceLine: 'digital' as ServiceLine,  // Digital
    budget: 100000,
    discount: 0,
    revenue: 100000,
    complexity: 'low' as const,
    hoursPerQuarter: 600, // ~2,400 hrs/year for £100k
    quartersRemaining: 4,
    wonInQuarter: 0,
    status: 'active',
    satisfactionLevel: 75, // Happy - good relationship
  },
  {
    clientName: 'GreenLeaf Foundation',
    clientType: 'nonprofit' as ClientType,
    serviceLine: 'social' as ServiceLine,  // Social Media
    budget: 100000,
    discount: 0,
    revenue: 100000,
    complexity: 'low' as const,
    hoursPerQuarter: 600,
    quartersRemaining: 5,
    wonInQuarter: 0,
    status: 'active',
    satisfactionLevel: 65, // Slightly concerned - needs attention
  },
  {
    clientName: 'Urban Coffee Co',
    clientType: 'startup' as ClientType,
    serviceLine: 'brand' as ServiceLine,  // Branding
    budget: 100000,
    discount: 0,
    revenue: 100000,
    complexity: 'low' as const,
    hoursPerQuarter: 600,
    quartersRemaining: 3,
    wonInQuarter: 0,
    status: 'active',
    satisfactionLevel: 80, // Very happy
  },
  // 2x £200k retainers
  {
    clientName: 'Meridian Healthcare',
    clientType: 'enterprise' as ClientType,
    serviceLine: 'content' as ServiceLine,  // Content
    budget: 200000,
    discount: 0,
    revenue: 200000,
    complexity: 'medium' as const,
    hoursPerQuarter: 1200, // ~4,800 hrs/year for £200k
    quartersRemaining: 4,
    wonInQuarter: 0,
    status: 'active',
    satisfactionLevel: 55, // At risk - demanding client
  },
  {
    clientName: 'National Transport Authority',
    clientType: 'government' as ClientType,
    serviceLine: 'pr' as ServiceLine,  // PR
    budget: 200000,
    discount: 0,
    revenue: 200000,
    complexity: 'medium' as const,
    hoursPerQuarter: 1200,
    quartersRemaining: 6,
    wonInQuarter: 0,
    status: 'active',
    satisfactionLevel: 70, // Neutral - bureaucratic
  },
  // 1x £500k retainer
  {
    clientName: 'GlobalBank International',
    clientType: 'enterprise' as ClientType,
    serviceLine: 'digital' as ServiceLine,  // Digital
    budget: 500000,
    discount: 0,
    revenue: 500000,
    complexity: 'high' as const,
    hoursPerQuarter: 3000, // ~12,000 hrs/year for £500k
    quartersRemaining: 4,
    wonInQuarter: 0,
    status: 'active',
    satisfactionLevel: 60, // Needs work - high expectations
  },
];

// Total starter client hours per quarter: 600+600+600+1200+1200+3000 = 7,200 hrs
// With 20 staff at 520 hrs each = 10,400 hrs capacity
// Starting utilization: 7200/10400 = ~69% (healthy starting point)

// =============================================================================
// STARTING VALUES BY DIFFICULTY
// =============================================================================

const STARTING_VALUES = {
  1: { // Easy
    cash: 500000,      // More cash buffer
    staff: 20,
    reputation: 70,
    burnout: 10,
    marketPresence: 40,
  },
  2: { // Normal
    cash: 400000,      // Standard cash
    staff: 20,
    reputation: 60,
    burnout: 15,
    marketPresence: 30,
  },
  3: { // Hard
    cash: 300000,      // Tighter cash
    staff: 20,
    reputation: 50,
    burnout: 20,
    marketPresence: 25,
  },
};

// =============================================================================
// TEAM CREATION
// =============================================================================

/**
 * Create initial team state with IDENTICAL starting data
 * All teams get exactly the same numbers for fair competition
 * But each team has their own custom company name
 */
export function createInitialTeamState(
  teamId: string,
  companyName: string, // Custom name entered by team
  teamNumber: number,
  level: GameLevel,
  _random: SeededRandom, // Kept for API compatibility but not used for starting values
  maxQuarters: number = 8 // Game length - used to scale contract durations
): TeamState {
  const values = STARTING_VALUES[level];

  // Scale contract lengths based on game duration
  // Ensures all contracts have a chance to expire and renew within the game
  const scaleContract = (originalQuarters: number): number => {
    const scale = maxQuarters / 8; // 8 is the default game length
    const scaled = Math.round(originalQuarters * scale);
    // Min 1 quarter, max (maxQuarters - 1) so they get at least one renewal decision
    return Math.max(1, Math.min(scaled, maxQuarters - 1));
  };

  return {
    teamId,
    companyName, // Custom name entered by team
    teamNumber,
    quarter: 1,
    
    // Financials - IDENTICAL for all teams
    cash: values.cash,
    cumulativeProfit: 0,
    
    // Staff & Capacity - IDENTICAL for all teams
    staff: values.staff,
    burnout: values.burnout,
    
    // Reputation & Market - IDENTICAL for all teams
    reputation: values.reputation,
    marketPresence: values.marketPresence,
    
    // Capabilities - All start at level 1
    techLevel: 1,
    trainingLevel: 1,
    processLevel: 1,
    
    // Clients - IDENTICAL starter clients for all teams, scaled for game length
    clients: STARTER_CLIENTS.map((client, idx) => ({
      ...client,
      opportunityId: `starter-${teamId}-${idx}`,
      quartersRemaining: scaleContract(client.quartersRemaining),
    })),
    
    // Game state
    isBankrupt: false,
    submittedThisQuarter: false,
    currentInputs: getDefaultInputs(),
    
    // History - start empty
    quarterlyResults: [],
    agencyMetrics: [],
  };
}

// =============================================================================
// DEFAULT INPUTS
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
    growthFocus: 50, // Default to balanced
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get summary of starting values for display
 */
export function getStartingValuesSummary(level: GameLevel): {
  cash: number;
  staff: number;
  reputation: number;
  burnout: number;
  marketPresence: number;
  hoursCapacity: number;
  starterClients: number;
  starterRevenue: number;
  starterHoursPerQuarter: number;
} {
  const values = STARTING_VALUES[level];
  const totalRevenue = STARTER_CLIENTS.reduce((sum, c) => sum + c.revenue, 0);
  const totalHours = STARTER_CLIENTS.reduce((sum, c) => sum + c.hoursPerQuarter, 0);
  
  return {
    ...values,
    hoursCapacity: values.staff * 520,
    starterClients: STARTER_CLIENTS.length,
    starterRevenue: totalRevenue, // £1.2m
    starterHoursPerQuarter: totalHours, // 1440 hrs
  };
}
