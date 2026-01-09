import { TeamState, QuarterResult, Notification, GameEvent } from '../types';
/**
 * Generate notifications for a team based on their quarter results
 */
export declare function generateNotifications(team: TeamState, events: GameEvent[]): Notification[];
/**
 * Generate a compact quarterly summary notification
 */
export declare function generateQuarterSummary(team: TeamState, result: QuarterResult): Notification;
/**
 * Check and generate bankruptcy risk notification
 */
export declare function checkBankruptcyWarning(team: TeamState): Notification | null;
//# sourceMappingURL=notifications.d.ts.map