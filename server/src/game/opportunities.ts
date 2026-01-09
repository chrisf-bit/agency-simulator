// server/src/game/opportunities.ts
// Client opportunity generation for Agency Leadership

import { ClientOpportunity, ServiceLine, ClientType, Complexity, GameLevel } from '../types';
import { SeededRandom } from '../utils/randomSeed';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// CLIENT NAME POOLS
// =============================================================================

const STARTUP_NAMES = [
  'NeoTech Labs', 'Quantum Leap', 'DataStream', 'CloudPulse', 'ByteForge',
  'InnovateCo', 'FutureStack', 'TechNova', 'CodeSprint', 'AgileWorks',
  'Pixel Perfect', 'Starlight Ventures', 'Momentum AI', 'Velocity Labs', 'Ignite Digital',
];

const ENTERPRISE_NAMES = [
  'GlobalCorp Industries', 'Meridian Holdings', 'Atlas International', 'Pinnacle Group',
  'Sovereign Systems', 'Apex Enterprises', 'Titan Industries', 'Nexus Corporation',
  'Vanguard Solutions', 'Sterling & Partners', 'Monarch Financial', 'Empire Logistics',
];

const NONPROFIT_NAMES = [
  'Hope Foundation', 'Green Earth Alliance', 'Youth Forward', 'Community First',
  'Healing Hands', 'Education For All', 'Wildlife Trust', 'Ocean Guardians',
  'Arts United', 'Health Bridge', 'Food Bank Network', 'Shelter Now',
];

const GOVERNMENT_NAMES = [
  'Department of Transport', 'NHS Trust', 'City Council', 'Environment Agency',
  'Education Authority', 'Regional Development', 'Public Health England',
  'Heritage Foundation', 'Skills & Employment', 'Digital Services',
];

const CLIENT_NAME_POOLS: Record<ClientType, string[]> = {
  startup: STARTUP_NAMES,
  enterprise: ENTERPRISE_NAMES,
  nonprofit: NONPROFIT_NAMES,
  government: GOVERNMENT_NAMES,
};

// =============================================================================
// BUDGET RANGES BY CLIENT TYPE (from Excel)
// =============================================================================

const BUDGET_RANGES: Record<ClientType, { min: number; max: number }> = {
  startup: { min: 20000, max: 60000 },
  enterprise: { min: 80000, max: 200000 },
  nonprofit: { min: 15000, max: 40000 },
  government: { min: 50000, max: 120000 },
};

// =============================================================================
// COMPLEXITY CONFIG (from Excel)
// =============================================================================

const COMPLEXITY_CONFIG: Record<Complexity, { hoursMin: number; hoursMax: number; baseWinChance: number }> = {
  low: { hoursMin: 100, hoursMax: 200, baseWinChance: 65 },
  medium: { hoursMin: 200, hoursMax: 400, baseWinChance: 50 },
  high: { hoursMin: 350, hoursMax: 600, baseWinChance: 35 },
};

// =============================================================================
// WIN CHANCE MODIFIERS BY CLIENT TYPE (from Excel)
// =============================================================================

const CLIENT_WIN_MODIFIERS: Record<ClientType, number> = {
  startup: 0,
  enterprise: -5, // Pickier
  nonprofit: 0,
  government: -3, // Want lower prices
};

// =============================================================================
// OPPORTUNITY GENERATION
// =============================================================================

/**
 * Generate opportunities for a quarter
 */
export function generateOpportunities(
  quarter: number,
  level: GameLevel,
  random: SeededRandom
): ClientOpportunity[] {
  // Number of opportunities scales with quarter and difficulty
  const baseCount = level === 1 ? 4 : level === 2 ? 3 : 2;
  const quarterBonus = Math.floor(quarter / 3);
  const count = baseCount + quarterBonus + random.nextInt(0, 1);

  const opportunities: ClientOpportunity[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const opportunity = generateSingleOpportunity(quarter, level, random, usedNames);
    opportunities.push(opportunity);
    usedNames.add(opportunity.clientName);
  }

  return opportunities;
}

