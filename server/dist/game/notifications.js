"use strict";
// server/src/game/notifications.ts
// Notification generation for Pitch Perfect agency simulation
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNotifications = generateNotifications;
exports.generateQuarterSummary = generateQuarterSummary;
exports.checkBankruptcyWarning = checkBankruptcyWarning;
const uuid_1 = require("uuid");
// =============================================================================
// MAIN NOTIFICATION GENERATOR
// =============================================================================
/**
 * Generate notifications for a team based on their quarter results
 */
function generateNotifications(team, events) {
    const notifications = [];
    const latestResult = team.quarterlyResults[team.quarterlyResults.length - 1];
    if (!latestResult)
        return notifications;
    // Financial notifications
    if (latestResult.profit > 0) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'success',
            title: 'Profitable Quarter',
            message: `Net profit: $${(latestResult.profit / 1000).toFixed(0)}k`,
            timestamp: Date.now(),
        });
    }
    else if (latestResult.profit < 0) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'warning',
            title: 'Loss This Quarter',
            message: `Net loss: $${Math.abs(latestResult.profit / 1000).toFixed(0)}k`,
            timestamp: Date.now(),
        });
    }
    // Client notifications
    if (latestResult.clientsWon > 0) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'success',
            title: 'New Clients Won',
            message: `🎯 Won ${latestResult.clientsWon} new client${latestResult.clientsWon > 1 ? 's' : ''} this quarter!`,
            timestamp: Date.now(),
        });
    }
    if (latestResult.clientsLost > 0) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'info',
            title: 'Pitches Lost',
            message: `Lost ${latestResult.clientsLost} pitch${latestResult.clientsLost > 1 ? 'es' : ''} to competitors.`,
            timestamp: Date.now(),
        });
    }
    // Burnout notifications
    if (team.burnout >= 80) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'error',
            title: 'Critical Burnout',
            message: `🔥 Team burnout at ${team.burnout}%! Immediate action required.`,
            timestamp: Date.now(),
        });
    }
    else if (team.burnout >= 60) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'warning',
            title: 'High Burnout',
            message: `Team burnout at ${team.burnout}%. Consider investing in wellbeing.`,
            timestamp: Date.now(),
        });
    }
    else if (latestResult.burnoutChange < -5 && team.burnout < 30) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'success',
            title: 'Team Wellbeing Improved',
            message: `Burnout reduced to ${team.burnout}%. Team morale is high!`,
            timestamp: Date.now(),
        });
    }
    // Reputation notifications
    if (latestResult.reputationChange >= 10 && team.reputation >= 80) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'success',
            title: 'Elite Agency Status',
            message: `🌟 Reputation reached ${team.reputation}! You're an industry leader.`,
            timestamp: Date.now(),
        });
    }
    else if (latestResult.reputationChange <= -10) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'warning',
            title: 'Reputation Declined',
            message: `Reputation dropped by ${Math.abs(latestResult.reputationChange)} points.`,
            timestamp: Date.now(),
        });
    }
    if (team.reputation < 30) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'warning',
            title: 'Reputation Crisis',
            message: `⚠️ Low reputation (${team.reputation}) is hurting your pitch success.`,
            timestamp: Date.now(),
        });
    }
    // Staff notifications
    if (latestResult.staffChange > 0) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'info',
            title: 'Team Expanded',
            message: `Hired ${latestResult.staffChange} new team member${latestResult.staffChange > 1 ? 's' : ''}. Total: ${team.staff}`,
            timestamp: Date.now(),
        });
    }
    else if (latestResult.staffChange < 0) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'info',
            title: 'Team Reduced',
            message: `${Math.abs(latestResult.staffChange)} team member${Math.abs(latestResult.staffChange) > 1 ? 's' : ''} departed. Total: ${team.staff}`,
            timestamp: Date.now(),
        });
    }
    // Cash notifications
    if (team.cash < 50000 && team.cash > 0) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'warning',
            title: 'Low Cash Reserves',
            message: `💰 Only $${(team.cash / 1000).toFixed(0)}k remaining. Watch your spending!`,
            timestamp: Date.now(),
        });
    }
    else if (team.cash < 100000 && team.cash >= 50000) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'info',
            title: 'Cash Getting Tight',
            message: `Cash reserves at $${(team.cash / 1000).toFixed(0)}k. Plan carefully.`,
            timestamp: Date.now(),
        });
    }
    // Capability milestones
    if (team.techLevel >= 4) {
        const prevTech = team.techLevel - 0.3; // Approximate previous
        if (prevTech < 4) {
            notifications.push({
                id: (0, uuid_1.v4)(),
                quarter: team.quarter,
                type: 'success',
                title: 'Tech Excellence',
                message: `🖥️ Tech capabilities reached advanced level (${team.techLevel.toFixed(1)}/5)`,
                timestamp: Date.now(),
            });
        }
    }
    if (team.trainingLevel >= 4) {
        const prevTraining = team.trainingLevel - 0.2;
        if (prevTraining < 4) {
            notifications.push({
                id: (0, uuid_1.v4)(),
                quarter: team.quarter,
                type: 'success',
                title: 'Training Excellence',
                message: `📚 Training level reached advanced (${team.trainingLevel.toFixed(1)}/5)`,
                timestamp: Date.now(),
            });
        }
    }
    if (team.marketPresence >= 70) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'success',
            title: 'Strong Market Presence',
            message: `📢 Market presence at ${team.marketPresence.toFixed(0)}%. You're well known!`,
            timestamp: Date.now(),
        });
    }
    // Event notifications
    events.filter(e => e.active && e.quarter === team.quarter).forEach(event => {
        const eventMessages = {
            talentPoaching: {
                title: '🎯 Talent Poaching Alert',
                message: 'A competitor is recruiting your team. Staff costs increased by 15%.',
                type: 'warning',
            },
            viralTrend: {
                title: '📈 Viral Trend Opportunity',
                message: 'Social media demand is surging! Social pitches have +15% win chance.',
                type: 'success',
            },
            budgetCuts: {
                title: '✂️ Industry Budget Cuts',
                message: 'Economic uncertainty is affecting clients. All pitch win chances reduced by 8%.',
                type: 'warning',
            },
            aiTools: {
                title: '🤖 AI Tools Available',
                message: 'New AI tools hit the market! Tech Level 3+ agencies gain efficiency.',
                type: 'info',
            },
            industryAward: {
                title: '🏆 Award Season',
                message: 'Award spotlight! High-reputation agencies get +10 reputation and better pitch success.',
                type: 'success',
            },
            keyDeparture: {
                title: '👋 Key Staff Departure',
                message: 'A senior team member has left. Burnout increased and reputation affected.',
                type: 'warning',
            },
            referralSurge: {
                title: '🤝 Referral Surge',
                message: 'Happy clients are spreading the word! All pitch win chances +10%.',
                type: 'success',
            },
        };
        const eventInfo = eventMessages[event.type];
        if (eventInfo) {
            notifications.push({
                id: (0, uuid_1.v4)(),
                quarter: team.quarter,
                type: eventInfo.type,
                title: eventInfo.title,
                message: eventInfo.message,
                timestamp: Date.now(),
            });
        }
    });
    // Strategic tips
    if (team.quarter === 2) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'info',
            title: '💡 Tip',
            message: 'Consider investing in tools and training to improve your competitive edge.',
            timestamp: Date.now(),
        });
    }
    if (team.quarter === 4 && team.staff < 10) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'info',
            title: '💡 Growth Opportunity',
            message: 'Mid-game is a good time to expand your team if cash allows.',
            timestamp: Date.now(),
        });
    }
    if (team.quarter === 7) {
        notifications.push({
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'info',
            title: '🏁 Final Stretch',
            message: 'Penultimate quarter! Focus on maximizing profit and reputation.',
            timestamp: Date.now(),
        });
    }
    return notifications;
}
// =============================================================================
// QUARTER SUMMARY
// =============================================================================
/**
 * Generate a compact quarterly summary notification
 */
