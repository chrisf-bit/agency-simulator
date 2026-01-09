// client/src/types.ts
// Shared type definitions for Agency Leadership simulation

// =============================================================================
// CORE ENUMS & LITERALS
// =============================================================================

export type GameLevel = 1 | 2 | 3;

export type ServiceLineType = 'brand' | 'digital' | 'social' | 'content' | 'pr';

export type ClientType = 'enterprise' | 'startup' | 'nonprofit' | 'government';

export type EventType = 
  | 'talentPoaching' 
  | 'viralTrend' 
  | 'budgetCuts' 
  | 'aiTools' 
  | 'industryAward' 
  | 'keyDeparture' 
  | 'referralSurge'
  | 'economyTanks'
  | 'aiBoom'
  | 'teamExodus'
  | 'clientGhosts'
  | 'prAwards';

export type QualityLevel = 'budget' | 'standard' | 'premium';

export type HiringDecision = 'none' | 'hire' | 'layoff';

export type Complexity = 'low' | 'medium' | 'high';

export type Deadline = 'standard' | 'urgent';

// NEW: Client retention status
export type ClientStatus = 'active' | 'notice_given' | 'renewing';

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

export interface GameConfig {
  gameId: string;
  gameName?: string;
  level: GameLevel;
  numberOfTeams: number;
  maxQuarters?: number;
  randomSeed: number;
  testMode: boolean; // NEW: Single team test mode
  events: {
    talentPoaching: { enabled: boolean; probability: number };
    viralTrend: { enabled: boolean; probability: number };
    budgetCuts: { enabled: boolean; probability: number };
    aiTools: { enabled: boolean; probability: number };
    industryAward: { enabled: boolean; probability: number };
    keyDeparture: { enabled: boolean; probability: number };
    referralSurge: { enabled: boolean; probability: number };
  };
}

// =============================================================================
// CLIENT OPPORTUNITIES
// =============================================================================

export interface ClientOpportunity {
  id: string;
  clientName: string;
  clientType: ClientType;
  serviceLine: ServiceLineType;
  serviceIcon: string;
  clientIcon: string;
  budget: number;
  complexity: Complexity;
  deadline: Deadline;
  hoursRequired?: number;
  baseWinChance?: number;
  // For existing client project opportunities
  isExistingClientProject?: boolean;
  existingClientId?: string;
  existingClientSatisfaction?: number;
}

// =============================================================================
// PITCH & CLIENT INPUTS
// =============================================================================

export interface PitchInput {
  opportunityId: string;
  clientName: string;
  clientType: ClientType;
  serviceLine: ServiceLineType;
  budget: number;
  discountPercent: number;  // 0-50%
  complexity: Complexity;
  deadline: Deadline;
  qualityLevel: QualityLevel; // NEW: Per-pitch quality
}

export interface WonClient {
  opportunityId: string;
  clientName: string;
  clientType: ClientType;
  serviceLine: ServiceLineType;
  budget: number;
  discount: number;
  revenue: number;          // budget * (1 - discount/100)
  complexity: Complexity;
  hoursPerQuarter: number;
  quartersRemaining: number;
  wonInQuarter: number;
  // NEW: Retention tracking
  status: ClientStatus;
  satisfactionLevel: number; // 0-100
  noticeQuarter?: number;
}

// =============================================================================
// TEAM INPUTS (DECISIONS)
// =============================================================================

export interface TeamInputs {
  // Client acquisition
  pitches: PitchInput[];
  
  // REMOVED: global qualityLevel - now per-pitch
  
  // Talent & resourcing
  hiringCount: number;
  firingCount: number;
  wellbeingSpend: number;
  
  // Investments
  techInvestment: number;
  trainingInvestment: number;
  marketingSpend: number;
  
  // NEW: Client satisfaction investment (£0-100k)
  clientSatisfactionSpend: number;
  
  // NEW: Growth Focus slider (0 = existing clients/organic, 100 = new clients)
  growthFocus: number;
}

// =============================================================================
// QUARTERLY RESULTS
// =============================================================================

export interface QuarterlyResults {
  quarter: number;
  revenue: number;
  costs: number;
  profit: number;
  clientsWon: number;
  clientsLost: number;
  clientsChurned: number; // NEW: Lost due to low satisfaction
  clientsRenewed: number; // NEW: Renewed at end of contract
  hoursDelivered: number;
  utilizationRate: number;
  staffChange: number; // NEW: Net change in staff this quarter
}

// =============================================================================
// AGENCY METRICS (REPLACES BALANCE SHEET)
// =============================================================================

export interface AgencyMetrics {
  quarter: number;
  cash: number;
  reputation: number;       // 0-100
  staff: number;            // 3-20
  burnout: number;          // 0-100
  techLevel: number;        // 1-5
  trainingLevel: number;    // 1-5
  processLevel: number;     // 1-5
  marketPresence: number;   // 0-100
  activeClients: number;
}

// =============================================================================
// GAME EVENTS
// =============================================================================

