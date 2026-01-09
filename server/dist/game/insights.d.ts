import { TeamState } from '../types';
export interface Skill {
    id: string;
    name: string;
    category: SkillCategory;
    description: string;
}
export type SkillCategory = 'commercial' | 'resource' | 'financial' | 'leadership' | 'strategy';
export declare const SKILLS: Record<string, Skill>;
export type InsightSeverity = 'strength' | 'warning' | 'critical';
export interface Insight {
    id: string;
    title: string;
    severity: InsightSeverity;
    finding: string;
    detail: string;
    skills: string[];
    priority: number;
}
export interface QuarterlyDataPoint {
    quarter: number;
    profit: number;
    revenue: number;
    costs: number;
    cash: number;
    reputation: number;
    burnout: number;
    staff: number;
    clients: number;
    utilization: number;
}
export interface TeamReport {
    teamId: string;
    companyName: string;
    generatedAt: string;
    summary: {
        finalRank: number;
        totalTeams: number;
        totalProfit: number;
        finalCash: number;
        finalReputation: number;
        totalClientsWon: number;
        totalPitches: number;
        winRate: number;
        peakBurnout: number;
        quarters: number;
        startingCash: number;
        startingReputation: number;
        avgDiscount: number;
        totalRevenue: number;
        totalCosts: number;
    };
    quarterlyData: QuarterlyDataPoint[];
    strengths: Insight[];
    warnings: Insight[];
    criticals: Insight[];
    developmentPlan: DevelopmentArea[];
}
export interface DevelopmentArea {
    priority: number;
    title: string;
    description: string;
    skills: Skill[];
}
export declare function generateTeamReport(team: TeamState, allTeams: TeamState[], rank: number): TeamReport;
export declare function generateAllTeamReports(teams: TeamState[]): TeamReport[];
//# sourceMappingURL=insights.d.ts.map