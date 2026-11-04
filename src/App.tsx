import { useState, useEffect } from "react";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import { MonthlyCalendar } from "./components/MonthlyCalendar";
import { YearlyCalendar } from "./components/YearlyCalendar";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { DailyCalendar } from "./components/DailyCalendar";
import { TableCalendar } from "./components/TableCalendar";
import { Dashboard } from "./components/Dashboard";
import { EventModal } from "./components/EventModal";
import { GenericModal } from "./components/GenericModal";
import { DayDetailsModal } from "./components/DayDetailsModal";
import { LoginModal } from "./components/LoginModal";
import { ExportModal } from "./components/ExportModal";
import { NotificationModal } from "./components/NotificationModal";
import { UserManagementModal } from "./components/UserManagementModal";
import { RegistrationForm } from "./components/RegistrationForm";
import { PendingApproval } from "./components/PendingApproval";
import { PresenceTracker } from "./components/PresenceTracker";
import { OnlineUsersModal } from "./components/OnlineUsersModal";
import { WorkGroupManagementModal } from "./components/WorkGroupManagementModal";
import { initialEventsMap, EventItem } from "./data/mockEvents";
import { useAuth } from "./context/AuthContext";
import { db, collection, query, onSnapshot } from "./lib/firebase";

import { exportData } from "./lib/exportUtils";
import { getEventsForDate, SelectedDate } from "./lib/dateUtils";

