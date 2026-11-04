// Mock Firebase with LocalStorage-backed fully-reactive JSON database
// Bypasses Firebase Console dependency to support offline/local testing natively

const defaultUsers = [
  {
    id: 'noy_admin_id',
    email: 'noy.thaweesit@gmail.com',
    password: 'password',
    displayName: 'เจ้าหน้าที่ทวีสิทธิ์ (Noy)',
    role: 'superadmin',
    status: 'active',
    workGroup: 'กลุ่มงานการพยาบาล',
    department: 'ฝ่ายการพยาบาล',
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin_id',
    email: 'admin@demo.com',
    password: 'password',
    displayName: 'ผู้ดูแลระบบสูงสุด',
    role: 'superadmin',
    status: 'active',
    workGroup: 'แอดมินระบบ',
    department: 'เทคโนโลยีสารสนเทศ',
    createdAt: new Date().toISOString()
  }
];

// Initialize mock database in LocalStorage if clear
if (!localStorage.getItem('mock_users')) {
  localStorage.setItem('mock_users', JSON.stringify(defaultUsers));
}
if (!localStorage.getItem('mock_presence')) {
  localStorage.setItem('mock_presence', JSON.stringify([]));
}

// Global active auth listeners
const authListeners: Array<(user: any) => void> = [];

export const auth = {
  currentUser: null as any
};

export const db = {};

export class GoogleAuthProvider {
  setCustomParameters() {}
}

export const googleProvider = new GoogleAuthProvider();

