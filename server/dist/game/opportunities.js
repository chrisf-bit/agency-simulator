"use strict";
// server/src/game/opportunities.ts
// Client opportunity generation for Pitch Perfect
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpportunities = generateOpportunities;
exports.evaluatePitch = evaluatePitch;
const uuid_1 = require("uuid");
// =============================================================================
// CLIENT NAME GENERATION
// =============================================================================
const CLIENT_NAME_PREFIXES = [
    'Apex', 'Nova', 'Pulse', 'Echo', 'Zenith', 'Vertex', 'Quantum', 'Stellar',
    'Prime', 'Fusion', 'Orbit', 'Catalyst', 'Momentum', 'Horizon', 'Summit',
    'Spark', 'Beacon', 'Vector', 'Nexus', 'Pioneer', 'Aurora', 'Compass',
];
const CLIENT_NAME_SUFFIXES = {
    startup: ['Labs', 'Tech', 'AI', 'Digital', 'Ventures', 'Studio', 'App'],
    enterprise: ['Corp', 'Industries', 'Global', 'Group', 'Holdings', 'Inc', 'International'],
    nonprofit: ['Foundation', 'Trust', 'Alliance', 'Initiative', 'Society', 'Institute'],
    government: ['Agency', 'Department', 'Office', 'Bureau', 'Authority', 'Council'],
};
function generateClientName(clientType, random) {
    const prefix = CLIENT_NAME_PREFIXES[random.nextInt(0, CLIENT_NAME_PREFIXES.length)];
    const suffixes = CLIENT_NAME_SUFFIXES[clientType];
    const suffix = suffixes[random.nextInt(0, suffixes.length)];
    return `${prefix} ${suffix}`;
}
// =============================================================================
// OPPORTUNITY GENERATION
// =============================================================================
const SERVICE_LINES = ['digital', 'brand', 'social', 'content', 'pr'];
const CLIENT_TYPES = ['startup', 'enterprise', 'nonprofit', 'government'];
// Budget ranges by client type (in dollars)
const BUDGET_RANGES = {
    startup: { min: 20000, max: 60000 },
    enterprise: { min: 80000, max: 200000 },
    nonprofit: { min: 15000, max: 40000 },
    government: { min: 50000, max: 120000 },
};
// Hours required by complexity
const HOURS_BY_COMPLEXITY = {
    low: { min: 20, max: 40 },
    medium: { min: 40, max: 70 },
    high: { min: 60, max: 100 },
};
// Base win chances by complexity (higher complexity = lower base chance)
const BASE_WIN_CHANCE = {
    low: 65,
    medium: 50,
    high: 35,
};
function generateOpportunities(quarter, level, random) {
    // Number of opportunities based on level and quarter
    const baseCount = {
        1: 4, // Easy - more opportunities
        2: 3, // Normal
        3: 2, // Hard - fewer opportunities
    }[level];
    // More opportunities in later quarters
    const quarterBonus = Math.floor(quarter / 3);
    const opportunityCount = baseCount + quarterBonus + random.nextInt(0, 2);
    const opportunities = [];
    for (let i = 0; i < opportunityCount; i++) {
        const clientType = CLIENT_TYPES[random.nextInt(0, CLIENT_TYPES.length)];
        const serviceLine = SERVICE_LINES[random.nextInt(0, SERVICE_LINES.length)];
        // Complexity weighted towards medium
        const complexityRoll = random.next();
        let complexity;
        if (complexityRoll < 0.25) {
            complexity = 'low';
        }
        else if (complexityRoll < 0.75) {
            complexity = 'medium';
        }
        else {
            complexity = 'high';
        }
        // Deadline - 20% chance of urgent
        const deadline = random.nextBool(0.2) ? 'urgent' : 'normal';
        // Budget based on client type with some variance
        const budgetRange = BUDGET_RANGES[clientType];
        const baseBudget = random.nextInt(budgetRange.min, budgetRange.max);
        // Round to nearest $5k
        const budget = Math.round(baseBudget / 5000) * 5000;
        // Hours based on complexity
        const hoursRange = HOURS_BY_COMPLEXITY[complexity];
        const hoursRequired = random.nextInt(hoursRange.min, hoursRange.max);
        // Base win chance
        let baseWinChance = BASE_WIN_CHANCE[complexity];
        // Urgent deadlines are slightly harder to win
        if (deadline === 'urgent') {
            baseWinChance -= 5;
        }
        // Enterprise clients are pickier
        if (clientType === 'enterprise') {
            baseWinChance -= 5;
        }
        // Government clients want lower prices
        if (clientType === 'government') {
            baseWinChance -= 3;
        }
        opportunities.push({
            id: (0, uuid_1.v4)(),
            clientName: generateClientName(clientType, random),
            clientType,
            serviceLine,
            budget,
            complexity,
            deadline,
            hoursRequired,
            baseWinChance: Math.max(20, Math.min(80, baseWinChance)), // Clamp 20-80%
            quarter,
        });
    }
    return opportunities;
}
function evaluatePitch(opportunity, discountPercent, teamReputation, teamMarketPresence, techLevel, trainingLevel, qualityLevel, activeEvents, random) {
    let winChance = opportunity.baseWinChance;
    const factors = [];
    // Discount bonus (+0.5% per 1% discount)
    if (discountPercent > 0) {
        const discountBonus = discountPercent * 0.5;
        winChance += discountBonus;
        factors.push(`Discount: +${discountBonus.toFixed(1)}%`);
    }
    // Reputation bonus (0-15% bonus for 50-100 reputation)
    if (teamReputation > 50) {
        const repBonus = Math.min(15, (teamReputation - 50) * 0.3);
        winChance += repBonus;
        factors.push(`Reputation: +${repBonus.toFixed(1)}%`);
    }
    else if (teamReputation < 40) {
        const repPenalty = (40 - teamReputation) * 0.3;
        winChance -= repPenalty;
        factors.push(`Low reputation: -${repPenalty.toFixed(1)}%`);
    }
    // Market presence bonus (0-10%)
    const presenceBonus = (teamMarketPresence / 100) * 10;
    winChance += presenceBonus;
    factors.push(`Market presence: +${presenceBonus.toFixed(1)}%`);
    // Tech level bonus for digital/social projects
    if (['digital', 'social'].includes(opportunity.serviceLine) && techLevel > 1) {
        const techBonus = (techLevel - 1) * 3;
        winChance += techBonus;
        factors.push(`Tech level: +${techBonus}%`);
    }
    // Training level bonus
    if (trainingLevel > 1) {
        const trainingBonus = (trainingLevel - 1) * 2;
        winChance += trainingBonus;
        factors.push(`Training: +${trainingBonus}%`);
    }
    // Quality level impact
    if (qualityLevel === 'premium') {
        winChance += 8;
        factors.push(`Premium quality: +8%`);
    }
    else if (qualityLevel === 'budget') {
        winChance -= 5;
        factors.push(`Budget quality: -5%`);
    }
    // Event modifiers
    if (activeEvents.includes('viralTrend') && opportunity.serviceLine === 'social') {
        winChance += 15;
        factors.push(`Viral trend (social): +15%`);
    }
    if (activeEvents.includes('budgetCuts')) {
        winChance -= 8;
        factors.push(`Budget cuts: -8%`);
    }
    if (activeEvents.includes('referralSurge')) {
        winChance += 10;
        factors.push(`Referral surge: +10%`);
    }
    if (activeEvents.includes('industryAward') && teamReputation >= 70) {
        winChance += 10;
        factors.push(`Award season (high rep): +10%`);
    }
    // Clamp final win chance
    winChance = Math.max(5, Math.min(95, winChance));
    // Roll for success
    const roll = random.next() * 100;
    const won = roll < winChance;
    return {
        won,
        winChance,
        roll,
        factors,
    };
}
//# sourceMappingURL=opportunities.js.map