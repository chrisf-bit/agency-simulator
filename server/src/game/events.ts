// server/src/game/events.ts
// Random event generation for Agency Leadership

import { GameEvent, EventType, EventConfig, GameConfig, GameLevel } from '../types';
import { SeededRandom } from '../utils/randomSeed';

// =============================================================================
// EVENT DEFINITIONS (from Excel)
// =============================================================================

interface EventDefinition {
  type: EventType;
  name: string;
  description: string;
  duration: number; // quarters
  probability: number; // base probability per quarter
  levelMultiplier: Record<GameLevel, number>;
}

const EVENT_DEFINITIONS: EventDefinition[] = [
  {
    type: 'talentPoaching',
    name: 'Talent Poaching',
    description: 'A competitor is aggressively recruiting talent. Staff costs increase by 15% this quarter.',
    duration: 1,
    probability: 0.15,
    levelMultiplier: { 1: 0.8, 2: 1.0, 3: 1.2 },
  },
  {
    type: 'viralTrend',
    name: 'Viral Trend',
    description: 'A viral trend creates sudden demand for social media campaigns. +15% win chance for social projects.',
    duration: 1,
    probability: 0.12,
    levelMultiplier: { 1: 1.0, 2: 1.0, 3: 1.0 },
  },
  {
    type: 'budgetCuts',
    name: 'Budget Cuts',
    description: 'Economic uncertainty causes clients to tighten budgets. -8% win chance on all pitches.',
    duration: 1,
    probability: 0.1,
    levelMultiplier: { 1: 0.7, 2: 1.0, 3: 1.3 },
  },
  {
    type: 'aiTools',
    name: 'AI Tools Launch',
    description: 'New AI tools boost productivity. Agencies with high tech investment gain efficiency.',
    duration: 2,
    probability: 0.08,
    levelMultiplier: { 1: 1.0, 2: 1.0, 3: 1.0 },
  },
  {
    type: 'industryAward',
    name: 'Industry Award',
    description: 'Award season! Agencies with reputation ≥70 gain +10% win chance and +10 reputation.',
    duration: 1,
    probability: 0.1,
    levelMultiplier: { 1: 1.2, 2: 1.0, 3: 0.8 },
  },
  {
    type: 'keyDeparture',
    name: 'Key Staff Departure',
    description: 'A senior team member leaves. +10 burnout and -5 reputation.',
    duration: 1,
    probability: 0.12,
    levelMultiplier: { 1: 0.6, 2: 1.0, 3: 1.4 },
  },
  {
    type: 'referralSurge',
    name: 'Referral Surge',
    description: 'Happy clients are referring business. +10% win chance on all pitches this quarter.',
    duration: 1,
    probability: 0.1,
    levelMultiplier: { 1: 1.2, 2: 1.0, 3: 0.8 },
  },
  // NEW EVENTS
  {
    type: 'economyTanks',
    name: 'Economy Tanks',
    description: 'Economic downturn hits the market. Several clients cut spending by 20%. -12% win chance, client satisfaction drops.',
    duration: 2,
    probability: 0.08,
    levelMultiplier: { 1: 0.5, 2: 1.0, 3: 1.5 },
  },
  {
    type: 'aiBoom',
    name: 'AI Boom',
    description: 'AI delivers big productivity benefits. Clients have more budget for marketing - 20% uplift in opportunity budgets.',
    duration: 2,
    probability: 0.1,
    levelMultiplier: { 1: 1.2, 2: 1.0, 3: 0.8 },
  },
  {
    type: 'teamExodus',
    name: 'Team Exodus',
    description: 'Four team members leave to start their own agency, taking a client with them! -4 staff, lose lowest-value client, +20 burnout.',
    duration: 1,
    probability: 0.06,
    levelMultiplier: { 1: 0.3, 2: 1.0, 3: 1.5 },
  },
  {
    type: 'clientGhosts',
    name: 'Client Ghosts',
    description: 'A new client you thought you had won has ghosted you - contracts were never signed. Lose the most recent new client.',
    duration: 1,
    probability: 0.08,
    levelMultiplier: { 1: 0.5, 2: 1.0, 3: 1.3 },
  },
  {
    type: 'prAwards',
    name: 'PR Industry Awards',
    description: 'Your strong marketing investment pays off with industry recognition! +15% win chance, +12 reputation if marketing spend is good.',
    duration: 1,
    probability: 0.1,
    levelMultiplier: { 1: 1.3, 2: 1.0, 3: 0.7 },
  },
];

// =============================================================================
// EVENT CONFIG BY LEVEL
// =============================================================================

export function getEventConfig(level: GameLevel): EventConfig {
  return {
    enabled: true,
    frequency: level === 1 ? 0.25 : level === 2 ? 0.35 : 0.45,
    maxConcurrent: level === 1 ? 1 : level === 2 ? 2 : 3,
  };
}

// =============================================================================
// EVENT PROCESSING
// =============================================================================

/**
 * Process random events for a new quarter
 */
export function processRandomEvents(
  quarter: number,
  config: GameConfig,
  currentEvents: GameEvent[],
  random: SeededRandom
): GameEvent[] {
  if (!config.events.enabled) {
    return [];
  }

  // First, update existing events (decrement duration, remove expired)
  const updatedEvents = currentEvents
    .map(event => ({
      ...event,
      duration: event.duration - 1,
      active: event.duration > 1,
    }))
    .filter(event => event.duration > 0);

  // Count active events
  const activeCount = updatedEvents.filter(e => e.active).length;

  // Don't add new events if at max
  if (activeCount >= config.events.maxConcurrent) {
    return updatedEvents;
  }

  // Chance to generate a new event
  if (!random.chance(config.events.frequency)) {
    return updatedEvents;
  }

  // Pick a random event that isn't already active
  const activeTypes = new Set(updatedEvents.filter(e => e.active).map(e => e.type));
  const availableEvents = EVENT_DEFINITIONS.filter(def => !activeTypes.has(def.type));

  if (availableEvents.length === 0) {
    return updatedEvents;
  }

  // Weight selection by probability and level multiplier
  const level = config.level;
  const totalWeight = availableEvents.reduce(
    (sum, def) => sum + def.probability * def.levelMultiplier[level],
    0
  );

  let roll = random.next() * totalWeight;
  let selectedDef: EventDefinition | null = null;

  for (const def of availableEvents) {
    roll -= def.probability * def.levelMultiplier[level];
    if (roll <= 0) {
      selectedDef = def;
      break;
    }
  }

  if (!selectedDef) {
    selectedDef = random.pick(availableEvents);
  }

  // Create the new event
  const newEvent: GameEvent = {
    type: selectedDef.type,
    quarter,
    duration: selectedDef.duration,
    active: true,
    description: selectedDef.description,
  };

  return [...updatedEvents, newEvent];
}

/**
 * Get description for an event type
 */
export function getEventDescription(type: EventType): string {
  const def = EVENT_DEFINITIONS.find(d => d.type === type);
  return def?.description || 'Unknown event';
}

/**
 * Get name for an event type
 */
export function getEventName(type: EventType): string {
  const def = EVENT_DEFINITIONS.find(d => d.type === type);
  return def?.name || 'Unknown';
}