function generateSingleOpportunity(
  quarter: number,
  level: GameLevel,
  random: SeededRandom,
  usedNames: Set<string>
): ClientOpportunity {
  // Pick client type with weighted distribution
  const clientType = pickClientType(random, quarter);
  
  // Pick service line
  const serviceLine = pickServiceLine(random);
  
  // Pick complexity (harder difficulties get more complex opportunities)
  const complexity = pickComplexity(random, level);
  
  // Generate budget
  const budgetRange = BUDGET_RANGES[clientType];
  const budget = roundToThousands(random.nextFloat(budgetRange.min, budgetRange.max));
  
  // Calculate hours
  const complexityConfig = COMPLEXITY_CONFIG[complexity];
  const hoursRequired = random.nextInt(complexityConfig.hoursMin, complexityConfig.hoursMax);
  
  // Calculate base win chance with client type modifier
  const baseWinChance = complexityConfig.baseWinChance + CLIENT_WIN_MODIFIERS[clientType];
  
  // Pick unique client name
  const clientName = pickUniqueName(clientType, usedNames, random);
  
  // Deadline (urgent opportunities are rarer but have higher budgets)
  const deadline = random.chance(0.2) ? 'urgent' : 'normal';

  return {
    id: uuidv4().slice(0, 8),
    clientName,
    clientType,
    serviceLine,
    budget: deadline === 'urgent' ? Math.round(budget * 1.15) : budget,
    complexity,
    deadline,
    hoursRequired,
    baseWinChance: Math.max(20, Math.min(80, baseWinChance)),
    quarter,
  };
}

function pickClientType(random: SeededRandom, quarter: number): ClientType {
  // Early quarters: more startups and nonprofits
  // Later quarters: more enterprise and government
  const weights = quarter <= 3
    ? { startup: 0.35, enterprise: 0.2, nonprofit: 0.3, government: 0.15 }
    : { startup: 0.25, enterprise: 0.35, nonprofit: 0.2, government: 0.2 };

  const roll = random.next();
  let cumulative = 0;

  for (const [type, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) {
      return type as ClientType;
    }
  }

  return 'startup';
}

function pickServiceLine(random: SeededRandom): ServiceLine {
  const lines: ServiceLine[] = ['digital', 'brand', 'social', 'content', 'pr'];
  return random.pick(lines);
}

function pickComplexity(random: SeededRandom, level: GameLevel): Complexity {
  // Higher difficulty = more complex opportunities
  const weights = level === 1
    ? { low: 0.5, medium: 0.35, high: 0.15 }
    : level === 2
    ? { low: 0.35, medium: 0.4, high: 0.25 }
    : { low: 0.2, medium: 0.4, high: 0.4 };

  const roll = random.next();
  let cumulative = 0;

  for (const [comp, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) {
      return comp as Complexity;
    }
  }

  return 'medium';
}

function pickUniqueName(clientType: ClientType, usedNames: Set<string>, random: SeededRandom): string {
  const pool = CLIENT_NAME_POOLS[clientType];
  const available = pool.filter(name => !usedNames.has(name));
  
  if (available.length === 0) {
    // All names used, generate a variant
    const base = random.pick(pool);
    return `${base} (New)`;
  }
  
  return random.pick(available);
}

function roundToThousands(value: number): number {
  return Math.round(value / 1000) * 1000;
}

/**
 * Generate project opportunities from existing satisfied clients
 * These have higher win chances based on relationship health
 */
export function generateExistingClientProjects(
  clients: { opportunityId: string; clientName: string; clientType: ClientType; serviceLine: ServiceLine; budget: number; satisfactionLevel?: number }[],
  quarter: number,
  random: SeededRandom
): ClientOpportunity[] {
  const projects: ClientOpportunity[] = [];
  
  for (const client of clients) {
    const satisfaction = client.satisfactionLevel || 50;
    
    // Only satisfied clients (45%+) offer project opportunities
    if (satisfaction < 45) continue;
    
    // Higher satisfaction = higher chance of project opportunity
    const projectChance = 0.3 + (satisfaction - 45) * 0.01; // 30% at 45 satisfaction, 85% at 100
    if (random.next() > projectChance) continue;
    
    // Project budget is 15-40% of their retainer
    const projectBudget = roundToThousands(
      client.budget * (0.15 + random.next() * 0.25)
    );
    
    // Hours based on budget at ~£400/hr
    const hoursRequired = Math.round(projectBudget / 400);
    
    // Win chance based on satisfaction: 70% at 45 satisfaction, 95% at 100
    const baseWinChance = Math.round(70 + (satisfaction - 45) * 0.45);
    
    projects.push({
      id: `project-${client.opportunityId}-${quarter}`,
      clientName: `${client.clientName} (Project)`,
      clientType: client.clientType,
      serviceLine: client.serviceLine,
      budget: Math.max(25000, projectBudget),
      complexity: 'low', // Existing relationship makes it simpler
      deadline: 'relaxed',
      hoursRequired: Math.max(50, hoursRequired),
      baseWinChance: Math.min(95, baseWinChance),
      quarter,
      isExistingClientProject: true,
      existingClientId: client.opportunityId,
      existingClientSatisfaction: satisfaction,
    });
  }
  
  return projects;
}