export interface GameEvent {
  id?: number;
  quarter: number;
  type: EventType;
  name?: string;
  description?: string;
  impact: string | number;
  affectedTeams?: string[];
  active: boolean;
  duration: number;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export interface Notification {
  id: string;
  quarter: number;
  type: 'success' | 'warning' | 'info' | 'error' | 'event';
  title: string;
  message: string;
  timestamp?: number;
}

// =============================================================================
// TEAM STATE
// =============================================================================

export interface TeamState {
  teamId: string;
  companyName: string;      // "Team 1", "Team 2", etc.
  teamNumber: number;       // NEW: Numeric identifier
  quarter: number;
  level: GameLevel;
  
  // Core metrics (denormalized for easy access)
  cash: number;
  reputation: number;
  staff: number;
  burnout: number;
  
  // Capability levels
  techLevel: number;
  trainingLevel: number;
  processLevel: number;
  marketPresence: number;
  
  // Business data
  clients: WonClient[];
  quarterlyResults: QuarterlyResults[];
  agencyMetrics: AgencyMetrics[];
  
  // Inputs
  currentInputs: TeamInputs;
  previousInputs: TeamInputs[];
  
  // Status
  submittedThisQuarter: boolean;
  cumulativeProfit: number;
  cumulativeRevenue: number;
  
  // Bankruptcy
  isBankrupt?: boolean;
  bankruptQuarter?: number;
}

// =============================================================================
// LEADERBOARD
// =============================================================================

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  companyName: string;
  teamNumber: number; // NEW
  cumulativeProfit: number;
  reputation: number;
  clients: number;
  clientCount: number; // Alias for clients
  cash: number;
  burnout: number;
  totalScore: number;
}

// =============================================================================
// GAME STATE
// =============================================================================

export interface GameState {
  gameId?: string;
  level?: GameLevel;
  numberOfTeams?: number;
  currentQuarter: number;
  teams: Map<string, TeamState>;
  opportunities?: ClientOpportunity[];
  events?: GameEvent[];
  marketBrief?: string;
  seed?: string;
  isComplete?: boolean;
  config: GameConfig;
  activeEvents: GameEvent[];
  gameEnded?: boolean;
  gameStarted?: boolean;
  winner?: LeaderboardEntry | string;
  allTeamsSubmitted?: boolean;
  testMode?: boolean; // NEW
}

// =============================================================================
// SOCKET.IO EVENTS
// =============================================================================

export interface ServerToClientEvents {
  gameCreated: (gameId: string) => void;
  teamJoined: (team: TeamState | { teamId: string; companyName: string; teamNumber: number }) => void;
  quarterAdvanced: (quarter: number, marketBrief: string) => void;
  gameStateUpdated: (teams: TeamState[]) => void;
  teamUpdated: (updatedTeam: TeamState, newNotifications?: Notification[]) => void;
  gameComplete: (leaderboard: LeaderboardEntry[]) => void;
  allTeamsSubmitted: () => void;
  inputsSubmitted: (teamId?: string) => void;
  quarterStarted: (quarter: number, brief?: string, events?: GameEvent[], opportunities?: ClientOpportunity[]) => void;
  opportunitiesGenerated: (opportunities: ClientOpportunity[]) => void;
  resultsReady: (results: QuarterlyResults, notifications?: Notification[]) => void;
  gameEnded: (leaderboard: LeaderboardEntry[]) => void;
  gameRestored: () => void;
  forceRefresh: () => void;
  error: (message: string) => void;
  testModeAdvanced: (quarter: number) => void; // NEW
}

export interface ClientToServerEvents {
  createGame: (
    config: { level: GameLevel; numberOfTeams: number; companyName: string }, 
    callback: (response: { success: boolean; gameId?: string; teamId?: string; error?: string } | string) => void
  ) => void;
  joinGame: (
    gameId: string, 
    companyName: string, 
    callback: (response: { success: boolean; teamState?: TeamState; error?: string } | TeamState | { teamId: string; companyName: string }) => void
  ) => void;
  submitInputs: (gameId: string, teamId: string, inputs: TeamInputs) => void;
  advanceQuarter: (gameId: string) => void;
  startQuarter: (gameId: string) => void;
  endGame: (gameId: string) => void;
  getGameState: (gameId: string, callback: (gameState: GameState) => void) => void;
  getOpportunities: (gameId: string, callback: (opportunities: ClientOpportunity[]) => void) => void;
  requestGameState: (gameId: string, callback: (gameState: { teams: TeamState[] }) => void) => void;
  reconnectTeam: (gameId: string, teamId: string) => void;
  reconnectFacilitator: (gameId: string) => void;
  resetTeamSubmission: (
    gameId: string, 
    teamId: string, 
    callback: (result: { success: boolean; error?: string }) => void
  ) => void;
  forceAdvanceQuarter: (
    gameId: string, 
    callback: (result: { success: boolean; error?: string }) => void
  ) => void;
  forceRefreshAllTeams: (gameId: string) => void;
  exportGame: (gameId: string, callback: (data: GameState) => void) => void;
  importGame: (
    gameId: string, 
    gameData: GameState, 
    callback: (result: { success: boolean; error?: string }) => void
  ) => void;
  ping: (callback: () => void) => void;
  joinTestMode: (callback: (response: any) => void) => void; // NEW
}

