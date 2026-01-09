export type GameLevel = 1 | 2 | 3;
export interface GameConfig {
    gameId: string;
    gameName: string;
    level: GameLevel;
    numberOfTeams: number;
    maxQuarters: number;
    randomSeed: number;
    events: EventConfig;
}
export interface EventConfig {
    enabled: boolean;
    frequency: number;
    maxConcurrent: number;
}
export type ServiceLine = 'digital' | 'brand' | 'social' | 'content' | 'pr';
export type ClientType = 'startup' | 'enterprise' | 'nonprofit' | 'government';
export type Complexity = 'low' | 'medium' | 'high';
export type Deadline = 'normal' | 'urgent';
export interface ClientOpportunity {
    id: string;
    clientName: string;
    clientType: ClientType;
    serviceLine: ServiceLine;
    budget: number;
    complexity: Complexity;
    deadline: Deadline;
    hoursRequired: number;
    baseWinChance: number;
    quarter: number;
}
export interface ActiveClient {
    opportunityId: string;
    clientName: string;
    clientType: ClientType;
    serviceLine: ServiceLine;
    budget: number;
    discount: number;
    revenue: number;
    complexity: 'low' | 'medium' | 'high';
    hoursPerQuarter: number;
    quartersRemaining: number;
    wonInQuarter: number;
}
export interface TeamState {
    teamId: string;
    companyName: string;
    quarter: number;
    cash: number;
    cumulativeProfit: number;
    staff: number;
    burnout: number;
    reputation: number;
    marketPresence: number;
    techLevel: number;
    trainingLevel: number;
    processLevel: number;
    clients: ActiveClient[];
    isBankrupt: boolean;
    submittedThisQuarter: boolean;
    currentInputs: TeamInputs;
    quarterlyResults: QuarterResult[];
    agencyMetrics: AgencyMetrics[];
}
export interface AgencyMetrics {
    quarter: number;
    cash: number;
    reputation: number;
    burnout: number;
    staff: number;
    techLevel: number;
    trainingLevel: number;
    processLevel: number;
    marketPresence: number;
    activeClients: number;
}
export interface QuarterResult {
    quarter: number;
    revenue: number;
    costs: number;
    profit: number;
    clientsWon: number;
    clientsLost: number;
    staffChange: number;
    reputationChange: number;
    burnoutChange: number;
    utilizationRate: number;
    hoursDelivered: number;
    hoursCapacity: number;
}
export interface PitchDecision {
    opportunityId: string;
    discountPercent: number;
}
export interface TeamInputs {
    pitches: PitchDecision[];
    qualityLevel: 'budget' | 'standard' | 'premium';
    techInvestment: number;
    trainingInvestment: number;
    marketingSpend: number;
    hiringCount: number;
    firingCount: number;
    wellbeingSpend: number;
}
export type EventType = 'talentPoaching' | 'viralTrend' | 'budgetCuts' | 'aiTools' | 'industryAward' | 'keyDeparture' | 'referralSurge';
export interface GameEvent {
    type: EventType;
    quarter: number;
    duration: number;
    active: boolean;
    description: string;
}
export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'event';
export interface Notification {
    id: string;
    quarter: number;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: number;
}
export interface LeaderboardEntry {
    teamId: string;
    companyName: string;
    cumulativeProfit: number;
    reputation: number;
    staff: number;
    isBankrupt: boolean;
}
export interface GameState {
    config: GameConfig;
    currentQuarter: number;
    teams: Map<string, TeamState>;
    activeEvents: GameEvent[];
    opportunities: ClientOpportunity[];
    allTeamsSubmitted: boolean;
    gameStarted: boolean;
    gameEnded: boolean;
    winner?: string;
}
export interface ServerToClientEvents {
    gameCreated: (gameId: string) => void;
    teamJoined: (data: {
        teamId: string;
        companyName: string;
    }) => void;
    inputsSubmitted: (teamId?: string) => void;
    allTeamsSubmitted: () => void;
    quarterStarted: (quarter: number, brief: string, events: GameEvent[], opportunities: ClientOpportunity[]) => void;
    resultsReady: (teamState: TeamState, notifications: Notification[]) => void;
    gameEnded: (leaderboard: LeaderboardEntry[]) => void;
    opportunitiesGenerated: (opportunities: ClientOpportunity[]) => void;
    error: (message: string) => void;
    forceRefresh: () => void;
    gameRestored: () => void;
}
export interface ClientToServerEvents {
    createGame: (config: Partial<GameConfig>, callback: (response: any) => void) => void;
    joinGame: (gameId: string, companyName: string, callback: (teamState: any) => void) => void;
    joinWithToken: (gameId: string, token: string, companyName: string, callback: (response: any) => void) => void;
    validateToken: (gameId: string, token: string, callback: (response: any) => void) => void;
    getTeamSlots: (gameId: string, callback: (slots: any[]) => void) => void;
    submitInputs: (gameId: string, teamId: string, inputs: TeamInputs) => void;
    startQuarter: (gameId: string) => void;
    endGame: (gameId: string) => void;
    getGameState: (gameId: string, callback: (state: any) => void) => void;
    getTeamState: (gameId: string, teamId: string, callback: (state: TeamState) => void) => void;
    getOpportunities: (gameId: string, callback: (opportunities: ClientOpportunity[]) => void) => void;
    exportGame: (gameId: string, callback: (data: any) => void) => void;
    importGame: (gameId: string, data: any, callback: (result: any) => void) => void;
    forceRefreshAllTeams: (gameId: string) => void;
    resetTeamSubmission: (gameId: string, teamId: string, callback: (result: any) => void) => void;
    forceAdvanceQuarter: (gameId: string, callback: (result: any) => void) => void;
    reconnectTeam: (gameId: string, teamId: string) => void;
    reconnectFacilitator: (gameId: string) => void;
    ping: (callback: () => void) => void;
}
//# sourceMappingURL=types.d.ts.map