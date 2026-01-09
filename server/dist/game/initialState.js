"use strict";
// server/src/game/initialState.ts
// Initial state generation for new teams
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialTeamState = createInitialTeamState;
exports.getDefaultInputs = getDefaultInputs;
const STARTER_CLIENTS = [
    { name: 'TechStart Solutions', type: 'startup', service: 'digital' },
    { name: 'GreenLeaf Foundation', type: 'nonprofit', service: 'social' },
    { name: 'Metro Council', type: 'government', service: 'pr' },
    { name: 'Apex Industries', type: 'enterprise', service: 'brand' },
    { name: 'Bloom & Co', type: 'startup', service: 'content' },
];
function createInitialTeamState(teamId, companyName, level, random) {
    // Starting values based on difficulty level
    const startingCash = {
        1: 350000, // Easy - more cash
        2: 300000, // Normal - increased runway
        3: 225000, // Hard - less cash
    }[level];
    const startingStaff = {
        1: 8, // Easy - more staff
        2: 6, // Normal
        3: 5, // Hard - fewer staff
    }[level];
    const startingReputation = {
        1: 65, // Easy - higher starting rep
        2: 55, // Normal - closer to bonus threshold
        3: 45, // Hard - lower starting rep
    }[level];
    // Pick two random starter clients for guaranteed early revenue
    const shuffled = [...STARTER_CLIENTS].sort(() => random.next() - 0.5);
    const starterClient1 = shuffled[0];
    const starterClient2 = shuffled[1];
    const starterBudget1 = 40000 + random.nextInt(0, 15000); // $40k - $55k
    const starterBudget2 = 20000 + random.nextInt(0, 10000); // $20k - $30k
    return {
        teamId,
        companyName,
        quarter: 1,
        // Financials
        cash: startingCash,
        cumulativeProfit: 0,
        // Staff & Capacity
        staff: startingStaff,
        burnout: 10 + random.nextInt(0, 10), // Start with some baseline burnout
        // Reputation & Market
        reputation: startingReputation,
        marketPresence: 20 + random.nextInt(0, 15), // 20-35% starting presence
        // Capabilities
        techLevel: 1,
        trainingLevel: 1,
        processLevel: 1,
        // Clients - start with two clients for stable early revenue
        clients: [
            {
                opportunityId: `starter-${teamId}-1`,
                clientName: starterClient1.name,
                clientType: starterClient1.type,
                serviceLine: starterClient1.service,
                budget: starterBudget1,
                discount: 0,
                revenue: starterBudget1,
                complexity: 'low',
                hoursPerQuarter: 30 + random.nextInt(0, 10),
                quartersRemaining: 4 + random.nextInt(0, 2),
                wonInQuarter: 0, // Pre-existing client
            },
            {
                opportunityId: `starter-${teamId}-2`,
                clientName: starterClient2.name,
                clientType: starterClient2.type,
                serviceLine: starterClient2.service,
                budget: starterBudget2,
                discount: 0,
                revenue: starterBudget2,
                complexity: 'low',
                hoursPerQuarter: 20 + random.nextInt(0, 10),
                quartersRemaining: 3 + random.nextInt(0, 2),
                wonInQuarter: 0, // Pre-existing client
            }
        ],
        // Game state
        isBankrupt: false,
        submittedThisQuarter: false,
        currentInputs: getDefaultInputs(),
        // History - start with empty but will show initial state
        quarterlyResults: [],
        agencyMetrics: [],
    };
}
function getDefaultInputs() {
    return {
        pitches: [],
        qualityLevel: 'standard',
        techInvestment: 0,
        trainingInvestment: 0,
        marketingSpend: 0,
        hiringCount: 0,
        firingCount: 0,
        wellbeingSpend: 0,
    };
}
//# sourceMappingURL=initialState.js.map