// =============================================================================
// HELPER CONSTANTS (for UI) - AMBER BRANDING
// =============================================================================

export const SERVICE_LINE_INFO: Record<ServiceLineType, { name: string; icon: string; description: string }> = {
  brand: { 
    name: 'Brand Strategy', 
    icon: '🎯', 
    description: 'Brand positioning, identity, and strategic planning' 
  },
  digital: { 
    name: 'Digital Marketing', 
    icon: '📱', 
    description: 'Digital campaigns, SEO, paid media, and analytics' 
  },
  social: { 
    name: 'Social Media', 
    icon: '💬', 
    description: 'Social strategy, community management, and influencer partnerships' 
  },
  content: { 
    name: 'Content Production', 
    icon: '🎬', 
    description: 'Video, photography, copywriting, and creative assets' 
  },
  pr: { 
    name: 'Public Relations', 
    icon: '📰', 
    description: 'Media relations, press releases, and reputation management' 
  },
};

export const CLIENT_TYPE_INFO: Record<ClientType, { name: string; icon: string; budgetRange: string }> = {
  enterprise: { 
    name: 'Enterprise', 
    icon: '🏢', 
    budgetRange: '£80k - £200k' 
  },
  government: { 
    name: 'Government', 
    icon: '🏛️', 
    budgetRange: '£50k - £120k' 
  },
  startup: { 
    name: 'Startup', 
    icon: '🚀', 
    budgetRange: '£20k - £60k' 
  },
  nonprofit: { 
    name: 'Non-Profit', 
    icon: '💚', 
    budgetRange: '£15k - £40k' 
  },
};

export const EVENT_INFO: Record<EventType, { name: string; icon: string; description: string }> = {
  talentPoaching: {
    name: 'Talent Poaching',
    icon: '🎯',
    description: 'A competitor is aggressively recruiting your team. Staff costs increase.',
  },
  viralTrend: {
    name: 'Viral Trend',
    icon: '📈',
    description: 'A viral trend creates sudden demand for social campaigns.',
  },
  budgetCuts: {
    name: 'Budget Cuts',
    icon: '✂️',
    description: 'Economic uncertainty causes clients to reduce budgets.',
  },
  aiTools: {
    name: 'AI Tools Launch',
    icon: '🤖',
    description: 'New AI tools boost productivity for tech-invested agencies.',
  },
  industryAward: {
    name: 'Industry Award',
    icon: '🏆',
    description: 'Your recent work gains industry recognition.',
  },
  keyDeparture: {
    name: 'Key Staff Departure',
    icon: '👋',
    description: 'A senior team member leaves for a competitor.',
  },
  referralSurge: {
    name: 'Referral Surge',
    icon: '🤝',
    description: 'Happy clients are referring new business your way.',
  },
  economyTanks: {
    name: 'Economy Tanks',
    icon: '📉',
    description: 'Economic downturn - clients cut spending by 20%.',
  },
  aiBoom: {
    name: 'AI Boom',
    icon: '🚀',
    description: 'AI productivity gains mean clients have more marketing budget.',
  },
  teamExodus: {
    name: 'Team Exodus',
    icon: '🚪',
    description: 'Four team members leave to start their own agency, taking a client!',
  },
  clientGhosts: {
    name: 'Client Ghosts',
    icon: '👻',
    description: 'A new client has ghosted you - contracts were never signed.',
  },
  prAwards: {
    name: 'PR Industry Awards',
    icon: '🏅',
    description: 'Strong marketing pays off with industry recognition!',
  },
};

// =============================================================================
// AMBER BRAND COLOURS
// =============================================================================

export const AMBER_COLORS = {
  orange: '#f47836',
  yellow: '#fbaf34',
  amberBrown: '#982f20',
  amberRed: '#9a2d02',
  darkGrey: '#4d4d4f',
  midGrey: '#808285',
  lightGrey: '#b0b0b1',
} as const;

export const AMBER_GRADIENT = 'linear-gradient(to right, #982f20, #fbaf34)';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format currency for display - uses k for thousands, m for millions
 * @param value - Amount in pounds
 * @param showPence - Whether to show decimal places
 */
export function formatCurrency(value: number, showPence = false): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1000000) {
    // Millions: £1.2m
    const millions = absValue / 1000000;
    return `${sign}£${millions.toFixed(millions >= 10 ? 1 : 2).replace(/\.0+$/, '')}m`;
  } else if (absValue >= 1000) {
    // Thousands: £150k
    const thousands = absValue / 1000;
    return `${sign}£${thousands.toFixed(showPence ? 1 : 0)}k`;
  } else {
    // Under 1000: £500
    return `${sign}£${absValue.toFixed(showPence ? 2 : 0)}`;
  }
}
