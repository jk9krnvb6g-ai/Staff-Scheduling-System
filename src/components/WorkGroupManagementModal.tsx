import { useState, useEffect, FormEvent } from 'react';
import { X, Plus, Trash2, Edit2, Check, FolderTree, Building, Layers, Power } from 'lucide-react';

export interface Workgroup {
  id: string;
  name: string;
  departments: string[];
  isActive?: boolean;
  inactiveDepartments?: string[];
}

export const defaultWorkgroups: Workgroup[] = [
  {
    id: "wg-1",
    name: "กลุ่มงานการพยาบาล",
    departments: ["ฝ่ายการพยาบาล", "หอผู้ป่วยใน", "ห้องฉุกเฉิน", "กุมารเวชกรรม"],
    isActive: true,
    inactiveDepartments: []
  },
  {
    id: "wg-2",
    name: "กลุ่มงานบริหารและจัดการ",
    departments: ["กลุ่มบริหารบุคคล", "ฝ่ายการเงินและบัญชี", "ฝ่ายพัสดุและบำรุงรักษา"],
    isActive: true,
    inactiveDepartments: []
  },
  {
    id: "wg-3",
    name: "กลุ่มงานเทคโนโลยีและสารสนเทศ",
    departments: ["เทคโนโลยีสารสนเทศ", "สารสนเทศและการสื่อสาร", "ฝ่ายข้อมูลและสถิติ"],
    isActive: true,
    inactiveDepartments: []
  },
  {
    id: "wg-4",
    name: "แอดมินระบบ",
    departments: ["เทคโนโลยีสารสนเทศ", "ผู้ดูแลระบบย่อย"],
    isActive: true,
    inactiveDepartments: []
  }
];

export function getStoredWorkgroups(): Workgroup[] {
  const stored = localStorage.getItem('mock_workgroups');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure existing ones have default fields populated
      return parsed.map((item: any) => ({
        ...item,
        isActive: item.isActive !== false,
        inactiveDepartments: item.inactiveDepartments || []
      }));
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('mock_workgroups', JSON.stringify(defaultWorkgroups));
  return defaultWorkgroups;
}

interface WorkGroupManagementModalProps {
  onClose: () => void;
  userRole?: string | null;
}

