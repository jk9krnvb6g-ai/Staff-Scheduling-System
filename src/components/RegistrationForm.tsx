import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStoredWorkgroups } from './WorkGroupManagementModal';
import { db, doc, setDoc, serverTimestamp } from '../lib/firebase';

export function RegistrationForm() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [workGroup, setWorkGroup] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableWorkgroups, setAvailableWorkgroups] = useState<any[]>([]);

  useEffect(() => {
    const wg = getStoredWorkgroups();
    setAvailableWorkgroups(wg);
    if (wg.length > 0) {
      setWorkGroup(wg[0].name);
      setDepartment(wg[0].departments[0] || '');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    let role = 'user';
    let status = 'pending';
    
    if (user.email === 'noy.thaweesit@gmail.com') {
      role = 'superadmin';
      status = 'active';
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        role,
        status,
        workGroup,
        department,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Error registering user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-md w-full border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-50">สมัครสมาชิก</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium text-sm">กรุณากรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งานระบบ</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">ชื่อ-นามสกุล / ชื่อที่แสดง</label>
            <input 
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-[14px]"
              placeholder="Ex: สมชาย ใจดี"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">กลุ่มงาน</label>
            <select 
              required
              value={workGroup}
              onChange={(e) => {
                const val = e.target.value;
                setWorkGroup(val);
                const found = availableWorkgroups.find(g => g.name === val);
                if (found) {
                  const activeDepts = found.departments.filter((d: string) => !(found.inactiveDepartments || []).includes(d));
                  if (activeDepts.length > 0) {
                    setDepartment(activeDepts[0]);
                  } else if (found.departments.length > 0) {
                    setDepartment(found.departments[0]);
                  } else {
                    setDepartment('');
                  }
                } else {
                  setDepartment('');
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-[14px]"
            >
              {availableWorkgroups
                .filter(g => g.isActive !== false || g.name === workGroup)
                .map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">หน่วยงาน</label>
            <select 
              required
              value={department}
              disabled={!workGroup}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-[14px] disabled:opacity-50"
            >
              {(() => {
                const found = availableWorkgroups.find(g => g.name === workGroup);
                if (!found) return [];
                const activeDepts = found.departments.filter((d: string) => !(found.inactiveDepartments || []).includes(d) || d === department);
                return activeDepts;
              })().map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={logout}
              className="flex-1 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition font-medium"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded transition font-medium disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
