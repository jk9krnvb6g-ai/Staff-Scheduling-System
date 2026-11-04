import { X, Calendar as CalendarIcon, Printer, FileSpreadsheet, FileText, LayoutTemplate } from 'lucide-react';
import { useState } from 'react';

interface ExportModalProps {
  type: 'pdf' | 'excel' | 'word';
  onClose: () => void;
  onExport: (config: { startDate: string, endDate: string, columns: Record<string, boolean> }) => void;
}

export function ExportModal({ type, onClose, onExport }: ExportModalProps) {
  const [startDate, setStartDate] = useState('01/01/2026');
  const [endDate, setEndDate] = useState('31/12/2026');
  
  const [columns, setColumns] = useState({
    seq: true, date: true, time: true, name: true,
    details: true, owner: true, dept: true, location: true,
    priority: true
  });

  const toggleCol = (key: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getTheme = () => {
    switch (type) {
      case 'pdf': return { color: '#ef4444', headerColor: '#dc2626', icon: Printer, title: 'พิมพ์กิจกรรมของหน่วยงาน', btnText: 'สั่งพิมพ์', tip: 'เลือกระยะเวลาและคอลัมน์ที่ต้องการให้แสดงผลในรายงาน' };
      case 'excel': return { color: '#22c55e', headerColor: '#16a34a', icon: FileSpreadsheet, title: 'ส่งออกข้อมูล Excel', btnText: 'ส่งออก', tip: 'เลือกระยะเวลาและคอลัมน์ที่ต้องการให้แสดงผลในไฟล์ Excel' };
      case 'word': return { color: '#3b82f6', headerColor: '#2563eb', icon: FileText, title: 'ส่งออกข้อมูล Word', btnText: 'ส่งออก', tip: 'เลือกระยะเวลาและคอลัมน์ที่ต้องการให้แสดงผลในไฟล์ Word' };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-[16px] w-full max-w-[500px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 text-white" style={{ backgroundColor: theme.headerColor }}>
          <h3 className="text-[17px] font-bold flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" strokeWidth={2} />
            {theme.title}
          </h3>
          <button onClick={onClose} className="text-white hover:text-white/80 transition-colors p-1">
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800">
          <div className="w-full bg-white dark:bg-slate-800 border rounded-lg p-3.5 mb-6 text-[14.5px] flex items-center gap-2.5 shadow-sm" style={{ borderColor: theme.color }}>
             <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full text-white text-[12px] font-bold shrink-0" style={{ backgroundColor: theme.color }}>i</div>
             <div style={{ color: theme.color }}>{theme.tip}</div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-[14.5px] font-bold mb-2">ตั้งแต่วันที่</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-[14.5px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <CalendarIcon className="w-[18px] h-[18px] absolute right-3 top-3 text-slate-500 dark:text-slate-400" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[14.5px] font-bold mb-2">ถึงวันที่</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-[14.5px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <CalendarIcon className="w-[18px] h-[18px] absolute right-3 top-3 text-slate-500 dark:text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 font-bold text-[14.5px]" style={{ color: theme.headerColor }}>
            <LayoutTemplate className="w-[18px] h-[18px]" />
            คลิกเลือกคอลัมน์ที่ต้องการ
          </div>
          
          <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 text-[14px]">
             {[
               { key: 'seq', label: 'ลำดับ' },
               { key: 'date', label: 'วันที่จัดกิจกรรม' },
               { key: 'time', label: 'เวลา' },
               { key: 'name', label: 'ชื่อกิจกรรม' },
               { key: 'details', label: 'รายละเอียด', cols: 'col-span-2' },
               { key: 'owner', label: 'ผู้รับผิดชอบ', cols: 'col-span-2 md:col-span-1' },
               { key: 'dept', label: 'ฝ่ายงาน', cols: 'col-span-2 md:col-span-1' },
               { key: 'location', label: 'สถานที่', cols: 'col-span-2' },
               { key: 'priority', label: 'ระดับความสำคัญ', cols: 'col-span-2' }
             ].map((col) => (
                <label key={col.key} className={`flex items-center gap-2.5 cursor-pointer ${col.cols || ''}`}>
                  <input type="checkbox" className="hidden" checked={columns[col.key as keyof typeof columns]} onChange={() => toggleCol(col.key as keyof typeof columns)} />
                  <div className={`w-[18px] h-[18px] rounded border flex items-center justify-center shrink-0 ${columns[col.key as keyof typeof columns] ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                    {columns[col.key as keyof typeof columns] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="truncate">{col.label}</span>
                </label>
             ))}
          </div>

          <div className="flex justify-center md:justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-full text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-[14.5px]">
              ยกเลิก
            </button>
            <button 
              onClick={() => onExport({ startDate, endDate, columns })} 
              className="px-6 py-2.5 rounded-full text-white font-bold flex items-center gap-2 transition-colors shadow-md hover:opacity-90 text-[14.5px]" 
              style={{ backgroundColor: theme.headerColor }}
            >
              <Icon className="w-4 h-4" />
              {theme.btnText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
