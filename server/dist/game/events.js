"use strict";
// server/src/game/events.ts
// Random event generation for Pitch Perfect agency simulation
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_INFO = void 0;
exports.processRandomEvents = processRandomEvents;
exports.getEventConfig = getEventConfig;
exports.getEventDefinition = getEventDefinition;
exports.getActiveEvents = getActiveEvents;
exports.isEventActive = isEventActive;
const EVENT_DEFINITIONS = [
    {
        type: 'talentPoaching',
        name: 'Talent Poaching',
        description: 'A competitor is aggressively recruiting your staff. Staff costs increased by 15%.',
        baseChance: 0.12,
        duration: 1,
        levelMultiplier: { 1: 0.6, 2: 1.0, 3: 1.4 },
    },
    {
        type: 'viralTrend',
        name: 'Viral Trend',
        description: 'A social media trend creates high demand for social campaigns. Social pitches get +15% win chance.',
        baseChance: 0.10,
        duration: 1,
        levelMultiplier: { 1: 1.0, 2: 1.0, 3: 1.0 },
    },
    {
        type: 'budgetCuts',
        name: 'Industry Budget Cuts',
        description: 'Economic uncertainty is causing clients to cut marketing budgets. All pitch win chances reduced by 8%.',
        baseChance: 0.10,
        duration: 1,
        levelMultiplier: { 1: 0.5, 2: 1.0, 3: 1.5 },
    },
    {
        type: 'aiTools',
        name: 'AI Tools Launch',
        description: 'New AI tools hit the market. Agencies with Tech Level 3+ gain efficiency bonuses.',
        baseChance: 0.08,
        duration: 2,
        levelMultiplier: { 1: 0.8, 2: 1.0, 3: 1.2 },
    },
    {
        type: 'industryAward',
        name: 'Industry Award Season',
        description: 'Award season spotlight! High-reputation agencies (70+) get +10 reputation and better pitch success.',
        baseChance: 0.10,
        duration: 1,
        levelMultiplier: { 1: 1.0, 2: 1.0, 3: 1.0 },
    },
    {
        type: 'keyDeparture',
        name: 'Key Staff Departure',
        description: 'A senior team member has left unexpectedly. Burnout increases and reputation takes a hit.',
        baseChance: 0.12,
        duration: 1,
        levelMultiplier: { 1: 0.5, 2: 1.0, 3: 1.5 },
    },
    {
        type: 'referralSurge',
        name: 'Referral Surge',
        description: 'Happy clients are spreading the word! All pitch win chances increased by 10%.',
        baseChance: 0.15,
        duration: 1,
        levelMultiplier: { 1: 1.2, 2: 1.0, 3: 0.8 },
    },
];
// =============================================================================
// EVENT PROCESSING
// =============================================================================
/**
 * Process random events for a quarter
 * Returns updated events array with new and expired events
 */
function processRandomEvents(quarter, config, currentEvents, random) {
    // Update existing events (reduce duration, deactivate expired)
    const updatedEvents = currentEvents.map(event => {
        if (!event.active)
            return event;
        const remainingDuration = event.duration - 1;
        return {
            ...event,
            duration: remainingDuration,
            active: remainingDuration > 0,
        };
    });
    // Check if events are enabled
    if (!config.events.enabled) {
        return updatedEvents;
    }
    // Count active events
    const activeCount = updatedEvents.filter(e => e.active).length;
    // Don't add new events if at max
    if (activeCount >= config.events.maxConcurrent) {
        return updatedEvents;
    }
    // Roll for new events
    const newEvents = [];
    const levelMult = { 1: 0.6, 2: 1.0, 3: 1.4 }[config.level];
    for (const eventDef of EVENT_DEFINITIONS) {
        // Check if this event type is already active
        const alreadyActive = updatedEvents.some(e => e.type === eventDef.type && e.active);
        if (alreadyActive)
            continue;
        // Check if we've hit max concurrent
        if (activeCount + newEvents.length >= config.events.maxConcurrent)
            break;
        // Calculate final chance
        const baseChance = eventDef.baseChance * eventDef.levelMultiplier[config.level];
        const finalChance = baseChance * config.events.frequency;
        // Roll for event
        if (random.next() < finalChance) {
            newEvents.push({
                type: eventDef.type,
                quarter,
                description: eventDef.description,
                active: true,
                duration: eventDef.duration,
            });
            console.log(`🎲 Event triggered: ${eventDef.name} in Q${quarter}`);
        }
    }
    return [...updatedEvents, ...newEvents];
}
// =============================================================================
// EVENT CONFIGURATION
// =============================================================================
/**
 * Get default event configuration based on game level
 */
function getEventConfig(level) {
    const configs = {
        1: {
            enabled: true,
            frequency: 0.6, // Fewer events in easy mode
            maxConcurrent: 1,
        },
        2: {
            enabled: true,
            frequency: 1.0, // Normal frequency
            maxConcurrent: 2,
        },
        3: {
            enabled: true,
            frequency: 1.4, // More events in hard mode
            maxConcurrent: 3,
        },
    };
    return configs[level];
}
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
/**
 * Get event definition by type
 */
function getEventDefinition(type) {
    return EVENT_DEFINITIONS.find(e => e.type === type);
}
/**
 * Get all active events from an events array
 */
function getActiveEvents(events) {
    return events.filter(e => e.active);
}
/**
 * Check if a specific event type is active
 */
function isEventActive(events, type) {
    return events.some(e => e.type === type && e.active);
}
/**
 * Get event display info
 */
exports.EVENT_INFO = {
    talentPoaching: { name: 'Talent Poaching', icon: '🎯', color: 'yellow' },
    viralTrend: { name: 'Viral Trend', icon: '📈', color: 'green' },
    budgetCuts: { name: 'Budget Cuts', icon: '✂️', color: 'red' },
    aiTools: { name: 'AI Tools', icon: '🤖', color: 'blue' },
    industryAward: { name: 'Award Season', icon: '🏆', color: 'gold' },
    keyDeparture: { name: 'Key Departure', icon: '👋', color: 'orange' },
    referralSurge: { name: 'Referral Surge', icon: '🤝', color: 'green' },
};
//# sourceMappingURL=events.js.map