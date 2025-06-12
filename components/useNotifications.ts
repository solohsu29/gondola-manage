import { useEffect, useState } from 'react';

export type Notification = {
  id: string;
  type: string;
  message: string;
  date: string | Date;
  read: boolean;
  actionLink?: string;
};

export type NotificationPreferences = {
  certificateExpiry?: boolean;
  maintenanceReminders?: boolean;
  // Add more as needed
};

export function useNotifications(prefs?: NotificationPreferences) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        let notifs: Notification[] =
          data.notifications?.map((n: any) => ({
            ...n,
            date: n.date ? new Date(n.date) : new Date(),
          })) || [];
        // Filter according to preferences
        if (prefs) {
          notifs = notifs.filter(n => {
            if (n.type === 'warning' && prefs.certificateExpiry === false)
              return false;
            if (n.type === 'info' && prefs.maintenanceReminders === false)
              return false;
            // Add more rules as needed for other prefs
            return true;
          });
        }
        setNotifications(notifs);
      } catch {
        setNotifications([]);
      }
      setLoading(false);
    }
    fetchNotifications();
  }, [prefs]);

  return { notifications, loading };
}
