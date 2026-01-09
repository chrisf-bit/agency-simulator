"use strict";
// server/src/game/engine.ts
// Core game calculation engine for Pitch Perfect agency simulation
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQuarter = processQuarter;
exports.getDefaultInputs = getDefaultInputs;
exports.calculateWinner = calculateWinner;
exports.getLeaderboard = getLeaderboard;
exports.checkBankruptcy = checkBankruptcy;
// =============================================================================
// MAIN ENGINE FUNCTION
// =============================================================================
function processQuarter(team, inputs, allTeams, opportunities, events, level, random) {
    const quarter = team.quarter + 1;
    // Step 1: Process pitches and determine wins
    const { wonClients, lostPitches, totalPitchRevenue } = processPitches(team, inputs, opportunities, events, random);
    // Step 2: Calculate existing client revenue
    const existingClientRevenue = team.clients.reduce((sum, c) => {
        if (c.quartersRemaining > 0) {
            return sum + (c.revenue / 4); // Quarterly portion
        }
        return sum;
    }, 0);
    const totalRevenue = totalPitchRevenue + existingClientRevenue;
    // Step 3: Process staffing changes
    const staffChange = inputs.hiringCount - inputs.firingCount;
    const newStaff = Math.max(3, Math.min(25, team.staff + staffChange));
    // Step 4: Calculate capacity and utilization
    const capacity = newStaff * 520; // 520 hours per staff per quarter
    const workload = calculateWorkload(team.clients, wonClients);
    const utilizationRate = capacity > 0 ? (workload / capacity) * 100 : 0;
    // Step 5: Calculate costs
    const costs = calculateCosts(team, inputs, newStaff, events);
    // Step 6: Calculate profit
    const profit = totalRevenue - costs;
    // Step 7: Update burnout
    const burnoutChange = calculateBurnoutChange(team, inputs, utilizationRate, events);
    const newBurnout = Math.max(0, Math.min(100, team.burnout + burnoutChange));
    // Step 8: Update reputation
    const reputationChange = calculateReputationChange(team, inputs, wonClients, utilizationRate, events);
    const newReputation = Math.max(0, Math.min(100, team.reputation + reputationChange));
    // Step 9: Update capability levels
    const newTechLevel = updateTechLevel(team, inputs);
    const newTrainingLevel = updateTrainingLevel(team, inputs);
    const newProcessLevel = team.processLevel || 1; // Keep existing or default
    // Step 10: Update market presence
    const newMarketPresence = updateMarketPresence(team, inputs, wonClients);
    // Step 11: Calculate new cash position
    const newCash = team.cash + profit;
    // Step 12: Update client list
    const updatedClients = updateClients(team.clients, wonClients);
    // Step 13: Create quarterly result
    const quarterResult = {
        quarter,
        revenue: totalRevenue,
        costs,
        profit,
        clientsWon: wonClients.length,
        clientsLost: lostPitches,
        staffChange,
        reputationChange,
        burnoutChange,
        utilizationRate: utilizationRate / 100, // Store as decimal (0-1)
        hoursDelivered: workload,
        hoursCapacity: capacity,
    };
    // Step 13b: Create agency metrics snapshot
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
        activeClients: updatedClients.length,
    };
    // Step 14: Check for bankruptcy
    const isBankrupt = newCash < 0;
    // Return updated team state
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
        clients: updatedClients,
        isBankrupt,
        submittedThisQuarter: false,
        currentInputs: getDefaultInputs(),
        quarterlyResults: [...(team.quarterlyResults || []), quarterResult],
        agencyMetrics: [...(team.agencyMetrics || []), agencyMetricsSnapshot],
    };
}
function processPitches(team, inputs, opportunities, events, random) {
    const wonClients = [];
    let lostPitches = 0;
    let totalPitchRevenue = 0;
    for (const pitch of inputs.pitches) {
        const opportunity = opportunities.find(o => o.id === pitch.opportunityId);
        if (!opportunity)
            continue;
        // Calculate win chance
        const winChance = calculateWinChance(team, pitch, opportunity, events);
        // Roll for success
        const roll = random.next() * 100;
        const won = roll < winChance;
        if (won) {
            const effectiveRevenue = opportunity.budget * (1 - pitch.discountPercent / 100);
            totalPitchRevenue += effectiveRevenue;
            wonClients.push({
                opportunityId: opportunity.id,
                clientName: opportunity.clientName,
                clientType: opportunity.clientType,
                serviceLine: opportunity.serviceLine,
                budget: opportunity.budget,
                discount: pitch.discountPercent,
                revenue: effectiveRevenue,
                complexity: opportunity.complexity,
                hoursPerQuarter: opportunity.hoursRequired,
                quartersRemaining: 4, // 4 quarter contracts
                wonInQuarter: team.quarter + 1,
            });
        }
        else {
            lostPitches++;
        }
    }
    return { wonClients, lostPitches, totalPitchRevenue };
}
function calculateWinChance(team, pitch, opportunity, events) {
    let chance = opportunity.baseWinChance;
    // Discount bonus (+0.5% per 1% discount)
    chance += pitch.discountPercent * 0.5;
    // Reputation impact
    if (team.reputation > 60) {
        chance += (team.reputation - 60) * 0.4;
    }
    else if (team.reputation < 40) {
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
    // Event modifiers
    const activeEvents = events.filter(e => e.active).map(e => e.type);
    if (activeEvents.includes('viralTrend') && opportunity.serviceLine === 'social') {
        chance += 15;
    }
    if (activeEvents.includes('budgetCuts')) {
        chance -= 8;
    }
    if (activeEvents.includes('referralSurge')) {
        chance += 10;
    }
    if (activeEvents.includes('industryAward') && team.reputation >= 70) {
        chance += 10;
    }
    // Clamp between 5 and 95
    return Math.max(5, Math.min(95, chance));
}
// =============================================================================
// WORKLOAD & CAPACITY
// =============================================================================
function calculateWorkload(existingClients, newClients) {
    const existingHours = existingClients
        .filter(c => c.quartersRemaining > 0)
        .reduce((sum, c) => sum + c.hoursPerQuarter, 0);
    const newHours = newClients.reduce((sum, c) => sum + c.hoursPerQuarter, 0);
    return existingHours + newHours;
}
// =============================================================================
// COST CALCULATION
// =============================================================================
function calculateCosts(team, inputs, newStaff, events) {
    // Staff costs: $10k per staff per quarter
    let staffCost = newStaff * 10000;
    // Talent poaching event increases staff costs
    if (events.some(e => e.type === 'talentPoaching' && e.active)) {
        staffCost *= 1.15;
    }
    // Hiring costs: $15k per new hire
    const hiringCost = inputs.hiringCount * 15000;
    // Firing costs: $5k severance per person
    const firingCost = inputs.firingCount * 5000;
    // Investment costs
    const investmentCosts = inputs.techInvestment +
        inputs.trainingInvestment +
        inputs.marketingSpend +
        inputs.wellbeingSpend;
    // Quality level modifier
    let qualityMultiplier = 1.0;
    if (inputs.qualityLevel === 'premium') {
        qualityMultiplier = 1.2;
    }
    else if (inputs.qualityLevel === 'budget') {
        qualityMultiplier = 0.9;
    }
    // Base operating costs
    const operatingCosts = staffCost * qualityMultiplier;
    return operatingCosts + hiringCost + firingCost + investmentCosts;
}
// =============================================================================
// BURNOUT CALCULATION
// =============================================================================
function calculateBurnoutChange(team, inputs, utilizationRate, events) {
    let change = 0;
    // Utilization impact
    if (utilizationRate > 130) {
        change += 15; // Severe overwork
    }
    else if (utilizationRate > 110) {
        change += 8; // Overwork
    }
    else if (utilizationRate > 90) {
        change += 3; // Slightly busy
    }
    else if (utilizationRate < 60) {
        change -= 5; // Underutilized = recovery
    }
    // Wellbeing investment reduces burnout
    if (inputs.wellbeingSpend >= 30000) {
        change -= 12;
    }
    else if (inputs.wellbeingSpend >= 15000) {
        change -= 7;
    }
    else if (inputs.wellbeingSpend >= 5000) {
        change -= 3;
    }
    // Firing increases burnout (survivors' guilt)
    if (inputs.firingCount > 0) {
        change += inputs.firingCount * 3;
    }
    // Key departure event
    if (events.some(e => e.type === 'keyDeparture' && e.active)) {
        change += 10;
    }
    // Premium quality is stressful
    if (inputs.qualityLevel === 'premium') {
        change += 3;
    }
    return change;
}
// =============================================================================
// REPUTATION CALCULATION
// =============================================================================
function calculateReputationChange(team, inputs, wonClients, utilizationRate, events) {
    let change = 0;
    // Winning clients builds reputation
    change += wonClients.length * 3;
    // Quality level impact
    if (inputs.qualityLevel === 'premium') {
        change += 5;
    }
    else if (inputs.qualityLevel === 'budget') {
        change -= 3;
    }
    // Overwork hurts quality and reputation
    if (utilizationRate > 130) {
        change -= 8;
    }
    else if (utilizationRate > 110) {
        change -= 3;
    }
    // High burnout hurts reputation
    if (team.burnout > 70) {
        change -= 5;
    }
    // Training investment helps
    if (inputs.trainingInvestment >= 20000) {
        change += 3;
    }
    // Industry award event
    if (events.some(e => e.type === 'industryAward' && e.active)) {
        change += 10;
    }
    // Key departure hurts
    if (events.some(e => e.type === 'keyDeparture' && e.active)) {
        change -= 5;
    }
    return change;
}
// =============================================================================
// CAPABILITY UPDATES
// =============================================================================
function updateTechLevel(team, inputs) {
    let level = team.techLevel;
    if (inputs.techInvestment >= 40000) {
        level += 0.5;
    }
    else if (inputs.techInvestment >= 25000) {
        level += 0.3;
    }
    else if (inputs.techInvestment >= 10000) {
        level += 0.15;
    }
    return Math.min(5, level);
}
function updateTrainingLevel(team, inputs) {
    let level = team.trainingLevel;
    if (inputs.trainingInvestment >= 30000) {
        level += 0.4;
    }
    else if (inputs.trainingInvestment >= 15000) {
        level += 0.2;
    }
    else if (inputs.trainingInvestment >= 5000) {
        level += 0.1;
    }
    // Firing hurts training continuity
    if (inputs.firingCount >= 2) {
        level -= 0.2;
    }
    return Math.max(1, Math.min(5, level));
}
function updateMarketPresence(team, inputs, wonClients) {
    let presence = team.marketPresence;
    // Marketing spend
    presence += inputs.marketingSpend / 5000;
    // Winning clients
    presence += wonClients.length * 3;
    // Natural decay if no marketing
    if (inputs.marketingSpend < 10000) {
        presence -= 2;
    }
    return Math.max(0, Math.min(100, presence));
}
// =============================================================================
// CLIENT UPDATES
// =============================================================================
function updateClients(existingClients, newClients) {
    // Reduce quarters remaining on existing clients
    const updated = existingClients
        .map(c => ({
        ...c,
        quartersRemaining: c.quartersRemaining - 1,
    }))
        .filter(c => c.quartersRemaining > 0); // Remove expired contracts
    // Add new clients
    return [...updated, ...newClients];
}
// =============================================================================
// DEFAULT INPUTS
// =============================================================================
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
// =============================================================================
// WINNER CALCULATION
// =============================================================================
function calculateWinner(teams) {
    const validTeams = teams.filter(t => !t.isBankrupt);
    if (validTeams.length === 0) {
        return teams[0]?.teamId || '';
    }
    const maxProfit = Math.max(...validTeams.map(t => t.cumulativeProfit), 1);
    const maxClients = Math.max(...validTeams.map(t => t.clients.length), 1);
    const maxCash = Math.max(...validTeams.map(t => t.cash), 1);
    let bestScore = -Infinity;
    let winnerId = '';
    for (const team of validTeams) {
        const profitScore = (team.cumulativeProfit / maxProfit) * 25;
        const reputationScore = team.reputation * 0.25;
        const clientScore = (team.clients.length / maxClients) * 20;
        const cashScore = (team.cash / maxCash) * 15;
        const wellbeingScore = (100 - team.burnout) * 0.15;
        const totalScore = profitScore + reputationScore + clientScore + cashScore + wellbeingScore;
        if (totalScore > bestScore) {
            bestScore = totalScore;
            winnerId = team.teamId;
        }
    }
    return winnerId;
}
function getLeaderboard(teams) {
    return teams
        .map(team => ({
        teamId: team.teamId,
        companyName: team.companyName,
        cumulativeProfit: team.cumulativeProfit,
        reputation: team.reputation,
        staff: team.staff,
        isBankrupt: team.isBankrupt,
    }))
        .sort((a, b) => b.cumulativeProfit - a.cumulativeProfit);
}
// =============================================================================
// BANKRUPTCY CHECK
// =============================================================================
function checkBankruptcy(team) {
    return team.cash < 0;
}
//# sourceMappingURL=engine.js.map