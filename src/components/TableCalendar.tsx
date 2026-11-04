import { useState, useMemo } from 'react';
import { EventItem } from '../data/mockEvents';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SelectedDate, getThaiMonthName } from '../lib/dateUtils';

interface TableCalendarProps {
  eventsMap: Record<string | number, EventItem[]>;
  onDayClick?: (date: SelectedDate) => void;
}

export function TableCalendar({ eventsMap, onDayClick }: TableCalendarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState<number | 'all'>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Convert map to sorted array of single events for display
  const allEvents = useMemo(() => {
    const arr: Array<{ day: number; month: number; year: number; event: EventItem }> = [];
    Object.keys(eventsMap).forEach(key => {
      const events = eventsMap[key] || [];
      if (key.includes('-')) {
        // Key is YYYY-MM-DD (Gregorian)
        const [y, m, d] = key.split('-').map(Number);
        const bYear = y < 2500 ? y + 543 : y;
        events.forEach(event => {
          arr.push({ day: d, month: m - 1, year: bYear, event });
        });
      } else {
        // Legacy Key is number (April 2569)
        const d = parseInt(key);
        events.forEach(event => {
          arr.push({ day: d, month: 3, year: 2569, event });
        });
      }
    });

    arr.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      const timeA = a.event.time || '23:59';
      const timeB = b.event.time || '23:59';
      return timeA.localeCompare(timeB);
    });
    return arr;
  }, [eventsMap]);

  // Handle Search Filter
  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return allEvents;
    const lowerSearch = searchTerm.toLowerCase();

    return allEvents.filter(item => {
      return (
        item.event.title.toLowerCase().includes(lowerSearch) ||
        (item.event.location || '').toLowerCase().includes(lowerSearch) ||
        (item.event.responsibles || '').toLowerCase().includes(lowerSearch) ||
        (item.event.department || '').toLowerCase().includes(lowerSearch) ||
        (item.event.workGroup || '').toLowerCase().includes(lowerSearch) ||
        (item.event.ownerId || '').toLowerCase().includes(lowerSearch) ||
        (item.event.time || '').toLowerCase().includes(lowerSearch)
      );
    });
  }, [allEvents, searchTerm]);

  // Handle Pagination
  const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredEvents.length / rowsPerPage);
  
  const displayedEvents = useMemo(() => {
    if (rowsPerPage === 'all') return filteredEvents;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredEvents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredEvents, currentPage, rowsPerPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      
      {/* Table Toolbar Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-colors text-slate-900 dark:text-slate-50 font-medium"
            placeholder="ค้นหากิจกรรม, สถานที่, ผู้รับผิดชอบ..."
            value={searchTerm}
            onChange={(e) => {
               setSearchTerm(e.target.value);
               setCurrentPage(1); // Reset to page 1 on search
            }}
          />
        </div>

        {/* Rows per page selector */}
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
          <span>แสดง</span>
          <select
            className="border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 px-2 py-1.5 focus:outline-none focus:border-[#6366f1] text-slate-900 dark:text-slate-50 text-xs font-bold cursor-pointer"
            value={rowsPerPage}
            onChange={(e) => {
              const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
              setRowsPerPage(val);
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">ทั้งหมด</option>
          </select>
          <span>รายการ</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">วันที่</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">เวลา</th>
                <th className="px-4 py-3 font-medium w-full min-w-[200px]">ชื่อกิจกรรม</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">สถานที่</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">ผู้รับผิดชอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {displayedEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400 text-[14.5px]">
                    {searchTerm ? `ไม่พบกิจกรรมที่ตรงกับคำค้นหา "${searchTerm}"` : 'ไม่มีกิจกรรมในระบบ'}
                  </td>
                </tr>
              ) : (
                displayedEvents.map((item, idx) => {
                  const rowBgClass = 
                    item.event.type === 'urgent' ? 'bg-[#f43f5e]/5 hover:bg-[#f43f5e]/10 dark:bg-[#f43f5e]/10 dark:hover:bg-[#f43f5e]/20' : 
                    item.event.type === 'medium' ? 'bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10 dark:bg-[#f59e0b]/10 dark:hover:bg-[#f59e0b]/20' : 
                    item.event.type === 'info' ? 'bg-[#6366f1]/5 hover:bg-[#6366f1]/10 dark:bg-[#6366f1]/10 dark:hover:bg-[#6366f1]/20' : 
                    'bg-[#22c55e]/5 hover:bg-[#22c55e]/10 dark:bg-[#22c55e]/10 dark:hover:bg-[#22c55e]/20';

                  return (
                    <tr 
                      key={`${item.event.id}-${idx}`} 
                      onClick={() => onDayClick && onDayClick({ day: item.day, month: item.month, year: item.year, selectedEventId: item.event.id })}
                      className={`cursor-pointer transition-colors border-b border-white/50 dark:border-slate-800 ${rowBgClass}`}
                    >
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-50 whitespace-nowrap">
                         {item.day} {getThaiMonthName(item.month).substring(0, 4)}. {item.year}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                         {item.event.time || 'ตลอดวัน'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
                         <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${item.event.type === 'urgent' ? 'bg-[#f43f5e]' : item.event.type === 'medium' ? 'bg-[#f59e0b]' : item.event.type === 'info' ? 'bg-[#6366f1]' : 'bg-[#22c55e]'}`}></span>
                         {item.event.title}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                         {item.event.location || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap text-[13px]">
                         <span className="bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                            {item.event.ownerId}
                          </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {rowsPerPage !== 'all' && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              แสดง {(currentPage - 1) * rowsPerPage + 1} ถึง {Math.min(currentPage * rowsPerPage, filteredEvents.length)} จาก {filteredEvents.length} รายการ
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 dark:text-slate-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 dark:text-slate-400"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
