import { useEffect, useState, FormEvent } from 'react';
import { X, Check, XCircle, Users, User, Trash2, Edit2, Plus, Mail, Key } from 'lucide-react';
import { 
  auth, 
  db, 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  setDoc,
  createUserWithEmailAndPassword 
} from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { getStoredWorkgroups } from './WorkGroupManagementModal';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: string;
  status: string;
  workGroup: string;
  department: string;
}

export function UserManagementModal({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'add'>('pending');

  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [availableWorkgroups, setAvailableWorkgroups] = useState<any[]>([]);

  useEffect(() => {
    const wg = getStoredWorkgroups();
    setAvailableWorkgroups(wg);
    if (wg.length > 0) {
      setNewGroup(wg[0].name);
      setNewDept(wg[0].departments[0] || '');
    }
  }, []);

  const isSuperAdmin = profile?.role === 'superadmin' || user?.email === 'noy.thaweesit@gmail.com';

  // Change password states
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserData | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdatePassword = async (userId: string, newPass: string) => {
    if (!newPass.trim() || newPass.trim().length < 6) {
      alert("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setIsChangingPassword(true);
    try {
      const usersList = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const updatedList = usersList.map((u: any) => {
        if (u.id === userId) {
          return { ...u, password: newPass.trim() };
        }
        return u;
      });
      localStorage.setItem('mock_users', JSON.stringify(updatedList));
      alert("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!");
      setSelectedUserForPassword(null);
      setNewPasswordForUser('');
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const canShowChangePasswordIcon = (targetUser: UserData) => {
    const currentRole = profile?.role;
    if (currentRole === 'superadmin') {
      return targetUser.role !== 'superadmin';
    }
    if (currentRole === 'admin') {
      return targetUser.role === 'user';
    }
    return false;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const items: UserData[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<UserData, 'id'>
      }));
      setUsers(items);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (e) {
      console.error(e);
      alert('Error updating user status');
    }
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error(e);
      alert('Error updating user role');
    }
  };

  const handleSaveEdit = async () => {
     if(!editingUser) return;
     try {
        await updateDoc(doc(db, 'users', editingUser.id), {
           displayName: editingUser.displayName,
           workGroup: editingUser.workGroup,
           department: editingUser.department,
           updatedAt: serverTimestamp()
        });
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
     } catch (e) {
        console.error(e);
        alert('Error updating user profile');
     }
  }

  const handleDelete = async (id: string) => {
    if(!confirm('ยืนยันการลบผู้ใช้งานนี้ออกจากระบบ?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      console.error(e);
      alert('Error deleting user');
    }
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formattedEmail = newEmail.trim().includes('@') ? newEmail.trim() : `${newEmail.trim()}@demo.com`;

    try {
      // Create user in firebase auth
      const cred = await createUserWithEmailAndPassword(auth, formattedEmail, newPassword);
      const newUid = cred.user.uid;

      // Add to firestore
      await setDoc(doc(db, 'users', newUid), {
         email: formattedEmail,
         displayName: newName,
         role: newRole,
         status: 'active', // Auto-approve since admin created them
         workGroup: newGroup,
         department: newDept,
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp()
      });

      // Clear form & switch tab
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewGroup('');
      setNewDept('');
      setNewRole('user');
      
      await fetchUsers(); // Refresh list
      setActiveTab('users');
      alert('เพิ่มผู้ใช้งานสำเร็จ!');
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
         setErrorMsg('ชื่อผู้ใช้งาน/อีเมลนี้ถูกใช้งานแล้ว');
      } else {
         setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status !== 'pending');

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#6366f1]" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              จัดการผู้ใช้งานและอนุมัติสิทธิ์
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'pending' ? 'border-[#6366f1] text-[#6366f1]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
          >
            รอการอนุมัติ 
            {pendingUsers.length > 0 && (
              <span className="bg-[#f43f5e] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 text-[14px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-[#6366f1] text-[#6366f1]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
          >
            รายชื่อผู้ใช้งานทั้งหมด
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`px-4 py-3 text-[14px] font-bold border-b-2 transition-colors flex items-center gap-1 whitespace-nowrap ${activeTab === 'add' ? 'border-[#6366f1] text-[#6366f1]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
          >
            <Plus className="w-4 h-4" /> เพิ่มผู้ใช้ใหม่
          </button>
        </div>
        
        {/* Content */}
        <div className="p-0 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/20">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <span className="text-slate-500 font-medium">กำลังโหลด...</span>
            </div>
          ) : activeTab === 'pending' ? (
            /* Tab: Pending */
            pendingUsers.length === 0 ? (
              <div className="py-20 text-center text-slate-500 font-medium">
                ไม่มีคำขอเข้าใช้งานที่รอการอนุมัติ
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 text-[15px]">{u.displayName}</h3>
                      <p className="text-[13px] text-slate-500 mb-2 truncate">{u.email}</p>
                      <div className="flex flex-wrap gap-1.5">
                         <span className="text-[11px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30">
                           {u.workGroup}
                         </span>
                         <span className="text-[11px] font-bold px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30">
                           {u.department}
                         </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <button 
                        onClick={() => handleUpdateStatus(u.id, 'rejected')}
                        className="flex-1 px-3 py-1.5 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/5 text-[#f43f5e] hover:bg-[#f43f5e]/10 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> ปฏิเสธ
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(u.id, 'active')}
                        className="flex-1 px-3 py-1.5 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-lg bg-[#22c55e] text-white hover:bg-[#16a34a] transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" /> อนุมัติ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'users' ? (
            /* Tab: All Users */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap">ชื่อผู้ใช้งาน</th>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap">Username</th>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap">กลุ่มงาน / หน่วยงาน</th>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap">บทบาท</th>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap">สถานะ</th>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap w-[60px]">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-transparent">
                  {activeUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-50">{u.displayName}</div>
                        <div className="text-[12px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold select-all">
                          {u.email.split('@')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">{u.workGroup}</div>
                        <div className="text-[12px] text-slate-500">{u.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          disabled={!isSuperAdmin && u.role === 'superadmin'}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[13px] rounded-md focus:ring-[#6366f1] focus:border-[#6366f1] p-1.5 font-medium disabled:opacity-50 outline-none"
                        >
                          <option value="user" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">User (ทั่วไป)</option>
                          <option value="admin" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Admin (ผู้ดูแล)</option>
                          {isSuperAdmin && <option value="superadmin" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Superadmin</option>}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                         <select 
                          value={u.status}
                          onChange={(e) => handleUpdateStatus(u.id, e.target.value)}
                          disabled={!isSuperAdmin && u.role === 'superadmin'}
                          className={`text-[13px] rounded-md p-1.5 font-bold outline-none border focus:ring-[#6366f1] focus:border-[#6366f1] disabled:opacity-50 ${
                            u.status === 'active' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' : 
                            u.status === 'rejected' ? 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20' : 
                            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          <option value="active" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Active (ใช้งาน)</option>
                          <option value="rejected" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Rejected (ระงับ)</option>
                          <option value="pending" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Pending (รออนุมัติ)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                           {canShowChangePasswordIcon(u) && (
                             <button 
                               onClick={() => setSelectedUserForPassword(u)}
                               className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors"
                               title="เปลี่ยนรหัสผ่าน"
                             >
                                <Key className="w-4 h-4 text-amber-500 hover:scale-110 transition-transform" />
                             </button>
                            )}
                            <button
                              onClick={() => setEditingUser(u)}
                             disabled={!isSuperAdmin && u.role === 'superadmin'}
                             className="p-1.5 text-slate-400 hover:text-[#6366f1] hover:bg-[#6366f1]/10 rounded transition-colors disabled:opacity-50"
                             title="แก้ไขผู้ใช้งาน"
                           >
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDelete(u.id)}
                             disabled={!isSuperAdmin && u.role === 'superadmin'}
                             className="p-1.5 text-slate-400 hover:text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded transition-colors disabled:opacity-50"
                             title="ลบผู้ใช้งาน"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'add' ? (
             <div className="p-8 max-w-2xl mx-auto">
               <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">เพิ่มผู้ใช้งานใหม่เข้าระบบ</h3>
               
               <form onSubmit={handleAddUser} className="space-y-5">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 text-[13px] rounded-lg border border-red-200">
                      {errorMsg}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อ-นามสกุล / Username <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            placeholder="username"
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] focus:ring-2 focus:ring-[#6366f1] focus:border-transparent outline-none"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">ใช้ตั้งเป็น Username เข้าสู่ระบบ (เช่น สมหวัง หรือ email@domain.com)</p>
                     </div>
                     <div>
                        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">รหัสผ่าน <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="password" 
                            required
                            minLength={6}
                            placeholder="อย่างน้อย 6 ตัวอักษร"
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] focus:ring-2 focus:ring-[#6366f1] focus:border-transparent outline-none"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อแสดงผล (Display Name) <span className="text-red-500">*</span></label>
                     <input 
                       type="text" 
                       required
                       className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] focus:ring-2 focus:ring-[#6366f1] focus:border-transparent outline-none"
                       value={newName}
                       onChange={(e) => setNewName(e.target.value)}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">กลุ่มงาน <span className="text-red-500">*</span></label>
                        <select 
                          required
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] text-slate-800 dark:text-slate-100 outline-none"
                          value={newGroup}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewGroup(val);
                            const found = availableWorkgroups.find(g => g.name === val);
                            if (found) {
                              const activeDepts = found.departments.filter((d: string) => !(found.inactiveDepartments || []).includes(d));
                              if (activeDepts.length > 0) {
                                setNewDept(activeDepts[0]);
                              } else if (found.departments.length > 0) {
                                setNewDept(found.departments[0]);
                              } else {
                                setNewDept('');
                              }
                            } else {
                              setNewDept('');
                            }
                          }}
                        >
                          {availableWorkgroups
                            .filter(g => g.isActive !== false || g.name === newGroup)
                            .map(g => (
                              <option key={g.id} value={g.name} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{g.name}</option>
                            ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">หน่วยงาน <span className="text-red-500">*</span></label>
                        <select 
                          required
                          disabled={!newGroup}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] text-slate-800 dark:text-slate-100 outline-none disabled:opacity-50"
                          value={newDept}
                          onChange={(e) => setNewDept(e.target.value)}
                        >
                          {(() => {
                            const found = availableWorkgroups.find(g => g.name === newGroup);
                            if (!found) return [];
                            const activeDepts = found.departments.filter((d: string) => !(found.inactiveDepartments || []).includes(d) || d === newDept);
                            return activeDepts;
                          })().map(d => (
                            <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{d}</option>
                          ))}
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">สิทธิ์การใช้งาน (Role)</label>
                     <select 
                       className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#6366f1] focus:border-transparent outline-none font-medium"
                       value={newRole}
                       onChange={(e) => setNewRole(e.target.value)}
                     >
                       <option value="user" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">User (ผู้ใช้งานทั่วไป)</option>
                       <option value="admin" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Admin (ผู้ดูแลระบบงาน)</option>
                       {isSuperAdmin && <option value="superadmin" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Superadmin (ผู้ดูแลระบบสูงสุด)</option>}
                     </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                     <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                     >
                        {isSubmitting ? 'กำลังบันทึก...' : <><Check className="w-4 h-4" /> เพิ่มผู้ใช้งาน</>}
                     </button>
                   </div>
                </form>
             </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {editingUser && (
         <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                 <Edit2 className="w-4 h-4 text-[#6366f1]" /> แก้ไขข้อมูลผู้ใช้งาน
               </h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">ชื่อแสดงผล</label>
                     <input 
                        type="text" 
                        value={editingUser.displayName} 
                        onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 text-sm font-semibold"
                     />
                  </div>
                  <div>
                     <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">กลุ่มงาน</label>
                     <select 
                        value={editingUser.workGroup} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = availableWorkgroups.find(g => g.name === val);
                          let nextDept = '';
                          if (found) {
                            const activeDepts = found.departments.filter((d) => !(found.inactiveDepartments || []).includes(d));
                            nextDept = activeDepts.length > 0 ? activeDepts[0] : (found.departments.length > 0 ? found.departments[0] : '');
                          }
                          setEditingUser({
                            ...editingUser,
                            workGroup: val,
                            department: nextDept
                          });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-100 font-semibold text-sm focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 cursor-pointer"
                     >
                       {availableWorkgroups
                         .filter((g) => g.isActive !== false || g.name === editingUser.workGroup)
                         .map((g) => (
                            <option key={g.id} value={g.name} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium">{g.name}</option>
                         ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">หน่วยงาน</label>
                     <select 
                        value={editingUser.department} 
                        onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                        disabled={!editingUser.workGroup}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-100 font-semibold text-sm focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 disabled:opacity-50 cursor-pointer"
                     >
                       {(() => {
                         const found = availableWorkgroups.find((g) => g.name === editingUser.workGroup);
                         if (!found) return [];
                         const activeDepts = found.departments.filter((d) => !(found.inactiveDepartments || []).includes(d) || d === editingUser.department);
                         return activeDepts;
                       })().map((d) => (
                         <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium">{d}</option>
                       ))}
                     </select>
                  </div>
               </div>

               <div className="flex justify-end gap-2 mt-6">
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg text-sm transition-all"
                  >
                     ยกเลิก
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-[#6366f1] text-white font-bold rounded-lg hover:bg-[#4f46e5] text-sm transition-all"
                  >
                     บันทึกการแก้ไข
                  </button>
               </div>
            </div>
         </div>
      )}

      {selectedUserForPassword && (
         <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
                 <Key className="w-4 h-4 text-amber-500" /> เปลี่ยนรหัสผ่านผู้ใช้
               </h3>
               
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                 ผู้ใช้: <strong className="text-slate-800 dark:text-slate-200">{selectedUserForPassword.displayName} ({selectedUserForPassword.email.split('@')[0]})</strong>
               </p>

               <div className="space-y-4">
                  <div>
                     <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">รหัสผ่านใหม่ <span className="text-red-500">*</span></label>
                     <input 
                        type="password" 
                        required
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        value={newPasswordForUser} 
                        onChange={(e) => setNewPasswordForUser(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-semibold"
                     />
                  </div>
               </div>

               <div className="flex justify-end gap-2 mt-6">
                  <button 
                    onClick={() => { setSelectedUserForPassword(null); setNewPasswordForUser(''); }}
                    disabled={isChangingPassword}
                    className="px-4 py-2 font-bold text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-sm transition-all"
                  >
                     ยกเลิก
                  </button>
                  <button 
                    onClick={() => handleUpdatePassword(selectedUserForPassword.id, newPasswordForUser)}
                    disabled={isChangingPassword}
                    className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-indigo-300 text-white font-bold rounded-lg text-sm flex items-center gap-1.5 transition-all outline-none"
                  >
                     {isChangingPassword ? 'กำลังเปลี่ยน...' : 'บันทึก'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
