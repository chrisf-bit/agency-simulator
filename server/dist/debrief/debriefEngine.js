"use strict";
// =============================================================================
// PITCH PERFECT - DEBRIEF ENGINE
// Generates facilitator prompts based on team decisions
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFacilitatorPrompts = generateFacilitatorPrompts;
exports.generateQuarterlyPrompts = generateQuarterlyPrompts;
const debriefQuestions_1 = require("./debriefQuestions");
const triggerDetection_1 = require("./triggerDetection");
const QUESTIONS_PER_TEAM = 3;
const ALL_TEAMS_QUESTIONS = 2;
// =============================================================================
// MAIN ENTRY POINT
// =============================================================================
function generateFacilitatorPrompts(gameState) {
    const teams = Array.from(gameState.teams.values());
    const gameContext = buildGameContext(gameState);
    const currentQuarter = gameState.currentQuarter;
    // Analyze each team
    const teamAnalyses = teams.map(team => {
        const triggers = (0, triggerDetection_1.detectTriggers)(team, gameContext);
        const firedTriggers = triggers.filter(t => t.fired);
        const suggestedQuestions = selectQuestionsForTeam(firedTriggers, currentQuarter, true);
        return {
            teamId: team.teamId,
            companyName: team.companyName,
            triggers: firedTriggers,
            keyObservations: firedTriggers
                .sort((a, b) => b.intensity - a.intensity)
                .slice(0, 4)
                .map(t => t.context),
            suggestedQuestions
        };
    });
    // Select all-teams questions
    const allTeamsQuestions = selectAllTeamsQuestions(teamAnalyses, currentQuarter, true);
    // Generate narrative
    const gameNarrative = generateGameNarrative(teamAnalyses, gameContext);
    return {
        gameNarrative,
        allTeams: allTeamsQuestions,
        perTeam: teamAnalyses
    };
}
function generateQuarterlyPrompts(gameState, currentQuarter) {
    const teams = Array.from(gameState.teams.values());
    const gameContext = buildGameContext(gameState);
    const perTeam = teams.map(team => {
        const triggers = (0, triggerDetection_1.detectTriggers)(team, gameContext);
        const firedTriggers = triggers.filter(t => t.fired);
        // Focus on triggers relevant to this quarter
        const recentTriggers = firedTriggers.filter(t => t.quarters?.includes(currentQuarter) || t.quarters?.length === 0);
        const keyObservations = recentTriggers
            .sort((a, b) => b.intensity - a.intensity)
            .slice(0, 3)
            .map(t => t.context);
        // Pass currentQuarter for filtering
        const suggestedQuestions = selectQuestionsForTeam(recentTriggers, currentQuarter, false).slice(0, 2);
        return {
            teamId: team.teamId,
            companyName: team.companyName,
            keyObservations,
            suggestedQuestions
        };
    });
    // Get all-teams questions appropriate for this quarter
    const allTeams = selectAllTeamsQuestions(perTeam.map(t => ({ ...t, triggers: [] })), currentQuarter, false).slice(0, 2);
    return {
        quarter: currentQuarter,
        perTeam,
        allTeams
    };
}
// =============================================================================
// QUESTION SELECTION
// =============================================================================
function getQuestionsForQuarter(currentQuarter, isEndOfGame) {
    return debriefQuestions_1.questionBank.filter(q => {
        // Check minQuarter constraint
        if (q.minQuarter && currentQuarter < q.minQuarter) {
            return false;
        }
        // Check maxQuarter constraint (only for quarterly debriefs, not end of game)
        if (!isEndOfGame && q.maxQuarter && currentQuarter > q.maxQuarter) {
            return false;
        }
        return true;
    });
}
function selectQuestionsForTeam(triggers, currentQuarter, isEndOfGame) {
    const availableQuestions = getQuestionsForQuarter(currentQuarter, isEndOfGame);
    const scoredQuestions = availableQuestions
        .filter(q => q.scope === 'team')
        .map(question => {
        let score = 0;
        // Score based on trigger matches
        for (const trigger of triggers) {
            if (question.triggers.includes(trigger.type)) {
                score += question.priority * trigger.intensity;
            }
        }
        // Boost questions that have no specific triggers but are appropriate for this quarter
        // (These are general reflection questions)
        if (question.triggers.length === 0 && score === 0) {
            score = question.priority * 0.3;
        }
        // Early game boost for first_quarter trigger
        if (currentQuarter <= 2 && question.triggers.includes('first_quarter')) {
            score += 2;
        }
        return { question, score };
    })
        .filter(sq => sq.score > 0)
        .sort((a, b) => b.score - a.score);
    // Select with theme diversity
    const selected = [];
    const usedThemes = new Set();
    for (const sq of scoredQuestions) {
        if (selected.length >= QUESTIONS_PER_TEAM)
            break;
        const themeCount = selected.filter(q => q.theme === sq.question.theme).length;
        if (themeCount < 2) {
            selected.push(sq.question);
            usedThemes.add(sq.question.theme);
        }
    }
    return selected;
}
function selectAllTeamsQuestions(analyses, currentQuarter, isEndOfGame) {
    const availableQuestions = getQuestionsForQuarter(currentQuarter, isEndOfGame);
    // Count trigger occurrences across teams
    const triggerCounts = new Map();
    for (const analysis of analyses) {
        for (const trigger of analysis.triggers) {
            const current = triggerCounts.get(trigger.type) || 0;
            triggerCounts.set(trigger.type, current + trigger.intensity);
        }
    }
    const scoredQuestions = availableQuestions
        .filter(q => q.scope === 'all')
        .map(question => {
        let score = question.priority;
        // Boost if multiple teams triggered
        for (const triggerType of question.triggers) {
            const count = triggerCounts.get(triggerType) || 0;
            if (count >= 2) {
                score += count * 2;
            }
        }
        // Always-relevant questions get a boost (these have empty triggers)
        if (question.triggers.length === 0) {
            score += 2;
        }
        // Early game boost for first_quarter trigger
        if (currentQuarter <= 2 && question.triggers.includes('first_quarter')) {
            score += 3;
        }
        return { question, score };
    })
        .sort((a, b) => b.score - a.score);
    // Select with theme diversity
    const selected = [];
    const usedThemes = new Set();
    for (const sq of scoredQuestions) {
        if (selected.length >= ALL_TEAMS_QUESTIONS)
            break;
        if (!usedThemes.has(sq.question.theme)) {
            selected.push(sq.question);
            usedThemes.add(sq.question.theme);
        }
    }
    return selected;
}
// =============================================================================
// GAME CONTEXT & NARRATIVE
// =============================================================================
function buildGameContext(gameState) {
    const teams = Array.from(gameState.teams.values());
    // Count opportunities per quarter
    const opportunitiesPerQuarter = new Map();
    for (const opp of gameState.opportunities) {
        const current = opportunitiesPerQuarter.get(opp.quarter) || 0;
        opportunitiesPerQuarter.set(opp.quarter, current + 1);
    }
    // Determine leader by quarter (by cumulative profit)
    const leaderByQuarter = [];
    for (let q = 1; q <= gameState.currentQuarter; q++) {
        let leader = '';
        let maxProfit = -Infinity;
        for (const team of teams) {
            const qResult = team.quarterlyResults.find(r => r.quarter === q);
            const cumProfit = team.quarterlyResults
                .filter(r => r.quarter <= q)
                .reduce((sum, r) => sum + r.profit, 0);
            if (cumProfit > maxProfit) {
                maxProfit = cumProfit;
                leader = team.teamId;
            }
        }
        leaderByQuarter.push(leader);
    }
    return {
        totalTeams: teams.length,
        opportunities: gameState.opportunities,
        opportunitiesPerQuarter,
        leaderByQuarter
    };
}
function generateGameNarrative(analyses, gameContext) {
    const parts = [];
    // Leadership changes
    const uniqueLeaders = new Set(gameContext.leaderByQuarter).size;
    if (uniqueLeaders > 2) {
        parts.push("Lead changed hands multiple times throughout the game.");
    }
    else if (uniqueLeaders === 1 && gameContext.leaderByQuarter.length > 0) {
        const leader = analyses.find(a => a.teamId === gameContext.leaderByQuarter[0]);
        if (leader) {
            parts.push(`${leader.companyName} maintained the lead throughout.`);
        }
    }
    // Burnout events
    const burnoutTeams = analyses.filter(a => a.triggers.some(t => t.type === 'burnout_spiral' || (t.type === 'high_burnout' && t.intensity > 0.7)));
    if (burnoutTeams.length > 0) {
        parts.push(`${burnoutTeams.map(a => a.companyName).join(' and ')} faced significant burnout challenges.`);
    }
    // Financial pressure
    const cashCrunchTeams = analyses.filter(a => a.triggers.some(t => t.type === 'near_bankruptcy'));
    if (cashCrunchTeams.length > 0) {
        parts.push(`${cashCrunchTeams.map(a => a.companyName).join(' and ')} experienced serious financial pressure.`);
    }
    // Comebacks
    const comebackTeams = analyses.filter(a => a.triggers.some(t => t.type === 'comeback'));
    if (comebackTeams.length > 0) {
        parts.push(`${comebackTeams.map(a => a.companyName).join(' and ')} staged impressive comebacks.`);
    }
    // Strategic contrast
    const aggressive = analyses.filter(a => a.triggers.some(t => t.type === 'aggressive_pitching'));
    const selective = analyses.filter(a => a.triggers.some(t => t.type === 'selective_pitching'));
    if (aggressive.length > 0 && selective.length > 0) {
        parts.push("Teams took contrasting approaches to opportunity selection.");
    }
    return parts.join(' ') || 'A competitive game with varied strategies across teams.';
}
//# sourceMappingURL=debriefEngine.js.map