"use strict";
// =============================================================================
// PITCH PERFECT - DEBRIEF QUESTION SYSTEM
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionBank = void 0;
// =============================================================================
// QUESTION BANK
// =============================================================================
exports.questionBank = [
    // ==========================================================================
    // EARLY GAME QUESTIONS (Q1-Q2)
    // ==========================================================================
    {
        id: 'early_initial_strategy',
        text: "What was your initial strategy going into this quarter?",
        theme: 'strategy',
        triggers: ['first_quarter'],
        priority: 5,
        scope: 'team',
        maxQuarter: 2
    },
    {
        id: 'early_opportunity_selection',
        text: "How did you decide which opportunities to pursue?",
        theme: 'decision_quality',
        triggers: ['first_quarter', 'selective_pitching', 'aggressive_pitching'],
        priority: 5,
        scope: 'all',
        maxQuarter: 3
    },
    {
        id: 'early_pricing_approach',
        text: "Walk us through your pricing decisions this quarter.",
        theme: 'decision_quality',
        triggers: ['heavy_discounting', 'first_quarter'],
        priority: 4,
        scope: 'team',
        maxQuarter: 3
    },
    {
        id: 'early_investment_thinking',
        text: "You invested in tech/training early. What's the thinking behind that?",
        theme: 'investment',
        triggers: ['early_investment'],
        priority: 5,
        scope: 'team',
        maxQuarter: 3,
        followUp: "What returns are you hoping to see?"
    },
    {
        id: 'early_no_investment',
        text: "You didn't invest in tech or training this quarter. Was that deliberate?",
        theme: 'strategy',
        triggers: ['no_investment'],
        priority: 4,
        scope: 'team',
        maxQuarter: 3
    },
    {
        id: 'early_staffing',
        text: "Tell us about your staffing decisions this quarter.",
        theme: 'capacity',
        triggers: ['hired_staff', 'fired_staff', 'overstaffed', 'understaffed'],
        priority: 4,
        scope: 'team',
        maxQuarter: 3
    },
    {
        id: 'early_quality_choice',
        text: "You chose {quality} delivery. What trade-offs were you considering?",
        theme: 'decision_quality',
        triggers: ['premium_quality', 'budget_quality'],
        priority: 4,
        scope: 'team',
        maxQuarter: 3
    },
    {
        id: 'early_risk_appetite',
        text: "How would you describe your risk appetite so far?",
        theme: 'strategy',
        triggers: ['aggressive_pitching', 'heavy_discounting'],
        priority: 4,
        scope: 'all',
        maxQuarter: 3
    },
    {
        id: 'early_what_watching',
        text: "What metrics or signals are you watching most closely?",
        theme: 'systems_thinking',
        triggers: ['first_quarter'],
        priority: 4,
        scope: 'all',
        maxQuarter: 3
    },
    {
        id: 'early_surprised',
        text: "Anything surprise you about the results this quarter?",
        theme: 'story',
        triggers: ['first_quarter'],
        priority: 4,
        scope: 'all',
        maxQuarter: 4
    },
    // ==========================================================================
    // MID GAME QUESTIONS (Q3-Q5)
    // ==========================================================================
    {
        id: 'mid_strategy_evolving',
        text: "How has your strategy evolved since the start?",
        theme: 'strategy',
        triggers: [],
        priority: 5,
        scope: 'all',
        minQuarter: 3,
        maxQuarter: 5
    },
    {
        id: 'mid_pattern_noticed',
        text: "What patterns are you noticing across quarters?",
        theme: 'systems_thinking',
        triggers: [],
        priority: 4,
        scope: 'all',
        minQuarter: 3
    },
    {
        id: 'mid_adjustment',
        text: "What adjustments have you made based on earlier results?",
        theme: 'decision_quality',
        triggers: [],
        priority: 4,
        scope: 'team',
        minQuarter: 3,
        maxQuarter: 6
    },
    {
        id: 'mid_burnout_emerging',
        text: "Your team's burnout is climbing. What's driving that?",
        theme: 'capacity',
        triggers: ['high_burnout'],
        priority: 5,
        scope: 'team',
        minQuarter: 2,
        followUp: "What options are you considering?"
    },
    {
        id: 'mid_reputation_trend',
        text: "Your reputation has been {trend}. What's contributing to that?",
        theme: 'systems_thinking',
        triggers: ['reputation_growth', 'reputation_damage'],
        priority: 4,
        scope: 'team',
        minQuarter: 2
    },
    {
        id: 'mid_cash_position',
        text: "You're running tight on cash. How are you thinking about that?",
        theme: 'strategy',
        triggers: ['cash_crunch'],
        priority: 5,
        scope: 'team',
        minQuarter: 2
    },
    {
        id: 'mid_utilization_pressure',
        text: "Your utilization has been very high. Is that sustainable?",
        theme: 'capacity',
        triggers: ['high_utilization'],
        priority: 4,
        scope: 'team',
        minQuarter: 2
    },
    // ==========================================================================
    // LATE GAME / REFLECTION QUESTIONS (Q4+)
    // ==========================================================================
    {
        id: 'story_turning_point',
        text: "What was your biggest turning point in the game?",
        theme: 'story',
        triggers: ['burnout_recovery', 'comeback', 'early_lead_lost', 'near_bankruptcy'],
        priority: 5,
        scope: 'team',
        minQuarter: 4
    },
    {
        id: 'story_pressure',
        text: "When did you feel the most pressure? What caused it?",
        theme: 'story',
        triggers: ['high_burnout', 'cash_crunch', 'high_utilization', 'client_churn'],
        priority: 4,
        scope: 'team',
        minQuarter: 3
    },
    {
        id: 'story_confidence',
        text: "When did things start clicking for your team?",
        theme: 'story',
        triggers: ['strong_growth', 'reputation_growth', 'burnout_recovery'],
        priority: 3,
        scope: 'team',
        minQuarter: 3
    },
    // --- DECISION QUALITY (Late game) ---
    {
        id: 'decision_discount_trap',
        text: "You discounted heavily on several pitches. Walk us through that thinking — what were you trying to achieve?",
        theme: 'decision_quality',
        triggers: ['heavy_discounting'],
        priority: 5,
        scope: 'team',
        minQuarter: 3,
        followUp: "Looking back, did the wins justify the margin sacrifice?"
    },
    {
        id: 'decision_aggressive_pitching',
        text: "You pitched on most available opportunities. Was that intentional strategy or reactive?",
        theme: 'decision_quality',
        triggers: ['aggressive_pitching', 'high_utilization', 'high_burnout'],
        priority: 5,
        scope: 'team',
        minQuarter: 3,
        followUp: "What would have helped you be more selective?"
    },
    {
        id: 'decision_selective',
        text: "You were quite selective about which opportunities to pursue. How did you decide what to pass on?",
        theme: 'decision_quality',
        triggers: ['selective_pitching'],
        priority: 4,
        scope: 'team',
        minQuarter: 3
    },
    {
        id: 'decision_ignored_data',
        text: "What warning signs did you see but choose to ignore? Why?",
        theme: 'decision_quality',
        triggers: ['high_burnout', 'burnout_spiral', 'cash_crunch', 'reputation_damage'],
        priority: 5,
        scope: 'team',
        minQuarter: 4
    },
    // --- SYSTEMS THINKING (Late game) ---
    {
        id: 'systems_delayed_consequences',
        text: "What consequences showed up two or three quarters after the decision that caused them?",
        theme: 'systems_thinking',
        triggers: ['burnout_spiral', 'reputation_damage', 'early_lead_lost'],
        priority: 5,
        scope: 'all',
        minQuarter: 4
    },
    {
        id: 'systems_burnout_spiral',
        text: "Your team's burnout spiked significantly. Walk us through how that happened and what it affected.",
        theme: 'systems_thinking',
        triggers: ['high_burnout', 'burnout_spiral'],
        priority: 5,
        scope: 'team',
        minQuarter: 3,
        followUp: "At what point did you realize it was becoming a spiral?"
    },
    {
        id: 'systems_reputation_loop',
        text: "How did you see reputation affecting your win rates? Did that create a virtuous or vicious cycle?",
        theme: 'systems_thinking',
        triggers: ['reputation_growth', 'reputation_damage'],
        priority: 4,
        scope: 'all',
        minQuarter: 3
    },
    {
        id: 'systems_investment_compound',
        text: "You invested early in tech/training. When did you start seeing returns on that?",
        theme: 'systems_thinking',
        triggers: ['early_investment', 'strong_growth'],
        priority: 4,
        scope: 'team',
        minQuarter: 4
    },
    {
        id: 'systems_small_big',
        text: "Where did a small decision create a surprisingly big effect later?",
        theme: 'systems_thinking',
        triggers: ['burnout_spiral', 'near_bankruptcy', 'comeback'],
        priority: 4,
        scope: 'all',
        minQuarter: 4
    },
    {
        id: 'systems_root_cause',
        text: "Which problems were symptoms rather than root causes?",
        theme: 'systems_thinking',
        triggers: ['high_burnout', 'client_churn', 'cash_crunch'],
        priority: 4,
        scope: 'all',
        minQuarter: 4
    },
    // --- STRATEGY (Late game) ---
    {
        id: 'strategy_no_invest_late',
        text: "You didn't invest much in tech or training throughout the game. How did that play out?",
        theme: 'strategy',
        triggers: ['no_investment'],
        priority: 4,
        scope: 'team',
        minQuarter: 5,
        followUp: "If you played again, would you change that?"
    },
    {
        id: 'strategy_wellbeing',
        text: "You invested consistently in staff wellbeing. How did that affect your team's performance?",
        theme: 'strategy',
        triggers: ['wellbeing_focus', 'burnout_recovery'],
        priority: 4,
        scope: 'team',
        minQuarter: 4
    },
    {
        id: 'strategy_neglect_wellbeing',
        text: "Staff wellbeing wasn't a priority for your team. What were you focused on instead?",
        theme: 'strategy',
        triggers: ['wellbeing_neglect', 'high_burnout'],
        priority: 4,
        scope: 'team',
        minQuarter: 4
    },
    {
        id: 'strategy_comeback',
        text: "You recovered from a difficult position. What changed?",
        theme: 'strategy',
        triggers: ['comeback', 'burnout_recovery'],
        priority: 5,
        scope: 'team',
        minQuarter: 4
    },
    {
        id: 'strategy_lost_lead',
        text: "You had an early lead but it slipped. What happened?",
        theme: 'strategy',
        triggers: ['early_lead_lost'],
        priority: 5,
        scope: 'team',
        minQuarter: 4
    },
    {
        id: 'strategy_staffing_late',
        text: "Walk us through your hiring and firing decisions over the game. What drove those choices?",
        theme: 'strategy',
        triggers: ['overstaffed', 'understaffed', 'high_utilization', 'low_utilization'],
        priority: 4,
        scope: 'team',
        minQuarter: 4
    },
    {
        id: 'strategy_repeat',
        text: "What would you definitely do again if you played tomorrow?",
        theme: 'strategy',
        triggers: ['strong_growth', 'market_leader', 'reputation_growth'],
        priority: 4,
        scope: 'all',
        minQuarter: 5
    },
    {
        id: 'strategy_never_again',
        text: "What would you never do again?",
        theme: 'strategy',
        triggers: ['near_bankruptcy', 'burnout_spiral', 'heavy_discounting', 'early_lead_lost'],
        priority: 4,
        scope: 'all',
        minQuarter: 5
    },
    // --- CROSS-TEAM (Late game) ---
    {
        id: 'compare_different_approach',
        text: "Looking at other teams, where did you see a fundamentally different approach that made you think?",
        theme: 'strategy',
        triggers: ['market_leader', 'selective_pitching', 'aggressive_pitching'],
        priority: 3,
        scope: 'all',
        minQuarter: 4
    },
    {
        id: 'compare_risk',
        text: "Which team took the biggest risks? How did that play out?",
        theme: 'strategy',
        triggers: ['aggressive_pitching', 'heavy_discounting', 'near_bankruptcy'],
        priority: 3,
        scope: 'all',
        minQuarter: 4
    },
    // --- DEEP DIVES (Late game) ---
    {
        id: 'deep_burnout_real',
        text: "How do you spot early burnout signals in real life — before it becomes a crisis?",
        theme: 'capacity',
        triggers: ['high_burnout', 'burnout_spiral'],
        priority: 3,
        scope: 'all',
        minQuarter: 4
    },
    {
        id: 'deep_saying_no',
        text: "In your real work, what does it take to say 'no' to work that isn't right for the organisation?",
        theme: 'focus',
        triggers: ['selective_pitching', 'aggressive_pitching'],
        priority: 3,
        scope: 'all',
        minQuarter: 4
    },
    {
        id: 'deep_quick_vs_sustainable',
        text: "How do you balance quick wins versus sustainable growth in your actual business?",
        theme: 'investment',
        triggers: ['early_investment', 'no_investment', 'heavy_discounting'],
        priority: 3,
        scope: 'all',
        minQuarter: 4
    },
    // --- LESSONS (always relevant but scaled) ---
    {
        id: 'lesson_mirror',
        text: "Where does this simulation mirror dynamics you see in your real work?",
        theme: 'lessons',
        triggers: [],
        priority: 5,
        scope: 'all',
        minQuarter: 3
    },
    {
        id: 'lesson_personal',
        text: "What leadership lesson emerged for you personally?",
        theme: 'lessons',
        triggers: [],
        priority: 5,
        scope: 'all',
        minQuarter: 4
    },
    {
        id: 'lesson_monday',
        text: "What will your team do differently on Monday?",
        theme: 'lessons',
        triggers: [],
        priority: 4,
        scope: 'all',
        minQuarter: 5
    },
    {
        id: 'lesson_early_takeaway',
        text: "What's your biggest takeaway from this quarter?",
        theme: 'lessons',
        triggers: ['first_quarter'],
        priority: 4,
        scope: 'all',
        maxQuarter: 3
    }
];
//# sourceMappingURL=debriefQuestions.js.map