import {
  Calendar,
  Download,
  Settings,
  Bell,
  HelpCircle,
  User,
  LogOut,
  ChevronDown,
  LogIn,
  Printer,
  FileSpreadsheet,
  FileText,
  Users,
  Plus,
  Upload,
  FolderTree,
} from "lucide-react";
import { useState, useRef, useEffect, ChangeEvent } from "react";

interface ToolbarProps {
  currentView: "year" | "month" | "week" | "day" | "table" | "dashboard";
  onViewChange: (
    view: "year" | "month" | "week" | "day" | "table" | "dashboard",
  ) => void;
  onAddEvent: () => void;
  onAction: (action: string) => void;
  isLoggedIn?: boolean;
  currentUsername?: string | null;
  userRole?: string | null;
}

export default function Toolbar({
  currentView,
  onViewChange,
  onAddEvent,
  onAction,
  isLoggedIn,
  currentUsername,
  userRole,
}: ToolbarProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportRef.current &&
        !exportRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAction("import");
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div
      className={`relative z-30 rounded-2xl mx-auto max-w-7xl px-4 py-3 mt-6 ${isLoggedIn ? "mb-4" : "mb-6"} bg-white/80 backdrop-blur-md dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors`}
    >
      {/* Left section for balance (empty or space holder) */}
      <div className="hidden md:flex md:w-1/4 select-none pointer-events-none opacity-0"></div>

      {/* Centered Segmented View Toggles */}
      <div className="w-full md:w-auto flex-1 flex justify-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700 w-full sm:w-auto overflow-x-auto scrollbar-hide shrink-0 items-center justify-center gap-0.5">
          {(isLoggedIn && (userRole === "admin" || userRole === "superadmin")
            ? (["year", "month", "week", "day", "table", "dashboard"] as const)
            : (["year", "month", "week", "day", "table"] as const)
          ).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`w-[85px] sm:w-[105px] text-center py-1.5 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                currentView === view
                  ? "bg-indigo-600 text-white shadow-sm font-black text-[#ffffff]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/50"
              }`}
            >
              {view === "year"
                ? "รายปี"
                : view === "month"
                  ? "รายเดือน"
                  : view === "week"
                    ? "รายสัปดาห์"
                    : view === "day"
                      ? "รายวัน"
                      : view === "table"
                        ? "แบบตาราง"
                        : "แดชบอร์ด"}
            </button>
          ))}
        </div>
      </div>

      {/* Export Menu Dropdown on the right */}
      <div className="w-full md:w-1/4 flex justify-end shrink-0">
        {isLoggedIn ? (
          <div className="relative w-full sm:w-auto" ref={exportRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl transition-all font-bold text-[13px] shrink-0 bg-white/50 dark:bg-slate-800/55 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>ส่งออกข้อมูล</span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-60 ml-0.5 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isExportMenuOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1.5 z-50">
                <button
                  onClick={() => {
                    onAction("export_pdf");
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 text-slate-800 dark:text-slate-200 text-[13.5px] font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-[18px] h-[18px] text-rose-500" />{" "}
                  พิมพ์ / PDF
                </button>
                <button
                  onClick={() => {
                    onAction("export_excel");
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 text-slate-800 dark:text-slate-200 text-[13.5px] font-bold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-[18px] h-[18px] text-emerald-500" />{" "}
                  ส่งออก Excel
                </button>
                <button
                  onClick={() => {
                    onAction("export_word");
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 text-slate-800 dark:text-slate-200 text-[13.5px] font-bold transition-colors cursor-pointer"
                >
                  <FileText className="w-[18px] h-[18px] text-blue-500" />{" "}
                  ส่งออก Word
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:block w-3 sm:w-auto h-8 opacity-0 pointer-events-none" />
        )}
      </div>
    </div>
  );
}