export default function App() {
  const { user, profile, loading, login, logout } = useAuth();

  const [currentView, setCurrentView] = useState<
    "year" | "month" | "week" | "day" | "table" | "dashboard"
  >("month");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<{
    title: string;
    message: string;
    type?: "info" | "success" | "danger";
    confirmable?: boolean;
  } | null>(null);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "excel" | "word" | null>(
    null,
  );
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminApprovalOpen, setIsAdminApprovalOpen] = useState(false);

  const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
  const [isWorkgroupModalOpen, setIsWorkgroupModalOpen] = useState(false);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "presence"));
    const unsubscribe = onSnapshot(q, (snap) => {
      let count = 0;
      const now = new Date().getTime();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data && data.isOnline) {
          const lastSeen = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : (data.lastSeen || 0);
          const diffMinutes = (now - lastSeen) / 60000;
          if (diffMinutes <= 5) {
            count++;
          }
        }
      });
      setOnlineUsersCount(count);
    });
    return () => unsubscribe();
  }, []);

  const [eventsMap, setEventsMap] =
    useState<Record<string | number, EventItem[]>>(initialEventsMap);
  const [selectedDay, setSelectedDay] = useState<number | SelectedDate | null>(
    null,
  );
  const [editingEvent, setEditingEvent] = useState<
    (EventItem & { date?: number | SelectedDate }) | null
  >(null);

  const todayDateObj = new Date();
  const currentMonth = todayDateObj.getMonth();
  const currentYear = todayDateObj.getFullYear() + 543;

  const isNoyBypass = user?.email === "noy.thaweesit@gmail.com";
  const isLoggedIn = !!user && (profile?.status === "active" || isNoyBypass);
  const userRole = isNoyBypass ? "superadmin" : profile?.role || null;
  const currentUsername = profile?.displayName || null;
  const userWorkGroup = profile?.workGroup || "";
  const userDepartment = profile?.department || "";

  // Access security guard for the dashboard view
  useEffect(() => {
    if (currentView === "dashboard") {
      const isAdmin = userRole === "admin" || userRole === "superadmin";
      if (!isLoggedIn || !isAdmin) {
        setCurrentView("month");
      }
    }
  }, [currentView, isLoggedIn, userRole]);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has previously set a preference
    if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme") === "dark";
    }
    // Check system preference
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    // Default to light mode
    return false;
  });

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleAction = (action: string) => {
    switch (action) {
      case "export_pdf":
        setExportType("pdf");
        break;
      case "export_excel":
        setExportType("excel");
        break;
      case "export_word":
        setExportType("word");
        break;
      case "notifications":
        setIsNotificationOpen(true);
        break;
      case "onlineUsers":
        setIsOnlineUsersModalOpen(true);
        break;
      case "publicHolidays":
        setEventsMap((prev) => {
          const next = { ...prev };
          const addHoliday = (day: number, title: string) => {
            if (!next[day]) next[day] = [];
            if (!next[day].some((e) => e.title === title)) {
              next[day].push({
                id: `holiday-${day}`,
                title,
                type: "urgent", // urgent makes it red, suitable for holidays
                time: "",
                ownerId: "System",
              });
            }
          };
          // 2026 April Holidays (Songkran, Chakri Day)
          addHoliday(6, "วันจักรี");
          addHoliday(13, "วันสงกรานต์");
          addHoliday(14, "วันสงกรานต์");
          addHoliday(15, "วันสงกรานต์");

          return next;
        });
        setActiveModal({
          title: "วันหยุดราชการ",
          message: "นำเข้าข้อมูลวันหยุดราชการประจำปีปัจจุบันสำเร็จแล้ว",
          type: "success",
        });
        break;
      case "export":
        setActiveModal({
          title: "ส่งออกข้อมูล (Excel)",
          message: "กำลังสร้างไฟล์ดึงข้อมูลปฏิทิน กรุณารอสักครู่...",
          type: "success",
        });
        break;
      case "import":
        setActiveModal({
          title: "นำเข้ากิจกรรม (Excel)",
          message: "ระบบได้นำเข้าข้อมูลจากไฟล์ที่คุณเลือกสำเร็จแล้ว",
          type: "success",
        });
        break;
      case "settings":
        setActiveModal({
          title: "ตั้งค่าระบบ",
          message: "ฟังก์ชันตั้งค่าระบบกำลังเปิดให้ใช้งานเร็วๆ นี้",
        });
        break;
      case "systemManagement":
        if (userRole === "admin" || userRole === "superadmin") {
          setIsAdminApprovalOpen(true);
        } else {
          setActiveModal({
            title: "จัดการระบบ",
            message: "ส่วนจัดการระบบสำหรับผู้ดูแลระบบเท่านั้น",
            type: "danger",
          });
        }
        break;
      case "manageWorkgroups":
        if (userRole === "admin" || userRole === "superadmin") {
          setIsWorkgroupModalOpen(true);
        } else {
          setActiveModal({
            title: "จัดการกลุ่มงานและหน่วยงาน",
            message: "ส่วนจัดการกลุ่มงานและหน่วยงานสำหรับผู้ดูแลระบบเท่านั้น",
            type: "danger",
          });
        }
        break;
      case "logout":
        setActiveModal({
          title: "ออกจากระบบ",
          message: "คุณต้องการออกจากระบบหรือไม่?",
          type: "danger",
          confirmable: true,
        });
        break;
      case "login":
        setIsLoginModalOpen(true);
        break;
    }
  };

  const handleConfirmAction = () => {
    if (activeModal?.title === "ออกจากระบบ") {
      logout();
    }
    setActiveModal(null);
  };

  const handleSaveEvent = (eventData: any) => {
    const {
      id,
      title,
      startDay,
      startMonth,
      startYear,
      endDay,
      endMonth,
      endYear,
      time,
      priority,
      location,
      responsibles,
      department,
      workGroup,
      description,
    } = eventData;

    setEventsMap((prev) => {
      const next = { ...prev };

      // Handle Edit: remove old event reference first
      if (id && editingEvent) {
        let oldKey = "";
        if (editingEvent.date) {
          if (typeof editingEvent.date === "object") {
            const oldGYear =
              editingEvent.date.year < 2500
                ? editingEvent.date.year
                : editingEvent.date.year - 543;
            oldKey = `${oldGYear}-${String(editingEvent.date.month + 1).padStart(2, "0")}-${String(editingEvent.date.day).padStart(2, "0")}`;
          } else {
            oldKey = String(editingEvent.date);
          }
        }

        if (oldKey && next[oldKey]) {
          next[oldKey] = next[oldKey].filter((e) => e.id !== id);
          if (next[oldKey].length === 0) delete next[oldKey];
        }
      }

      const minD = Math.min(startDay, endDay);
      const maxD = Math.max(startDay, endDay);
      const newId =
        id && editingEvent ? id.split("-")[0] : Date.now().toString();

      const gYear = startYear < 2500 ? startYear : startYear - 543;
      const pad = (n: number) => String(n).padStart(2, "0");

      for (let i = minD; i <= maxD; i++) {
        const dateKey = `${gYear}-${pad(startMonth + 1)}-${pad(i)}`;
        const items = next[dateKey] ? [...next[dateKey]] : [];
        items.push({
          id: `${newId}-${i}`,
          title: title || "(ไม่มีชื่อ)",
          type: priority,
          time: time || undefined,
          location,
          responsibles,
          department,
          workGroup,
          description,
          ownerId:
            id && editingEvent
              ? editingEvent.ownerId
              : currentUsername || "staff",
        });
        next[dateKey] = items;
      }
      return next;
    });

    setIsModalOpen(false);
    setEditingEvent(null);
    setActiveModal({
      title: id ? "แก้ไขกิจกรรมสำเร็จ" : "เพิ่มกิจกรรมสำเร็จ",
      message: id
        ? "ระบบได้บันทึกการแก้ไขกิจกรรมของคุณแล้ว"
        : "ระบบได้บันทึกกิจกรรมใหม่ลงในปฏิทินเรียบร้อยแล้ว",
      type: "success",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-none outline-none">
        <span className="text-slate-500">กำลังโหลด...</span>
      </div>
    );
  }

  if (user && !profile) {
    return <RegistrationForm />;
  }

  if (user && profile?.status !== "active" && !isNoyBypass) {
    return <PendingApproval />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 pb-24 transition-colors duration-200">
      <PresenceTracker />
      <Header 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        isLoggedIn={isLoggedIn}
        currentUsername={currentUsername}
        userRole={userRole}
        userWorkGroup={userWorkGroup}
        userDepartment={userDepartment}
        onlineCount={onlineUsersCount}
        onAction={handleAction}
      />

      <Toolbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddEvent={() => setIsModalOpen(true)}
        onAction={handleAction}
        isLoggedIn={isLoggedIn}
        currentUsername={currentUsername}
        userRole={userRole}
      />

      {currentView === "year" && (
        <YearlyCalendar
          eventsMap={eventsMap}
          onDayClick={setSelectedDay}
          onAction={handleAction}
          isLoggedIn={isLoggedIn}
          onAddEvent={() => setIsModalOpen(true)}
        />
      )}
      {currentView === "month" && (
        <MonthlyCalendar
          eventsMap={eventsMap}
          onDayClick={setSelectedDay}
          isLoggedIn={isLoggedIn}
          onAddEvent={() => setIsModalOpen(true)}
        />
      )}
      {currentView === "week" && (
        <WeeklyCalendar
          eventsMap={eventsMap}
          onDayClick={setSelectedDay}
          isLoggedIn={isLoggedIn}
          onAddEvent={() => setIsModalOpen(true)}
        />
      )}
      {currentView === "day" && (
        <DailyCalendar
          eventsMap={eventsMap}
          onDayClick={setSelectedDay}
          isLoggedIn={isLoggedIn}
          onAddEvent={() => setIsModalOpen(true)}
        />
      )}
      {currentView === "table" && (
        <TableCalendar eventsMap={eventsMap} onDayClick={setSelectedDay} />
      )}
      {currentView === "dashboard" && <Dashboard eventsMap={eventsMap} />}

      {isModalOpen && (
        <EventModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          initialData={editingEvent || undefined}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}

      {selectedDay !== null && (
        <DayDetailsModal
          date={typeof selectedDay === "object" ? selectedDay.day : selectedDay}
          month={
            typeof selectedDay === "object" ? selectedDay.month : currentMonth
          }
          year={
            typeof selectedDay === "object" ? selectedDay.year : currentYear
          }
          events={(() => {
            const allDayEvents = getEventsForDate(
              eventsMap,
              typeof selectedDay === "object" ? selectedDay.day : selectedDay,
              typeof selectedDay === "object" ? selectedDay.month : currentMonth,
              typeof selectedDay === "object" ? selectedDay.year : currentYear,
            );
            if (typeof selectedDay === "object" && selectedDay.selectedEventId) {
              return allDayEvents.filter((e) => e.id === selectedDay.selectedEventId);
            }
            return allDayEvents;
          })()}
          onClose={() => setSelectedDay(null)}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          currentUsername={currentUsername}
          onAddEvent={(day, month, year) => {
            if (!isLoggedIn) {
              setIsLoginModalOpen(true);
              return;
            }
            const dObj: SelectedDate = {
              day,
              month: month !== undefined ? month : currentMonth,
              year: year !== undefined ? year : currentYear,
            };
            setEditingEvent({ date: dObj } as any);
            setSelectedDay(null);
            setIsModalOpen(true);
          }}
          onDelete={(id) => {
            if (!isLoggedIn) {
              setIsLoginModalOpen(true);
              return;
            }
            setEventsMap((prev) => {
              const updated = { ...prev };
              const dayVal =
                typeof selectedDay === "object" ? selectedDay.day : selectedDay;
              const monthVal =
                typeof selectedDay === "object"
                  ? selectedDay.month
                  : currentMonth;
              const yearVal =
                typeof selectedDay === "object"
                  ? selectedDay.year
                  : currentYear;

              let targetKey = String(dayVal);
              const gYear = yearVal < 2500 ? yearVal : yearVal - 543;
              const formattedKey = `${gYear}-${String(monthVal + 1).padStart(2, "0")}-${String(dayVal).padStart(2, "0")}`;

              if (updated[formattedKey]) {
                targetKey = formattedKey;
              }

              if (updated[targetKey]) {
                updated[targetKey] = updated[targetKey].filter(
                  (e) => e.id !== id,
                );
                if (updated[targetKey].length === 0) delete updated[targetKey];
              }
              return updated;
            });
            setSelectedDay(null);
            setActiveModal({
              title: "ลบสำเร็จ",
              message: "ลบกิจกรรมออกจากระบบเรียบร้อยแล้ว",
              type: "success",
            });
          }}
          onEdit={(event) => {
            if (!isLoggedIn) {
              setIsLoginModalOpen(true);
              return;
            }
            const dayVal =
              typeof selectedDay === "object" ? selectedDay.day : selectedDay;
            const monthVal =
              typeof selectedDay === "object"
                ? selectedDay.month
                : currentMonth;
            const yearVal =
              typeof selectedDay === "object" ? selectedDay.year : currentYear;

            setEditingEvent({
              ...event,
              date: { day: dayVal, month: monthVal, year: yearVal },
            });
            setSelectedDay(null);
            setIsModalOpen(true);
          }}
        />
      )}

      {activeModal && (
        <GenericModal
          title={activeModal.title}
          message={activeModal.message}
          type={activeModal.type}
          onClose={() => setActiveModal(null)}
          onConfirm={activeModal.confirmable ? handleConfirmAction : undefined}
          confirmText={activeModal.confirmable ? "ยืนยัน" : undefined}
        />
      )}

      {exportType && (
        <ExportModal
          type={exportType}
          onClose={() => setExportType(null)}
          onExport={(config) => {
            exportData(exportType, config, eventsMap);
            setExportType(null);
            const titles: Record<string, string> = {
              pdf: "พิมพ์รายงาน (PDF)",
              excel: "ส่งออกข้อมูล (Excel)",
              word: "ส่งออกข้อมูล (Word)",
            };
            setActiveModal({
              title: `${titles[exportType]} สำเร็จ`,
              message:
                "ระบบได้ประมวลผลข้อมูลและดาวน์โหลดไฟล์ลงเครื่องของคุณเรียบร้อยแล้ว",
              type: "success",
            });
          }}
        />
      )}

      {isNotificationOpen && (
        <NotificationModal
          eventsMap={eventsMap}
          onClose={() => setIsNotificationOpen(false)}
        />
      )}
      {isAdminApprovalOpen && (
        <UserManagementModal onClose={() => setIsAdminApprovalOpen(false)} />
      )}
      {isOnlineUsersModalOpen && (
        <OnlineUsersModal
          onClose={() => setIsOnlineUsersModalOpen(false)}
          userWorkGroup={profile?.workGroup || ""}
          userDepartment={profile?.department || ""}
        />
      )}
      {isWorkgroupModalOpen && (
        <WorkGroupManagementModal
          onClose={() => setIsWorkgroupModalOpen(false)}
          userRole={userRole}
        />
      )}
      <PresenceTracker />
    </div>
  );
}
