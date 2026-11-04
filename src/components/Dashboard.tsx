import { useState, useMemo, useEffect } from 'react';
import { EventItem } from '../data/mockEvents';
import { 
  TrendingUp, 
  AlertTriangle, 
  Briefcase, 
  Clock, 
  Activity, 
  Users, 
  Building, 
  MapPin, 
  CheckCircle2, 
  Printer, 
  User, 
  Calendar, 
  Filter, 
  ShieldAlert,
  AlertCircle,
  Download,
  X,
  ArrowLeft
} from 'lucide-react';

interface DashboardProps {
  eventsMap: Record<string | number, EventItem[]>;
  onClose?: () => void;
}

export function Dashboard({ eventsMap }: DashboardProps) {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');

  // Period filter states
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Interactive Popup States
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [selectedMonthPriorityFilter, setSelectedMonthPriorityFilter] = useState<'urgent' | 'not_urgent' | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedDetailedEvent, setSelectedDetailedEvent] = useState<any | null>(null);
  const [selectedGroupDetailed, setSelectedGroupDetailed] = useState<string | null>(null);
  const [selectedUnitDetailed, setSelectedUnitDetailed] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Automatically open print modal and trigger print if print=true is specified in the URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('print') === 'true') {
        setShowPrintModal(true);
        // Delay print dialog call so charts has enough time to render beautifully
        const timer = setTimeout(() => {
          try {
            window.print();
          } catch (e) {
            console.error("Auto print failed:", e);
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Load registered users and presence from LocalStorage dynamically
  const usersData = useMemo(() => {
    try {
      const u = localStorage.getItem('mock_users');
      return u ? JSON.parse(u) : [];
    } catch {
      return [];
    }
  }, []);

  const presenceData = useMemo(() => {
    try {
      const p = localStorage.getItem('mock_presence');
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  }, []);

  // 1. Flatten all events from eventsMap
  const allEvents = useMemo(() => {
    const list: Array<EventItem & { dateKey: string; formattedDate: string; parsedYear: number; parsedMonth: number; parsedDay: number }> = [];
    
    Object.entries(eventsMap).forEach(([key, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          let formattedDate = '';
          let year = 2569;
          let month = 3; // April
          let day = 1;

          if (key.includes('-')) {
            // YYYY-MM-DD
            const parts = key.split('-');
            const gYear = parseInt(parts[0], 10);
            year = gYear < 2500 ? gYear + 543 : gYear;
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
          } else {
            // Fallback key as day number
            day = parseInt(key, 10) || 1;
          }

          const thMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
          ];
          formattedDate = `${day} ${thMonths[month]} ${year}`;

          list.push({
            ...item,
            dateKey: key,
            formattedDate,
            parsedYear: year,
            parsedMonth: month,
            parsedDay: day
          });
        });
      }
    });

    // Sort events by estimated chronological order
    return list.sort((a, b) => {
      if (a.parsedYear !== b.parsedYear) return a.parsedYear - b.parsedYear;
      if (a.parsedMonth !== b.parsedMonth) return a.parsedMonth - b.parsedMonth;
      return a.parsedDay - b.parsedDay;
    });
  }, [eventsMap]);

  // Extract dynamically unique departments and priorities of all events for filter dropdowns
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    allEvents.forEach(e => {
      if (e.department && e.department.trim()) {
        depts.add(e.department.trim());
      }
    });
    return Array.from(depts);
  }, [allEvents]);

  // Filtered Events with Period selection
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      // 1. Department Filter
      const matchDept = selectedDeptFilter === 'all' || e.department?.trim() === selectedDeptFilter;
      
      // 2. Priority Filter
      const matchPriority = selectedPriorityFilter === 'all' || e.type === selectedPriorityFilter;

      // 3. Period Filter
      let matchPeriod = true;
      const eventJSDate = new Date(e.parsedYear > 2400 ? e.parsedYear - 543 : e.parsedYear, e.parsedMonth, e.parsedDay);

      if (periodPreset === 'today') {
        matchPeriod = eventJSDate.getFullYear() === 2026 && 
                      eventJSDate.getMonth() === 5 && // June
                      eventJSDate.getDate() === 10;
      } else if (periodPreset === 'thisWeek') {
        const startOfWeek = new Date(2026, 5, 8); // Monday June 8, 2026
        const endOfWeek = new Date(2026, 5, 14);  // Sunday June 14, 2026
        matchPeriod = eventJSDate >= startOfWeek && eventJSDate <= endOfWeek;
      } else if (periodPreset === 'thisMonth') {
        matchPeriod = eventJSDate.getFullYear() === 2026 && eventJSDate.getMonth() === 5; // June 2026
      } else if (periodPreset === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (eventJSDate < start) matchPeriod = false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (eventJSDate > end) matchPeriod = false;
        }
      }

      return matchDept && matchPriority && matchPeriod;
    });
  }, [allEvents, selectedDeptFilter, selectedPriorityFilter, periodPreset, customStartDate, customEndDate]);

  // 2. Metrics Calculations
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    let urgent = 0;
    let medium = 0;
    let normal = 0;
    let info = 0;
    
    const deptCounts: Record<string, number> = {};

    filteredEvents.forEach(e => {
      // Priority counts
      if (e.type === 'urgent') urgent++;
      else if (e.type === 'medium') medium++;
      else if (e.type === 'normal') normal++;
      else if (e.type === 'info') info++;

      // Department counts
      const d = e.department?.trim() || 'ไม่ระบุฝ่าย';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const sortedDepts = Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      urgent,
      medium,
      normal,
      info,
      sortedDepts
    };
  }, [filteredEvents]);

  // Registered staff metrics
  const staffMetrics = useMemo(() => {
    const totalStaff = usersData.length;
    const pendingStaff = usersData.filter((u: any) => u.status === 'pending').length;
    const activeStaff = usersData.filter((u: any) => u.status === 'active').length;
    const onlineCount = presenceData.length;

    return {
      totalStaff,
      pendingStaff,
      activeStaff,
      onlineCount
    };
  }, [usersData, presenceData]);

  // Dynamic Work Group and Unit/Department proportions calculation
  const groupAndUnitStats = useMemo(() => {
    const groupCounts: Record<string, number> = {};
    const unitCounts: Record<string, number> = {};

    allEvents.forEach(e => {
      // Group counts
      const groupName = e.workGroup?.trim() || 'ไม่ระบุกลุ่มงาน';
      groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;

      // Unit counts
      const unitName = e.department?.trim() || 'ไม่ระบุหน่วยงาน';
      unitCounts[unitName] = (unitCounts[unitName] || 0) + 1;
    });

    const sortedGroups = Object.entries(groupCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const sortedUnits = Object.entries(unitCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      sortedGroups,
      sortedUnits
    };
  }, [allEvents]);

  // 3. Dynamic Monthly Distribution (For SVG bar chart)
  const monthlyStatsList = useMemo(() => {
    const monthsThai = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const distribution = Array(12).fill(0).map((_, i) => ({
      monthName: monthsThai[i],
      count: 0,
      urgent: 0,
      other: 0
    }));

    filteredEvents.forEach(e => {
      const mIdx = e.parsedMonth;
      if (mIdx >= 0 && mIdx < 12) {
        distribution[mIdx].count++;
        if (e.type === 'urgent') {
          distribution[mIdx].urgent++;
        } else {
          distribution[mIdx].other++;
        }
      }
    });

    return distribution;
  }, [filteredEvents]);

  const maxMonthCount = useMemo(() => {
    const counts = monthlyStatsList.map(m => m.count);
    const max = Math.max(...counts);
    return max > 0 ? max : 5;
  }, [monthlyStatsList]);

  // Derived lists for popup modals
  const thMonthsLong = useMemo(() => [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ], []);

  const monthEventsList = useMemo(() => {
    if (selectedMonthIndex === null) return [];
    let list = filteredEvents.filter(e => e.parsedMonth === selectedMonthIndex);
    if (selectedMonthPriorityFilter === 'urgent') {
      list = list.filter(e => e.type === 'urgent');
    } else if (selectedMonthPriorityFilter === 'not_urgent') {
      list = list.filter(e => e.type !== 'urgent');
    }
    return list;
  }, [filteredEvents, selectedMonthIndex, selectedMonthPriorityFilter]);

  const priorityEventsList = useMemo(() => {
    if (selectedPriority === null) return [];
    if (selectedPriority === 'not_urgent') {
      return filteredEvents.filter(e => e.type !== 'urgent');
    }
    return filteredEvents.filter(e => e.type === selectedPriority);
  }, [filteredEvents, selectedPriority]);

  const groupEventsList = useMemo(() => {
    if (selectedGroupDetailed === null) return [];
    return filteredEvents.filter(e => {
      const groupName = e.workGroup?.trim() || 'ไม่ระบุกลุ่มงาน';
      return groupName === selectedGroupDetailed;
    });
  }, [filteredEvents, selectedGroupDetailed]);

  const unitEventsList = useMemo(() => {
    if (selectedUnitDetailed === null) return [];
    return filteredEvents.filter(e => {
      const unitName = e.department?.trim() || 'ไม่ระบุหน่วยงาน';
      return unitName === selectedUnitDetailed;
    });
  }, [filteredEvents, selectedUnitDetailed]);

  const triggerPrintPopup = () => {
    if (typeof window !== "undefined") {
      try {
        const printContent = document.getElementById('printable-report-area')?.innerHTML;
        const printWindow = window.open('', '_blank');
        if (printWindow && printContent) {
          printWindow.document.write('<html><head><title>รายงานสถิติสรุปงานประจำ</title>');
          
          // Google Fonts for elegant Thai typography
          printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">');
          
          // Copy all activestylesheets/styles from parent window
          const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
          styles.forEach(el => {
            printWindow.document.write(el.outerHTML);
          });
          
          // Print-specific overrides
          printWindow.document.write(`
            <style>
              body {
                font-family: "Sarabun", "Inter", sans-serif !important;
                background-color: #ffffff;
                color: #000000;
                margin: 0;
                padding: 10mm;
              }
              #printable-report-area {
                max-width: 100% !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                display: block !important;
                background: white !important;
                color: black !important;
              }
              .print-modal-web-controls {
                display: none !important;
              }
              @media print {
                body, html {
                  background: white !important;
                  color: black !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                #printable-report-area {
                  padding: 10mm !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  border: none !important;
                  box-shadow: none !important;
                }
              }
            </style>
          `);
          
          printWindow.document.write('</head><body>');
          printWindow.document.write('<div id="printable-report-area">' + printContent + '</div>');
          
          // Script to trigger print and close after dialog ends
          printWindow.document.write(`
            <script>
              window.onload = function() {
                setTimeout(function() {
                  try {
                    window.print();
                    // Safari and chrome handle print dialog asynchronously block
                    setTimeout(function() {
                      window.close();
                    }, 300);
                  } catch (e) {
                    console.error("Print failed:", e);
                  }
                }, 1000);
              };
            <\/script>
          `);
          
          printWindow.document.write('</body></html>');
          printWindow.document.close();
        } else {
          window.print();
        }
      } catch (e) {
        console.error("Popup print block, falling back:", e);
        try {
          window.print();
        } catch (err) {
          alert("เบราว์เซอร์ของคุณบล็อกการเปิดหน้าต่างพิมพ์ กรุณาอนุญาตบล็อกป๊อปอัพก่อนทำการพิมพ์ หรือเปิดหน้าหลักในแท็บใหม่");
        }
      }
    }
  };

  // Handle printing specifically designed for executive meeting summaries
  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-2 sm:mt-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Dashboard Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-white/5 shadow-xl mb-6 relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-slate-900 print:mb-4">
        {/* Abstract design elements overlay */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none print:hidden"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none print:hidden"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#6366f1]/20 dark:bg-[#6366f1]/30 border border-[#6366f1]/30 text-[#818cf8] px-3.5 py-1 rounded-full text-xs font-bold mb-3 print:hidden">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>ภาพรวมระดับผู้บริหาร (Executive Dashboard)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
              ระบบวิเคราะห์ข้อมูลและการควบคุมงานภายในหน่วยงาน
            </h1>
            <p className="text-[13.5px] sm:text-sm text-slate-350 mt-1.5 font-medium print:text-slate-600">
              รายงานสถิติ แผนงาน และสัมประสิทธิ์การขับเคลื่อนกิจกรรม เพื่อนำเสนอคณะผู้บริหารและหัวหน้ากลุ่มงาน
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/5 border border-white/15 hover:border-white/20 text-white text-[13.5px] font-bold rounded-xl transition-all shadow-md shrink-0"
            >
              <Printer className="w-4 h-4 text-slate-350" />
              <span>พิมพ์รายงานสรุปผล</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Interactive Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80 rounded-2xl p-4.5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
            <Filter className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150">ตัวกรองวิเคราะห์ข้อมูล</h3>
            <p className="text-[11.5px] text-slate-500">กรองข้อมูลในตารางสถิติและกราฟด้านล่าง</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/60 px-3 py-1.5 rounded-lg w-full sm:w-[220px]">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full bg-transparent text-[13px] text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกฝ่าย / ทุกกลุ่มงาน</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/60 px-3 py-1.5 rounded-lg w-full sm:w-[180px]">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="w-full bg-transparent text-[13px] text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">ระดับความสำคัญทั้งหมด</option>
              <option value="urgent">🔴 เร่งด่วน / วิกฤต</option>
              <option value="medium">🟠 สำคัญมาก</option>
              <option value="normal">🔵 ทั่วไป / ปกติ</option>
              <option value="info">🟢 ข้อมูลประชาสัมพันธ์</option>
            </select>
          </div>

          {/* Period Filter (ช่วงเวลา) */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/60 px-3 py-1.5 rounded-lg w-full sm:w-[170px]">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value)}
              className="w-full bg-transparent text-[13px] text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกช่วงเวลา</option>
              <option value="today">วันนี้</option>
              <option value="thisWeek">สัปดาห์นี้</option>
              <option value="thisMonth">เดือนนี้</option>
              <option value="custom">กำหนดช่วงเวลาเอง</option>
            </select>
          </div>

          {/* Custom Date Inputs Rendered on demand when 'custom' is selected */}
          {periodPreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto animate-in slide-in-from-left-2 duration-200">
              <span className="text-[11.5px] font-bold text-slate-400">เริ่มต้น:</span>
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              />
              <span className="text-[11.5px] font-bold text-slate-400">สิ้นสุด:</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              />
            </div>
          )}

          {(selectedDeptFilter !== 'all' || selectedPriorityFilter !== 'all' || periodPreset !== 'all') && (
            <button
              onClick={() => {
                setSelectedDeptFilter('all');
                setSelectedPriorityFilter('all');
                setPeriodPreset('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-xs text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer px-1 py-1"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>



      {/* GRAPHS AND ANALYTICAL VISUALIZATIONS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Graph 1: Monthly Operations Bar Chart (8 Columns wide) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">ความถี่และแนวโน้มกิจกรรมรายเดือน</h2>
              <p className="text-[11.5px] text-slate-500 mt-0.5">ปริมาณกิจกรรมแยกตามระดับความสำคัญวิกฤต</p>
            </div>
            <div className="flex gap-4.5 text-[11px] font-extrabold">
              <button 
                onClick={() => stats.urgent > 0 && setSelectedPriority('urgent')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all border border-transparent ${
                  stats.urgent > 0 
                    ? 'cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200/50 text-rose-600 dark:text-rose-400' 
                    : 'opacity-40 cursor-not-allowed text-slate-400'
                }`}
                title="คลิกเพื่อสรุปข้อมูลงานด่วนวิกฤตทั้งหมด"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0"></span>
                <span>ด่วนวิกฤต ({stats.urgent})</span>
              </button>

              <button 
                onClick={() => (stats.total - stats.urgent) > 0 && setSelectedPriority('not_urgent')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all border border-transparent ${
                  (stats.total - stats.urgent) > 0 
                    ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200/50 text-indigo-650 dark:text-indigo-400' 
                    : 'opacity-40 cursor-not-allowed text-slate-400'
                }`}
                title="คลิกเพื่อสรุปข้อมูลงานปกติ/ทั่วไปทั้งหมด"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shrink-0"></span>
                <span>ปกติ/ทั่วไป ({stats.total - stats.urgent})</span>
              </button>
            </div>
          </div>

          {/* SVG Custom Responsive Bar Chart */}
          <div className="h-[210px] w-full flex items-end justify-between px-1.5 sm:px-4 pt-4 border-b border-slate-200/60 dark:border-slate-700/50">
            {monthlyStatsList.map((m, idx) => {
              // Calculate percentages for stacked columns
              const totalHeightPercent = maxMonthCount > 0 ? (m.count / maxMonthCount) * 100 : 0;
              const urgentPercent = m.count > 0 ? (m.urgent / m.count) * 100 : 0;
              const otherPercent = m.count > 0 ? (m.other / m.count) * 100 : 0;

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (m.count > 0) {
                      setSelectedMonthPriorityFilter('all');
                      setSelectedMonthIndex(idx);
                    }
                  }}
                  className={`flex flex-col items-center group flex-1 transition-all duration-200 select-none px-0.5 py-1 ${
                    m.count > 0 
                      ? 'cursor-pointer hover:scale-105 hover:bg-slate-100/50 dark:hover:bg-slate-700/10 rounded-xl' 
                      : 'opacity-40'
                  }`}
                  title={m.count > 0 ? `คลิกวิเคราะห์รายงานเดือน ${m.monthName}` : 'ไม่มีกิจกรรม'}
                >
                  
                  {/* Styled Bar Stack Column */}
                  <div className="h-[140px] w-8 sm:w-10 bg-slate-50 dark:bg-slate-900/30 rounded-t-lg relative overflow-hidden flex flex-col justify-end">
                    {m.count > 0 ? (
                      <>
                        {/* Other Events segment */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMonthPriorityFilter('not_urgent');
                            setSelectedMonthIndex(idx);
                          }}
                          style={{ height: `${(m.other / m.count) * totalHeightPercent}%` }}
                          className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-500 cursor-pointer" 
                          title={`ปกติ/ทั่วไป: ${m.other} งาน (คลิกเพื่อดู)`}
                        />
                        {/* Urgent Events segment */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMonthPriorityFilter('urgent');
                            setSelectedMonthIndex(idx);
                          }}
                          style={{ height: `${(m.urgent / m.count) * totalHeightPercent}%` }}
                          className="w-full bg-rose-500 hover:bg-rose-600 transition-all duration-500 cursor-pointer" 
                          title={`ด่วนวิกฤต: ${m.urgent} งาน (คลิกเพื่อดู)`}
                        />
                      </>
                    ) : (
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>

                  {/* Month Label */}
                  <span className="text-[10.5px] font-semibold text-slate-550 dark:text-slate-400 mt-2 block truncate">
                    {m.monthName}
                  </span>
                  {m.count > 0 && (
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-gray-200 mt-0.5">
                      {m.count} งาน
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dynamic summary indicator at the bottom */}
          <div className="mt-4 flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750 font-medium">
            <span className="text-slate-500">ค่าเฉลี่ยกิจกรรมตามข้อมูลภาพรวม:</span>
            <span className="text-slate-800 dark:text-slate-200 font-extrabold">
              {Math.round((stats.total / 12) * 10) / 10} รายการ / เดือน
            </span>
          </div>

        </div>

        {/* Graph 2: Donut Chart priority breakdown (4 Columns wide) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">สัดส่วนประเภทสัมประสิทธิ์งาน</h2>
            <p className="text-[11.5px] text-slate-500 mt-0.5">จำแนกตามระดับความสำคัญปฏิบัติการ</p>
          </div>

          <div className="flex justify-center items-center my-4">
            {/* Real SVG Donut Ring Chart */}
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-750" strokeWidth="3" />
                
                {/* Dynamic sections based on counts */}
                {(() => {
                  const t = stats.total || 1;
                  const pctUrgent = (stats.urgent / t) * 100;
                  const pctMedium = (stats.medium / t) * 100;
                  const pctNormal = (stats.normal / t) * 100;
                  const pctInfo = (stats.info / t) * 100;

                  // Cumulatives
                  const u_offset = 0;
                  const m_offset = pctUrgent;
                  const n_offset = pctUrgent + pctMedium;
                  const i_offset = pctUrgent + pctMedium + pctNormal;

                  return (
                    <>
                      {/* Urgent segment */}
                      {stats.urgent > 0 && (
                        <circle 
                          onClick={() => setSelectedPriority('urgent')}
                          cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" 
                          strokeWidth="3.2" 
                          strokeDasharray={`${pctUrgent} ${100 - pctUrgent}`} 
                          strokeDashoffset={100 - u_offset} 
                          className="transition-all duration-1000 cursor-pointer hover:stroke-[4.2px] hover:opacity-90"
                          title={`วิกฤต: ${stats.urgent} งาน (คลิกเพื่อดู)`}
                        />
                      )}
                      
                      {/* Medium segment */}
                      {stats.medium > 0 && (
                        <circle 
                          onClick={() => setSelectedPriority('medium')}
                          cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" 
                          strokeWidth="3.2" 
                          strokeDasharray={`${pctMedium} ${100 - pctMedium}`} 
                          strokeDashoffset={100 - m_offset} 
                          className="transition-all duration-1000 cursor-pointer hover:stroke-[4.2px] hover:opacity-90"
                          title={`สำคัญมาก: ${stats.medium} งาน (คลิกเพื่อดู)`}
                        />
                      )}

                      {/* Normal segment */}
                      {stats.normal > 0 && (
                        <circle 
                          onClick={() => setSelectedPriority('normal')}
                          cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" 
                          strokeWidth="3.2" 
                          strokeDasharray={`${pctNormal} ${100 - pctNormal}`} 
                          strokeDashoffset={100 - n_offset} 
                          className="transition-all duration-1000 cursor-pointer hover:stroke-[4.2px] hover:opacity-90"
                          title={`ทั่วไป: ${stats.normal} งาน (คลิกเพื่อดู)`}
                        />
                      )}

                      {/* Info segment */}
                      {stats.info > 0 && (
                        <circle 
                          onClick={() => setSelectedPriority('info')}
                          cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" 
                          strokeWidth="3.2" 
                          strokeDasharray={`${pctInfo} ${100 - pctInfo}`} 
                          strokeDashoffset={100 - i_offset} 
                          className="transition-all duration-1000 cursor-pointer hover:stroke-[4.2px] hover:opacity-90"
                          title={`ข่าวสาร: ${stats.info} งาน (คลิกเพื่อดู)`}
                        />
                      )}
                    </>
                  );
                })()}
              </svg>

              {/* Number inside */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800 dark:text-gray-150">{stats.total}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">งานทั้งหมด</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button 
              onClick={() => stats.urgent > 0 && setSelectedPriority('urgent')}
              className={`flex items-center gap-2 font-medium bg-rose-50/40 dark:bg-rose-950/10 p-2.5 rounded-xl border border-transparent select-none text-left w-full transition-all duration-200 ${
                stats.urgent > 0 
                  ? 'cursor-pointer hover:bg-rose-100/60 dark:hover:bg-rose-950/30 hover:border-rose-300/30 font-bold text-rose-705 dark:text-rose-400 bg-rose-50/60' 
                  : 'opacity-40 cursor-not-allowed text-slate-450'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0"></span>
              <span className="truncate">วิกฤต: <strong className="font-extrabold">{stats.urgent}</strong></span>
            </button>

            <button 
              onClick={() => stats.medium > 0 && setSelectedPriority('medium')}
              className={`flex items-center gap-2 font-medium bg-amber-50/40 dark:bg-amber-950/10 p-2.5 rounded-xl border border-transparent select-none text-left w-full transition-all duration-200 ${
                stats.medium > 0 
                  ? 'cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-950/30 hover:border-amber-300/30 font-bold text-orange-700 dark:text-orange-450 bg-amber-50/65' 
                  : 'opacity-40 cursor-not-allowed text-slate-450'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shrink-0"></span>
              <span className="truncate">สำคัญมาก: <strong className="font-extrabold">{stats.medium}</strong></span>
            </button>

            <button 
              onClick={() => stats.normal > 0 && setSelectedPriority('normal')}
              className={`flex items-center gap-2 font-medium bg-indigo-50/40 dark:bg-indigo-950/10 p-2.5 rounded-xl border border-transparent select-none text-left w-full transition-all duration-200 ${
                stats.normal > 0 
                  ? 'cursor-pointer hover:bg-indigo-100/60 dark:hover:bg-indigo-950/30 hover:border-indigo-300/30 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/65' 
                  : 'opacity-40 cursor-not-allowed text-slate-450'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] inline-block shrink-0"></span>
              <span className="truncate">ทั่วไป: <strong className="font-extrabold">{stats.normal}</strong></span>
            </button>

            <button 
              onClick={() => stats.info > 0 && setSelectedPriority('info')}
              className={`flex items-center gap-2 font-medium bg-emerald-50/40 dark:bg-emerald-950/10 p-2.5 rounded-xl border border-transparent select-none text-left w-full transition-all duration-200 ${
                stats.info > 0 
                  ? 'cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-950/30 hover:border-emerald-300/30 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/65' 
                  : 'opacity-40 cursor-not-allowed text-slate-450'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block shrink-0"></span>
              <span className="truncate">ข่าวสาร: <strong className="font-extrabold">{stats.info}</strong></span>
            </button>
          </div>
        </div>

      </div>

      {/* DETAILED STATS TABLE AND OPERATIONAL BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Department Ranking Workload & Live Personnel statuses (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: สัดส่วนกลุ่มงาน */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500 animate-pulse" />
              <span>สัดส่วนกลุ่มงาน</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* SVG Ring */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-750" strokeWidth="3" />
                  {(() => {
                    const totalGroups = groupAndUnitStats.sortedGroups.reduce((acc, curr) => acc + curr.count, 0) || 1;
                    let runningGroupOffset = 0;
                    const gColors = [
                      { hex: '#8b5cf6', bg: 'bg-violet-600' },
                      { hex: '#6366f1', bg: 'bg-indigo-500' },
                      { hex: '#ec4899', bg: 'bg-pink-500' },
                      { hex: '#d946ef', bg: 'bg-fuchsia-500' },
                      { hex: '#a855f7', bg: 'bg-purple-500' },
                      { hex: '#f59e0b', bg: 'bg-amber-500' }
                    ];

                    return groupAndUnitStats.sortedGroups.map((g, idx) => {
                      const pct = (g.count / totalGroups) * 100;
                      const offset = runningGroupOffset;
                      runningGroupOffset += pct;
                      const colorObj = gColors[idx % gColors.length];

                      return (
                        <circle 
                          key={idx}
                          onClick={() => setSelectedGroupDetailed(g.name)}
                          cx="18" cy="18" r="15.915" fill="none" 
                          stroke={colorObj.hex}
                          strokeWidth="3.2" 
                          strokeDasharray={`${pct} ${100 - pct}`} 
                          strokeDashoffset={100 - offset} 
                          className="transition-all duration-700 cursor-pointer hover:stroke-[4px] hover:opacity-95"
                          title={`${g.name}: ${g.count} งาน (คลิกเพื่อดู)`}
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Total indicator inside */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center pointer-events-none">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-150">
                    {groupAndUnitStats.sortedGroups.reduce((acc, curr) => acc + curr.count, 0)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">งานทั้งหมด</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex-1 space-y-2 w-full">
                {groupAndUnitStats.sortedGroups.length > 0 ? (
                  groupAndUnitStats.sortedGroups.map((g, idx) => {
                    const totalGroups = groupAndUnitStats.sortedGroups.reduce((acc, curr) => acc + curr.count, 0) || 1;
                    const pctOverall = Math.round((g.count / totalGroups) * 100);
                    const gColors = [
                      'bg-violet-600', 'bg-indigo-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500', 'bg-amber-500'
                    ];

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedGroupDetailed(g.name)}
                        className="flex items-center justify-between text-xs w-full hover:bg-slate-50 dark:hover:bg-slate-750/30 p-1.5 p-1 rounded-lg transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[155px]">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${gColors[idx % gColors.length]}`} />
                          <span className="text-slate-750 dark:text-slate-300 font-bold truncate">{g.name}</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] whitespace-nowrap">
                          {g.count} งาน ({pctOverall}%)
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-450 dark:text-slate-550 text-center">ไม่มีข้อมูล</div>
                )}
              </div>
            </div>
          </div>

          {/* Card: สัดส่วนหน่วยงาน */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/65 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4.5 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              <span>สัดส่วนหน่วยงาน</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* SVG Ring */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-750" strokeWidth="3" />
                  {(() => {
                    const totalUnits = groupAndUnitStats.sortedUnits.reduce((acc, curr) => acc + curr.count, 0) || 1;
                    let runningUnitOffset = 0;
                    const uColors = [
                      { hex: '#10b981', bg: 'bg-emerald-500' },
                      { hex: '#14b8a6', bg: 'bg-teal-500' },
                      { hex: '#06b6d4', bg: 'bg-cyan-500' },
                      { hex: '#0284c7', bg: 'bg-sky-500' },
                      { hex: '#3b82f6', bg: 'bg-blue-500' },
                      { hex: '#6366f1', bg: 'bg-indigo-505' }
                    ];

                    return groupAndUnitStats.sortedUnits.map((u, idx) => {
                      const pct = (u.count / totalUnits) * 100;
                      const offset = runningUnitOffset;
                      runningUnitOffset += pct;
                      const colorObj = uColors[idx % uColors.length];

                      return (
                        <circle 
                          key={idx}
                          onClick={() => setSelectedUnitDetailed(u.name)}
                          cx="18" cy="18" r="15.915" fill="none" 
                          stroke={colorObj.hex}
                          strokeWidth="3.2" 
                          strokeDasharray={`${pct} ${100 - pct}`} 
                          strokeDashoffset={100 - offset} 
                          className="transition-all duration-700 cursor-pointer hover:stroke-[4px] hover:opacity-95"
                          title={`${u.name}: ${u.count} งาน (คลิกเพื่อดู)`}
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Total indicator inside */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center pointer-events-none">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-150">
                    {groupAndUnitStats.sortedUnits.reduce((acc, curr) => acc + curr.count, 0)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">งานทั้งหมด</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex-1 space-y-2 w-full">
                {groupAndUnitStats.sortedUnits.length > 0 ? (
                  groupAndUnitStats.sortedUnits.map((u, idx) => {
                    const totalUnits = groupAndUnitStats.sortedUnits.reduce((acc, curr) => acc + curr.count, 0) || 1;
                    const pctOverall = Math.round((u.count / totalUnits) * 100);
                    const uColors = [
                      'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500'
                    ];

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedUnitDetailed(u.name)}
                        className="flex items-center justify-between text-xs w-full hover:bg-slate-50 dark:hover:bg-slate-750/30 p-1.5 p-1 rounded-lg transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[155px]">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${uColors[idx % uColors.length]}`} />
                          <span className="text-slate-750 dark:text-slate-300 font-bold truncate">{u.name}</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] whitespace-nowrap">
                          {u.count} งาน ({pctOverall}%)
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-450 dark:text-slate-550 text-center">ไม่มีข้อมูล</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Timeline of important & upcoming events (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4.5 border-b border-slate-100 dark:border-slate-700/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>รายการกิจกรรม / แผนประมวลผลงานภาพรวม</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">เรียงลำดับตามความเร่งด่วนและไทม์ไลน์ปฏิทิน</p>
              </div>
              <span className="text-[11px] font-bold text-slate-500">แสดงสูงสุด 7 แผนล่าสุด</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-750/70 overflow-hidden">
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 7).map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedDetailedEvent(item)}
                    className="w-full text-left py-3 items-center flex justify-between gap-4.5 hover:bg-slate-55 dark:hover:bg-slate-900/40 px-2.5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200/50"
                  >
                    
                    {/* Left: Date and priority bullet */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.type === 'urgent' ? 'bg-rose-500 ring-4 ring-rose-500/20' : 
                        item.type === 'medium' ? 'bg-orange-500 ring-4 ring-orange-500/10' : 
                        item.type === 'normal' ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}></div>
                      
                      <div className="truncate">
                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate md:max-w-md">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">{item.formattedDate}</span>
                          <span>•</span>
                          <span className="truncate">{item.department || 'ไม่ระบุฝ่าย'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: details and metadata indicators */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.time && (
                        <span className="hidden sm:inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/40 dark:border-slate-800 text-[10px] text-slate-500 font-bold">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.time}</span>
                        </span>
                      )}
                      
                      <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.type === 'urgent' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450' : 
                        item.type === 'medium' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-450' : 
                        item.type === 'normal' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 
                        'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {item.type === 'urgent' ? 'ด่วนที่สุด' : 
                         item.type === 'medium' ? 'ปานกลาง' : 
                         item.type === 'normal' ? 'ทั่วไป' : 'ข้อมูล'}
                      </span>
                    </div>

                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                  ไม่มีข้อมูลแผนกิจกรรมที่ตรงตามตัวกรองที่ระบุขณะนี้
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-2.5 mt-4 text-[11px] text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">แผนข้อมูลแสดงผลสอดคล้องกับปฏิทินปฏิบัติงานส่วนกลาง และการป้อนข้อมูลสดผ่านฝ่ายประสานการตัดสินใจสูงสุด</span>
          </div>

        </div>

      </div>

      {/* FOOTER METADATA (Anti-AI-Slop Clean, human-centered credits) */}
      <div className="mt-8 text-center text-xs text-slate-450 dark:text-slate-500 leading-relaxed font-medium pb-4 print:mt-12">
        <p>เอกสารสรุปผลเชิงวิเคราะห์ระดับผู้บริหารประจำศูนย์ปฏิบัติการและประสานงานร่วม</p>
        <p className="text-[10px] text-slate-400 mt-0.5">จัดเตรียมเพื่อการประชุมคณะผู้บริหารสำนักพยาบาลและเทคโนโลยีสารสนเทศ</p>
      </div>

      {/* 1. Month Level Events Modal */}
      {selectedMonthIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span>กิจกรรมประจำเดือน {thMonthsLong[selectedMonthIndex]}
                    {selectedMonthPriorityFilter === 'urgent' && ' (เฉพาะด่วนวิกฤต)'}
                    {selectedMonthPriorityFilter === 'not_urgent' && ' (เฉพาะปกติ/ทั่วไป)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ตรวจพบทั้งหมด {monthEventsList.length} กิจกรรม/ภารกิจ
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedMonthIndex(null);
                  setSelectedMonthPriorityFilter('all');
                }}
                className="p-1 px-2.5 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 font-bold rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
              {monthEventsList.length > 0 ? (
                monthEventsList.map((item, idx) => {
                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (item.type === 'urgent') badgeColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400';
                  else if (item.type === 'medium') badgeColor = 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400';
                  else if (item.type === 'normal') badgeColor = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400';
                  else if (item.type === 'info') badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400';

                  const priorityLabel = item.type === 'urgent' ? 'ด่วนที่สุด' : 
                                        item.type === 'medium' ? 'สำคัญมาก' : 
                                        item.type === 'normal' ? 'ทั่วไป' : 'ข่าวสาร';

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDetailedEvent(item)}
                      className="w-full text-left p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/40 transition-all border border-slate-200/40 dark:border-slate-700/50 flex items-center justify-between gap-3 group shrink-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono text-slate-550 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-2 py-1 rounded shadow-sm shrink-0">
                          วันที่ {item.parsedDay}
                        </span>
                        <div className="truncate">
                          <span className="font-extrabold text-[13.5px] text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block truncate max-w-[220px]">
                            {item.title}
                          </span>
                          {item.department && (
                            <span className="text-[10.5px] text-slate-500 block truncate">
                              {item.department}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                          {priorityLabel}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 text-sm">
                  ไม่มีกิจกรรมในเดือนนี้
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-755 flex justify-end">
              <button
                onClick={() => {
                  setSelectedMonthIndex(null);
                  setSelectedMonthPriorityFilter('all');
                }}
                className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Priority Level Events Modal */}
      {selectedPriority !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  <span>กิจกรรมระดับปฏิบัติการ: {
                    selectedPriority === 'urgent' ? '🔴 เร่งด่วน / วิกฤต' : 
                    selectedPriority === 'medium' ? '🟠 สำคัญมาก' : 
                    selectedPriority === 'normal' ? '🔵 ทั่วไป / ปกติ' : '🟢 ข้อมูลประชาสัมพันธ์'
                  }</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ตรวจพบทั้งหมด {priorityEventsList.length} งานดำเนินงาน
                </p>
              </div>
              <button 
                onClick={() => setSelectedPriority(null)}
                className="p-1 px-2.5 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 font-bold rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
              {priorityEventsList.length > 0 ? (
                priorityEventsList.map((item, idx) => {
                  let badgeClass = "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40";
                  let hoverTextClass = "group-hover:text-indigo-600 dark:group-hover:text-indigo-450";
                  if (item.type === 'urgent') {
                    badgeClass = "text-rose-600 bg-rose-50 dark:bg-rose-950/40";
                    hoverTextClass = "group-hover:text-rose-600 dark:group-hover:text-rose-400";
                  } else if (item.type === 'medium') {
                    badgeClass = "text-orange-600 bg-orange-50 dark:bg-orange-950/40";
                    hoverTextClass = "group-hover:text-orange-600 dark:group-hover:text-orange-400";
                  } else if (item.type === 'info') {
                    badgeClass = "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40";
                    hoverTextClass = "group-hover:text-emerald-600 dark:group-hover:text-emerald-400";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDetailedEvent(item)}
                      className="w-full text-left p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/40 transition-all border border-slate-200/40 dark:border-slate-700/50 flex items-center gap-3.5 group shrink-0 cursor-pointer"
                    >
                      <span className={`text-[12px] font-bold px-3 py-1 rounded shadow-sm shrink-0 font-sans ${badgeClass}`}>
                        {item.formattedDate}
                      </span>
                      <span className={`font-bold text-[13.5px] text-slate-800 dark:text-slate-100 ${hoverTextClass} transition-colors truncate block flex-1`}>
                        {item.title}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 text-sm">
                  ไม่มีกิจกรรมในระดับความสำคัญนี้
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-755 flex justify-end">
              <button
                onClick={() => setSelectedPriority(null)}
                className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Detailed Event Modal (Popup ดูรายละเอียดอย่างละเอียด) */}
      {selectedDetailedEvent !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-3">
                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  selectedDetailedEvent.type === 'urgent' ? 'bg-rose-500 ring-4 ring-rose-500/20' : 
                  selectedDetailedEvent.type === 'medium' ? 'bg-orange-500 ring-4 ring-orange-500/10' : 
                  selectedDetailedEvent.type === 'normal' ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}></span>
                
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {selectedDetailedEvent.type === 'urgent' ? '🚨 แผนงานเร่งด่วน / วิกฤตสัญญลักษณ์แดง' : 
                     selectedDetailedEvent.type === 'medium' ? 'งานระดับสำคัญมากสังเกตส้ม' : 
                     selectedDetailedEvent.type === 'normal' ? 'กิจกรรมระดับปฏิบัติการทั่วไป' : 'ข้อมูลข่าวสารระบบประสานร่วม'}
                  </span>
                  <h3 className="text-md font-extrabold text-slate-850 dark:text-slate-100 mt-0.5">รายละเอียดผลการดำเนินงาน</h3>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedDetailedEvent(null)}
                className="p-1.5 px-3 bg-slate-100 hover:bg-slate-150 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 font-bold rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm bg-slate-50/30 dark:bg-slate-900/10">
              
              {/* Event Title */}
              <div>
                <h4 className="text-lg font-black tracking-tight text-slate-850 dark:text-white leading-snug">
                  {selectedDetailedEvent.title}
                </h4>
              </div>

              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-800 p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-750 shadow-sm animate-in fade-in">
                
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-400 block">🗓️ วันที่ดำเนินกิจกรรม</span>
                  <span className="text-[13px] font-extrabold text-slate-750 dark:text-slate-300">
                    {selectedDetailedEvent.formattedDate || selectedDetailedEvent.dateKey || '-'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-400 block">⏰ เวลาปฏิบัติการ</span>
                  <span className="text-[13px] font-extrabold text-slate-750 dark:text-slate-300">
                    {selectedDetailedEvent.time || 'ไม่ระบุเวลา'}
                  </span>
                </div>

                <div className="space-y-0.5 col-span-2 border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block">🏢 ฝ่ายงานที่รับผิดชอบ</span>
                  <span className="text-[13px] font-extrabold text-indigo-600 dark:text-indigo-400">
                    {selectedDetailedEvent.department || 'ไม่ระบุฝ่ายงาน / สังกัดส่วนกลาง'}
                  </span>
                </div>

                {selectedDetailedEvent.location && (
                  <div className="space-y-0.5 col-span-2 border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
                    <span className="text-[11px] font-bold text-slate-400 block">📍 สถานที่พิกัดแผนงาน</span>
                    <span className="text-[13px] font-extrabold text-slate-700 dark:text-slate-300">
                      {selectedDetailedEvent.location}
                    </span>
                  </div>
                )}

                {selectedDetailedEvent.responsibles && selectedDetailedEvent.responsibles.length > 0 && (
                  <div className="space-y-0.5 col-span-2 border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
                    <span className="text-[11px] font-bold text-slate-400 block">👤 หัวหน้างาน / ผู้รับผิดชอบหลัก</span>
                    <span className="text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedDetailedEvent.responsibles.join(', ')}
                    </span>
                  </div>
                )}

                <div className="space-y-0.5 col-span-2 border-t border-slate-100 dark:border-slate-700/65 pt-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block">🔐 ผู้บันทึกกิจกรรมเข้าสู่ฐานข้อมูล</span>
                  <span className="text-[11.5px] font-bold text-slate-500">
                    {selectedDetailedEvent.ownerId || 'ระบบอัตโนมัติประจำหน่วย'}
                  </span>
                </div>

              </div>

              {/* Event Description */}
              {selectedDetailedEvent.description && (
                <div className="space-y-1.5 animate-in slide-in-from-bottom-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">📝 หมายเหตุงานและรายละเอียด</span>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-750 p-4 rounded-2xl text-[13px] text-slate-700 dark:text-slate-350 leading-relaxed font-normal shadow-sm whitespace-pre-line">
                    {selectedDetailedEvent.description}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between gap-3">
              {(selectedMonthIndex !== null || selectedPriority !== null) ? (
                <button
                  onClick={() => setSelectedDetailedEvent(null)}
                  className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ย้อนกลับไปรายการสรุป</span>
                </button>
              ) : (
                <div></div>
              )}
              
              <button
                onClick={() => {
                  setSelectedDetailedEvent(null);
                  setSelectedMonthIndex(null);
                  setSelectedMonthPriorityFilter('all');
                  setSelectedPriority(null);
                }}
                className="px-4.5 py-2.5 bg-[#6366f1] hover:bg-[#5558e6] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                เสร็จสิ้น / ปิดทั้งหมด
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. WORK GROUP DETAILS MODAL */}
      {selectedGroupDetailed !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span>กิจกรรมกลุ่มงาน: {selectedGroupDetailed}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  มีงานในความรับผิดชอบทั้งหมด {groupEventsList.length} รายการ
                </p>
              </div>
              <button 
                onClick={() => setSelectedGroupDetailed(null)}
                className="p-1 px-2.5 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 font-bold rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
              {groupEventsList.length > 0 ? (
                groupEventsList.map((item, idx) => {
                  let badgeColor = "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40";
                  if (item.type === 'urgent') badgeColor = "text-rose-600 bg-rose-50 dark:bg-rose-950/40";
                  else if (item.type === 'medium') badgeColor = "text-orange-600 bg-orange-50 dark:bg-orange-950/40";
                  else if (item.type === 'info') badgeColor = "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40";

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDetailedEvent(item)}
                      className="w-full text-left p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/40 transition-all border border-slate-200/40 dark:border-slate-700/50 flex items-center gap-3.5 group shrink-0 cursor-pointer"
                    >
                      <span className={`text-[12px] font-bold px-3 py-1 rounded shadow-sm shrink-0 ${badgeColor}`}>
                        {item.formattedDate}
                      </span>
                      <span className="font-bold text-[13.5px] text-slate-800 dark:text-slate-100 group-hover:text-[#6366f1] transition-colors truncate block flex-1">
                        {item.title}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 text-sm">
                  ไม่มีรายการงานประจำกลุ่มนี้ในเงื่อนไขการกรองปัจจุบัน
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-755 flex justify-end">
              <button
                onClick={() => setSelectedGroupDetailed(null)}
                className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ORGANIZATIONAL UNIT DETAILS MODAL */}
      {selectedUnitDetailed !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-500" />
                  <span>กิจกรรมหน่วยงาน: {selectedUnitDetailed}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  มีงานในความรับผิดชอบทั้งหมด {unitEventsList.length} รายการ
                </p>
              </div>
              <button 
                onClick={() => setSelectedUnitDetailed(null)}
                className="p-1 px-2.5 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 font-bold rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
              {unitEventsList.length > 0 ? (
                unitEventsList.map((item, idx) => {
                  let badgeColor = "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40";
                  if (item.type === 'urgent') badgeColor = "text-rose-600 bg-rose-50 dark:bg-rose-950/40";
                  else if (item.type === 'medium') badgeColor = "text-orange-600 bg-orange-50 dark:bg-orange-950/40";
                  else if (item.type === 'info') badgeColor = "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40";

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDetailedEvent(item)}
                      className="w-full text-left p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/40 transition-all border border-slate-200/40 dark:border-slate-700/50 flex items-center gap-3.5 group shrink-0 cursor-pointer"
                    >
                      <span className={`text-[12px] font-bold px-3 py-1 rounded shadow-sm shrink-0 ${badgeColor}`}>
                        {item.formattedDate}
                      </span>
                      <span className="font-bold text-[13.5px] text-slate-800 dark:text-slate-100 group-hover:text-[#6366f1] transition-colors truncate block flex-1">
                        {item.title}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 text-sm">
                  ไม่มีรายการงานประจำหน่วยนี้ในเงื่อนไขการกรองปัจจุบัน
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-755 flex justify-end">
              <button
                onClick={() => setSelectedUnitDetailed(null)}
                className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-205 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EXECUTIVE SUMMARY PRINT VIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-slate-900/95 overflow-y-auto p-4 sm:p-6 md:p-10 scrollbar-thin print-modal-wrapper">
          
          {/* Print specific hidden/visible CSS stylesheet element dynamically loaded */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body, html {
                height: auto !important;
                overflow: visible !important;
                background: white !important;
                color: black !important;
              }
              
              /* Hide all standard webpage elements visually */
              body * {
                visibility: hidden !important;
              }
              
              /* Force display of the report wrapper and sheet */
              .print-modal-wrapper,
              #printable-report-area,
              #printable-report-area * {
                visibility: visible !important;
              }
              
              /* Position print modal wrapper neutrally over the page */
              .print-modal-wrapper {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                display: block !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                width: 100% !important;
                height: auto !important;
              }
              
              /* Hide web control panel buttons entirely */
              .print-modal-web-controls,
              .print-modal-web-controls * {
                display: none !important;
                visibility: hidden !important;
              }
              
              /* Force printable layout to match standard page format */
              #printable-report-area {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important; /* Perfect A4 width */
                height: auto !important; /* Allow multi-page print flow */
                min-height: 297mm !important; /* Perfect A4 height template */
                margin: 0 auto !important;
                padding: 20mm 15mm 20mm 15mm !important; /* Clean margin inside A4 boundary */
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                overflow: visible !important;
              }
              
              /* Avoid splitting table rows and panels mid-sentence */
              tr, th, td {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              
              .page-break-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              
              /* Prevent heading titles from being orphaned at parent page bottom */
              h1, h2, h3, h4, h5, h6 {
                break-after: avoid-page !important;
                page-break-after: avoid !important;
              }
            }
            @page {
              size: A4 portrait;
              margin: 0; /* Handled by internal padding of A4 container */
            }
          `}} />

          {/* Web controls bar (hidden on physical print output) */}
          <div className="print-modal-web-controls max-w-4xl mx-auto w-full bg-slate-800 border border-slate-700 text-white rounded-2xl p-5 mb-6 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/30 p-2 rounded-xl border border-indigo-500/20">
                  <Printer className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-[14.5px]">ตัวอย่างสถิติรายสรุป สำหรับเสนอผู้บริหารก่อนสั่งพิมพ์</h3>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">ระบบจะแสดงผลในรูปแบบสีดำสะอาดยีนหมึกพิมพ์ (A4 Ratio) สามารถพิมพ์หรือเก็บบันทึกเป็น PDF</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                <button
                  onClick={triggerPrintPopup}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-black rounded-lg shadow transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[13px] font-bold rounded-lg border border-slate-605 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ปิดหน้าจอพรีวิว</span>
                </button>
              </div>
            </div>

            {/* Dynamic Iframe Detection Info Banner */}
            {typeof window !== "undefined" && window.self !== window.top && (
              <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-left leading-relaxed">
                  <span className="font-black block text-amber-400 mb-0.5">💡 คำแนะนำสำหรับระบบพรีวิว (iFrame Sandbox)</span>
                  ระบบตรวจพบแผงตัวอย่างจำลอง เนื่องจากเบราว์เซอร์จะตรวจสอบความปลอดภัยและบล็อกคำสั่งพิมพ์ (<code className="p-0.5 bg-slate-900 rounded font-mono">window.print</code>) จากหน้าต่างย่อยนี้ 
                  <strong> หากปุ่ม PDF ไม่ตอบสนอง:</strong> ให้คลิกที่ไอคอนแท็บใหม่ <strong className="text-white hover:underline">"เปิดในแท็บใหม่ (Open in new tab)"</strong> ที่แผงมุมบนขวาสุดของหน้าต่างแสดงผลนี้ เพื่อใช้งานพิมพ์/บันทึกไฟล์เป็น PDF สมบูรณ์แบบ
                </div>
              </div>
            )}
          </div>

          {/* Paper Printable Sheet Container */}
          <div 
            id="printable-report-area" 
            className="max-w-4xl mx-auto w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-10 sm:p-14 shadow-2xl space-y-8 font-sans leading-relaxed text-left"
          >
            {/* Report Header Logo and Metadata Block */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div className="text-left">
                <div className="text-[10.5px] uppercase font-black tracking-widest text-[#6366f1] font-mono">
                  รายงานสรุปผล / สำหรับกลุ่มงานปฏิบัติการเท่านั้น
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1 mb-2 font-sans">
                  รายงานวิเคราะห์ข้อมูลและกำลังพลปฏิบัติการประจำหน่วย
                </h1>
                <p className="text-[11.5px] text-slate-500 leading-snug font-medium">
                  ระบบประเมินผลปฏิบัติงานภาพรวมความคืบหน้าระดับผู้บริหาร
                </p>
              </div>

              <div className="text-right border-l-2 border-slate-200 pl-5 space-y-1 text-[11px] text-slate-600 font-mono">
                <div><strong>วันที่ออกเอกสาร:</strong> เมษายน-มิถุนายน 2569</div>
                <div><strong>ผู้ถอนความยั่งยืน:</strong> แอดมินวิเคราะห์ความร่วมมือ</div>
                <div><strong>สำนักส่วนกลาง:</strong> {usersData[0]?.email || 'noy.thaweesit@gmail.com'}</div>
              </div>
            </div>

            {/* Print Block 1: Filter Conditions and Overview Analytics Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 border-l-[3.5px] border-[#6366f1] pl-2.5">
                1. ข้อมูลสังเขปเงื่อนไขการวัดผลสถิติงาน (Current Filter Boundaries)
              </h3>
              
              <div className="grid grid-cols-3 gap-4 border border-slate-200 rounded-lg p-3.5 bg-slate-50 text-[12px] font-medium leading-relaxed">
                <div>
                  <span className="text-slate-400 block text-[10.5px]">ฝ่ายสนับสนุน/สังกัด:</span>
                  <strong className="text-slate-800 font-black">
                    {selectedDeptFilter === 'all' ? 'ทุกฝ่ายปฏิบัติการทั้งหมดในสังกัด' : selectedDeptFilter}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px]">ขอบเขตความฉุกเฉิน:</span>
                  <strong className="text-slate-800 font-black">
                    {selectedPriorityFilter === 'all' ? 'ทุกประเภทระดับประมวลสัมประสิทธิ์' : selectedPriorityFilter}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px]">ช่วงเวลาดึงรายงาน (Timeframe):</span>
                  <strong className="text-indigo-700 font-black">
                    {periodPreset === 'all' && 'ทุกช่วงเวลาที่มีข้อมูล'}
                    {periodPreset === 'today' && 'วันนี้ประมวลพิเศษ (10 มิ.ย. 2569)'}
                    {periodPreset === 'thisWeek' && 'สัปดาห์นี้ปฏิบัติการ (8 - 14 มิ.ย. 2569)'}
                    {periodPreset === 'thisMonth' && 'เดือนมิถุนายน 2569 ในระบบ'}
                    {periodPreset === 'custom' && `${customStartDate || 'ไม่จำกัด'} ถึง ${customEndDate || 'ไม่จำกัด'}`}
                  </strong>
                </div>
              </div>
            </div>

            {/* Print Block 3: Group & Unit breakdown metrics tables side by side */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Group Distribution */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-[12.5px] font-black text-slate-850 flex items-center gap-1.5 border-b border-slate-150 pb-2">
                  <span>สัดส่วนแยกตาม ‘กลุ่มงาน’ ในสังกัด</span>
                </div>
                
                <table className="w-full text-left text-[11px] font-medium">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-155">
                      <th className="py-1">ชื่อกลุ่มปฏิบัติงาน</th>
                      <th className="py-1 text-right">จำนวนกิจกรรม</th>
                      <th className="py-1 text-right">ร้อยละ (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupAndUnitStats.sortedGroups.map((g, idx) => {
                      const totalC = groupAndUnitStats.sortedGroups.reduce((acc, curr) => acc + curr.count, 0) || 1;
                      const pct = Math.round((g.count / totalC) * 100);
                      return (
                        <tr key={idx} className="text-slate-700">
                          <td className="py-1 text-slate-850 font-bold">{g.name}</td>
                          <td className="py-1 text-right font-bold">{g.count} งาน</td>
                          <td className="py-1 text-right text-indigo-700 font-extrabold">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Unit Distribution */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-[12.5px] font-black text-slate-850 flex items-center gap-1.5 border-b border-slate-150 pb-2">
                  <span>สัดส่วนแยกตาม ‘หน่วยงาน’ รับผิดชอบ</span>
                </div>
                
                <table className="w-full text-left text-[11px] font-medium">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-155">
                      <th className="py-1">ชื่อแผนกฝ่ายงานหลัก</th>
                      <th className="py-1 text-right">จำนวนกิจกรรม</th>
                      <th className="py-1 text-right">ร้อยละ (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupAndUnitStats.sortedUnits.map((u, idx) => {
                      const totalC = groupAndUnitStats.sortedUnits.reduce((acc, curr) => acc + curr.count, 0) || 1;
                      const pct = Math.round((u.count / totalC) * 100);
                      return (
                        <tr key={idx} className="text-slate-700">
                          <td className="py-1 text-slate-850 font-bold">{u.name}</td>
                          <td className="py-1 text-right font-bold">{u.count} งาน</td>
                          <td className="py-1 text-right text-emerald-700 font-extrabold">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Print Block 4: Detailed Listing of high importance tasks */}
            <div className="space-y-3.5">
              <h3 className="text-sm font-black text-slate-900 border-l-[3.5px] border-[#6366f1] pl-2.5">
                2. บัญชีรายละเอียดแผนงานและกิจกรรมจัดอันดับ (Detailed Operation Activity Registry)
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px] leading-relaxed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold">
                      <th className="p-3">วันที่ดำเนินกิจกรรม</th>
                      <th className="p-3">ระดับปฏิบัติงาน</th>
                      <th className="p-3">หัวเรื่องกิจกรรม</th>
                      <th className="p-3">สังกัดหน่วยงาน</th>
                      <th className="p-3 text-right">หัวหน้าผู้ประสานงาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(() => {
                      const sortedPrintList = [...filteredEvents].sort((a, b) => {
                        const score = { urgent: 4, medium: 3, normal: 2, info: 1 };
                        return (score[b.type as keyof typeof score] || 0) - (score[a.type as keyof typeof score] || 0);
                      });

                      if (sortedPrintList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                              ไม่มีบันทึกข้อมูลสถิติตามช่วงตัวกรองที่เลือก
                            </td>
                          </tr>
                        );
                      }

                      return sortedPrintList.map((item, idx) => {
                        let levelLabel = "ทั่วไป";
                        let levelClass = "text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-black text-[10px]";
                        if (item.type === 'urgent') {
                          levelLabel = "🔴 วิกฤต / ด่วน";
                          levelClass = "text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-black text-[10px]";
                        } else if (item.type === 'medium') {
                          levelLabel = "🟠 สำคัญมาก";
                          levelClass = "text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded font-black text-[10px]";
                        } else if (item.type === 'info') {
                          levelLabel = "🟢 ประชาสัมพันธ์";
                          levelClass = "text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-black text-[10px]";
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-600 font-mono whitespace-nowrap">{item.formattedDate}</td>
                            <td className="p-3 text-xs"><span className={levelClass}>{levelLabel}</span></td>
                            <td className="p-3 font-bold text-slate-900 max-w-[200px] truncate">{item.title}</td>
                            <td className="p-3 font-bold text-slate-700">{item.department || '-'}</td>
                            <td className="p-3 text-right font-mono text-slate-600">
                              {item.responsibles && item.responsibles.length > 0 
                                ? item.responsibles[0] 
                                : usersData[0]?.name || 'สำนักวิเคราะห์ประมวลสถิติ'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Block 5: Signature line at foot of paper */}
            <div className="pt-10 flex justify-between items-end text-[11px] font-medium leading-relaxed">
              <div className="space-y-1 text-slate-550">
                <div>* เอกสารฉบับนี้ใช้สรุปประมวลรายงานทางสถิติระดับผู้อำนวยการส่วนความมั่นคงภายใน</div>
                <div>* ระบบประมวลผลวิเคราะห์ข้อมูลอ้างอิงรายสัปดาห์ / คลังเก็บสถิติสำนักประสงค์</div>
              </div>

              <div className="text-center space-y-8 border-t border-slate-300 pt-3 w-[260px]">
                <div className="text-slate-400 font-bold">ลงชื่อ.............................................................. ผู้สรุปสถิติดำเนินการ</div>
                <div className="text-slate-800 font-extrabold">
                  ( {usersData[0]?.name || 'สำนักวิเคราะห์ประมวลสถิติ'} )
                </div>
                <div className="text-slate-500 text-[10.5px] font-mono">
                  หัวหน้ากลุ่มประเมินสารภาพรวมระบบควบคุมภายใน
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
