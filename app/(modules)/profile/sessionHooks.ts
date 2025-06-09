import { useEffect, useState } from 'react';

export interface SessionInfo {
  userAgent: string;
  lastLogin: string;
}

export function useSessionInfo() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.user) {
          // Use browser info for userAgent
          const userAgent = navigator.userAgent;
          // Use local time for lastLogin (simulate for now)
          const lastLogin = new Date().toLocaleString();
          setSession({ userAgent, lastLogin });
        }
      } catch (err) {
        setSession(null);
      }
    }
    fetchSession();
  }, []);

  return session;
}
