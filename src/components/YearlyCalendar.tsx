import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Filter,
  X,
  LayoutGrid,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Plus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { getEventsForDate, isDayHoliday, SelectedDate } from "../lib/dateUtils";

const monthsData = [
  { name: "มกราคม", id: 0 },
  { name: "กุมภาพันธ์", id: 1 },
  { name: "มีนาคม", id: 2 },
  { name: "เมษายน", id: 3 },
  { name: "พฤษภาคม", id: 4 },
  { name: "มิถุนายน", id: 5 },
  { name: "กรกฎาคม", id: 6 },
  { name: "สิงหาคม", id: 7 },
  { name: "กันยายน", id: 8 },
  { name: "ตุลาคม", id: 9 },
  { name: "พฤศจิกายน", id: 10 },
  { name: "ธันวาคม", id: 11 },
];

const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// Function to classify event categories based on keywords
function getEventCategory(event: { title: string; type?: string }) {
  const title = event.title || "";
  const type = event.type || "";
  
  if (title.includes("วันหยุด") || title.includes("วัน") || type === "urgent") {
    return { name: "วันหยุด", color: "bg-[#ef4444]", dot: "#ef4444" };
  }
  if (title.includes("อบรม") || title.includes("สัมมนา") || title.includes("เรียน") || title.includes("ค่าย")) {
    return { name: "อบรม", color: "bg-[#f59e0b]", dot: "#f59e0b" };
  }
  if (title.includes("ตรวจ") || title.includes("ประเมิน") || title.includes("วิเคราะห์")) {
    return { name: "ตรวจประเมิน", color: "bg-[#f97316]", dot: "#f97316" };
  }
  if (title.includes("ประชุม") || title.includes("Brief") || title.includes("เสวนา")) {
    return { name: "ประชุม", color: "bg-[#a855f7]", dot: "#a855f7" };
  }
  if (title.includes("ชุมชน") || title.includes("วิ่ง") || title.includes("เยี่ยมบ้าน") || type === "normal") {
    return { name: "ชุมชน", color: "bg-[#10b981]", dot: "#10b981" };
  }
  return { name: "บริการ", color: "bg-[#3b82f6]", dot: "#3b82f6" };
}

interface EventItem {
  id: string;
  title: string;
  time?: string;
  endTime?: string;
  type: "urgent" | "medium" | "normal" | "info";
  location?: string;
  responsibles?: string;
  department?: string;
  description?: string;
  ownerId?: string;
  workGroup?: string;
}

