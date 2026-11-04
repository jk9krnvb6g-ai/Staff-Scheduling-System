import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, setDoc, serverTimestamp } from '../lib/firebase';

export function PresenceTracker() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || profile?.status !== 'active') return;

    const presenceRef = doc(db, 'presence', user.uid);
    
    // Set presence initially
    const setPresence = async () => {
      try {
        await setDoc(presenceRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
          displayName: profile.displayName || user.email,
          workGroup: profile.workGroup,
          department: profile.department
        });
      } catch (e) {
        console.error('Error setting presence:', e);
      }
    };
    
    setPresence();

    // Setup heartbeat interval (e.g. every minute) to keep lastSeen fresh
    // Instead of interval, maybe just beforeunload
    const handleBeforeUnload = async () => {
      // Best effort offline status
      try {
        // Can't guarantee this fires, but we try
        await setDoc(presenceRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
          displayName: profile.displayName || user.email,
          workGroup: profile.workGroup,
          department: profile.department
        });
      } catch (e) {
        // Ignore
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Heartbeat every 2 minutes
    const interval = setInterval(setPresence, 120000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
      // Try to set offline on unmount
      handleBeforeUnload();
    };
  }, [user, profile]);

  return null;
}