function generateQuarterSummary(team, result) {
    const profitStr = result.profit >= 0
        ? `+$${(result.profit / 1000).toFixed(0)}k`
        : `-$${Math.abs(result.profit / 1000).toFixed(0)}k`;
    return {
        id: (0, uuid_1.v4)(),
        quarter: team.quarter,
        type: result.profit >= 0 ? 'success' : 'warning',
        title: `Q${result.quarter} Summary`,
        message: `Profit: ${profitStr} | Clients Won: ${result.clientsWon} | Staff: ${team.staff} | Rep: ${team.reputation}`,
        timestamp: Date.now(),
    };
}
// =============================================================================
// BANKRUPTCY WARNING
// =============================================================================
/**
 * Check and generate bankruptcy risk notification
 */
function checkBankruptcyWarning(team) {
    const estimatedQuarterlyCosts = team.staff * 12000 + 20000; // Staff + overhead
    if (team.cash < estimatedQuarterlyCosts && team.cash > 0) {
        return {
            id: (0, uuid_1.v4)(),
            quarter: team.quarter,
            type: 'error',
            title: '⚠️ Bankruptcy Risk',
            message: `Cash ($${(team.cash / 1000).toFixed(0)}k) may not cover next quarter's costs (~$${(estimatedQuarterlyCosts / 1000).toFixed(0)}k)`,
            timestamp: Date.now(),
        };
    }
    return null;
}
//# sourceMappingURL=notifications.js.map