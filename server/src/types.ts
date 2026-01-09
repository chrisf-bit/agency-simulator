// server/src/types.ts
// Shared types for Agency Leadership simulation

import { SeededRandom } from './utils/randomSeed';

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

export type GameLevel = 1 | 2 | 3;

export interface GameConfig {
  gameId: string;
  gameName: string;
  level: GameLevel;
  numberOfTeams: number;
  maxQuarters: number;
  randomSeed: number;
  events: EventConfig;
  testMode: boolean; // NEW: Single team test mode
}

export interface EventConfig {
  enabled: boolean;
  frequency: number; // 0-1, chance per quarter
  maxConcurrent: number;
}

// =============================================================================
// CLIENT / OPPORTUNITY TYPES
// =============================================================================

export type ServiceLine = 'digital' | 'brand' | 'social' | 'content' | 'pr';
export type ClientType = 'startup' | 'enterprise' | 'nonprofit' | 'government';
export type Complexity = 'low' | 'medium' | 'high';
export type Deadline = 'normal' | 'urgent';
export type QualityLevel = 'budget' | 'standard' | 'premium';

// NEW: Client retention status
export type ClientStatus = 'active' | 'notice_given' | 'renewing';

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
  // For existing client project opportunities
  isExistingClientProject?: boolean;
  existingClientId?: string;
  existingClientSatisfaction?: number;
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
  // NEW: Retention tracking
  status: ClientStatus;
  satisfactionLevel: number; // 0-100, tracks cumulative satisfaction
  noticeQuarter?: number; // Quarter when notice was given
}

// =============================================================================
// TEAM STATE
// =============================================================================

export interface TeamState {
  teamId: string;
  companyName: string; // Will be "Team 1", "Team 2", etc.
  teamNumber: number; // NEW: Numeric team identifier
  quarter: number;
  
  // Financials
  cash: number;
  cumulativeProfit: number;
  
  // Staff & Capacity
  staff: number;
  burnout: number; // 0-100
  
  // Reputation & Market
  reputation: number; // 0-100
  marketPresence: number; // 0-100
  
  // Capabilities (1-5 scale)
  techLevel: number;
  trainingLevel: number;
  processLevel: number;
  
  // Clients
  clients: ActiveClient[];
  
  // Game state
  isBankrupt: boolean;
  submittedThisQuarter: boolean;
  currentInputs: TeamInputs;
  
  // History
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
  clientsChurned: number; // NEW: Clients who left due to low satisfaction
  clientsRenewed: number; // NEW: Clients who renewed
  staffChange: number;
  reputationChange: number;
  burnoutChange: number;
  utilizationRate: number;
  hoursDelivered: number;
  hoursCapacity: number;
}

// =============================================================================
// TEAM INPUTS (Decisions)
// =============================================================================

export interface PitchDecision {
  opportunityId: string;
  discountPercent: number; // 0-50
  qualityLevel: QualityLevel; // NEW: Per-pitch quality level
}

export interface TeamInputs {
  pitches: PitchDecision[];
  // REMOVED: global qualityLevel - now per-pitch
  techInvestment: number;
  trainingInvestment: number;
  marketingSpend: number;
  hiringCount: number;
  firingCount: number;
  wellbeingSpend: number;
  // NEW: Client satisfaction investment (£0-100k)
  clientSatisfactionSpend: number;
  // NEW: Growth Focus slider (0 = existing clients/projects, 100 = new clients)
  growthFocus: number; // 0-100
}

// =============================================================================
// EVENTS
// =============================================================================

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

export interface GameEvent {
  type: EventType;
  quarter: number;
  duration: number;
  active: boolean;
  description: string;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'event';

export interface Notification {
  id: string;
  quarter: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

// =============================================================================
// LEADERBOARD
// =============================================================================

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  companyName: string;
  teamNumber: number;
  cumulativeProfit: number;
  reputation: number;
  clients: number;
  clientCount: number; // Alias for clients
  cash: number;
  burnout: number;
  staff: number;
  isBankrupt: boolean;
  totalScore: number;
}

// =============================================================================
// GAME STATE (for repository)
// =============================================================================

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

// =============================================================================
// SOCKET EVENTS
// =============================================================================

export interface ServerToClientEvents {
  gameCreated: (gameId: string) => void;
  teamJoined: (data: { teamId: string; companyName: string; teamNumber: number }) => void;
  inputsSubmitted: (teamId?: string) => void;
  allTeamsSubmitted: () => void;
  quarterStarted: (quarter: number, brief: string, events: GameEvent[], opportunities: ClientOpportunity[]) => void;
  resultsReady: (teamState: TeamState, notifications: Notification[]) => void;
  gameEnded: (leaderboard: LeaderboardEntry[]) => void;
  opportunitiesGenerated: (opportunities: ClientOpportunity[]) => void;
  error: (message: string) => void;
  forceRefresh: () => void;
  gameRestored: () => void;
  // NEW: Test mode events
  testModeAdvanced: (quarter: number) => void;
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
  // NEW: Test mode direct join
  joinTestMode: (callback: (response: any) => void) => void;
}
