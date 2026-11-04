import {
  X,
  Clock,
  MapPin,
  User,
  Building,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  PlusCircle,
  BellOff,
  AlertCircle,
  Users,
} from "lucide-react";
import { EventItem } from "../data/mockEvents";
import { getHolidayName, isDayHoliday } from "../lib/dateUtils";

interface DayDetailsModalProps {
  date: number;
  month?: number;
  year?: number;
  events: EventItem[];
  onClose: () => void;
  onAddEvent: (day: number, month?: number, year?: number) => void;
  onEdit?: (event: EventItem) => void;
  onDelete?: (eventId: string) => void;
  isLoggedIn?: boolean;
  userRole?: "admin" | "staff" | "user" | null;
  currentUsername?: string | null;
}

export function DayDetailsModal({
  date,
  month,
  year,
  events,
  onClose,
  onAddEvent,
  onEdit,
  onDelete,
  isLoggedIn,
  userRole,
  currentUsername,
}: DayDetailsModalProps) {
  const dNow = new Date();
  const m = month !== undefined ? month : dNow.getMonth();
  const y =
    year !== undefined
      ? year < 2500
        ? year + 543
        : year
      : dNow.getFullYear() + 543;
  const thaiMonth =
    m === 0
      ? "มกราคม"
      : m === 1
        ? "กุมภาพันธ์"
        : m === 2
          ? "มีนาคม"
          : m === 3
            ? "เมษายน"
            : m === 4
              ? "พฤษภาคม"
              : m === 5
                ? "มิถุนายน"
                : m === 6
                  ? "กรกฎาคม"
                  : m === 7
                    ? "สิงหาคม"
                    : m === 8
                      ? "กันยายน"
                      : m === 9
                        ? "ตุลาคม"
                        : m === 10
                          ? "พฤศจิกายน"
                          : m === 11
                            ? "ธันวาคม"
                            : "เมษายน";
  const holidayName = getHolidayName(date, m, y);
  const isWeekend =
    typeof holidayName === "string" &&
    (holidayName.includes("วันเสาร์") || holidayName.includes("วันอาทิตย์"));
  const isLaborDay = m === 4 && date === 1;
  const isHoliday = isDayHoliday(date, m, y) && !isLaborDay;

  // Rule 4 constraint: past date is strictly before today (00:00)
  const todayStart = new Date(
    dNow.getFullYear(),
    dNow.getMonth(),
    dNow.getDate(),
  );
  const gYear =
    year !== undefined ? (year > 2500 ? year - 543 : year) : dNow.getFullYear();
  const clickedDate = new Date(gYear, m, date);
  const isPast = clickedDate < todayStart;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "urgent":
        return {
          color: "text-[#f43f5e]",
          bg: "bg-[rgba(244,63,94,0.15)]",
          border: "border-l-[#f43f5e]",
          cardBg: "bg-rose-50/40 dark:bg-rose-950/10",
          cardBorder: "border-rose-200/50 dark:border-rose-900/40",
          label: "สำคัญมาก",
        };
      case "medium":
        return {
          color: "text-[#f59e0b]",
          bg: "bg-[rgba(245,158,11,0.15)]",
          border: "border-l-[#f59e0b]",
          cardBg: "bg-amber-50/40 dark:bg-amber-950/10",
          cardBorder: "border-amber-200/50 dark:border-amber-900/40",
          label: "ปานกลาง",
        };
      case "normal":
        return {
          color: "text-[#22c55e]",
          bg: "bg-[rgba(34,197,94,0.15)]",
          border: "border-l-[#22c55e]",
          cardBg: "bg-emerald-50/40 dark:bg-emerald-950/10",
          cardBorder: "border-emerald-200/50 dark:border-emerald-900/40",
          label: "ปกติ",
        };
      case "info":
        return {
          color: "text-[#6366f1]",
          bg: "bg-[rgba(99,102,241,0.15)]",
          border: "border-l-[#6366f1]",
          cardBg: "bg-indigo-50/40 dark:bg-indigo-950/10",
          cardBorder: "border-indigo-200/60 dark:border-indigo-900/40",
          label: "ทั่วไป",
        };
      default:
        return {
          color: "text-slate-500 dark:text-slate-400",
          bg: "bg-slate-200 dark:bg-slate-700",
          border: "border-l-[#94a3b8]",
          cardBg: "bg-white dark:bg-slate-800",
          cardBorder: "border-slate-200 dark:border-slate-700",
          label: "ตั้งค่า",
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-slate-50 dark:bg-slate-900 rounded-xl w-full max-w-[480px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h3 className="text-[18px] font-bold text-[#6366f1] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            วันที่จัดกิจกรรม: {date} {thaiMonth} {y}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 transition-colors bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900 flex-1">
          {holidayName && (
            <div
              className={`rounded-xl p-4 flex items-start gap-3 border shadow-sm ${
                isWeekend
                  ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/45 text-rose-700 dark:text-rose-300"
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 shrink-0 mt-0.5 ${isWeekend ? "text-slate-400 dark:text-slate-500" : "text-rose-500"}`}
              />
              <div className="space-y-1">
                <div className="text-[12px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
                  {isWeekend
                    ? "วันหยุดประจำสัปดาห์"
                    : "วันหยุดราชการ / วันหยุดนักขัตฤกษ์"}
                </div>
                <div
                  className={`text-[15px] font-bold ${isWeekend ? "text-slate-800 dark:text-slate-200" : "text-rose-700 dark:text-rose-250"}`}
                >
                  {holidayName}
                </div>
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-[14px]">
              ไม่มีกิจกรรมในวันนี้นะครับ
            </div>
          ) : (
            events.map((event) => {
              const styles = getTypeStyles(event.type);

              return (
                <div
                  key={event.id}
                  className={`${styles.cardBg} rounded-xl border-l-[6px] ${styles.border} border-y border-r ${styles.cardBorder} p-4 relative shadow-md`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-50 text-[16px] pr-2 leading-tight">
                      {event.title}
                    </h4>
                    <span
                      className={`shrink-0 ${styles.bg} ${styles.color} px-2 py-0.5 rounded text-[11px] font-bold`}
                    >
                      {styles.label}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5 bg-white/45 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100/80 dark:border-slate-800/50">
                    <div className="flex items-start gap-3 text-[15px]">
                      <Clock className={`w-5 h-5 ${styles.color} mt-0.5 shrink-0`} />
                      <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-800 dark:text-slate-250 mr-2">
                          เวลา:
                        </strong>
                        <span className="font-medium text-slate-750 dark:text-slate-200">{event.time ? `${event.time} ${event.endTime ? `- ${event.endTime}` : ""}` : "ตลอดวัน"}</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-[15px]">
                      <MapPin className={`w-5 h-5 ${styles.color} mt-0.5 shrink-0`} />
                      <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-800 dark:text-slate-250 mr-2">
                          สถานที่:
                        </strong>
                        <span className="font-medium text-slate-750 dark:text-slate-200">{event.location || "ไม่ระบุ"}</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-[15px]">
                      <User className={`w-5 h-5 ${styles.color} mt-0.5 shrink-0`} />
                      <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-800 dark:text-slate-250 mr-2">
                          ผู้รับผิดชอบ:
                        </strong>
                        <span className="font-medium text-slate-750 dark:text-slate-200">{event.responsibles || "ไม่มี"}</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-[15px]">
                      <Users className={`w-5 h-5 ${styles.color} mt-0.5 shrink-0`} />
                      <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-800 dark:text-slate-250 mr-2">
                          กลุ่มงาน:
                        </strong>
                        <span className="font-medium text-slate-755 dark:text-slate-200">{event.workGroup || "ไม่ระบุ"}</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-[15px]">
                      <Building className={`w-5 h-5 ${styles.color} mt-0.5 shrink-0`} />
                      <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-800 dark:text-slate-250 mr-2">
                          หน่วยงาน:
                        </strong>
                        <span className="font-medium text-slate-755 dark:text-slate-200">{event.department || "ไม่ระบุ"}</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-[15px]">
                      <BellOff className={`w-5 h-5 ${styles.color} mt-0.5 shrink-0`} />
                      <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                        <strong className="font-bold text-slate-800 dark:text-slate-250 mr-2">
                          แจ้งเตือน:
                        </strong>
                        <span className="font-medium text-slate-750 dark:text-slate-200">ไม่เตือนล่วงหน้า</span>
                      </span>
                    </div>
                  </div>

                  {event.description && (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-[13px] text-slate-500 dark:text-slate-400 mb-4 overflow-hidden">
                      {event.description}
                    </div>
                  )}

                  {isLoggedIn &&
                    !isHoliday &&
                    (userRole === "admin" ||
                      (currentUsername && event.ownerId === currentUsername) ||
                      (!event.ownerId && currentUsername === "staff")) && (
                      <div className="flex justify-end gap-2.5 mt-2 pt-3.5 border-t border-slate-200 dark:border-slate-700/60">
                        <button
                          onClick={() => onEdit?.(event)}
                          className="px-4 py-1.5 rounded-full border border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors text-[13px] font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5" /> แก้ไข
                        </button>
                        <button
                          onClick={() => onDelete?.(event.id)}
                          className="px-4 py-1.5 rounded-full border border-[#f43f5e] text-[#f43f5e] hover:bg-[#f43f5e]/10 transition-colors text-[13px] font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ลบ
                        </button>
                      </div>
                    )}
                </div>
              );
            })
          )}
        </div>

        {isLoggedIn && !isHoliday && !isPast ? (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={() => onAddEvent(date, m, y)}
              className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-[15px] transition-colors shadow-lg shadow-[#10b981]/20"
            >
              <PlusCircle className="w-5 h-5" /> เพิ่มกิจกรรมใหม่ในวันนี้
            </button>
          </div>
        ) : isLoggedIn && isPast ? (
          <div className="p-4.5 border-t border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/15 text-center text-amber-600 dark:text-amber-400 font-bold text-[13px] rounded-b-xl flex flex-col items-center gap-1.5 py-4 px-5">
            <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            <span>เป็นวันในอดีต (ย้อนหลัง) ไม่สามารถเพิ่มหรือบันทึกกิจกรรมย้อนหลังได้</span>
          </div>
        ) : isLoggedIn && isHoliday ? (
          <div className="p-4.5 border-t border-slate-200 dark:border-slate-700 bg-rose-50/50 dark:bg-rose-950/15 text-center text-rose-600 dark:text-rose-400 font-bold text-[13px] rounded-b-xl flex flex-col items-center gap-1.5">
            <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
            <span>
              ไม่สามารถเพิ่ม แก้ไข หรือลบกิจกรรมในวันหยุดราชการ
              หรือวันเสาร์-อาทิตย์ได้
            </span>
            <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
              ระบบรองรับการบันทึกข้อมูลเฉพาะวันทำงานปกติ (จันทร์ - ศุกร์)
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
