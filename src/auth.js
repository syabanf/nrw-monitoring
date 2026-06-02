// Auth module — mock authentication for prototype

const STORAGE_KEY = 'nrw-auth-v1';

export const USERS = [
  { email: 'budi@pdam.id', password: 'demo123', name: 'Budi Santoso', role: 'NRW Supervisor', initials: 'BS', avatar: 'from-orange-500 to-orange-700' },
  { email: 'dewi@pdam.id', password: 'demo123', name: 'Dewi Anggraini', role: 'Operator', initials: 'DA', avatar: 'from-purple-500 to-purple-700' },
  { email: 'sari@pdam.id', password: 'demo123', name: 'Sari Wijaya', role: 'Data Analyst', initials: 'SW', avatar: 'from-emerald-500 to-emerald-700' },
  { email: 'sutrisno@pdam.id', password: 'demo123', name: 'Pak Sutrisno', role: 'Field Inspector', initials: 'PS', avatar: 'from-blue-500 to-blue-700' },
  { email: 'rachman@pdam.id', password: 'demo123', name: 'Pak Rachman', role: 'Executive', initials: 'PR', avatar: 'from-rose-500 to-rose-700' },
  { email: 'admin@pdam.id', password: 'demo123', name: 'System Admin', role: 'Administrator', initials: 'SA', avatar: 'from-slate-500 to-slate-700' }
];

let currentUser = null;
try {
  const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (stored) currentUser = JSON.parse(stored);
} catch {}

export function getCurrentUser() { return currentUser; }
export function isLoggedIn() { return !!currentUser; }

export function login({ email, password, remember = false }) {
  const user = USERS.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
  if (!user) return { ok: false, error: 'No account with that email address' };
  if (password !== user.password) return { ok: false, error: 'Incorrect password — try "demo123"' };
  const sessionUser = { email: user.email, name: user.name, role: user.role, initials: user.initials, avatar: user.avatar };
  currentUser = sessionUser;
  try {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    (remember ? sessionStorage : localStorage).removeItem(STORAGE_KEY);
  } catch {}
  return { ok: true, user: sessionUser };
}

export function logout() {
  currentUser = null;
  try { localStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

export function quickLogin(email) {
  return login({ email, password: 'demo123', remember: true });
}
