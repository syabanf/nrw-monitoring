import {
  WORK_ORDERS, ALARMS, INTERVENTIONS, CUSTOMERS, NOTIFICATIONS, ACTIVITY_FEED,
  formatDateTime
} from './data.js';

const subscribers = new Set();
function emit(event, data) {
  subscribers.forEach(fn => { try { fn(event, data); } catch (e) { console.error(e); } });
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

const STORAGE_KEY = 'nrw-state-v1';
const persisted = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
})();

function persist(patch) {
  const next = { ...persisted, ...patch };
  Object.assign(persisted, patch);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
}

function nextWoId() {
  const max = WORK_ORDERS.reduce((m, w) => Math.max(m, parseInt(w.id.slice(-4), 10) || 0), 0);
  return `WO-2026-${String(max + 1).padStart(4, '0')}`;
}

function nextNotifId() {
  const max = NOTIFICATIONS.reduce((m, n) => Math.max(m, parseInt(n.id.slice(-4), 10) || 0), 0);
  return `NTF-2026-${String(max + 1).padStart(4, '0')}`;
}

function nowTs() {
  return '2026-06-02T09:30:00';
}

function logActivity(type, target, text, iconName) {
  ACTIVITY_FEED.unshift({ ts: nowTs(), type, target, text, iconName });
  if (ACTIVITY_FEED.length > 50) ACTIVITY_FEED.length = 50;
}

function pushNotification(notif) {
  NOTIFICATIONS.unshift({ id: nextNotifId(), ts: nowTs(), read: false, ...notif });
  if (NOTIFICATIONS.length > 40) NOTIFICATIONS.length = 40;
  emit('notification', notif);
}

export function createWorkOrder({ title, zoneId, type, priority, assignee, dueDate, description, estRecoveryM3 = 0 }) {
  const wo = {
    id: nextWoId(),
    title, zoneId, type, priority,
    status: assignee ? 'Assigned' : 'Draft',
    assignee: assignee || null,
    createdBy: 'Budi Santoso',
    createdAt: nowTs(),
    dueDate, description,
    suspicionScore: 0,
    estRecoveryM3: Number(estRecoveryM3) || 0,
    estRecoveryIDR: (Number(estRecoveryM3) || 0) * 5000,
    updates: [{ ts: nowTs(), user: 'Budi Santoso', action: 'Created', note: description || '' }],
    evidence: []
  };
  if (assignee) {
    wo.updates.push({ ts: nowTs(), user: 'Budi Santoso', action: 'Assigned', note: `Assigned to ${assignee}` });
  }
  WORK_ORDERS.unshift(wo);
  logActivity('wo', wo.id, `Work order created: ${title}`, 'plus');
  pushNotification({ type: 'wo_created', title: 'New work order', message: `${wo.id} · ${title}`, target: wo.id });
  emit('workOrderCreated', wo);
  return wo;
}

export function updateWorkOrderStatus(id, status, note = '') {
  const w = WORK_ORDERS.find(x => x.id === id);
  if (!w) return null;
  const prev = w.status;
  w.status = status;
  const friendly = status.replace(/([A-Z])/g, ' $1').trim();
  w.updates.push({ ts: nowTs(), user: 'Budi Santoso', action: friendly, note: note || `Status changed from ${prev} to ${status}` });
  if (status === 'Closed' || status === 'Verified') w.closedAt = nowTs();
  logActivity('wo', w.id, `WO ${w.id} → ${status}`, 'clipboard-list');
  emit('workOrderUpdated', w);
  return w;
}

export function addWorkOrderNote(id, note, user = 'Budi Santoso') {
  const w = WORK_ORDERS.find(x => x.id === id);
  if (!w) return null;
  w.updates.push({ ts: nowTs(), user, action: 'Field Note', note });
  logActivity('wo', w.id, `Note added to ${w.id}`, 'message-square');
  emit('workOrderUpdated', w);
  return w;
}

export function addEvidence(id, evidence) {
  const w = WORK_ORDERS.find(x => x.id === id);
  if (!w) return null;
  w.evidence.push({ ...evidence, ts: nowTs() });
  w.updates.push({ ts: nowTs(), user: 'Budi Santoso', action: 'Evidence Added', note: evidence.label });
  emit('workOrderUpdated', w);
  return w;
}

export function assignWorkOrder(id, assignee) {
  const w = WORK_ORDERS.find(x => x.id === id);
  if (!w) return null;
  w.assignee = assignee;
  if (w.status === 'Draft') w.status = 'Assigned';
  w.updates.push({ ts: nowTs(), user: 'Budi Santoso', action: 'Assigned', note: `Assigned to ${assignee}` });
  logActivity('wo', w.id, `WO ${w.id} assigned to ${assignee}`, 'user');
  emit('workOrderUpdated', w);
  return w;
}

export function acknowledgeAlarm(id, note = '') {
  const a = ALARMS.find(x => x.id === id);
  if (!a) return null;
  a.status = 'acknowledged';
  a.acknowledgedAt = nowTs();
  a.acknowledgedBy = 'Budi Santoso';
  a.acknowledgeNote = note;
  logActivity('alarm', a.id, `Alarm ${a.id} acknowledged`, 'check');
  emit('alarmUpdated', a);
  return a;
}

export function resolveAlarm(id, resolution = 'Manually resolved') {
  const a = ALARMS.find(x => x.id === id);
  if (!a) return null;
  a.status = 'resolved';
  a.resolvedAt = nowTs();
  a.resolution = resolution;
  logActivity('alarm', a.id, `Alarm ${a.id} resolved`, 'check');
  emit('alarmUpdated', a);
  return a;
}

export function markNotificationRead(id) {
  const n = NOTIFICATIONS.find(x => x.id === id);
  if (n) { n.read = true; emit('notificationsChanged'); }
}

export function markAllNotificationsRead() {
  NOTIFICATIONS.forEach(n => n.read = true);
  emit('notificationsChanged');
}

export function getUnreadCount() {
  return NOTIFICATIONS.filter(n => !n.read).length;
}

export function getTheme() { return persisted.theme || 'light'; }
export function setTheme(t) {
  persist({ theme: t });
  document.documentElement.dataset.theme = t;
  emit('themeChanged', t);
}

export function getFilter(key) { return (persisted.filters || {})[key]; }
export function setFilter(key, val) {
  const filters = { ...(persisted.filters || {}), [key]: val };
  persist({ filters });
}

export function getStarred() { return persisted.starred || []; }
export function toggleStar(id) {
  const starred = [...(persisted.starred || [])];
  const i = starred.indexOf(id);
  if (i >= 0) starred.splice(i, 1); else starred.push(id);
  persist({ starred });
  emit('starredChanged', starred);
  return starred.includes(id);
}
