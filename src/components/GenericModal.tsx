import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface GenericModalProps {
  title: string;
  message: string;
  type?: 'success' | 'danger' | 'info';
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

export function GenericModal({ title, message, type = 'info', onClose, onConfirm, confirmText = 'ตกลง' }: GenericModalProps) {
  const isDanger = type === 'danger';
  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col items-center text-center space-y-3">
          {isSuccess && <CheckCircle className="w-12 h-12 text-[#22c55e]" />}
          {isDanger && <AlertCircle className="w-12 h-12 text-[#f43f5e]" />}
          {!isSuccess && !isDanger && <Info className="w-12 h-12 text-[#6366f1]" />}
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>

        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex gap-2 justify-center">
          {onConfirm ? (
            <>
              <button 
                onClick={onClose} 
                className="px-4 py-1.5 rounded text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-1"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }} 
                className={`px-4 py-1.5 rounded text-[13px] font-medium text-white transition-colors flex-1 shadow ${isDanger ? 'bg-[#f43f5e] hover:bg-[#e11d48]' : 'bg-[#6366f1] hover:bg-[#4f46e5]'}`}
              >
                {confirmText}
              </button>
            </>
          ) : (
             <button 
                onClick={onClose} 
                className="px-8 py-1.5 rounded text-[13px] font-medium text-white bg-[#6366f1] hover:bg-[#4f46e5] transition-colors shadow"
              >
                ปิด
              </button>
          )}
        </div>
      </div>
    </div>
  );
}
