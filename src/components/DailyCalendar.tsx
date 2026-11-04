import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Filter, X, Plus, Calendar, Clock, MapPin, User, Sparkles } from "lucide-react";
import { EventItem } from "../data/mockEvents";
import { getEventsForDate, isDayHoliday, getHolidayName, SelectedDate } from "../lib/dateUtils";

export function DailyCalendar({
  eventsMap,
  onDayClick,
  isLoggedIn = false,
  onAddEvent,
}: {
  eventsMap: Record<string | number, EventItem[]>;
  onDayClick?: (date: SelectedDate) => void;
  isLoggedIn?: boolean;
  onAddEvent?: () => void;
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkGroup, setSelectedWorkGroup] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  // Unique filters from all loaded events
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

  const isFilterActive = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      selectedWorkGroup !== "" ||
      selectedDepartment !== "" ||
      selectedPriority !== ""
    );
  }, [searchTerm, selectedWorkGroup, selectedDepartment, selectedPriority]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedWorkGroup("");
    setSelectedDepartment("");
    setSelectedPriority("");
  };

  const day = currentDate.getDate();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const handlePrevDay = () => {
    setCurrentDate(new Date(year, month, day - 1));
  };

  const handleNextDay = () => {
    setCurrentDate(new Date(year, month, day + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const activeRawEvents = getEventsForDate(eventsMap, day, month, year);

  const filteredEvents = useMemo(() => {
    return activeRawEvents.filter((evt) => {
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const matchesSearch =
          (evt.title || "").toLowerCase().includes(lower) ||
          (evt.location || "").toLowerCase().includes(lower) ||
          (evt.responsibles || "").toLowerCase().includes(lower) ||
          (evt.description || "").toLowerCase().includes(lower);
        if (!matchesSearch) return false;
      }
      if (selectedWorkGroup && evt.workGroup !== selectedWorkGroup) return false;
      if (selectedDepartment && evt.department !== selectedDepartment) return false;
      if (selectedPriority && evt.type !== selectedPriority) return false;
      return true;
    });
  }, [activeRawEvents, searchTerm, selectedWorkGroup, selectedDepartment, selectedPriority]);

  const thaiDateString = currentDate.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isHoliday = isDayHoliday(day, month, year);
  const holidayName = getHolidayName(day, month, year);

  // Sorting events by time
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const timeA = a.time || "23:59";
      const timeB = b.time || "23:59";
      return timeA.localeCompare(timeB);
    });
  }, [filteredEvents]);

  const priorityMeta = {
    urgent: {
      label: "สำคัญมาก",
      bg: "bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20 dark:bg-rose-500/20",
      pillBg: "bg-rose-500",
      line: "border-l-rose-500",
    },
    medium: {
      label: "ปานกลาง",
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20 dark:bg-amber-500/20",
      pillBg: "bg-amber-500",
      line: "border-l-amber-500",
    },
    normal: {
      label: "ปกติ",
      bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 dark:bg-emerald-500/20",
      pillBg: "bg-emerald-500",
      line: "border-l-emerald-500",
    },
    info: {
      label: "ทั่วไป/นัดหมาย",
      bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:bg-indigo-500/20",
      pillBg: "bg-indigo-500",
      line: "border-l-indigo-500",
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="พิมพ์คำค้นหากิจกรรมรายวัน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>

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

            <div className="flex flex-col">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all font-bold cursor-pointer"
              >
                <option value="">ความสำคัญทั้งหมด</option>
                <option value="urgent">สำคัญมาก</option>
                <option value="medium">ปานกลาง</option>
                <option value="normal">ปกติ</option>
                <option value="info">ทั่วไป/นัดหมาย</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end shrink-0 self-end lg:self-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
            {isFilterActive && (
              <div className="flex items-center justify-center">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 transition-all cursor-pointer"
                  title="ล้างตัวกรอง"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isLoggedIn && (
              <button
                onClick={onAddEvent}
                className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 hover:text-white hover:bg-[#16a34a] px-3.5 py-2 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 bg-[#22c55e]/10 dark:bg-emerald-500/5 transition-all font-bold text-[13px] shrink-0 cursor-pointer animate-in fade-in"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มกิจกรรม</span>
              </button>
            )}
          </div>
        </div>

        {isFilterActive && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/20 animate-in slide-in-from-top-1">
            <div className="flex flex-wrap gap-2.5 items-center">
              <span>กำลังกรองกิจกรรมรายวัน:</span>
              {searchTerm && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">คำหลัก: "{searchTerm}"</span>}
              {selectedWorkGroup && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">กลุ่มงาน: {selectedWorkGroup}</span>}
              {selectedDepartment && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">หน่วยงาน: {selectedDepartment}</span>}
              {selectedPriority && <span className="bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-[11px]">ความสำคัญ: {priorityMeta[selectedPriority as keyof typeof priorityMeta]?.label}</span>}
            </div>
            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-500 hover:text-rose-600 transition-colors underline cursor-pointer"
            >
              ล้างทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Main Daily Calendar Container */}
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden ${isHoliday ? "bg-rose-500/[0.02] dark:bg-rose-950/[0.04]" : ""}`}>
        {/* Navigation Header with Background-removal compatible styles */}
        <div className="bg-slate-50/50 dark:bg-transparent px-4 py-3.5 border-b border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 select-none text-[12px] font-bold">
          <div className="text-slate-500 dark:text-slate-400 shrink-0 text-center md:text-left flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>📅 มุมมองปฏิทินรายวัน</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 py-1.5 px-4 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shadow-xs shrink-0 select-text">
            <span className={`text-[13.5px] font-black ${isHoliday ? "text-rose-600 dark:text-rose-400" : "text-indigo-650 dark:text-indigo-400"}`}>
              {thaiDateString}
            </span>
            <div className="flex items-center gap-0.5 bg-white/90 dark:bg-slate-800/90 rounded-md p-0.5 border border-slate-200/50 dark:border-slate-700/50 ml-1.5 shadow-xs">
              <button
                onClick={handlePrevDay}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-slate-300 cursor-pointer"
                title="วันก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleToday}
                className="px-2 py-0.5 text-[10.5px] font-black tracking-tight text-slate-600 hover:text-[#6366f1] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all"
                title="กระโดดไปวันนี้"
              >
                วันนี้
              </button>
              <button
                onClick={handleNextDay}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-slate-300 cursor-pointer"
                title="วันถัดไป"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 font-extrabold text-center md:text-right">
            <span>✨ ดับเบิลคลิกหรือแตะกิจกรรมเพื่อจัดการข้อมูล</span>
          </div>
        </div>

        {/* Holiday banner if there's one */}
        {isHoliday && holidayName && (
          <div className="p-3.5 bg-rose-500/10 dark:bg-rose-950/30 border-b border-rose-200/40 dark:border-rose-900/20 flex items-center justify-center gap-2 text-rose-650 dark:text-rose-400 font-bold text-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shadow-md shadow-[#f43f5e]/25 animate-pulse" />
            <span className="text-[13.5px] font-extrabold text-rose-700 dark:text-rose-350">
              วันหยุด: {holidayName}
            </span>
          </div>
        )}

        {/* Daily Schedule List */}
        <div className="p-4 sm:p-6 min-h-[350px]">
          {sortedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-150 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-900 dark:text-slate-100 font-bold text-[16px] mb-1">
                ไม่มีกิจกรรมการปฏิบัติงานในวันนี้
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4.5">
                เลือกวันอื่นๆ หรือคลิกปุ่มด้านขวาบนเพื่อสร้างกิจกรรมใหม่ได้ทันที
              </p>
              {isLoggedIn && (
                <button
                  onClick={onAddEvent}
                  className="px-4 py-2 text-xs font-bold bg-[#6366f1] text-white rounded-lg shadow-sm hover:bg-indigo-600 transition-all cursor-pointer"
                >
                  สร้างกิจกรรมแรกในวันนี้
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {sortedEvents.map((event) => {
                const meta = priorityMeta[event.type as keyof typeof priorityMeta] || priorityMeta.normal;
                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      if (onDayClick) {
                        onDayClick({ day, month, year, selectedEventId: event.id });
                      }
                    }}
                    className={`flex flex-col sm:flex-row bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 border-l-[4px] ${meta.line} rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:translate-x-0.5`}
                  >
                    {/* Time or duration Column */}
                    <div className="flex items-center gap-2 w-full sm:w-1/4 shrink-0 pb-3 sm:pb-0 border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-slate-700/60 mr-4">
                      <Clock className="w-[15px] h-[15px] text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-[14px] font-black text-slate-700 dark:text-slate-200">
                        {event.time || "ตลอดทั้งวัน"}
                      </span>
                    </div>

                    {/* Core Event Content Column */}
                    <div className="flex-1 space-y-2 mt-3 sm:mt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide border ${meta.bg}`}>
                          {meta.label}
                        </span>
                        {event.workGroup && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 px-2 py-0.5 rounded-full text-[10.5px] font-medium">
                            {event.workGroup}
                          </span>
                        )}
                        {event.department && (
                          <span className="bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 border border-indigo-100/10 dark:border-indigo-900/10 px-2 py-0.5 rounded-full text-[10.5px] font-medium">
                            {event.department}
                          </span>
                        )}
                      </div>

                      <h3 className="text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11.5px] text-slate-500 dark:text-slate-400">
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.ownerId && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>ผู้รับผิดชอบ: <span className="font-extrabold text-slate-700 dark:text-slate-200">{event.ownerId}</span></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
