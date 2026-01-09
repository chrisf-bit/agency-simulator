// client/src/components/Tabs/Notifications.tsx
// Notifications tab - Dark theme

import { Notification, GameEvent, EVENT_INFO } from '../../types';

interface NotificationsTabProps {
  notifications: Notification[];
  activeEvents: GameEvent[];
  currentQuarter: number;
}

export default function NotificationsTab({ notifications, activeEvents, currentQuarter }: NotificationsTabProps) {
  const recentNotifications = notifications.filter(n => n.quarter >= currentQuarter - 2);
  const activeEventsList = activeEvents.filter(e => e.active);

  return (
    <div className="space-y-4">
      {/* Active Events */}
      {activeEventsList.length > 0 && (
        <div className="rounded-lg p-4 border bg-cyan-500/20 border-cyan-500">
          <h3 className="text-sm font-bold mb-3 text-cyan-400">📢 Active Events</h3>
          <div className="space-y-2">
            {activeEventsList.map((event, idx) => {
              const info = EVENT_INFO?.[event.type] || { icon: '📌', name: event.type, description: event.description };
              return (
                <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{info.icon}</span>
                    <span className="font-medium text-white">{info.name}</span>
                    <span className="text-white/60 ml-auto">{event.duration} quarters left</span>
                  </div>
                  <p className="text-white/70 mt-2 text-sm">{info.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-sm font-bold mb-3 text-cyan-400">🔔 Recent Updates</h3>
        {recentNotifications.length === 0 ? (
          <p className="text-white/60 text-sm">No recent notifications</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentNotifications.slice().reverse().map((notif, idx) => (
              <div key={idx} className={`rounded-lg p-3 border ${
                notif.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                notif.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                notif.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                'bg-white/5 border-white/10 text-white/80'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm">Q{notif.quarter}</span>
                  <span>{notif.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