export function WorkGroupManagementModal({ onClose, userRole }: WorkGroupManagementModalProps) {
  const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Adding Workgroup State
  const [newGroupName, setNewGroupName] = useState('');
  
  // Adding Department State
  const [newDeptName, setNewDeptName] = useState('');
  
  // Editing Workgroup State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Editing Department State
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    setWorkgroups(getStoredWorkgroups());
  }, []);

  useEffect(() => {
    if (workgroups.length > 0) {
      localStorage.setItem('mock_workgroups', JSON.stringify(workgroups));
      if (!selectedGroupId || !workgroups.some(g => g.id === selectedGroupId)) {
        setSelectedGroupId(workgroups[0].id);
      }
    }
  }, [workgroups]);

  const handleAddGroup = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('สิทธิ์ของคุณไม่สามารถเพิ่มกลุ่มงานได้');
      return;
    }
    if (!newGroupName.trim()) return;
    
    // Check duplication
    const exists = workgroups.some(g => g.name.trim() === newGroupName.trim());
    if (exists) {
      alert('กลุ่มงานนี้มีอยู่แล้วในระบบ');
      return;
    }

    const newGroup: Workgroup = {
      id: 'wg-' + Math.random().toString(36).substring(2, 9),
      name: newGroupName.trim(),
      departments: [],
      isActive: true,
      inactiveDepartments: []
    };

    const updated = [...workgroups, newGroup];
    setWorkgroups(updated);
    setSelectedGroupId(newGroup.id);
    setNewGroupName('');
  };

  const handleStartEditGroup = (group: Workgroup) => {
    if (!isAdmin) return;
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleSaveEditGroup = (groupId: string) => {
    if (!editingGroupName.trim()) return;
    
    setWorkgroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, name: editingGroupName.trim() };
      }
      return g;
    }));
    setEditingGroupId(null);
  };

  const handleToggleGroupStatus = (groupId: string) => {
    if (!isAdmin) {
      alert('สิทธิ์ของคุณไม่สามารถตั้งค่าสถานะกลุ่มงานได้');
      return;
    }
    setWorkgroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const nextActive = g.isActive === false ? true : false;
        return { ...g, isActive: nextActive };
      }
      return g;
    }));
  };

  const handleAddDept = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('สิทธิ์ของคุณไม่สามารถเพิ่มหน่วยงานได้');
      return;
    }
    if (!newDeptName.trim() || !selectedGroupId) return;

    const group = workgroups.find(g => g.id === selectedGroupId);
    if (!group) return;

    if (group.departments.some(d => d.trim() === newDeptName.trim())) {
      alert('หน่วยงานนี้มีอยู่ในกลุ่มงานนี้อยู่แล้ว');
      return;
    }

    const updated = workgroups.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          departments: [...g.departments, newDeptName.trim()]
        };
      }
      return g;
    });

    setWorkgroups(updated);
    setNewDeptName('');
  };

  const handleStartEditDept = (idx: number, deptName: string) => {
    if (!isAdmin) return;
    setEditingDeptIndex(idx);
    setEditingDeptName(deptName);
  };

  const handleSaveEditDept = (idx: number, oldDeptName: string) => {
    if (!editingDeptName.trim() || !selectedGroupId) return;
    
    // Check duplicates in current group
    const group = workgroups.find(g => g.id === selectedGroupId);
    if (group && group.departments.some((d, dIdx) => dIdx !== idx && d.trim() === editingDeptName.trim())) {
      alert('มีชื่อหน่วยงานย่อยนี้อยู่แล้วในกลุ่มงาน');
      return;
    }

    setWorkgroups(prev => prev.map(g => {
      if (g.id === selectedGroupId) {
        const inactive = g.inactiveDepartments || [];
        const nextInactive = inactive.map(d => d === oldDeptName ? editingDeptName.trim() : d);
        const updatedDepts = [...g.departments];
        updatedDepts[idx] = editingDeptName.trim();
        return {
          ...g,
          departments: updatedDepts,
          inactiveDepartments: nextInactive
        };
      }
      return g;
    }));
    setEditingDeptIndex(null);
  };

  const handleToggleDeptStatus = (deptName: string) => {
    if (!isAdmin) {
      alert('สิทธิ์ของคุณไม่สามารถตั้งค่าสถานะหน่วยงานได้');
      return;
    }
    setWorkgroups(prev => prev.map(g => {
      if (g.id === selectedGroupId) {
        const inactive = g.inactiveDepartments || [];
        const isCurrentlyInactive = inactive.includes(deptName);
        const nextInactive = isCurrentlyInactive 
          ? inactive.filter(d => d !== deptName) 
          : [...inactive, deptName];
        
        return {
          ...g,
          inactiveDepartments: nextInactive
        };
      }
      return g;
    }));
  };

  const activeGroup = workgroups.find(g => g.id === selectedGroupId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[80vh] md:h-[70vh] border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#6366f1]" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              จัดการกลุ่มงานและหน่วยงาน ในสังกัด
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
          
          {/* Left Column: Workgroups */}
          <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col p-4 overflow-y-auto bg-slate-50/20 dark:bg-slate-900/10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5" />
              รายการกลุ่มงาน ({workgroups.length})
            </div>

            <div className="space-y-2 flex-1 min-h-[150px]">
              {workgroups.map(group => {
                const isGroupActive = group.isActive !== false;
                return (
                  <div 
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`group/item flex flex-col p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedGroupId === group.id 
                        ? 'bg-[#6366f1]/10 border-[#6366f1] text-[#6366f1] shadow-sm font-bold' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    } ${!isGroupActive ? 'opacity-65' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0 pr-2">
                        {editingGroupId === group.id ? (
                          <input 
                            type="text"
                            value={editingGroupName}
                            onChange={e => setEditingGroupName(e.target.value)}
                            className="w-full px-2 py-0.5 bg-white dark:bg-slate-700 border border-[#6366f1] rounded max-w-full text-[13px] outline-none text-slate-800 dark:text-slate-100 font-semibold"
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => e.key === 'Enter' && handleSaveEditGroup(group.id)}
                            autoFocus
                          />
                        ) : (
                          <div className="truncate text-[14px]">
                            {group.name}
                            <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                              ({group.departments.length} หน่วยงาน)
                            </span>
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                          {editingGroupId === group.id ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSaveEditGroup(group.id); }}
                              className="p-1 hover:bg-[#6366f1]/25 rounded text-[#22c55e]"
                              title="บันทึก"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStartEditGroup(group); }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-[#6366f1]"
                              title="แก้ไขชื่อกลุ่มงาน"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleGroupStatus(group.id); }}
                            className={`p-1 rounded transition-colors ${
                              isGroupActive 
                                ? 'hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600' 
                                : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[#22c55e] hover:text-emerald-500'
                            }`}
                            title={isGroupActive ? "คลิกเพื่อระงับการใช้งานกลุ่มงาน" : "คลิกเพื่อเปิดใช้งานกลุ่มงาน"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isGroupActive 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-450' 
                          : 'bg-slate-150 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${isGroupActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isGroupActive ? 'เปิดใช้งาน' : 'ระงับใช้งานอยู่'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddGroup} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input 
                  type="text"
                  placeholder="เพิ่มกลุ่มงานใหม่..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-[#6366f1]"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="p-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#4f46e5] flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Departments of Selected Workgroup */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            {activeGroup ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  <Building className="w-3.5 h-3.5" />
                  หน่วยงานใน {activeGroup.name} ({activeGroup.departments.length})
                </div>

                <div className="space-y-2 flex-1 min-h-[150px]">
                  {activeGroup.departments.length === 0 ? (
                    <div className="text-center py-12 text-slate-450 dark:text-slate-500 text-xs">
                      ยังไม่มีหน่วยงานย่อยในกลุ่มงานนี้
                    </div>
                  ) : (
                    activeGroup.departments.map((deptName, idx) => {
                      const isDeptActive = !(activeGroup.inactiveDepartments || []).includes(deptName);
                      const isDeptEditing = editingDeptIndex === idx;

                      return (
                        <div 
                          key={idx}
                          className={`group/dept flex flex-col p-3 bg-white dark:bg-slate-800 rounded-lg border transition-all ${
                            isDeptActive 
                              ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300' 
                              : 'border-slate-150 dark:border-slate-850 opacity-65'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1 min-w-0 pr-2">
                              {isDeptEditing ? (
                                <input 
                                  type="text"
                                  value={editingDeptName}
                                  onChange={e => setEditingDeptName(e.target.value)}
                                  className="w-full px-2 py-0.5 bg-white dark:bg-slate-700 border border-[#6366f1] rounded max-w-full text-[13px] outline-none text-slate-850 dark:text-slate-100 font-semibold"
                                  onClick={e => e.stopPropagation()}
                                  onKeyDown={e => e.key === 'Enter' && handleSaveEditDept(idx, deptName)}
                                  autoFocus
                                />
                              ) : (
                                <div className="text-[13.5px] font-medium text-slate-800 dark:text-slate-200">
                                  {deptName}
                                </div>
                              )}
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/dept:opacity-100 transition-opacity shrink-0">
                                {isDeptEditing ? (
                                  <button 
                                    onClick={() => handleSaveEditDept(idx, deptName)}
                                    className="p-1 hover:bg-[#6366f1]/25 rounded text-[#22c55e]"
                                    title="บันทึก"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleStartEditDept(idx, deptName)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-[#6366f1]"
                                    title="แก้ไขชื่อหน่วยงาน"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button 
                                  onClick={() => handleToggleDeptStatus(deptName)}
                                  className={`p-1 rounded transition-colors ${
                                    isDeptActive 
                                      ? 'hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600' 
                                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[#22c55e] hover:text-emerald-500'
                                  }`}
                                  title={isDeptActive ? "คลิกเพื่อระงับการใช้งานหน่วยงาน" : "คลิกเพื่อเปิดใช้งานหน่วยงาน"}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="mt-1 flex items-center">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isDeptActive 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-450' 
                                : 'bg-slate-150 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${isDeptActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {isDeptActive ? 'เปิดใช้งาน' : 'ระงับใช้งานอยู่'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {isAdmin && (
                  <form onSubmit={handleAddDept} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-100 flex gap-2">
                    <input 
                      type="text"
                      placeholder={`เพิ่มหน่วยงานในกลุ่มงาน ${activeGroup.name}...`}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-[#6366f1]"
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มหน่วยงาน
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-450 text-xs">
                กรุณาเลือกกลุ่มงานฝั่งซ้ายมือ
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
