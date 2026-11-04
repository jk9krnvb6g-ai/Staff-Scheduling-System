import { useEffect, useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { db, collection, query, where, onSnapshot } from '../lib/firebase';

interface PresenceData {
  id: string;
  displayName: string;
  isOnline: boolean;
  department: string;
  workGroup: string;
  lastSeen: any;
}

export function OnlineUsersModal({ onClose, userWorkGroup, userDepartment }: { onClose: () => void, userWorkGroup: string, userDepartment: string }) {
  const [users, setUsers] = useState<PresenceData[]>([]);

  useEffect(() => {
    // We query by workGroup to avoid needing a composite index
    const q = query(
      collection(db, 'presence'),
      where('workGroup', '==', userWorkGroup)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const activeUsers: PresenceData[] = [];
      
      snap.forEach(doc => {
         const data = doc.data() as Omit<PresenceData, 'id'>;
         
         if (data.department === userDepartment && data.isOnline) {
             // Treat > 5 minutes old as offline
             const now = new Date().getTime();
             const lastSeen = data.lastSeen?.toMillis() || 0;
             const diffMinutes = (now - lastSeen) / 60000;
             
             if (diffMinutes <= 5) {
                activeUsers.push({ id: doc.id, ...data });
             }
         }
      });
      
      setUsers(activeUsers);
    });

    return () => unsubscribe();
  }, [userWorkGroup, userDepartment]);

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#22c55e]" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">ผู้ออนไลน์ ({users.length})</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {users.length === 0 ? (
             <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                ไม่มีผู้ออนไลน์ในกลุ่มงานของคุณ
             </div>
          ) : (
             <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                           {u.displayName.charAt(0)}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22c55e] border-2 border-white dark:border-slate-800 rounded-full"></span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-50 text-[14px]">{u.displayName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{u.workGroup}</div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
