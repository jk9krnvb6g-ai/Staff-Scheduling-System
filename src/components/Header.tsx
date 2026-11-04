import { Moon, Sun, CalendarDays, UserCheck, Users, UserCog, Bell, Settings, LogOut, LogIn } from 'lucide-react';

interface HeaderProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  isLoggedIn?: boolean;
  currentUsername?: string | null;
  userRole?: string | null;
  userWorkGroup?: string;
  userDepartment?: string;
  onlineCount?: number;
  onAction?: (action: string) => void;
}

export default function Header({ 
  isDarkMode, 
  toggleTheme,
  isLoggedIn,
  currentUsername,
  userRole,
  userWorkGroup,
  userDepartment,
  onlineCount,
  onAction
}: HeaderProps) {
  const hasPeopleOnline = (onlineCount ?? 0) > 1;

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 text-slate-900 dark:text-slate-50 border-b border-slate-200/60 dark:border-slate-800 py-3 px-6 flex flex-col md:flex-row items-center justify-between shadow-sm transition-colors duration-300">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
          <CalendarDays className="w-5 h-5 text-white/90" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">ระบบจัดการปฏิทินการทำงานเข้าเจ้าหน้าที่</h1>
          <div className="flex items-center space-x-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            <span>โรงพยาบาลสามชุก</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3 justify-end">
        {/* 1. ปุ่มผู้ดูแลระบบสูงสุด (Label) */}
        <div className="flex flex-col text-right pr-1 select-none">
          <div className="text-[13.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
            {isLoggedIn ? (currentUsername || "ผู้ใช้งาน") : "ผู้เยี่ยมชม"}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
            {isLoggedIn ? `${userWorkGroup || '-'} / ${userDepartment || '-'}` : "บุคคลทั่วไป"}
          </div>
        </div>

        {/* 2. ปุ่มเปลี่ยนโหมด */}
        {toggleTheme && (
          <button 
            onClick={toggleTheme}
            className="p-2 border border-slate-200 dark:border-slate-700/65 bg-white/70 dark:bg-slate-800 text-slate-550 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
            title={isDarkMode ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
          >
            {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
        )}

        {/* 3. ปุ่มจัดการผู้ใช้งานและอนุมัติสิทธิ์ (No text, UserCog icon) */}
        {isLoggedIn && (userRole === "admin" || userRole === "superadmin") && (
          <button
            onClick={() => onAction?.("systemManagement")}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/50 dark:bg-slate-800/55 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/65 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
            title="จัดการผู้ใช้งานและอนุมัติสิทธิ์"
          >
            <UserCog className="w-[18px] h-[18px] text-indigo-500 dark:text-indigo-400" />
          </button>
        )}

        {/* 4. ปุ่มใครออน */}
        {isLoggedIn && (
          <button
            onClick={() => onAction?.("onlineUsers")}
            className={`p-2.5 rounded-xl border transition-all shadow-sm shrink-0 flex items-center justify-center relative cursor-pointer ${
              hasPeopleOnline 
                ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/20" 
                : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/65 bg-white/50 dark:bg-slate-800/55 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={onlineCount && onlineCount > 0 ? `ผู้ออนไลน์สะสม (${onlineCount} คน)` : "ใครออนไลน์บ้าง"}
          >
            {hasPeopleOnline ? (
              <>
                <UserCheck className="w-[18px] h-[18px] text-emerald-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full animate-ping"></span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full"></span>
              </>
            ) : (
              <Users className="w-[18px] h-[18px]" />
            )}
          </button>
        )}

        {/* 5. ปุ่มกระดิ่ง */}
        {isLoggedIn && (
          <button
            onClick={() => onAction?.("notifications")}
            className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/65 rounded-xl transition-all bg-white/50 dark:bg-slate-800/55 shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
            title="การแจ้งเตือน"
          >
            <Bell className="w-[18px] h-[18px] text-amber-500 dark:text-amber-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        )}

        {/* 6. ปุ่มจัดการกลุ่มและหน่วยงาน ในสังกัด */}
        {isLoggedIn && (userRole === "admin" || userRole === "superadmin") && (
          <button
            onClick={() => onAction?.("manageWorkgroups")}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/65 rounded-xl transition-all bg-white/55 dark:bg-slate-800/55 shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
            title="จัดการกลุ่มงานและหน่วยงาน ในสังกัด"
          >
            <Settings className="w-[18px] h-[18px] text-indigo-500" />
          </button>
        )}

        {/* 7. ปุ่มออกจากระบบ / เข้าสู่ระบบ */}
        {isLoggedIn ? (
          <button
            onClick={() => onAction?.("logout")}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-rose-650 dark:text-rose-405 hover:text-white dark:hover:text-white hover:bg-rose-500 dark:hover:bg-rose-650 border border-rose-200 dark:border-rose-900/30 rounded-xl transition-all font-bold text-[13px] shadow-sm shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        ) : (
          <button
            onClick={() => onAction?.("login")}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-[13px] shadow-sm shrink-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </header>
  );
}
