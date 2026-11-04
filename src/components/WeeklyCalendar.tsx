import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Target, Search, Filter, X, CheckCircle2, Sparkles, LayoutGrid, Plus } from "lucide-react";
import { EventItem } from "../data/mockEvents";
import { getEventsForDate, isDayHoliday, SelectedDate } from "../lib/dateUtils";

export function WeeklyCalendar({
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
  // Start with Sunday of the current week dynamically
  const [startOfWeekDate, setStartOfWeekDate] = useState(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - day,
    );
  });

  // State managers for high-level search and dropdown filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkGroup, setSelectedWorkGroup] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  // Custom Display Mode choice to let users switch between dots (minimalist) & bars (original)
  const [displayMode, setDisplayMode] = useState<"dots" | "bars">("bars");

  // Dynamically extract unique work groups and departments from all loaded events
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

  const filterEventsList = (evs: EventItem[]) => {
    return evs.filter((evt) => {
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

  const handlePrevWeek = () => {
    setStartOfWeekDate(
      new Date(
        startOfWeekDate.getFullYear(),
        startOfWeekDate.getMonth(),
        startOfWeekDate.getDate() - 7,
      ),
    );
  };
  const handleNextWeek = () => {
    setStartOfWeekDate(
      new Date(
        startOfWeekDate.getFullYear(),
        startOfWeekDate.getMonth(),
        startOfWeekDate.getDate() + 7,
      ),
    );
  };
  const handleThisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    setStartOfWeekDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - day),
    );
  };

  const endOfWeekDate = new Date(
    startOfWeekDate.getFullYear(),
    startOfWeekDate.getMonth(),
    startOfWeekDate.getDate() + 6,
  );

  const formatDateStr = (date: Date) => {
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  };
  const formatYearStr = (date: Date) => {
    return date.getFullYear() + 543; // Basic Thai year display
  };
  const weekLabel = `${formatDateStr(startOfWeekDate)} — ${formatDateStr(endOfWeekDate)} ${formatYearStr(endOfWeekDate)}`;

  const weekDayNames = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  const colors = [
    {
      color: "text-rose-500",
      border: "border-t-rose-500",
      headerBg: "bg-rose-50/50 dark:bg-rose-900/10",
    },
    {
      color: "text-amber-500",
      border: "border-t-amber-500",
      headerBg: "bg-amber-50/50 dark:bg-amber-900/10",
    },
    {
      color: "text-pink-500",
      border: "border-t-pink-500",
      headerBg: "bg-pink-50/50 dark:bg-pink-900/10",
    },
    {
      color: "text-emerald-500",
      border: "border-t-emerald-500",
      headerBg: "bg-emerald-50/50 dark:bg-emerald-900/10",
    },
    {
      color: "text-orange-500",
      border: "border-t-orange-500",
      headerBg: "bg-orange-50/50 dark:bg-orange-900/10",
    },
    {
      color: "text-indigo-500",
      border: "border-t-indigo-500",
      headerBg: "bg-indigo-500 text-white",
      activeHeader: "shadow-lg shadow-indigo-500/30",
    },
    {
      color: "text-purple-500",
      border: "border-t-purple-500",
      headerBg: "bg-purple-50/50 dark:bg-purple-900/10",
    },
  ];

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(
      startOfWeekDate.getFullYear(),
      startOfWeekDate.getMonth(),
      startOfWeekDate.getDate() + i,
    );
    const nowToday = new Date();
    const isToday =
      d.getDate() === nowToday.getDate() &&
      d.getMonth() === nowToday.getMonth() &&
      d.getFullYear() === nowToday.getFullYear();
    const isHoliday = isDayHoliday(d.getDate(), d.getMonth(), d.getFullYear());
    const isRedDay = i === 0 || i === 6 || isHoliday;

    let dayHeaderBg = colors[i].headerBg;
    if (isToday) {
      dayHeaderBg = "bg-indigo-600 text-white";
    } else if (isRedDay) {
      dayHeaderBg = "bg-rose-500/10 dark:bg-rose-950/30 text-[#f43f5e]";
    }

    return {
      name: weekDayNames[i],
      date: d.getDate(),
      month: d.getMonth(),
      color: isRedDay ? "text-rose-500" : colors[i].color,
      border: isRedDay ? "border-t-rose-500" : colors[i].border,
      headerBg: dayHeaderBg,
      activeHeader: isToday ? "shadow-lg shadow-indigo-600/30 lg:ring-2 lg:ring-indigo-600/50" : "",
      isToday,
      isRedDay,
    };
  });

  const renderEvent = (event: EventItem, dayVal: number, monthVal: number, yearVal: number) => {
    const bgMap = {
      urgent:
        "bg-rose-50/80 text-rose-600 border-l-rose-500 dark:bg-rose-500/10 dark:text-rose-400",
      medium:
        "bg-amber-50/80 text-amber-600 border-l-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
      normal:
        "bg-emerald-50/80 text-emerald-600 border-l-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
      info: "bg-indigo-50/80 text-indigo-600 border-l-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
    };
    const textColors = {
      urgent: "text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20",
      medium: "text-amber-700 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20",
      normal: "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
      info: "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20",
    };
    const dotMap = {
      urgent: "bg-rose-500",
      medium: "bg-amber-500",
      normal: "bg-emerald-500",
      info: "bg-indigo-500",
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDayClick) {
        onDayClick({
          day: dayVal,
          month: monthVal,
          year: yearVal,
          selectedEventId: event.id,
        });
      }
    };

    if (displayMode === "dots") {
      return (
        <div
          key={event.id}
          onClick={handleClick}
          className={`flex items-center px-1.5 py-1 mb-1 rounded text-[11px] font-bold truncate ${textColors[event.type as keyof typeof textColors]} cursor-pointer transition-all duration-150 group`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${dotMap[event.type as keyof typeof dotMap]} ring-1 ring-white/10 group-hover:scale-125 transition-transform`}
          ></span>
          {event.time && (
            <span className="mr-1 opacity-75 font-semibold text-[10px]">{event.time}</span>
          )}
          <span className="truncate">{event.title}</span>
        </div>
      );
    }

    if (event.type === "urgent" && !event.time) {
      return (
        <div
          key={event.id}
          onClick={handleClick}
          className="text-[11px] text-rose-500 flex items-center gap-1.5 px-2 py-1.5 font-semibold bg-rose-50/50 dark:bg-rose-500/10 rounded-md cursor-pointer"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
          </svg>
          {event.title}
        </div>
      );
    }

    return (
      <div
        key={event.id}
        onClick={handleClick}
        className={`p-2 rounded-r-xl rounded-l-sm text-[11px] ${bgMap[event.type as keyof typeof bgMap]} border-y border-r border-transparent border-l-[3px] flex flex-col gap-0.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      >
        {event.time && (
          <div className="font-semibold opacity-80 text-[10px]">
            {event.time}
          </div>
        )}
        <div className="font-semibold leading-tight">{event.title}</div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      {/* 2. Interactive Search & Filters Panel for Weekly View */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-755 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4">
        
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="พิมพ์คำค้นหากิจกรรมรายสัปดาห์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          {/* Work Group Select */}
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

          {/* Department Select */}
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

          {/* Priority Select */}
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

        {/* Filter Summary Status */}
        {isFilterActive && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6366f1]" />
              <span>กำลังกรองกิจกรรมรายสัปดาห์:</span>
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden">
        {/* Subtle Horizontal Scroll Assist Guide & Centered Weekly Title */}
        <div className="bg-slate-50/50 dark:bg-transparent px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 select-none text-[12px] font-bold">
          <div className="text-slate-500 dark:text-slate-400 shrink-0 text-center md:text-left flex items-center gap-2">
            <span>📅 มุมมองปฏิทินรายสัปดาห์</span>
            <button
              onClick={handleThisWeek}
              className="px-2.5 py-0.5 bg-indigo-100/60 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 border border-indigo-200/30 dark:border-indigo-900/30 cursor-pointer"
            >
              <Target className="w-3 h-3" />
              <span>สัปดาห์นี้</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 py-1.5 px-4 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shadow-xs shrink-0 select-text bg-indigo-50/30">
            <span className="text-[13px] font-black text-indigo-650 dark:text-indigo-400">
              ตารางปฏิบัติงานรายสัปดาห์ {weekLabel}
            </span>
            <div className="flex items-center gap-0.5 bg-white/90 dark:bg-slate-800/90 rounded-md p-0.5 border border-slate-200/50 dark:border-slate-700/50 ml-1.5 shadow-xs">
              <button
                onClick={handlePrevWeek}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-indigo-300 cursor-pointer"
                title="สัปดาห์ก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextWeek}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-indigo-300 cursor-pointer"
                title="สัปดาห์ถัดไป"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 font-extrabold text-center md:text-right">
            <span>✨ แตะช่องวันเพื่อแก้ไขหรือแสดงแบบสรุป</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {weekDays.map((day) => {
            const rawEvents = getEventsForDate(
              eventsMap,
              day.date,
              day.month,
              startOfWeekDate.getFullYear(),
            );
            const events = filterEventsList(rawEvents);
            let colClasses = `min-h-[400px] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 last:border-r-0 border-t-[3px] ${day.border} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/20 transition-colors`;
            if (day.isToday) {
              colClasses += " bg-[rgba(99,102,241,0.02)]";
            } else if (day.isRedDay) {
              colClasses += " bg-rose-500/5 dark:bg-rose-950/15";
            }
            return (
              <div
                key={day.date}
                className={colClasses}
                onClick={() =>
                  onDayClick &&
                  onDayClick({
                    day: day.date,
                    month: day.month,
                    year: startOfWeekDate.getFullYear(),
                  })
                }
              >
                <div
                  className={`p-3 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-700 ${day.headerBg} ${day.activeHeader}`}
                >
                  <div
                    className={`text-[12px] font-bold ${day.isToday ? "text-white/90" : day.color}`}
                  >
                    {day.name}
                  </div>
                  <div className="text-[26px] font-bold leading-tight mt-0.5">
                    {day.date}
                  </div>
                  <div className="mt-1.5 bg-black/30 px-2 py-[2px] rounded text-[10px] font-medium min-w-[36px] text-center text-white">
                    {events.length} งาน
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-2">
                  {events.map((ev, idx) =>
                    renderEvent(
                      { ...ev, id: ev.id || `${day.date}-${idx}` },
                      day.date,
                      day.month,
                      startOfWeekDate.getFullYear()
                    )
                  )}
                </div>
              </div>
            );
          })}
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