export function onAuthStateChanged(authObj: any, callback: (user: any) => void) {
  authListeners.push(callback);
  
  const savedUserId = localStorage.getItem('mock_current_user_id');
  if (savedUserId) {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = users.find((u: any) => u.id === savedUserId);
    if (user) {
      auth.currentUser = { uid: user.id, email: user.email };
      callback(auth.currentUser);
    } else {
      auth.currentUser = null;
      callback(null);
    }
  } else {
    auth.currentUser = null;
    callback(null);
  }

  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

export async function signInWithPopup(authObj: any, provider: any) {
  // Autologin as noy.thaweesit@gmail.com (Superadmin) for easy testing
  const targetEmail = 'noy.thaweesit@gmail.com';
  const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
  let user = users.find((u: any) => u.email === targetEmail);
  if (!user) {
    user = {
      id: 'noy_admin_id',
      email: targetEmail,
      displayName: 'เจ้าหน้าที่ทวีสิทธิ์ (Noy)',
      password: 'password',
      role: 'superadmin',
      status: 'active',
      workGroup: 'กลุ่มงานการพยาบาล',
      department: 'ฝ่ายการพยาบาล',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem('mock_users', JSON.stringify(users));
  }
  localStorage.setItem('mock_current_user_id', user.id);
  auth.currentUser = { uid: user.id, email: user.email };
  authListeners.forEach(cb => cb(auth.currentUser));
  triggerDocListeners('users', user.id);
  triggerCollectionListeners('users');
  return { user: auth.currentUser };
}

export async function signInWithEmailAndPassword(authObj: any, email: string, pass: string) {
  const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
  const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== pass) {
    const err = new Error('Incorrect credentials');
    (err as any).code = 'auth/invalid-credential';
    throw err;
  }
  localStorage.setItem('mock_current_user_id', user.id);
  auth.currentUser = { uid: user.id, email: user.email };
  authListeners.forEach(cb => cb(auth.currentUser));
  triggerDocListeners('users', user.id);
  triggerCollectionListeners('users');
  return { user: auth.currentUser };
}

export async function createUserWithEmailAndPassword(authObj: any, email: string, pass: string) {
  const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
  const exists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    const err = new Error('Email already in use');
    (err as any).code = 'auth/email-already-in-use';
    throw err;
  }
  const newId = 'user_' + Math.random().toString(36).substring(2, 11);
  const newUser = {
    id: newId,
    email: email.trim(),
    password: pass,
    displayName: email.split('@')[0],
    role: 'user',
    status: 'pending',
    workGroup: '',
    department: '',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem('mock_users', JSON.stringify(users));
  localStorage.setItem('mock_current_user_id', newId);
  auth.currentUser = { uid: newId, email: email };
  authListeners.forEach(cb => cb(auth.currentUser));
  triggerCollectionListeners('users');
  return { user: auth.currentUser };
}

export async function signOut(authObj: any) {
  localStorage.removeItem('mock_current_user_id');
  auth.currentUser = null;
  authListeners.forEach(cb => cb(null));
}

// --- FIRESTORE MOCK SYSTEM ---

const dbListeners: Array<{
  type: 'doc' | 'collection';
  path: string;
  callback: Function;
}> = [];

function getMockDoc(collectionPath: string, docId: string) {
  if (collectionPath === 'users') {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    return users.find((u: any) => u.id === docId) || null;
  }
  if (collectionPath === 'presence') {
    const presenceList = JSON.parse(localStorage.getItem('mock_presence') || '[]');
    return presenceList.find((p: any) => p.id === docId) || null;
  }
  return null;
}

function getMockCollection(collectionPath: string, constraints: any[] = []) {
  if (collectionPath === 'users') {
    return JSON.parse(localStorage.getItem('mock_users') || '[]');
  }
  if (collectionPath === 'presence') {
    let presenceList = JSON.parse(localStorage.getItem('mock_presence') || '[]');
    if (constraints && constraints.length > 0) {
      constraints.forEach(c => {
        if (c && c.field === 'workGroup' && c.operator === '==') {
          presenceList = presenceList.filter((p: any) => p.workGroup === c.value);
        }
      });
    }
    return presenceList;
  }
  return [];
}

function triggerDocListeners(collectionPath: string, docId: string) {
  const path = `${collectionPath}/${docId}`;
  const data = getMockDoc(collectionPath, docId);
  dbListeners.forEach(lst => {
    if (lst.type === 'doc' && lst.path === path) {
      lst.callback({
        exists: () => data !== null,
        data: () => data
      });
    }
  });
}

function triggerCollectionListeners(collectionPath: string) {
  dbListeners.forEach(lst => {
    if (lst.type === 'collection' && lst.path === collectionPath) {
      const docs = getMockCollection(collectionPath);
      const snap = {
        forEach: (cb: Function) => {
          docs.forEach(d => cb({ id: d.id, data: () => d }));
        },
        docs: docs.map(d => ({ id: d.id, data: () => d }))
      };
      lst.callback(snap);
    }
  });
}

export function doc(dbObj: any, collectionPath: string, docId: string) {
  return { type: 'doc', collectionPath, docId };
}

export function collection(dbObj: any, collectionPath: string) {
  return { type: 'collection', collectionPath };
}

export function query(collectionRef: any, ...constraints: any[]) {
  return { type: 'query', collectionRef, constraints };
}

export function where(field: string, operator: string, value: any) {
  return { field, operator, value };
}

export function serverTimestamp() {
  return {
    toMillis: () => new Date().getTime()
  };
}

export async function getDocs(queryRef: any) {
  const collectionPath = queryRef.type === 'query' ? queryRef.collectionRef.collectionPath : queryRef.collectionPath;
  const constraints = queryRef.type === 'query' ? queryRef.constraints : [];
  const docs = getMockCollection(collectionPath, constraints);
  return {
    docs: docs.map(d => ({
      id: d.id,
      data: () => d
    }))
  };
}

export async function setDoc(docRef: any, data: any, options: any = {}) {
  const collectionPath = docRef.collectionPath;
  const docId = docRef.docId;

  if (collectionPath === 'users') {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const idx = users.findIndex((u: any) => u.id === docId);
    if (idx !== -1) {
      if (options.merge) {
        users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
      } else {
        users[idx] = { ...data, id: docId, updatedAt: new Date().toISOString() };
      }
    } else {
      users.push({ ...data, id: docId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem('mock_users', JSON.stringify(users));
  } else if (collectionPath === 'presence') {
    const list = JSON.parse(localStorage.getItem('mock_presence') || '[]');
    const idx = list.findIndex((p: any) => p.id === docId);
    
    const freshData = { ...data };
    if (freshData.lastSeen && typeof freshData.lastSeen === 'object') {
      freshData.lastSeen = {
        toMillis: () => new Date().getTime()
      };
    } else {
      freshData.lastSeen = {
        toMillis: () => new Date().getTime()
      };
    }

    if (idx !== -1) {
      list[idx] = { ...list[idx], ...freshData, id: docId };
    } else {
      list.push({ ...freshData, id: docId });
    }
    localStorage.setItem('mock_presence', JSON.stringify(list));
  }

  triggerDocListeners(collectionPath, docId);
  triggerCollectionListeners(collectionPath);
}

export async function updateDoc(docRef: any, data: any) {
  await setDoc(docRef, data, { merge: true });
}

export async function deleteDoc(docRef: any) {
  const collectionPath = docRef.collectionPath;
  const docId = docRef.docId;

  if (collectionPath === 'users') {
    let users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    users = users.filter((u: any) => u.id !== docId);
    localStorage.setItem('mock_users', JSON.stringify(users));
  } else if (collectionPath === 'presence') {
    let list = JSON.parse(localStorage.getItem('mock_presence') || '[]');
    list = list.filter((p: any) => p.id !== docId);
    localStorage.setItem('mock_presence', JSON.stringify(list));
  }

  triggerDocListeners(collectionPath, docId);
  triggerCollectionListeners(collectionPath);
}

export function onSnapshot(ref: any, callback: Function) {
  const listener = {
    type: ref.type === 'query' ? 'collection' : ref.type,
    path: ref.type === 'doc' ? `${ref.collectionPath}/${ref.docId}` : (ref.type === 'query' ? ref.collectionRef.collectionPath : ref.collectionPath),
    callback
  };
  dbListeners.push(listener);

  // Initial async push to allow state updates
  setTimeout(() => {
    if (ref.type === 'doc') {
      const data = getMockDoc(ref.collectionPath, ref.docId);
      callback({
        exists: () => data !== null,
        data: () => data
      });
    } else {
      const colPath = ref.type === 'query' ? ref.collectionRef.collectionPath : ref.collectionPath;
      const constraints = ref.type === 'query' ? ref.constraints : [];
      const docs = getMockCollection(colPath, constraints);
      const snap = {
        forEach: (cb: Function) => {
          docs.forEach(d => cb({ id: d.id, data: () => d }));
        },
        docs: docs.map(d => ({ id: d.id, data: () => d }))
      };
      callback(snap);
    }
  }, 0);

  return () => {
    const idx = dbListeners.indexOf(listener);
    if (idx !== -1) dbListeners.splice(idx, 1);
  };
}
