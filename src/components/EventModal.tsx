import { X, Calendar as CalendarIcon, Clock, AlignLeft, User, Building, MapPin, AlertCircle, RefreshCw, Save, PlusCircle, Bell, CalendarDays, FolderTree } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EventItem } from '../data/mockEvents';
import { getStoredWorkgroups } from './WorkGroupManagementModal';
import { SelectedDate, getThaiMonthName, isDayHoliday, getHolidayName } from '../lib/dateUtils';

interface EventModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: EventItem & { date?: SelectedDate | number };
}

const monthsList = [
  { value: 0, label: 'มกราคม' },
  { value: 1, label: 'กุมภาพันธ์' },
  { value: 2, label: 'มีนาคม' },
  { value: 3, label: 'เมษายน' },
  { value: 4, label: 'พฤษภาคม' },
  { value: 5, label: 'มิถุนายน' },
  { value: 6, label: 'กรกฎาคม' },
  { value: 7, label: 'สิงหาคม' },
  { value: 8, label: 'กันยายน' },
  { value: 9, label: 'ตุลาคม' },
  { value: 10, label: 'พฤศจิกายน' },
  { value: 11, label: 'ธันวาคม' }
];

const yearsList = [2568, 2569, 2570, 2571, 2572, 2573, 2574, 2575];