export function YearlyCalendar({
  eventsMap,
  onDayClick,
  onAction,
  isLoggedIn = false,
  onAddEvent,
}: {
  eventsMap: Record<string | number, EventItem[]>;
  onDayClick?: (date: SelectedDate) => void;
  onAction?: (action: string) => void;
  isLoggedIn?: boolean;
  onAddEvent?: () => void;
}) {
  const [currentYear, setCurrentYear] = useState(() => {
    // Default to the Buddhist era of the current year (e.g., 2026 + 543 = 2569)
    return new Date().getFullYear() + 543;
  });

  // State managers for high-level search and dropdown filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkGroup, setSelectedWorkGroup] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  
  // Custom Display Mode choice to let users switch between dots (minimalist) & bars (legacy/original)
  const [displayMode, setDisplayMode] = useState<"dots" | "bars">("dots");

  // Dynamically extract unique categories, work groups, and departments from all loaded events
  const { allWorkGroups, allDepartments } = useMemo(() => {
    const groupsSet = new Set<string>();
    const deptsSet = new Set<string>();

    Object.values(eventsMap).forEach((events) => {
      if (Array.isArray(events)) {
        events.forEach((evt) => {
          if (evt.workGroup?.trim()) groupsSet.add(evt.workGroup.trim());
          if (evt.department?.trim()) deptsSet.add(evt.department.trim());
        });
      }
    });

    return {
      allWorkGroups: Array.from(groupsSet).sort(),
      allDepartments: Array.from(deptsSet).sort(),
    };
  }, [eventsMap]);

  // Check if any filter is currently engaged
  const isFilterActive = useMemo(() => {
    return searchTerm.trim() !== "" || selectedWorkGroup !== "" || selectedDepartment !== "" || selectedPriority !== "";
  }, [searchTerm, selectedWorkGroup, selectedDepartment, selectedPriority]);

  // Reset all customized filters in one click
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedWorkGroup("");
    setSelectedDepartment("");
    setSelectedPriority("");
  };

  // Helper function to resolve filtered events for any day dynamically
  const getFilteredEventsForDay = (day: number, monthId: number, year: number) => {
    const rawEvents = getEventsForDate(eventsMap, day, monthId, year);
    return rawEvents.filter((evt) => {
      // 1. Text Search Filter
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const matchesSearch =
          (evt.title || "").toLowerCase().includes(lower) ||
          (evt.location || "").toLowerCase().includes(lower) ||
          (evt.responsibles || "").toLowerCase().includes(lower) ||
          (evt.description || "").toLowerCase().includes(lower);
        if (!matchesSearch) return false;
      }
      // 2. Work Group Filter
      if (selectedWorkGroup && evt.workGroup !== selectedWorkGroup) return false;
      // 3. Department Filter
      if (selectedDepartment && evt.department !== selectedDepartment) return false;
      // 4. Priority Filter
      if (selectedPriority && evt.type !== selectedPriority) return false;

      return true;
    });
  };

  // Calculate workdays and filtered event summaries dynamically for each month
  const monthlySummaries = useMemo(() => {
    const gregorianYear = currentYear - 543;
    const summaries: Record<number, { workDays: number; eventCount: number }> = {};

    monthsData.forEach((m) => {
      const totalDays = new Date(gregorianYear, m.id + 1, 0).getDate();
      let workDays = 0;
      let eventCount = 0;

      for (let d = 1; d <= totalDays; d++) {
        const isHoliday = isDayHoliday(d, m.id, currentYear);
        if (!isHoliday) {
          workDays++;
        }
        
        const filteredEvents = getFilteredEventsForDay(d, m.id, currentYear);
        eventCount += filteredEvents.length;
      }
      summaries[m.id] = { workDays, eventCount };
    });

    return summaries;
  }, [currentYear, eventsMap, searchTerm, selectedWorkGroup, selectedDepartment, selectedPriority]);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      
      {/* 2. Interactive Search & Filters Panel (Groups, Departments, Priorities) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4">
        
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Filters Grid at the very top/left */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {/* Search Key inputs */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="พิมพ์คำค้นหากิจกรรม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          {/* Group dropdown */}
          <div className="flex flex-col">
            <select
              value={selectedWorkGroup}
              onChange={(e) => setSelectedWorkGroup(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all font-bold cursor-pointer"
            >
              <option value="">กลุ่มงานทั้งหมด</option>
              {allWorkGroups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          </div>

          {/* Department dropdown */}
          <div className="flex flex-col">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all font-bold cursor-pointer"
            >
              <option value="">หน่วยงานทั้งหมด</option>
              {allDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Priority dropdown */}
          <div className="flex flex-col">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all font-bold cursor-pointer"
            >
              <option value="">ระดับความสำคัญทั้งหมด</option>
              <option value="urgent">🔴 สำคัญมาก</option>
              <option value="medium">🟡 ปานกลาง</option>
              <option value="normal">🟢 ปกติ</option>
              <option value="info">🔵 ทั่วไป / ข้อมูล</option>
            </select>
          </div>
        </div>

        {/* Action Controls Group: Check Status -> Dots Toggle -> Bars Toggle -> Add Event button */}
        <div className="flex items-center gap-2 justify-end shrink-0 self-end lg:self-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
          
          {/* Check Status icon / Clear button */}
          {isFilterActive && (
            <div className="flex items-center justify-center">
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 transition-all cursor-pointer"
                title="ล้างตัวกรองทั้งหมด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Display Mode Toggles (name removed, remaining only icon) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 animate-in fade-in">
            <button
              onClick={() => setDisplayMode("dots")}
              className={`p-2 text-xs font-bold rounded-md transition-all flex items-center justify-center cursor-pointer ${
                displayMode === "dots"
                  ? "bg-white dark:bg-slate-800 text-[#6366f1] dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              title="แบบจุดสีมินิมอล"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode("bars")}
              className={`p-2 text-xs font-bold rounded-md transition-all flex items-center justify-center cursor-pointer ${
                displayMode === "bars"
                  ? "bg-white dark:bg-slate-800 text-[#6366f1] dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              title="แบบแถบสี"
            >
              <div className="flex flex-col gap-0.5 w-4 items-center justify-center">
                <span className="h-0.5 w-full bg-current rounded-full" />
                <span className="h-0.5 w-full bg-current rounded-full" />
              </div>
            </button>
          </div>

          {/* Add Event Button (After dots/bars display mode toggles) */}
          {isLoggedIn && onAddEvent && (
            <button
              onClick={onAddEvent}
              className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 hover:text-white hover:bg-[#16a34a] px-3.5 py-2 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 bg-[#22c55e]/10 dark:bg-emerald-500/5 transition-all font-bold text-[13px] shrink-0 cursor-pointer animate-in fade-in"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>เพิ่มกิจกรรม</span>
            </button>
          )}
        </div>

      </div>

        {/* Display Filter Summary Status when filtered */}
        {isFilterActive && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6366f1] animate-pulse" />
              <span>กำลังกรองเหตุการณ์:</span>
              {searchTerm && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">คำหลัก: "{searchTerm}"</span>}
              {selectedWorkGroup && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">กลุ่มงาน: {selectedWorkGroup}</span>}
              {selectedDepartment && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">หน่วยงาน: {selectedDepartment}</span>}
              {selectedPriority && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">ความสำคัญ: {
                selectedPriority === "urgent" ? "สำคัญมาก" : selectedPriority === "medium" ? "ปานกลาง" : selectedPriority === "normal" ? "ปกติ" : "ทั่วไป"
              }</span>}
            </div>
            
            <button 
              onClick={handleClearFilters}
              className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
            >
              ยกเลิกตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* 3. The Grid Calendar Table - optimized to look incredibly beautiful and high-contrast */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden">
        
        {/* Subtle Horizontal Scroll Assist Guide & Centered Yearly Title */}
        <div className="bg-slate-50/50 dark:bg-transparent px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 select-none text-[12px] font-bold">
          <div className="text-slate-500 dark:text-slate-400 shrink-0 text-center md:text-left">
            <span>📅 รายเดือน มกราคม - ธันวาคม</span>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 py-1.5 px-4 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shadow-xs shrink-0">
            <span className="text-[13px] font-black text-indigo-650 dark:text-indigo-400">
              ตารางปฏิบัติงานรายปี {currentYear}
            </span>
            <div className="flex items-center gap-0.5 bg-white/90 dark:bg-slate-800/90 rounded-md p-0.5 border border-slate-200/50 dark:border-slate-700/50 ml-1.5 shadow-xs">
              <button
                onClick={() => setCurrentYear((y) => y - 1)}
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-slate-400 dark:hover:text-amber-400 cursor-pointer"
                title="ปีก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentYear((y) => y + 1)}
                 className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-slate-400 dark:hover:text-amber-400 cursor-pointer"
                title="ปีถัดไป"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="animate-pulse shrink-0 text-[11px] text-[#f59e0b] dark:text-amber-400 font-extrabold text-center md:text-right">
            <span>👉 เลื่อนขวาเพื่อดูวันที่ 1 - 31 👈</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed select-none">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                {/* Month header index */}
                <th 
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 text-center sticky left-0 z-20 shadow-[1px_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_rgba(30,41,59,1)] min-w-[110px] w-[110px]"
                >
                  เดือน
                </th>
                
                {/* 1 to 31 headers */}
                {Array.from({ length: 31 }, (_, idx) => idx + 1).map((d) => (
                  <th
                    key={`day-header-${d}`}
                    className="p-1 text-center bg-slate-50/85 dark:bg-slate-800/30 text-[11.5px] font-black text-slate-500 dark:text-slate-400 border-r border-[#e2e8f0] dark:border-slate-800/80 w-[42px] min-w-[36px]"
                  >
                    {d}
                  </th>
                ))}
                
                {/* Summary header */}
                <th className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 text-center min-w-[80px] w-[80px]">
                  สรุป
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {monthsData.map((m) => {
                const gregorianYear = currentYear - 543;
                const totalDaysInMonth = new Date(gregorianYear, m.id + 1, 0).getDate();
                const summary = monthlySummaries[m.id] || { workDays: 0, eventCount: 0 };

                return (
                  <tr key={m.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                    {/* Sticky Month Column */}
                    <td 
                      className="px-4 py-3.5 text-left border-r border-[#e2e8f0] dark:border-slate-800 font-bold sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.015)]"
                    >
                      <div className="border-l-[4px] border-[#6366f1]/90 pl-2.5 py-0.5">
                        <span className="font-black text-slate-900 dark:text-slate-50 text-[13.5px] tracking-tight block">
                          {m.name}
                        </span>
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block font-bold mt-0.5 select-none">
                          {currentYear}
                        </span>
                      </div>
                    </td>

                    {/* render 31 cells representing the calendar days */}
                    {Array.from({ length: 31 }, (_, idx) => idx + 1).map((d) => {
                      const isValidDay = d <= totalDaysInMonth;

                      if (!isValidDay) {
                        // Days that don't exist in the month (slanted stripes)
                        return (
                          <td
                            key={`invalid-cell-${m.id}-${d}`}
                            className="border-r border-[#e2e8f0] dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(45deg, rgba(148,163,184,0.1) 0px, rgba(148,163,184,0.1) 1px, transparent 1.5px, transparent 7px)",
                            }}
                          />
                        );
                      }

                      // Dynamic details
                      const dateObj = new Date(gregorianYear, m.id, d);
                      const dayOfWeek = dateObj.getDay();
                      const dayName = dayNames[dayOfWeek];
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isHoliday = isDayHoliday(d, m.id, currentYear);
                      const isRedDay = isWeekend || isHoliday;
                      
                      // Calculate and filter events matching current choices
                      const dayEvents = getFilteredEventsForDay(d, m.id, currentYear);
                      const hasFilteredEvents = dayEvents.length > 0;

                      // Check if matches today
                      const todayDateObj = new Date();
                      const isToday =
                        m.id === todayDateObj.getMonth() &&
                        d === todayDateObj.getDate() &&
                        currentYear === todayDateObj.getFullYear() + 543;

                      // Advanced styling classes to highlight matching search elements and push readability
                      let cellBgClass = "bg-white dark:bg-slate-900";
                      let borderRingClass = "";
                      
                      if (isToday) {
                        cellBgClass = "bg-indigo-50/30 dark:bg-indigo-950/20";
                        borderRingClass = "ring-1 ring-inset ring-indigo-500/25";
                      } else if (isRedDay) {
                        // Saturdays, Sundays & holidays colored in soft red tint to stand out beautifully
                        cellBgClass = "bg-rose-50/70 dark:bg-rose-950/25";
                      }

                      // If search filter is active: non-matches look faded, and matches pop out cleanly to guide eye instantly!
                      if (isFilterActive) {
                        if (hasFilteredEvents) {
                          cellBgClass = "bg-indigo-50/70 dark:bg-indigo-950/30 transition-all font-bold scale-[1.01]";
                          borderRingClass = "ring-2 ring-inset ring-indigo-500/50 dark:ring-indigo-500/60";
                        } else {
                          cellBgClass = `${cellBgClass} opacity-30 saturate-50`;
                        }
                      }

                      return (
                        <td
                          key={`day-cell-${m.id}-${d}`}
                          className={`p-0.5 border-r border-[#e2e8f0] dark:border-slate-800 text-center transition-all cursor-pointer relative h-[56px] ${cellBgClass} ${borderRingClass} hover:bg-slate-50 dark:hover:bg-indigo-950/15 hover:scale-[1.02] hover:z-20 hover:shadow-md`}
                          onClick={() =>
                            onDayClick &&
                            onDayClick({ day: d, month: m.id, year: currentYear })
                          }
                        >
                          {/* Top part: Week day character (Su, Mo, Tu, ...) */}
                          <div
                            className={`text-[9.5px] leading-none pt-0.5 select-none ${
                              isToday
                                ? "text-[#6366f1] font-black"
                                : isRedDay
                                ? "text-[#f43f5e] font-bold"
                                : "text-slate-350 dark:text-slate-600 font-semibold"
                            }`}
                          >
                            {dayName}
                          </div>

                          {/* Event Indicators Wrapper */}
                          <div className="absolute inset-x-0.5 bottom-1 flex items-center justify-center h-[28px] overflow-hidden">
                            {displayMode === "dots" ? (
                              /* Clean Minimal Circles Dots View (MUCH easier to read!) */
                              <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                                {dayEvents.slice(0, 3).map((evt, eIdx) => {
                                  const category = getEventCategory(evt);
                                  return (
                                    <span
                                      key={evt.id || `evt-${eIdx}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDayClick) {
                                          onDayClick({
                                            day: d,
                                            month: m.id,
                                            year: currentYear,
                                            selectedEventId: evt.id,
                                          });
                                        }
                                      }}
                                      className={`w-2 h-2 rounded-full ${category.color} ring-1 ring-white/20 dark:ring-black/10 shadow-sm cursor-pointer hover:scale-125 transition-transform`}
                                      title={evt.title}
                                    />
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <span className="text-[8.5px] leading-none font-extrabold text-indigo-600 dark:text-indigo-400 pl-0.5">
                                    +{dayEvents.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              /* Classic full colored stripe/bar view */
                              <div className="flex flex-col gap-0.5 w-full h-full justify-end px-0.5 pb-0.5">
                                {dayEvents.slice(0, 3).map((evt, eIdx) => {
                                  const category = getEventCategory(evt);
                                  return (
                                    <div
                                      key={evt.id || `evt-${eIdx}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDayClick) {
                                          onDayClick({
                                            day: d,
                                            month: m.id,
                                            year: currentYear,
                                            selectedEventId: evt.id,
                                          });
                                        }
                                      }}
                                      className={`h-[4.5px] w-full rounded-[1px] ${category.color} opacity-90 shadow-sm cursor-pointer hover:opacity-100`}
                                      title={evt.title}
                                    />
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <div className="text-[7.5px] leading-none text-slate-500 font-black text-center dark:text-slate-400 select-none">
                                    +{dayEvents.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Dynamic small blue dot for Today */}
                          {isToday && (
                            <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-[#6366f1] animate-pulse" />
                          )}
                        </td>
                      );
                    })}

                    {/* Summary Cell (rightmost column) */}
                    <td className="px-3 border-l border-[#e2e8f0] dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 font-medium text-xs">
                      <div className="flex flex-col gap-1 justify-center py-1">
                        <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 select-none">
                          <span className="font-bold text-[10.5px]">งาน</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {summary.eventCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-700/50 pt-1 select-none">
                          <span className="font-bold text-[10.5px]">วัน</span>
                          <span className="font-black text-indigo-600 dark:text-indigo-400">
                            {summary.workDays}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Elegant Color Legend Panel matching Image 3 specifically for color category meanings */}
      <div className="mt-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10 text-sm font-bold shadow-md animate-in fade-in duration-300">
        <div className="flex items-center gap-2.5">
          <span className="w-4.5 h-4.5 rounded-full bg-[#f43f5e] shadow-md shadow-[#f43f5e]/25 animate-pulse" />
          <span className="text-slate-800 dark:text-slate-200 text-[14.5px]">สำคัญมาก</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-4.5 h-4.5 rounded-full bg-[#f59e0b] shadow-md shadow-[#f59e0b]/25" />
          <span className="text-slate-800 dark:text-slate-200 text-[14.5px]">ปานกลาง</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-4.5 h-4.5 rounded-full bg-[#22c55e] shadow-md shadow-[#22c55e]/25" />
          <span className="text-slate-800 dark:text-slate-200 text-[14.5px]">ปกติ</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-4.5 h-4.5 rounded-full bg-[#6366f1] shadow-md shadow-[#6366f1]/25" />
          <span className="text-slate-800 dark:text-slate-200 text-[14.5px]">ทั่วไป/นัดหมาย</span>
        </div>
      </div>
    </div>
  );
}
