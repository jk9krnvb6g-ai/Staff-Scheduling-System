import { useAuth } from '../context/AuthContext';
import { Clock, LogOut } from 'lucide-react';

export function PendingApproval() {
  const { logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-sm w-full border border-slate-200 dark:border-slate-700 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-50">รอการอนุมัติ</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium text-sm">
          บัญชีของคุณอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ กรุณารอการอนุมัติเพื่อเข้าใช้งาน
        </p>
        <button 
          onClick={logout}
          className="flex items-center justify-center w-full gap-2 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition font-bold"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
