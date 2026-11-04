import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Filter, X, CheckCircle2, Sparkles, LayoutGrid, Plus } from "lucide-react";
import { EventItem } from "../data/mockEvents";
import { getEventsForDate, isDayHoliday, SelectedDate } from "../lib/dateUtils";

export function MonthlyCalendar({
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

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };
  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const monthYearString = currentDate.toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay(); // 0-6
  const prevMonthDays = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0,
  ).getDate();

  const gridCells = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    const day = prevMonthDays - firstDayOfMonth + i + 1;
    gridCells.push({
      day,
      isOtherMonth: true,
      isPrevMonth: true,
      isNextMonth: false,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push({
      day: i,
      isOtherMonth: false,
      isPrevMonth: false,
      isNextMonth: false,
    });
  }
  const totalCells = gridCells.length <= 35 ? 35 : 42;
  const nextMonthCount = totalCells - gridCells.length;
  for (let i = 1; i <= nextMonthCount; i++) {
    gridCells.push({
      day: i,
      isOtherMonth: true,
      isPrevMonth: false,
      isNextMonth: true,
    });
  }

  const renderEventPill = (event: EventItem, dayVal: number) => {
    const bgMap = {
      urgent:
        "bg-rose-50/80 text-rose-600 border border-rose-200/60 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400",
      medium:
        "bg-amber-50/80 text-amber-600 border border-amber-200/60 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400",
      normal:
        "bg-emerald-50/80 text-emerald-600 border border-emerald-200/60 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
      info: "bg-indigo-50/80 text-indigo-600 border border-indigo-200/60 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400",
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
          month: currentDate.getMonth(),
          year: currentDate.getFullYear(),
          selectedEventId: event.id,
        });
      }
    };

    if (displayMode === "dots") {
      return (
        <div
          key={event.id}
          onClick={handleClick}
          className={`flex items-center px-1.5 py-0.5 mb-0.5 rounded text-[11px] font-bold truncate ${textColors[event.type]} cursor-pointer transition-all duration-150 group`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${dotMap[event.type]} ring-1 ring-white/10 group-hover:scale-125 transition-transform`}
          ></span>
          {event.time && (
            <span className="mr-1 opacity-75 font-semibold text-[10px]">{event.time}</span>
          )}
          <span className="truncate">{event.title}</span>
        </div>
      );
    }

    return (
      <div
        key={event.id}
        onClick={handleClick}
        className={`flex items-center px-1.5 py-1 mb-1 rounded-md text-[11px] font-medium border truncate ${bgMap[event.type]} cursor-pointer transition-all duration-200 group`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotMap[event.type]} group-hover:scale-125 transition-transform`}
        ></span>
        {event.time && (
          <span className="mr-1.5 opacity-70 font-semibold">{event.time}</span>
        )}
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  const renderDayCell = (
    cell: {
      day: number;
      isOtherMonth: boolean;
      isPrevMonth: boolean;
      isNextMonth: boolean;
    },
    idx: number,
  ) => {
    const rawEvents = !cell.isOtherMonth
      ? getEventsForDate(
          eventsMap,
          cell.day,
          currentDate.getMonth(),
          currentDate.getFullYear(),
        )
      : [];
    
    // Apply filters to day events
    const cellEvents = filterEventsList(rawEvents);

    const nowToday = new Date();
    const isToday =
      !cell.isOtherMonth &&
      cell.day === nowToday.getDate() &&
      currentDate.getMonth() === nowToday.getMonth() &&
      currentDate.getFullYear() === nowToday.getFullYear();
    const isHoliday =
      !cell.isOtherMonth &&
      isDayHoliday(cell.day, currentDate.getMonth(), currentDate.getFullYear());

    const backgroundClass = cell.isOtherMonth
      ? "bg-slate-50 dark:bg-slate-900"
      : isToday
        ? "bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-800"
        : isHoliday
          ? "bg-rose-50/70 dark:bg-rose-950/20"
          : "bg-white dark:bg-slate-800";

    return (
      <div
        key={`cell-${idx}`}
        onClick={() => {
          if (!cell.isOtherMonth && onDayClick) {
            onDayClick({
              day: cell.day,
              month: currentDate.getMonth(),
              year: currentDate.getFullYear(),
            });
          }
        }}
        className={`min-h-[100px] p-1.5 border-r border-b border-slate-200 dark:border-slate-700 ${backgroundClass} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex flex-col`}
      >
        <div className="flex justify-end mb-1">
          <span
            className={`text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded ${isToday ? "bg-[#6366f1] text-white shadow-sm" : cell.isOtherMonth ? "text-slate-400 dark:text-slate-500" : isHoliday ? "text-[#f43f5e] font-bold" : "text-slate-700 dark:text-slate-300"}`}
          >
            {cell.day}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          {cellEvents.map((event) => renderEventPill(event, cell.day))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      {/* 2. Interactive Search & Filters Panel for Monthly View */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-755 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-4">
        
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="พิมพ์คำค้นหากิจกรรมรายเดือน..."
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
              <span>กำลังกรองกิจกรรมรายเดือน:</span>
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
        {/* Subtle Horizontal Scroll Assist Guide & Centered Monthly Title */}
        <div className="bg-slate-50/50 dark:bg-transparent px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 select-none text-[12px] font-bold">
          <div className="text-slate-500 dark:text-slate-400 shrink-0 text-center md:text-left">
            <span>📅 มุมมองปฏิทินรายเดือน</span>
          </div>

          <div className="flex items-center gap-1.5 bg-indigo-50/40 dark:bg-indigo-950/20 py-1.5 px-4 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shadow-xs shrink-0 select-text">
            <span className="text-[13px] font-black text-indigo-650 dark:text-indigo-400">
              ตารางปฏิบัติงานรายเดือน {monthYearString}
            </span>
            <div className="flex items-center gap-0.5 bg-white/90 dark:bg-slate-800/90 rounded-md p-0.5 border border-slate-200/50 dark:border-slate-700/50 ml-1.5 shadow-xs">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-slate-300 cursor-pointer"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all text-slate-500 hover:text-[#6366f1] dark:text-slate-300 cursor-pointer"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 font-extrabold text-center md:text-right">
            <span>✨ ดับเบิลคลิกหรือแตะช่องเพื่อจัดการกิจกรรม</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          {[
            "วันอาทิตย์",
            "วันจันทร์",
            "วันอังคาร",
            "วันพุธ",
            "วันพฤหัสบดี",
            "วันศุกร์",
            "วันเสาร์",
          ].map((day, idx) => (
            <div
              key={day}
              className={`py-2 text-center text-[11px] font-medium border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${idx === 0 || idx === 6 ? "text-[#f43f5e]" : "text-slate-500 dark:text-slate-400"}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-slate-200 dark:border-slate-700">
          {gridCells.map((cell, i) => renderDayCell(cell, i))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#f43f5e]"></span> สำคัญมาก
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#f59e0b]"></span> ปานกลาง
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#22c55e]"></span> ปกติ
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#6366f1]"></span>{" "}
            ทั่วไป/นัดหมาย
          </div>
        </div>
      </div>
    </div>
  );
}
