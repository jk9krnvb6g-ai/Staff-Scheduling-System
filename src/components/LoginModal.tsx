import { useState, FormEvent } from 'react';
import { Lock, X, User, Key, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { loginWithEmail, registerWithEmail } = useAuth();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // Allow testing without @domain by auto-appending a demo domain
    const formattedEmail = email.trim().includes('@') ? email.trim() : `${email.trim()}@demo.com`;

    try {
      if (isRegisterMode) {
        if (password !== confirmPassword) {
           setErrorMsg('รหัสผ่านไม่ตรงกัน');
           setLoading(false);
           return;
        }
        await registerWithEmail(formattedEmail, password);
        // After successful registration, it will automatically log in. App.tsx will show RegistrationForm for missing profile.
        onClose();
      } else {
        await loginWithEmail(formattedEmail, password);
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setErrorMsg('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
      } else if (err.code === 'auth/email-already-in-use') {
         setErrorMsg('ชื่อผู้ใช้งาน/อีเมลนี้ถูกใช้งานแล้ว');
      } else if (err.code === 'auth/operation-not-allowed') {
         setErrorMsg('ระบบยังไม่เปิดให้ใช้รหัสผ่าน กรุณาเข้าไปเปิด "Email/Password" ในหน้า Authentication ของ Firebase Console ก่อนครับ');
      } else {
         setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] w-full max-w-[420px] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#6366f1]" />
            <h2 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">
              {isRegisterMode ? 'สมัครสมาชิกสำหรับเจ้าหน้าที่' : 'เข้าสู่ระบบสำหรับเจ้าหน้าที่'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-350 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 md:p-8 flex flex-col bg-white dark:bg-slate-800">
          
          {/* Main User Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-sm">
              <User className="w-7 h-7 text-[#6366f1]" />
            </div>
          </div>

          {errorMsg && (
             <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-[13px] font-medium text-center">
               {errorMsg}
             </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block text-[14px] font-medium text-slate-600 dark:text-slate-300">ชื่อผู้ใช้งาน หรือ อีเมล</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                  placeholder="Username / Email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[14px] font-medium text-slate-600 dark:text-slate-300">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-normal">
                  <Key className="h-4 w-4 text-slate-400" style={{ transform: 'scaleX(-1)' }} />
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                  placeholder="Password"
                />
              </div>
            </div>

            {/* Confirm Password (Registration only) */}
            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="block text-[14px] font-medium text-slate-600 dark:text-slate-300">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-normal">
                    <Key className="h-4 w-4 text-slate-400" style={{ transform: 'scaleX(-1)' }} />
                  </div>
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm shadow-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all"
                    placeholder="Confirm Password"
                  />
                </div>
              </div>
            )}

            {!isRegisterMode && (
              <div className="flex justify-between items-center pt-1">
                 <button 
                    type="button"
                    onClick={() => setIsRegisterMode(true)}
                    className="text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                 >
                    สมัครสมาชิกใหม่?
                 </button>
                 <a href="#" className="text-[13px] font-medium text-[#4285f4] hover:text-[#3367d6] transition-colors">
                    ลืมรหัสผ่าน?
                 </a>
              </div>
            )}
            
            {isRegisterMode && (
              <div className="flex justify-start pt-1">
                 <button 
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className="text-[13px] font-medium text-[#4285f4] hover:text-[#3367d6] transition-colors"
                 >
                    มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                 </button>
              </div>
            )}

            <div className="pt-4 space-y-3">
               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full py-3 bg-[#4285f4] hover:bg-[#3367d6] active:bg-[#2b56b3] text-white text-[15px] font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center"
               >
                 {loading ? 'กำลังดำเนินการ...' : (isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ')}
               </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
