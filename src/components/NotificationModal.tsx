import { X, Bell, Pin, Clock, Hourglass, Calendar as CalendarIcon, History } from 'lucide-react';
import { useState, useMemo } from 'react';
import { EventItem } from '../data/mockEvents';

interface NotificationModalProps {
  onClose: () => void;
  eventsMap?: Record<string | number, EventItem[]>;
}

export function NotificationModal({ onClose, eventsMap = {} }: NotificationModalProps) {
  const [activeTab, setActiveTab] = useState('today');

  const tabs = [
    { id: 'today', label: 'วันนี้ (กำลังจัด)', icon: <Pin className="w-3.5 h-3.5 text-[#f43f5e]" fill="#f43f5e" /> },
    { id: '7days', label: 'ภายใน 7 วัน', icon: <Hourglass className="w-3.5 h-3.5 text-[#eab308]" fill="#eab308" /> },
    { id: 'overdue', label: 'เลยกำหนด', icon: <Hourglass className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> },
  ];

  // Helper to safely format Date to standard Thai date string
  const formatThaiDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('th-TH', { month: 'long' });
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const notifications = useMemo(() => {
    const parsedEvents: {
      title: string;
      date: string;
      time: string;
      priority: string;
      type: 'today' | '7days' | 'overdue';
      rawDate: Date;
    }[] = [];

    const todayRef = new Date();
    // Normalize today to Midnight for accurate relative comparisons
    const todayMidnight = new Date(todayRef.getFullYear(), todayRef.getMonth(), todayRef.getDate());
    const todayTime = todayMidnight.getTime();
    const oneDayMs = 24 * 3600 * 1000;

    Object.entries(eventsMap).forEach(([key, events]) => {
      if (!Array.isArray(events)) return;

      let dateObj: Date | null = null;
      if (typeof key === 'string' && key.includes('-')) {
        const parts = key.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            dateObj = new Date(y, m, d);
          }
        }
      } else {
        const dayNum = parseInt(key, 10);
        if (!isNaN(dayNum)) {
          // Fallback to April 2026 for legacy mock items
          dateObj = new Date(2026, 3, dayNum);
        }
      }

      if (!dateObj || isNaN(dateObj.getTime())) return;

      const eventTime = dateObj.getTime();
      let type: 'today' | '7days' | 'overdue' | null = null;

      if (eventTime === todayTime) {
        type = 'today';
      } else if (eventTime > todayTime && eventTime <= todayTime + (7 * oneDayMs)) {
        type = '7days';
      } else if (eventTime < todayTime) {
        // Only list past events within the last 14 days so we show the most recent past ones
        if (eventTime >= todayTime - (14 * oneDayMs)) {
          type = 'overdue';
        }
      }

      if (!type) return;

      events.forEach((evt) => {
        let priority = 'ปกติ';
        if (evt.type === 'urgent') priority = 'สำคัญมาก';
        else if (evt.type === 'medium') priority = 'สำคัญปานกลาง';
        else if (evt.type === 'info') priority = 'ทั่วไป / ข้อมูล';

        parsedEvents.push({
          title: evt.title,
          date: formatThaiDate(dateObj!),
          time: evt.time || 'ตลอดวัน',
          priority,
          type,
          rawDate: dateObj!,
        });
      });
    });

    // Filter by active tab
    const filtered = parsedEvents.filter((item) => item.type === activeTab);

    // Sort based on tab criteria
    if (activeTab === 'today') {
      return filtered.sort((a, b) => a.time.localeCompare(b.time));
    } else if (activeTab === '7days') {
      return filtered.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    } else {
      return filtered.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    }
  }, [eventsMap, activeTab]);

  // Map priority to badge styling
  const getBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'สำคัญมาก': return 'bg-[#fee2e2] text-[#ef4444]'; // Red
      case 'สำคัญปานกลาง': return 'bg-[#fef9c3] text-[#ca8a04]'; // Yellow
      case 'ปกติ': return 'bg-[#dcfce7] text-[#16a34a]'; // Green
      case 'ทั่วไป / ข้อมูล': return 'bg-[#e0e7ff] text-[#4f46e5]'; // Purple / Blue Info badge
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end p-4 pt-[76px] sm:pr-8 animate-in fade-in duration-200 pointer-events-none">
      {/* Click outside overlay */}
      <div className="fixed inset-0 pointer-events-auto" onClick={onClose} />
      
      <div 
        className="bg-slate-50 dark:bg-slate-900 rounded-xl w-full max-w-[400px] h-fit max-h-[80vh] shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-200 border border-slate-200 dark:border-slate-700 pointer-events-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h3 className="text-[15px] font-bold flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
            <Bell className="w-4 h-4 text-[#ef4444]" fill="#ef4444" />
            แจ้งเตือนกิจกรรมใกล้ถึงกำหนด
          </h3>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors p-1">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden px-4 pb-4 pt-3 gap-3">
           {/* Tabs */}
           <div className="flex items-center w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shrink-0">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[13px] font-bold transition-all ${
                   activeTab === tab.id 
                     ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                 }`}
               >
                 {activeTab === tab.id && tab.icon}
                 {tab.label}
               </button>
             ))}
           </div>

           {/* List */}
           <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400">
                   <History className="w-8 h-8 mb-2 opacity-50" />
                   <p className="text-[14.5px] font-medium">ไม่มีกิจกรรมในหมวดหมู่นี้</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                         <History className="w-[16px] h-[16px]" strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-slate-100 mb-1">{notif.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium"><CalendarIcon className="w-3.5 h-3.5" /> {notif.date}</span>
                          <span className="flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5" /> {notif.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pl-2">
                       <span className={`px-2.5 py-1 whitespace-nowrap rounded-md text-[11px] font-bold ${getBadgeStyle(notif.priority)}`}>
                         {notif.priority}
                       </span>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
