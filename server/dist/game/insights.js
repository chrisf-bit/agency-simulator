"use strict";
// server/src/game/insights.ts
// Rule-based insight detection engine with skills development mapping
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILLS = void 0;
exports.generateTeamReport = generateTeamReport;
exports.generateAllTeamReports = generateAllTeamReports;
exports.SKILLS = {
    // Commercial & Sales
    valueSelling: {
        id: 'valueSelling',
        name: 'Value-Based Selling',
        category: 'commercial',
        description: 'Articulating ROI and value to justify pricing',
    },
    negotiation: {
        id: 'negotiation',
        name: 'Negotiation',
        category: 'commercial',
        description: 'Holding firm on value while finding win-win outcomes',
    },
    clientQualification: {
        id: 'clientQualification',
        name: 'Client Qualification',
        category: 'commercial',
        description: 'Assessing fit and likelihood of success before pursuing',
    },
    proposalDevelopment: {
        id: 'proposalDevelopment',
        name: 'Proposal Development',
        category: 'commercial',
        description: 'Creating compelling, targeted proposals that win',
    },
    pricingStrategy: {
        id: 'pricingStrategy',
        name: 'Pricing Strategy',
        category: 'commercial',
        description: 'Setting prices that reflect value and market position',
    },
    // Resource Management
    workloadForecasting: {
        id: 'workloadForecasting',
        name: 'Workload Forecasting',
        category: 'resource',
        description: 'Estimating future demand before committing to work',
    },
    capacityPlanning: {
        id: 'capacityPlanning',
        name: 'Capacity Planning',
        category: 'resource',
        description: 'Matching team size and skills to expected workload',
    },
    workforcePlanning: {
        id: 'workforcePlanning',
        name: 'Workforce Planning',
        category: 'resource',
        description: 'Proactive hiring ahead of growth curves',
    },
    demandManagement: {
        id: 'demandManagement',
        name: 'Demand Management',
        category: 'resource',
        description: 'Balancing incoming work with available capacity',
    },
    sayingNo: {
        id: 'sayingNo',
        name: 'Opportunity Filtering',
        category: 'resource',
        description: 'Declining work that exceeds capacity or fit',
    },
    // Financial Management
    cashFlowManagement: {
        id: 'cashFlowManagement',
        name: 'Cash Flow Management',
        category: 'financial',
        description: 'Ensuring sufficient liquidity for operations',
    },
    budgeting: {
        id: 'budgeting',
        name: 'Budgeting & Forecasting',
        category: 'financial',
        description: 'Planning and tracking financial performance',
    },
    roiAnalysis: {
        id: 'roiAnalysis',
        name: 'ROI Analysis',
        category: 'financial',
        description: 'Evaluating return on investments and decisions',
    },
    riskAssessment: {
        id: 'riskAssessment',
        name: 'Risk Assessment',
        category: 'financial',
        description: 'Identifying and mitigating financial risks',
    },
    financialPlanning: {
        id: 'financialPlanning',
        name: 'Financial Planning',
        category: 'financial',
        description: 'Long-term financial strategy and sustainability',
    },
    // Leadership & People
    employeeWellbeing: {
        id: 'employeeWellbeing',
        name: 'Employee Wellbeing',
        category: 'leadership',
        description: 'Prioritizing team health and sustainable workloads',
    },
    teamEngagement: {
        id: 'teamEngagement',
        name: 'Team Engagement',
        category: 'leadership',
        description: 'Keeping teams motivated and connected to purpose',
    },
    retentionStrategies: {
        id: 'retentionStrategies',
        name: 'Retention Strategies',
        category: 'leadership',
        description: 'Creating environments where talent wants to stay',
    },
    performanceManagement: {
        id: 'performanceManagement',
        name: 'Performance Management',
        category: 'leadership',
        description: 'Setting expectations and developing team capabilities',
    },
    cultureBuilding: {
        id: 'cultureBuilding',
        name: 'Culture Building',
        category: 'leadership',
        description: 'Creating positive, high-performing team culture',
    },
    // Strategy & Growth
    strategicPlanning: {
        id: 'strategicPlanning',
        name: 'Strategic Planning',
        category: 'strategy',
        description: 'Setting direction and allocating resources for growth',
    },
    longTermThinking: {
        id: 'longTermThinking',
        name: 'Long-Term Thinking',
        category: 'strategy',
        description: 'Balancing immediate needs with future positioning',
    },
    marketPositioning: {
        id: 'marketPositioning',
        name: 'Market Positioning',
        category: 'strategy',
        description: 'Differentiating and competing effectively',
    },
    brandBuilding: {
        id: 'brandBuilding',
        name: 'Brand Building',
        category: 'strategy',
        description: 'Developing reputation and market presence',
    },
    investmentPrioritisation: {
        id: 'investmentPrioritisation',
        name: 'Investment Prioritisation',
        category: 'strategy',
        description: 'Choosing where to invest for maximum impact',
    },
};
const INSIGHT_RULES = [
    // ===================
    // STRENGTHS
    // ===================
    {
        id: 'highWinRate',
        title: 'Strong Client Acquisition',
        check: (team, stats) => stats.winRate >= 55 && stats.totalPitches >= 4,
        severity: 'strength',
        getFinding: (team, stats) => `You won ${stats.totalWins} of ${stats.totalPitches} pitches (${Math.round(stats.winRate)}%)`,
        getDetail: (team, stats) => `Your win rate of ${Math.round(stats.winRate)}% exceeds the typical range. You effectively qualified opportunities and positioned your agency for success.`,
        skills: ['clientQualification', 'proposalDevelopment'],
        priority: 10,
    },
    {
        id: 'consistentProfitability',
        title: 'Consistent Profitability',
        check: (team, stats) => stats.profitableQuarters >= stats.lossQuarters + 2 && team.quarterlyResults.length >= 4,
        severity: 'strength',
        getFinding: (team, stats) => `Profitable in ${stats.profitableQuarters} of ${team.quarterlyResults.length} quarters`,
        getDetail: () => `You maintained consistent profitability throughout the game, demonstrating strong financial discipline and sustainable growth practices.`,
        skills: ['financialPlanning', 'budgeting'],
        priority: 10,
    },
    {
        id: 'reputationGrowth',
        title: 'Reputation Builder',
        check: (team, stats) => stats.reputationChange >= 15,
        severity: 'strength',
        getFinding: (team, stats) => `Reputation grew from ${stats.startReputation} to ${stats.endReputation} (+${stats.reputationChange})`,
        getDetail: () => `You consistently delivered quality work that built your agency's reputation over time. This compounds into better win rates and client opportunities.`,
        skills: ['performanceManagement', 'cultureBuilding'],
        priority: 10,
    },
    {
        id: 'wellbeingFocus',
        title: 'Team Wellbeing Focus',
        check: (team, stats) => stats.peakBurnout <= 50 && team.quarterlyResults.length >= 4,
        severity: 'strength',
        getFinding: (team, stats) => `Burnout never exceeded ${Math.round(stats.peakBurnout)}%`,
        getDetail: () => `You maintained sustainable workloads throughout the game, protecting your team from burnout and preserving capacity for quality work.`,
        skills: ['employeeWellbeing', 'capacityPlanning'],
        priority: 10,
    },
    {
        id: 'earlyInvestor',
        title: 'Strategic Early Investment',
        check: (team, stats) => (stats.techInvestmentQuarter !== null && stats.techInvestmentQuarter <= 2) ||
            (stats.trainingInvestmentQuarter !== null && stats.trainingInvestmentQuarter <= 2),
        severity: 'strength',
        getFinding: (team, stats) => `Started capability investment in Q${Math.min(stats.techInvestmentQuarter || 99, stats.trainingInvestmentQuarter || 99)}`,
        getDetail: () => `Early investment in capabilities compounds over time, giving you advantages in later quarters. This shows good strategic thinking.`,
        skills: ['strategicPlanning', 'longTermThinking'],
        priority: 10,
    },
    {
        id: 'pricingConfidence',
        title: 'Pricing Confidence',
        check: (team, stats) => stats.avgDiscount <= 8 && stats.totalWins >= 3,
        severity: 'strength',
        getFinding: (team, stats) => `Average discount of ${stats.avgDiscount.toFixed(1)}% while winning ${stats.totalWins} clients`,
        getDetail: () => `You won business without heavy discounting, demonstrating confidence in your value proposition and strong commercial skills.`,
        skills: ['valueSelling', 'pricingStrategy'],
        priority: 10,
    },
    // ===================
    // WARNINGS
    // ===================
    {
        id: 'heavyDiscounter',
        title: 'Heavy Discounting Pattern',
        check: (team, stats) => stats.avgDiscount > 15 && stats.totalPitches >= 3,
        severity: 'warning',
        getFinding: (team, stats) => `Average discount of ${stats.avgDiscount.toFixed(1)}% across ${stats.totalPitches} pitches`,
        getDetail: (team, stats) => {
            const revenueLost = Math.round(stats.totalWins * 50000 * (stats.avgDiscount / 100));
            return `While discounting improved win rates, you may have left approximately $${(revenueLost / 1000).toFixed(0)}k in revenue on the table. Consider whether value articulation could achieve the same wins at better margins.`;
        },
        skills: ['valueSelling', 'negotiation', 'pricingStrategy'],
        priority: 2,
    },
    {
        id: 'burnoutCrisis',
        title: 'Team Burnout Crisis',
        check: (team, stats) => stats.peakBurnout > 70,
        severity: 'warning',
        getFinding: (team, stats) => `Burnout reached ${Math.round(stats.peakBurnout)}%`,
        getDetail: () => `High burnout damages quality, increases turnover, and creates a cycle of overwork. Earlier intervention through hiring, saying no to work, or wellbeing investment would help.`,
        skills: ['capacityPlanning', 'workloadForecasting', 'employeeWellbeing', 'sayingNo'],
        priority: 1,
    },
    {
        id: 'lateInvestor',
        title: 'Late Capability Investment',
        check: (team, stats) => stats.techInvestmentQuarter !== null &&
            stats.techInvestmentQuarter >= 5 &&
            team.quarterlyResults.length >= 6,
        severity: 'warning',
        getFinding: (team, stats) => `Tech investment started in Q${stats.techInvestmentQuarter}`,
        getDetail: () => `Capability investments compound over time. Starting earlier would have provided more quarters of benefit and improved competitiveness throughout the game.`,
        skills: ['strategicPlanning', 'longTermThinking', 'investmentPrioritisation'],
        priority: 3,
    },
    {
        id: 'lowWinRate',
        title: 'Low Pitch Win Rate',
        check: (team, stats) => stats.winRate < 35 && stats.totalPitches >= 4,
        severity: 'warning',
        getFinding: (team, stats) => `Won only ${stats.totalWins} of ${stats.totalPitches} pitches (${Math.round(stats.winRate)}%)`,
        getDetail: () => `A low win rate suggests opportunities for improvement in client targeting, proposal quality, or competitive positioning. Consider focusing on fewer, better-qualified opportunities.`,
        skills: ['clientQualification', 'proposalDevelopment', 'marketPositioning'],
        priority: 2,
    },
    {
        id: 'reactiveHiring',
        title: 'Reactive Staffing',
        check: (team, stats) => stats.lateHires >= 2,
        severity: 'warning',
        getFinding: (team, stats) => `Hired ${stats.lateHires} times after burnout exceeded 60%`,
        getDetail: () => `Hiring after overload has already occurred means the team suffered before relief arrived. Proactive hiring ahead of growth curves prevents this damage.`,
        skills: ['workforcePlanning', 'workloadForecasting', 'demandManagement'],
        priority: 2,
    },
    {
        id: 'noMarketing',
        title: 'Limited Market Presence',
        check: (team, stats) => stats.totalMarketingSpend < 10000 && team.quarterlyResults.length >= 4,
        severity: 'warning',
        getFinding: () => `Minimal investment in marketing and business development`,
        getDetail: () => `Without marketing investment, your agency relies solely on base win rates. Building market presence improves win rates on all pitches and attracts better opportunities.`,
        skills: ['brandBuilding', 'marketPositioning'],
        priority: 4,
    },
    {
        id: 'reputationDecline',
        title: 'Reputation Decline',
        check: (team, stats) => stats.reputationChange <= -15,
        severity: 'warning',
        getFinding: (team, stats) => `Reputation fell from ${stats.startReputation} to ${stats.endReputation} (${stats.reputationChange})`,
        getDetail: () => `Declining reputation makes winning new business harder and signals quality or delivery issues. This often stems from overwork, understaffing, or cutting corners.`,
        skills: ['performanceManagement', 'employeeWellbeing', 'capacityPlanning'],
        priority: 2,
    },
    {
        id: 'chronicOverwork',
        title: 'Chronic Overutilization',
        check: (team, stats) => stats.quartersOverworked >= 3,
        severity: 'warning',
        getFinding: (team, stats) => `Team was overutilized (>100%) for ${stats.quartersOverworked} quarters`,
        getDetail: () => `Sustained overwork leads to burnout, quality issues, and staff turnover. The short-term revenue gains are offset by long-term damage to capacity and reputation.`,
        skills: ['capacityPlanning', 'sayingNo', 'workforcePlanning'],
        priority: 2,
    },
    {
        id: 'underutilized',
        title: 'Underutilization',
        check: (team, stats) => stats.quartersUnderutilized >= 3,
        severity: 'warning',
        getFinding: (team, stats) => `Team was underutilized (<70%) for ${stats.quartersUnderutilized} quarters`,
        getDetail: () => `Low utilization means paying for capacity you're not using. This could indicate insufficient business development, poor client targeting, or overstaffing.`,
        skills: ['demandManagement', 'clientQualification', 'brandBuilding'],
        priority: 3,
    },
    // ===================
    // CRITICAL
    // ===================
    {
        id: 'bankruptcy',
        title: 'Financial Collapse',
        check: (team) => team.isBankrupt,
        severity: 'critical',
        getFinding: () => `Agency went bankrupt`,
        getDetail: () => `Running out of cash ends the game. This usually results from a combination of low revenue, high costs, and insufficient cash reserves. Key learning: maintain financial buffers and monitor cash flow closely.`,
        skills: ['cashFlowManagement', 'financialPlanning', 'riskAssessment'],
        priority: 0,
    },
    {
        id: 'severeBurnout',
        title: 'Team Meltdown',
        check: (team, stats) => stats.peakBurnout >= 90,
        severity: 'critical',
        getFinding: (team, stats) => `Burnout reached critical ${Math.round(stats.peakBurnout)}%`,
        getDetail: () => `Extreme burnout causes staff to quit, quality to collapse, and can trigger an unrecoverable spiral. This level of overwork would cause serious harm in a real organization.`,
        skills: ['employeeWellbeing', 'capacityPlanning', 'sayingNo', 'retentionStrategies'],
        priority: 0,
    },
    {
        id: 'cashCrisis',
        title: 'Cash Flow Crisis',
        check: (team, stats) => stats.lowestCash < 20000 && !team.isBankrupt,
        severity: 'critical',
        getFinding: (team, stats) => `Cash dropped to $${(stats.lowestCash / 1000).toFixed(0)}k`,
        getDetail: () => `Coming close to zero cash is extremely risky - one bad quarter would have ended the game. Maintaining larger cash reserves provides buffer for unexpected challenges.`,
        skills: ['cashFlowManagement', 'riskAssessment', 'financialPlanning'],
        priority: 0,
    },
    {
        id: 'reputationCollapse',
        title: 'Reputation Collapse',
        check: (team, stats) => stats.endReputation < 30,
        severity: 'critical',
        getFinding: (team, stats) => `Final reputation of ${stats.endReputation}/100`,
        getDetail: () => `Very low reputation makes winning any business extremely difficult and signals serious quality or delivery failures. Recovery from this level requires significant investment.`,
        skills: ['performanceManagement', 'cultureBuilding', 'employeeWellbeing'],
        priority: 0,
    },
];
// =============================================================================
// STATS CALCULATION
// =============================================================================
function calculateTeamStats(team, allTeams) {
    const results = team.quarterlyResults || [];
    const metrics = team.agencyMetrics || [];
    const clients = team.clients || [];
    // Win/loss stats
    const totalWins = results.reduce((sum, r) => sum + r.clientsWon, 0);
    const totalLosses = results.reduce((sum, r) => sum + r.clientsLost, 0);
    const totalPitches = totalWins + totalLosses;
    const winRate = totalPitches > 0 ? (totalWins / totalPitches) * 100 : 0;
    // Calculate game average win rate
    let allWins = 0, allPitches = 0;
    allTeams.forEach(t => {
        (t.quarterlyResults || []).forEach(r => {
            allWins += r.clientsWon;
            allPitches += r.clientsWon + r.clientsLost;
        });
    });
    const gameAvgWinRate = allPitches > 0 ? (allWins / allPitches) * 100 : 50;
    // Discount stats
    const discounts = clients.map(c => c.discount || 0);
    const avgDiscount = discounts.length > 0
        ? discounts.reduce((a, b) => a + b, 0) / discounts.length
        : 0;
    // Calculate game average discount
    let allDiscounts = [];
    allTeams.forEach(t => {
        (t.clients || []).forEach(c => {
            allDiscounts.push(c.discount || 0);
        });
    });
    const gameAvgDiscount = allDiscounts.length > 0
        ? allDiscounts.reduce((a, b) => a + b, 0) / allDiscounts.length
        : 10;
    // Burnout and utilization peaks
    const peakBurnout = Math.max(...metrics.map(m => m.burnout), team.burnout || 0);
    const peakUtilization = Math.max(...results.map(r => r.utilizationRate * 100), 0);
    // Cash tracking
    const cashHistory = metrics.map(m => m.cash);
    const lowestCash = Math.min(...cashHistory, team.cash || 0);
    // Reputation tracking
    const startReputation = metrics.length > 0 ? metrics[0].reputation : (team.reputation || 50);
    const endReputation = team.reputation || 50;
    const reputationChange = endReputation - startReputation;
    // Investment timing
    let techInvestmentQuarter = null;
    let trainingInvestmentQuarter = null;
    let totalTechInvestment = 0;
    let totalTrainingInvestment = 0;
    let totalMarketingSpend = 0;
    let totalWellbeingSpend = 0;
    // We don't have input history, so estimate from level changes
    metrics.forEach((m, idx) => {
        if (idx > 0) {
            const prevTech = metrics[idx - 1].techLevel;
            const prevTraining = metrics[idx - 1].trainingLevel;
            if (m.techLevel > prevTech && techInvestmentQuarter === null) {
                techInvestmentQuarter = m.quarter;
            }
            if (m.trainingLevel > prevTraining && trainingInvestmentQuarter === null) {
                trainingInvestmentQuarter = m.quarter;
            }
        }
    });
    // Count overwork/underwork quarters
    const quartersOverworked = results.filter(r => r.utilizationRate > 1.0).length;
    const quartersUnderutilized = results.filter(r => r.utilizationRate < 0.7).length;
    // Staff quit (estimated from burnout peaks followed by staff drops)
    let staffQuit = 0;
    let lateHires = 0;
    for (let i = 1; i < metrics.length; i++) {
        if (metrics[i].staff < metrics[i - 1].staff && metrics[i - 1].burnout > 70) {
            staffQuit += metrics[i - 1].staff - metrics[i].staff;
        }
        if (metrics[i].staff > metrics[i - 1].staff && metrics[i - 1].burnout > 60) {
            lateHires++;
        }
    }
    // Profitability
    const profitableQuarters = results.filter(r => r.profit > 0).length;
    const lossQuarters = results.filter(r => r.profit < 0).length;
    const finalProfit = team.cumulativeProfit || 0;
    return {
        avgDiscount,
        gameAvgDiscount,
        totalPitches,
        totalWins,
        winRate,
        gameAvgWinRate,
        peakBurnout,
        peakUtilization,
        lowestCash,
        reputationChange,
        startReputation,
        endReputation,
        techInvestmentQuarter,
        trainingInvestmentQuarter,
        totalTechInvestment,
        totalTrainingInvestment,
        totalMarketingSpend,
        totalWellbeingSpend,
        quartersOverworked,
        quartersUnderutilized,
        staffQuit,
        lateHires,
        finalProfit,
        profitableQuarters,
        lossQuarters,
    };
}
// =============================================================================
// REPORT GENERATION
// =============================================================================
function generateTeamReport(team, allTeams, rank) {
    const stats = calculateTeamStats(team, allTeams);
    const results = team.quarterlyResults || [];
    const clients = team.clients || [];
    // Run all insight rules
    const detectedInsights = [];
    for (const rule of INSIGHT_RULES) {
        try {
            if (rule.check(team, stats)) {
                detectedInsights.push({
                    id: rule.id,
                    title: rule.title,
                    severity: rule.severity,
                    finding: rule.getFinding(team, stats),
                    detail: rule.getDetail(team, stats),
                    skills: rule.skills,
                    priority: rule.priority,
                });
            }
        }
        catch (e) {
            // Skip rules that error
            console.error(`Error in insight rule ${rule.id}:`, e);
        }
    }
    // Separate by severity
    const strengths = detectedInsights
        .filter(i => i.severity === 'strength')
        .sort((a, b) => a.priority - b.priority);
    const warnings = detectedInsights
        .filter(i => i.severity === 'warning')
        .sort((a, b) => a.priority - b.priority);
    const criticals = detectedInsights
        .filter(i => i.severity === 'critical')
        .sort((a, b) => a.priority - b.priority);
    // Build development plan from warnings and criticals
    const developmentAreas = buildDevelopmentPlan([...criticals, ...warnings]);
    // Calculate summary stats
    const totalPitches = results.reduce((sum, r) => sum + r.clientsWon + r.clientsLost, 0);
    const totalWins = results.reduce((sum, r) => sum + r.clientsWon, 0);
    const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);
    const totalCosts = results.reduce((sum, r) => sum + r.costs, 0);
    // Build quarterly data for charts
    const metrics = team.agencyMetrics || [];
    const quarterlyData = results.map((r, idx) => {
        const metric = metrics[idx];
        return {
            quarter: r.quarter,
            profit: r.profit,
            revenue: r.revenue,
            costs: r.costs,
            cash: metric?.cash ?? team.cash ?? 0,
            reputation: metric?.reputation ?? team.reputation ?? 50,
            burnout: metric?.burnout ?? team.burnout ?? 0,
            staff: metric?.staff ?? team.staff ?? 6,
            clients: (team.clients || []).filter(c => c.wonInQuarter <= r.quarter).length,
            utilization: Math.round(r.utilizationRate * 100),
        };
    });
    // Get starting values
    const startingCash = metrics.length > 0 ? metrics[0].cash : (team.cash || 250000);
    const startingReputation = metrics.length > 0 ? metrics[0].reputation : (team.reputation || 50);
    return {
        teamId: team.teamId,
        companyName: team.companyName,
        generatedAt: new Date().toISOString(),
        summary: {
            finalRank: rank,
            totalTeams: allTeams.length,
            totalProfit: team.cumulativeProfit || 0,
            finalCash: team.cash || 0,
            finalReputation: team.reputation || 0,
            totalClientsWon: clients.length,
            totalPitches,
            winRate: totalPitches > 0 ? Math.round((totalWins / totalPitches) * 100) : 0,
            peakBurnout: Math.round(stats.peakBurnout),
            quarters: results.length,
            startingCash,
            startingReputation,
            avgDiscount: Math.round(stats.avgDiscount * 10) / 10,
            totalRevenue,
            totalCosts,
        },
        quarterlyData,
        strengths,
        warnings,
        criticals,
        developmentPlan: developmentAreas,
    };
}
function buildDevelopmentPlan(insights) {
    // Count skill occurrences across insights
    const skillCounts = {};
    insights.forEach(insight => {
        insight.skills.forEach(skillId => {
            if (!skillCounts[skillId]) {
                skillCounts[skillId] = { count: 0, priority: insight.priority };
            }
            skillCounts[skillId].count++;
            skillCounts[skillId].priority = Math.min(skillCounts[skillId].priority, insight.priority);
        });
    });
    // Group skills by category and sort by priority
    const categoryGroups = {
        commercial: { skills: [], priority: 99 },
        resource: { skills: [], priority: 99 },
        financial: { skills: [], priority: 99 },
        leadership: { skills: [], priority: 99 },
        strategy: { skills: [], priority: 99 },
    };
    Object.entries(skillCounts).forEach(([skillId, data]) => {
        const skill = exports.SKILLS[skillId];
        if (skill) {
            categoryGroups[skill.category].skills.push(skill);
            categoryGroups[skill.category].priority = Math.min(categoryGroups[skill.category].priority, data.priority);
        }
    });
    // Convert to development areas and sort by priority
    const categoryTitles = {
        resource: {
            title: 'Resource & Capacity Planning',
            description: 'Improve ability to match team capacity with demand',
        },
        commercial: {
            title: 'Commercial Excellence',
            description: 'Strengthen sales, pricing, and client acquisition skills',
        },
        financial: {
            title: 'Financial Management',
            description: 'Develop stronger financial planning and control',
        },
        leadership: {
            title: 'People & Leadership',
            description: 'Build team management and engagement capabilities',
        },
        strategy: {
            title: 'Strategic Thinking',
            description: 'Enhance long-term planning and investment decisions',
        },
    };
    const areas = Object.entries(categoryGroups)
        .filter(([_, data]) => data.skills.length > 0)
        .map(([category, data]) => ({
        priority: data.priority,
        title: categoryTitles[category].title,
        description: categoryTitles[category].description,
        skills: data.skills,
    }))
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3); // Top 3 development areas
    // Renumber priorities
    areas.forEach((area, idx) => {
        area.priority = idx + 1;
    });
    return areas;
}
// =============================================================================
// EXPORT ALL TEAM REPORTS
// =============================================================================
function generateAllTeamReports(teams) {
    // Sort teams by cumulative profit for ranking
    const sortedTeams = [...teams].sort((a, b) => (b.cumulativeProfit || 0) - (a.cumulativeProfit || 0));
    return sortedTeams.map((team, idx) => generateTeamReport(team, teams, idx + 1));
}
//# sourceMappingURL=insights.js.map