// server/src/game/notifications.ts
// Notification generation for Agency Leadership

import { TeamState, GameEvent, Notification, NotificationType } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate notifications for a team based on their quarter results
 */
export function generateNotifications(
  team: TeamState,
  events: GameEvent[]
): Notification[] {
  const notifications: Notification[] = [];
  const quarter = team.quarter;
  const latestResult = team.quarterlyResults[team.quarterlyResults.length - 1];

  if (!latestResult) {
    return notifications;
  }

  // Profit/Loss notification
  if (latestResult.profit > 0) {
    notifications.push(createNotification(
      quarter,
      'success',
      'Profitable Quarter',
      `Great work! You made £${(latestResult.profit / 1000).toFixed(0)}k profit this quarter.`
    ));
  } else if (latestResult.profit < 0) {
    notifications.push(createNotification(
      quarter,
      'warning',
      'Loss This Quarter',
      `You lost £${(Math.abs(latestResult.profit) / 1000).toFixed(0)}k this quarter. Review your costs.`
    ));
  }

  // Clients won
  if (latestResult.clientsWon > 0) {
    notifications.push(createNotification(
      quarter,
      'success',
      'New Clients',
      `You won ${latestResult.clientsWon} new client${latestResult.clientsWon > 1 ? 's' : ''} this quarter!`
    ));
  }

  // Clients churned
  if (latestResult.clientsChurned > 0) {
    notifications.push(createNotification(
      quarter,
      'warning',
      'Client Departures',
      `${latestResult.clientsChurned} client${latestResult.clientsChurned > 1 ? 's' : ''} left due to low satisfaction.`
    ));
  }

  // Clients renewed
  if (latestResult.clientsRenewed > 0) {
    notifications.push(createNotification(
      quarter,
      'success',
      'Contract Renewals',
      `${latestResult.clientsRenewed} client${latestResult.clientsRenewed > 1 ? 's' : ''} renewed their contract!`
    ));
  }

  // Utilization warnings
  if (latestResult.utilizationRate > 1.3) {
    notifications.push(createNotification(
      quarter,
      'error',
      'Severe Overwork',
      `Your team is at ${Math.round(latestResult.utilizationRate * 100)}% utilization. Burnout is rising fast!`
    ));
  } else if (latestResult.utilizationRate > 1.1) {
    notifications.push(createNotification(
      quarter,
      'warning',
      'Team Stretched',
      `Your team is at ${Math.round(latestResult.utilizationRate * 100)}% utilization. Consider hiring.`
    ));
  } else if (latestResult.utilizationRate < 0.5) {
    notifications.push(createNotification(
      quarter,
      'warning',
      'Underutilized',
      `Your team is only at ${Math.round(latestResult.utilizationRate * 100)}% utilization. Win more work!`
    ));
  }

  // Burnout alerts
  if (team.burnout > 70) {
    notifications.push(createNotification(
      quarter,
      'error',
      'High Burnout',
      `Team burnout is at ${Math.round(team.burnout)}%. Invest in wellbeing or risk losing staff.`
    ));
  } else if (team.burnout > 50) {
    notifications.push(createNotification(
      quarter,
      'warning',
      'Rising Burnout',
      `Team burnout is at ${Math.round(team.burnout)}%. Consider wellbeing investment.`
    ));
  }

  // Reputation changes
  if (latestResult.reputationChange > 5) {
    notifications.push(createNotification(
      quarter,
      'success',
      'Reputation Growing',
      `Your reputation increased by ${latestResult.reputationChange} points!`
    ));
  } else if (latestResult.reputationChange < -5) {
    notifications.push(createNotification(
      quarter,
      'warning',
      'Reputation Declining',
      `Your reputation dropped by ${Math.abs(latestResult.reputationChange)} points.`
    ));
  }

  // Cash warnings
  if (team.cash < 50000 && team.cash > 0) {
    notifications.push(createNotification(
      quarter,
      'error',
      'Low Cash',
      `Only £${(team.cash / 1000).toFixed(0)}k remaining. Watch your spending!`
    ));
  }

  // Bankruptcy
  if (team.isBankrupt) {
    notifications.push(createNotification(
      quarter,
      'error',
      'Bankrupt',
      `Your agency has run out of cash and is now bankrupt.`
    ));
  }

  // Event notifications
  const activeEvents = events.filter(e => e.active);
  for (const event of activeEvents) {
    if (event.quarter === quarter) {
      notifications.push(createNotification(
        quarter,
        'event',
        getEventTitle(event.type),
        event.description
      ));
    }
  }

  // Clients at risk
  const atRiskClients = team.clients.filter(c => 
    c.status === 'notice_given' || (c.satisfactionLevel && c.satisfactionLevel < 40)
  );
  if (atRiskClients.length > 0) {
    notifications.push(createNotification(
      quarter,
      'warning',
      'Clients At Risk',
      `${atRiskClients.length} client${atRiskClients.length > 1 ? 's are' : ' is'} unhappy. Invest in client satisfaction!`
    ));
  }

  return notifications;
}

function createNotification(
  quarter: number,
  type: NotificationType,
  title: string,
  message: string
): Notification {
  return {
    id: uuidv4().slice(0, 8),
    quarter,
    type,
    title,
    message,
    timestamp: Date.now(),
  };
}

function getEventTitle(type: string): string {
  const titles: Record<string, string> = {
    talentPoaching: '🎯 Talent Poaching',
    viralTrend: '📈 Viral Trend',
    budgetCuts: '✂️ Budget Cuts',
    aiTools: '🤖 AI Tools Launch',
    industryAward: '🏆 Industry Award',
    keyDeparture: '👋 Key Departure',
    referralSurge: '🤝 Referral Surge',
  };
  return titles[type] || 'Market Event';
}
