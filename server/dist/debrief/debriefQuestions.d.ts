export type QuestionTheme = 'story' | 'decision_quality' | 'systems_thinking' | 'team_dynamics' | 'strategy' | 'lessons' | 'capacity' | 'focus' | 'investment';
export type TriggerType = 'heavy_discounting' | 'aggressive_pitching' | 'selective_pitching' | 'high_burnout' | 'burnout_recovery' | 'burnout_spiral' | 'early_investment' | 'no_investment' | 'reputation_growth' | 'reputation_damage' | 'premium_quality' | 'budget_quality' | 'overstaffed' | 'understaffed' | 'high_utilization' | 'low_utilization' | 'cash_crunch' | 'near_bankruptcy' | 'strong_growth' | 'client_churn' | 'market_leader' | 'comeback' | 'early_lead_lost' | 'wellbeing_focus' | 'wellbeing_neglect' | 'first_quarter' | 'hired_staff' | 'fired_staff';
export interface DebriefQuestion {
    id: string;
    text: string;
    theme: QuestionTheme;
    triggers: TriggerType[];
    priority: number;
    scope: 'team' | 'all';
    followUp?: string;
    minQuarter?: number;
    maxQuarter?: number;
}
export interface TriggerResult {
    type: TriggerType;
    fired: boolean;
    intensity: number;
    context: string;
    quarters?: number[];
}
export interface TeamAnalysis {
    teamId: string;
    companyName: string;
    triggers: TriggerResult[];
    keyObservations: string[];
    suggestedQuestions: DebriefQuestion[];
}
export interface FacilitatorPrompts {
    gameNarrative: string;
    allTeams: DebriefQuestion[];
    perTeam: TeamAnalysis[];
}
export declare const questionBank: DebriefQuestion[];
//# sourceMappingURL=debriefQuestions.d.ts.map