export function EventModal({ onClose, onSave, initialData }: EventModalProps) {
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  
  const [startDay, setStartDay] = useState(() => {
    const today = new Date();
    return today.getDate().toString();
  });
  const [startMonth, setStartMonth] = useState(() => {
    const today = new Date();
    return today.getMonth().toString();
  });
  const [startYear, setStartYear] = useState(() => {
    const today = new Date();
    return (today.getFullYear() + 543).toString();
  });

  const [endDay, setEndDay] = useState(() => {
    const today = new Date();
    return today.getDate().toString();
  });
  const [endMonth, setEndMonth] = useState(() => {
    const today = new Date();
    return today.getMonth().toString();
  });
  const [endYear, setEndYear] = useState(() => {
    const today = new Date();
    return (today.getFullYear() + 543).toString();
  });

  const [time, setTime] = useState('08:00');
  const [priority, setPriority] = useState<'urgent'|'medium'|'normal'|'info'>('normal');
  
  const [location, setLocation] = useState('ไม่ระบุ');
  const [responsibles, setResponsibles] = useState('');
  const [department, setDepartment] = useState('');
  const [workGroup, setWorkGroup] = useState('');
  const [availableWorkgroups, setAvailableWorkgroups] = useState<any[]>([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const wg = getStoredWorkgroups();
    setAvailableWorkgroups(wg);
    if (!initialData) {
      if (wg.length > 0) {
        setWorkGroup(wg[0].name);
        setDepartment(wg[0].departments[0] || '');
      }
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setPriority(initialData.type || 'normal');
      setTime(initialData.time || '08:00');
      setLocation(initialData.location || 'ไม่ระบุ');
      setResponsibles(initialData.responsibles || '');
      setWorkGroup(initialData.workGroup || '');
      setDepartment(initialData.department || '');
      setDescription(initialData.description || '');
      
      if (initialData.date) {
        if (typeof initialData.date === 'object') {
          setStartDay(initialData.date.day.toString());
          setStartMonth(initialData.date.month.toString());
          setStartYear(initialData.date.year.toString());

          setEndDay(initialData.date.day.toString());
          setEndMonth(initialData.date.month.toString());
          setEndYear(initialData.date.year.toString());
        } else {
          const today = new Date();
          setStartDay(initialData.date.toString());
          setEndDay(initialData.date.toString());
          setStartMonth(today.getMonth().toString());
          setEndMonth(today.getMonth().toString());
          setStartYear((today.getFullYear() + 543).toString());
          setEndYear((today.getFullYear() + 543).toString());
        }
      }
    }
  }, [initialData]);

  const isLaborDayInput = Number(startMonth) === 4 && Number(startDay) === 1;
  const isStartHolidayInput = isDayHoliday(Number(startDay), Number(startMonth), Number(startYear)) && !isLaborDayInput;

  // Rule 1: No retroactive activity creation allowed
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sD = Number(startDay);
  const sM = Number(startMonth);
  const sY = Number(startYear);
  const gStartYear = sY > 2500 ? sY - 543 : sY;
  const startDate = new Date(gStartYear, sM, sD);
  const isPastDateInput = startDate < today;
  const hasPastDateError = !initialData?.id && isPastDateInput;

  // Automatically reset and disable isMultiDay when start date is holiday or past date
  useEffect(() => {
    if (isStartHolidayInput || hasPastDateError) {
      setIsMultiDay(false);
    }
  }, [isStartHolidayInput, hasPastDateError]);

  let isRangeHolidayInput = false;
  if (isMultiDay) {
    const eD = Number(endDay);
    const eM = Number(endMonth);
    const eY = Number(endYear);
    const gEndYear = eY > 2500 ? eY - 543 : eY;
    const endDate = new Date(gEndYear, eM, eD);
    if (startDate <= endDate) {
      let tempDate = new Date(startDate);
      while (tempDate <= endDate) {
        const checkD = tempDate.getDate();
        const checkM = tempDate.getMonth();
        const checkY = sY > 2500 ? tempDate.getFullYear() + 543 : tempDate.getFullYear();
        const isCheckLaborDay = checkM === 4 && checkD === 1;
        if (isDayHoliday(checkD, checkM, checkY) && !isCheckLaborDay) {
          isRangeHolidayInput = true;
          break;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }
  }

  const hasHolidayError = isMultiDay ? isRangeHolidayInput : isStartHolidayInput;

  const handleSave = () => {
    if (!title.trim()) {
       alert("กรุณาระบุชื่อกิจกรรม");
       return;
    }

    // Double check backdated activity rule
    if (!initialData?.id && isPastDateInput) {
      alert("ไม่สามารถกำหนดวันเพิ่มกิจกรรมย้อนหลังได้ กรุณาเลือกวันที่เป็นปัจจุบันหรืออนาคต");
      return;
    }
    
    // Validate if dates are weekends or holidays
    const sD = Number(startDay);
    const sM = Number(startMonth);
    const sY = Number(startYear);
    
    if (!isMultiDay) {
      const isLaborDay = sM === 4 && sD === 1;
      if (isDayHoliday(sD, sM, sY) && !isLaborDay) {
        const holidayName = getHolidayName(sD, sM, sY) || "วันหยุด";
        alert(`ไม่สามารถเพิ่มกิจกรรมในวันเสาร์-อาทิตย์ หรือวันหยุดราชการได้ (${holidayName})`);
        return;
      }
    } else {
      const eD = Number(endDay);
      const eM = Number(endMonth);
      const eY = Number(endYear);
      
      const gStartYear = sY > 2500 ? sY - 543 : sY;
      const gEndYear = eY > 2500 ? eY - 543 : eY;
      const startDate = new Date(gStartYear, sM, sD);
      const endDate = new Date(gEndYear, eM, eD);
      
      if (startDate > endDate) {
        alert("วันเริ่มต้นต้องไม่มากกว่าวันสิ้นสุด");
        return;
      }
      
      // Let's check each day in the range
      const tempDate = new Date(startDate);
      while (tempDate <= endDate) {
        const checkD = tempDate.getDate();
        const checkM = tempDate.getMonth();
        const checkY = sY > 2500 ? tempDate.getFullYear() + 543 : tempDate.getFullYear();
        
        const isCheckLaborDay = checkM === 4 && checkD === 1;
        if (isDayHoliday(checkD, checkM, checkY) && !isCheckLaborDay) {
          const holidayName = getHolidayName(checkD, checkM, checkY) || "วันหยุด";
          alert(`ไม่สามารถเพิ่มกิจกรรมในวันเสาร์-อาทิตย์ หรือวันหยุดราชการได้ (พบ ${holidayName} ในขอบเขตวันที่ระบุ)`);
          return;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }
    
    setIsSaving(true);
    setTimeout(() => {
      onSave({
         id: initialData?.id,
         title,
         startDay: Number(startDay),
         startMonth: Number(startMonth),
         startYear: Number(startYear),
         endDay: isMultiDay ? Number(endDay) : Number(startDay),
         endMonth: isMultiDay ? Number(endMonth) : Number(startMonth),
         endYear: isMultiDay ? Number(endYear) : Number(startYear),
         time,
         priority,
         location,
         responsibles,
         department,
         workGroup,
         description
      }); 
    }, 400);
  };

  const getDaysInMonth = (mIndex: number, yBuddhist: number) => {
    const gYear = yBuddhist - 543;
    return new Date(gYear, mIndex + 1, 0).getDate();
  };

  const startDaysLimit = getDaysInMonth(Number(startMonth), Number(startYear));
  const startDaysOptions = Array.from({length: startDaysLimit}, (_, i) => i + 1);

  const endDaysLimit = getDaysInMonth(Number(endMonth), Number(endYear));
  const endDaysOptions = Array.from({length: endDaysLimit}, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#6366f1]/20 flex items-center justify-center text-[#6366f1]">
              <PlusCircle className="w-4 h-4" />
            </div>
            {initialData?.id ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}
          </h3>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 transition-colors" disabled={isSaving}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="p-5 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/50">
          
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
             <div className="flex-1 space-y-1.5 w-full">
               <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#6366f1]" /> วันที่เริ่ม <span className="text-[#f43f5e]">*</span>
               </label>
               <div className="flex gap-2">
                  <select value={startDay} onChange={(e) => setStartDay(e.target.value)} className="flex-1 rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none text-[13px] appearance-none">
                     {startDaysOptions.map(d => <option key={`s-${d}`} value={d}>{d}</option>)}
                  </select>
                  <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="flex-[2] rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none text-[13px] appearance-none">
                     {monthsList.map(m => <option key={`sm-${m.value}`} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="flex-[1.5] rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none text-[13px] appearance-none">
                     {yearsList.map(y => <option key={`sy-${y}`} value={y}>{y}</option>)}
                  </select>
               </div>
             </div>

              {isMultiDay && (
                 <div className="flex-1 space-y-1.5 w-full bg-[#3b82f6]/10 p-2 rounded-md border border-[#3b82f6]/30 animate-in fade-in zoom-in-95">
                   <label className="text-[13px] font-medium text-[#c084fc] flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-[#c084fc]" /> ถึงวันที่ <span className="text-[#f43f5e]">*</span>
                   </label>
                   <div className="flex gap-2">
                     <select value={endDay} onChange={(e) => setEndDay(e.target.value)} className="flex-1 rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#c084fc] focus:ring-1 focus:ring-[#c084fc] outline-none text-[13px] appearance-none">
                        {endDaysOptions.map(d => <option key={`e-${d}`} value={d}>{d}</option>)}
                     </select>
                     <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="flex-[2] rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#c084fc] focus:ring-1 focus:ring-[#c084fc] outline-none text-[13px] appearance-none">
                        {monthsList.map(m => <option key={`em-${m.value}`} value={m.value}>{m.label}</option>)}
                     </select>
                     <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="flex-[1.5] rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#c084fc] focus:ring-1 focus:ring-[#c084fc] outline-none text-[13px] appearance-none">
                        {yearsList.map(y => <option key={`ey-${y}`} value={y}>{y}</option>)}
                     </select>
                   </div>
                 </div>
              )}
              
              <div 
                className="flex items-center gap-2 pb-1.5 shrink-0 select-none" 
                onClick={() => {
                  if (!isStartHolidayInput && !hasPastDateError) {
                    setIsMultiDay(!isMultiDay);
                  }
                }}
              >
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${
                    (isStartHolidayInput || hasPastDateError) 
                      ? 'bg-slate-200 dark:bg-slate-850 cursor-not-allowed opacity-50' 
                      : isMultiDay 
                        ? 'bg-[#6366f1]' 
                        : 'bg-slate-200 dark:bg-slate-700 cursor-pointer'
                  }`}>
                     <div className={`absolute top-0.5 bg-white dark:bg-slate-800 w-3 h-3 rounded-full transition-transform ${isMultiDay ? 'left-4.5 scale-110' : 'left-0.5'}`}></div>
                  </div>
                  <span className={`text-[13px] ${
                    (isStartHolidayInput || hasPastDateError) 
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50 font-medium' 
                      : 'cursor-pointer font-medium ' + (isMultiDay ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400')
                  }`}>หลายวัน</span>
              </div>
          </div>

          {/* Real-time Past Date, Weekend & Holiday Validation Notice */}
          {(() => {
            if (hasPastDateError) {
              return (
                <div className="flex items-start gap-2 p-3 bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-lg border border-rose-500/20 text-xs font-bold animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>แจ้งเตือน: ไม่สามารถทำรายการเพิ่มกิจกรรมย้อนหลังได้ กรุณาเลือกวันที่เป็นปัจจุบันหรืออนาคต เท่านั้น</span>
                </div>
              );
            }

            const sD = Number(startDay);
            const sM = Number(startMonth);
            const sY = Number(startYear);
            
            if (!isMultiDay) {
              const isLaborDay = sM === 4 && sD === 1;
              if (isDayHoliday(sD, sM, sY) && !isLaborDay) {
                const holidayName = getHolidayName(sD, sM, sY) || "วันหยุดราชการ / เสาร์ - อาทิตย์";
                return (
                  <div className="flex items-start gap-2 p-3 bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-lg border border-rose-500/20 text-xs font-bold animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>แจ้งเตือน: วันที่ระบุตรงกับ "{holidayName}" ซึ่งเป็นวันหยุด ระบบรองรับการตั้งกิจกรรมเฉพาะวันทำงานปกติ (จันทร์ - ศุกร์) เท่านั้น</span>
                  </div>
                );
              }
            } else {
              const eD = Number(endDay);
              const eM = Number(endMonth);
              const eY = Number(endYear);
              
              const gStartYear = sY > 2500 ? sY - 543 : sY;
              const gEndYear = eY > 2500 ? eY - 543 : eY;
              const startDate = new Date(gStartYear, sM, sD);
              const endDate = new Date(gEndYear, eM, eD);
              
              if (startDate <= endDate) {
                let tempDate = new Date(startDate);
                let foundHoliday = null;
                while (tempDate <= endDate) {
                  const checkD = tempDate.getDate();
                  const checkM = tempDate.getMonth();
                  const checkY = sY > 2500 ? tempDate.getFullYear() + 543 : tempDate.getFullYear();
                  
                  const isCheckLaborDay = checkM === 4 && checkD === 1;
                  if (isDayHoliday(checkD, checkM, checkY) && !isCheckLaborDay) {
                    foundHoliday = {
                      day: checkD,
                      monthLabel: monthsList[checkM].label,
                      year: checkY,
                      name: getHolidayName(checkD, checkM, checkY) || "วันหยุดราชการ / เสาร์ - อาทิตย์"
                    };
                    break;
                  }
                  tempDate.setDate(tempDate.getDate() + 1);
                }
                
                if (foundHoliday) {
                  return (
                    <div className="flex items-start gap-2 p-3 bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-lg border border-[#f43f5e]/20 text-xs font-bold animate-pulse">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      <span>แจ้งเตือน: ตรวจพบวันหยุดในขอบเขตวันที่ระบุ คือ "{foundHoliday.name}" (วันที่ {foundHoliday.day} {foundHoliday.monthLabel} {foundHoliday.year}) ระบบรองรับเฉพาะวันทำงานปกติเท่านั้น</span>
                    </div>
                  );
                }
              }
            }
            return null;
          })()}

          <div className="space-y-1.5">
             <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">ชื่อกิจกรรม <span className="text-[#f43f5e]">*</span></label>
             <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="ระบุชื่อกิจกรรม..." className="w-full rounded border-slate-200 dark:border-slate-700 border py-1.5 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] outline-none text-[13px]" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">เวลาเริ่ม</label>
                <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="w-full rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] outline-none text-[13px]" />
             </div>
             <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">สถานที่</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded border-slate-200 dark:border-slate-700 border py-1.5 px-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] outline-none text-[13px] appearance-none">
                  <option value="ไม่ระบุ">ไม่ระบุ</option>
                  <option value="ห้องประชุม 1">ห้องประชุม 1</option>
                  <option value="ห้องประชุม 2">ห้องประชุม 2</option>
                </select>
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">ความสำคัญ <span className="text-[#f43f5e]">*</span></label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
               {[
                 { id: 'urgent', label: 'สำคัญมาก', color: 'bg-[#f43f5e]', border: 'border-[#f43f5e]', bgActive: 'bg-[rgba(244,63,94,0.15)]' },
                 { id: 'medium', label: 'ปานกลาง', color: 'bg-[#f59e0b]', border: 'border-[#f59e0b]', bgActive: 'bg-[rgba(245,158,11,0.15)]' },
                 { id: 'normal', label: 'ปกติ', color: 'bg-[#22c55e]', border: 'border-[#22c55e]', bgActive: 'bg-[rgba(34,197,94,0.15)]' },
                 { id: 'info', label: 'ทั่วไป', color: 'bg-[#6366f1]', border: 'border-[#6366f1]', bgActive: 'bg-[rgba(99,102,241,0.15)]' }
               ].map(p => (
                 <label key={p.id} className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-md border transition-all select-none ${priority === p.id ? `${p.border} ${p.bgActive} shadow-[0_0_12px_rgba(0,0,0,0.15)] scale-[1.02]` : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-[#475569]'}`}>
                   <input type="radio" name="priority" value={p.id} checked={priority === p.id} onChange={(e) => setPriority(e.target.value as any)} className="hidden" />
                   <span className={`w-3.5 h-3.5 rounded-full ${p.color} ${priority === p.id ? `ring-2 ring-offset-2 ring-offset-[#1e293b]` : ''}`} style={priority === p.id ? { '--tw-ring-color': p.color.replace('bg-', '') } as any : {}}></span>
                   <span className={`text-[13px] font-medium ${priority === p.id ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}>{p.label}</span>
                 </label>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">กลุ่มงาน <span className="text-[#f43f5e]">*</span></label>
                <select 
                  value={workGroup} 
                  onChange={(e) => {
                    const selectedGName = e.target.value;
                    setWorkGroup(selectedGName);
                    const selectedGroupObj = availableWorkgroups.find(g => g.name === selectedGName);
                    if (selectedGroupObj && selectedGroupObj.departments.length > 0) {
                      setDepartment(selectedGroupObj.departments[0]);
                    } else {
                      setDepartment('');
                    }
                  }} 
                  required
                  className="w-full rounded border-slate-200 dark:border-slate-700 border py-1.5 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] outline-none text-[13px]"
                >
                  <option value="" disabled>--- เลือกกลุ่มงาน ---</option>
                  {availableWorkgroups.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">หน่วยงาน <span className="text-[#f43f5e]">*</span></label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  disabled={!workGroup}
                  required
                  className="w-full rounded border-slate-200 dark:border-slate-700 border py-1.5 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] outline-none text-[13px] disabled:opacity-50"
                >
                  <option value="" disabled>--- เลือกหน่วยงาน ---</option>
                  {((availableWorkgroups.find(g => g.name === workGroup)?.departments) || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">ผู้รับผิดชอบ</label>
             <input value={responsibles} onChange={e => setResponsibles(e.target.value)} type="text" placeholder="เจ้าหน้าที่..." className="w-full rounded border-slate-200 dark:border-slate-700 border py-1.5 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] outline-none text-[13px]" />
          </div>

          <div className="space-y-1.5">
             <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">รายละเอียดเพิ่มเติม</label>
             <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="เพิ่มเติม..." className="w-full rounded border-slate-200 dark:border-slate-700 border py-1.5 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:border-[#6366f1] outline-none resize-none text-[13px]"></textarea>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-2 mt-auto">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-1.5 rounded text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent disabled:opacity-50">
            ยกเลิก
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || hasHolidayError || hasPastDateError}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-white text-[13px] font-semibold rounded-lg transition-all shadow ${
              isSaving 
                ? 'bg-rose-400/70 cursor-not-allowed' 
                : (hasHolidayError || hasPastDateError)
                  ? 'bg-rose-300 dark:bg-rose-950/40 text-rose-100/50 border border-rose-500/10 cursor-not-allowed opacity-60'
                  : 'bg-[#f43f5e] hover:bg-[#e11d48] active:scale-[0.98]'
            }`}
          >
            {isSaving ? (
              <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}
