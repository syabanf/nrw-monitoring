import {
  WORK_ORDERS, ALARMS, INTERVENTIONS, CUSTOMERS, NOTIFICATIONS, ACTIVITY_FEED,
  ZONES, SENSORS, DEVICES, TEAMS, CASES, CAMPAIGNS, TARIFFS, JAKARTA_CENTER,
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

// ============ CRUD: ZONES ============
function nextZoneId() {
  const max = ZONES.reduce((m, z) => Math.max(m, parseInt(z.id.slice(-3), 10) || 0), 0);
  return `DMA-${String(max + 1).padStart(3, '0')}`;
}

function buildPolygon(center, sizeKm = 1) {
  const dLng = (sizeKm / 111) * 0.6;
  const dLat = (sizeKm / 111) * 0.5;
  const [lng, lat] = center;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
  const [w, s, e, n] = bbox;
  const polygon = [[[w, s], [e, s], [e, n], [w, n], [w, s]]];
  return { bbox, polygon };
}

export function createZone(data) {
  const id = nextZoneId();
  const center = data.center || [JAKARTA_CENTER[0] + (Math.random() - 0.5) * 0.04, JAKARTA_CENTER[1] + (Math.random() - 0.5) * 0.04];
  const { bbox, polygon } = buildPolygon(center, 1.2);
  const input = Number(data.inputVolume) || 30000;
  const billed = Number(data.billedVolume) || Math.round(input * (1 - Number(data.nrwPercent || 25) / 100));
  const nrwPercent = +(((input - billed) / input) * 100).toFixed(1);
  const classification = nrwPercent > 35 ? 'Critical' : nrwPercent > 25 ? 'High' : nrwPercent > 20 ? 'Medium' : 'Low';
  const zone = {
    id, name: data.name, region: data.region || 'Jakarta Pusat', type: data.type || 'DMA',
    customers: Number(data.customers) || 0, sensors: 0,
    inputVolume: input, billedVolume: billed, nrwPercent,
    nrwTrend: 'stable', nrwChange: 0, suspicionScore: 30, classification,
    center, bbox, polygon,
    minNightFlow: +(input / 30 / 24 / 3.6 * 0.15).toFixed(2),
    baselineMNF: +(input / 30 / 24 / 3.6 * 0.12).toFixed(2),
    avgPressure: 2.8, pressureStability: 0.85,
    activeAlarms: 0, openWorkOrders: 0,
    lastIntervention: '2026-01-01', estRevenue: billed * 5000
  };
  ZONES.unshift(zone);
  emit('zoneCreated', zone);
  return zone;
}

export function updateZone(id, data) {
  const z = ZONES.find(x => x.id === id);
  if (!z) return null;
  Object.assign(z, data);
  if (data.inputVolume || data.billedVolume) {
    z.nrwPercent = +(((z.inputVolume - z.billedVolume) / z.inputVolume) * 100).toFixed(1);
    z.classification = z.nrwPercent > 35 ? 'Critical' : z.nrwPercent > 25 ? 'High' : z.nrwPercent > 20 ? 'Medium' : 'Low';
  }
  emit('zoneUpdated', z);
  return z;
}

export function deleteZone(id) {
  const i = ZONES.findIndex(x => x.id === id);
  if (i < 0) return false;
  ZONES.splice(i, 1);
  emit('zoneDeleted', id);
  return true;
}

// ============ CRUD: SENSORS ============
function nextSensorId() {
  const max = SENSORS.reduce((m, s) => Math.max(m, parseInt(s.id.slice(-4), 10) || 0), 0);
  return `SNR-${String(max + 1).padStart(4, '0')}`;
}

export function createSensor(data) {
  const zone = ZONES.find(z => z.id === data.zoneId);
  if (!zone) return null;
  const id = nextSensorId();
  const type = data.type || 'flow';
  const sensor = {
    id, type, zoneId: zone.id, zoneName: zone.name,
    location: data.location || 'Custom point',
    coordinates: [zone.center[0] + (Math.random() - 0.5) * 0.01, zone.center[1] + (Math.random() - 0.5) * 0.008],
    status: data.status || 'online',
    battery: Number(data.battery) || 95,
    signalStrength: Number(data.signalStrength) || 90,
    lastReading: type === 'flow' ? 10 : type === 'pressure' ? 2.5 : 40,
    unit: type === 'flow' ? 'L/s' : type === 'pressure' ? 'bar' : 'dB',
    lastReadingTime: '2026-06-02T08:45:00',
    installedAt: data.installedAt || '2026-06-02'
  };
  SENSORS.unshift(sensor);
  zone.sensors = (zone.sensors || 0) + 1;
  const device = DEVICES.find(d => d.zoneId === zone.id);
  if (device) device.sensorIds.push(id);
  emit('sensorCreated', sensor);
  return sensor;
}

export function updateSensor(id, data) {
  const s = SENSORS.find(x => x.id === id);
  if (!s) return null;
  Object.assign(s, data);
  if (data.zoneId && data.zoneId !== s.zoneId) {
    const newZone = ZONES.find(z => z.id === data.zoneId);
    if (newZone) { s.zoneName = newZone.name; }
  }
  emit('sensorUpdated', s);
  return s;
}

export function deleteSensor(id) {
  const i = SENSORS.findIndex(x => x.id === id);
  if (i < 0) return false;
  const s = SENSORS[i];
  SENSORS.splice(i, 1);
  const zone = ZONES.find(z => z.id === s.zoneId);
  if (zone) zone.sensors = Math.max(0, (zone.sensors || 1) - 1);
  DEVICES.forEach(d => { d.sensorIds = d.sensorIds.filter(x => x !== id); });
  emit('sensorDeleted', id);
  return true;
}

// ============ CRUD: DEVICES ============
function nextDeviceId() {
  const max = DEVICES.reduce((m, d) => Math.max(m, parseInt(d.id.slice(-3), 10) || 0), 0);
  return `DEV-${String(max + 1).padStart(3, '0')}`;
}

const DEVICE_MODELS_MAP = {
  outdoor_4g: { label: 'Outdoor RIO · 4G LTE · Solar', power: 'Solar 10WP + Battery 4.2V 18Ah', connectivity: '4G LTE', ip: 'IP66' },
  outdoor_grid: { label: 'Outdoor RIO · 4G LTE · Grid', power: '220VAC mains', connectivity: '4G LTE', ip: 'IP66' },
  indoor_wifi: { label: 'Indoor RIO · WiFi · Modbus', power: '12VDC', connectivity: '2.4 GHz WiFi', ip: 'IP60' },
  indoor_eth: { label: 'Indoor RIO · Ethernet · Modbus', power: '12VDC', connectivity: 'Ethernet RJ45', ip: 'IP60' }
};

export function createDevice(data) {
  const zone = ZONES.find(z => z.id === data.zoneId);
  if (!zone) return null;
  const id = nextDeviceId();
  const modelKey = data.modelKey || 'outdoor_4g';
  const model = DEVICE_MODELS_MAP[modelKey];
  const isOutdoor = modelKey.startsWith('outdoor');
  const device = {
    id, name: data.name || `${zone.id} RIO`,
    modelKey, model: model.label,
    powerSource: model.power, connectivity: model.connectivity, ipRating: model.ip,
    location: data.location || `${zone.name} · ${isOutdoor ? 'DMA Boundary' : 'Pump Room'}`,
    zoneId: zone.id,
    coordinates: [zone.center[0], zone.center[1]],
    ipAddress: data.ipAddress || `10.42.${zone.id.slice(-1)}.${100 + DEVICES.length}`,
    macAddress: data.macAddress || `8C:1F:64:${Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')}`,
    firmware: data.firmware || 'v2.5.0',
    latestFirmware: 'v2.5.0',
    updateAvailable: false, otaStatus: 'idle',
    installedAt: data.installedAt || '2026-06-02',
    lastHeartbeat: '2026-06-02T09:30:00',
    uptimeDays: 0, status: data.status || 'online',
    signal: 95, battery: isOutdoor ? 100 : null,
    msgsPerHour: 240, errorRate: 0.01, latencyMs: 120,
    sensorIds: [], operatingTempC: 28
  };
  DEVICES.unshift(device);
  emit('deviceCreated', device);
  return device;
}

export function updateDevice(id, data) {
  const d = DEVICES.find(x => x.id === id);
  if (!d) return null;
  if (data.modelKey && data.modelKey !== d.modelKey) {
    const m = DEVICE_MODELS_MAP[data.modelKey];
    if (m) { d.modelKey = data.modelKey; d.model = m.label; d.powerSource = m.power; d.connectivity = m.connectivity; d.ipRating = m.ip; }
  }
  ['name', 'location', 'firmware', 'ipAddress', 'macAddress', 'status'].forEach(k => { if (data[k] !== undefined) d[k] = data[k]; });
  emit('deviceUpdated', d);
  return d;
}

export function deleteDevice(id) {
  const i = DEVICES.findIndex(x => x.id === id);
  if (i < 0) return false;
  DEVICES.splice(i, 1);
  emit('deviceDeleted', id);
  return true;
}

// ============ CRUD: CUSTOMERS ============
function nextCustomerId() {
  const max = CUSTOMERS.reduce((m, c) => Math.max(m, parseInt(c.id.slice(-5), 10) || 0), 0);
  return `CST-${String(max + 1).padStart(5, '0')}`;
}

export function createCustomer(data) {
  const zone = ZONES.find(z => z.id === data.zoneId);
  if (!zone) return null;
  const id = nextCustomerId();
  const type = data.type || 'Residential';
  const baseUsage = type === 'Business' ? 150 : 20;
  const history = Array.from({ length: 12 }, () => +(baseUsage * (0.85 + Math.random() * 0.3)).toFixed(1));
  const meterAge = Number(data.meterAge) || 1;
  const customer = {
    id, name: data.name, zoneId: zone.id, zoneName: zone.name,
    type, meterId: data.meterId || `MTR-${String(CUSTOMERS.length * 7).padStart(6, '0')}`,
    meterAge, installedAt: `${2026 - meterAge}-05-15`,
    history, avgMonthly: +(history.reduce((s, v) => s + v, 0) / history.length).toFixed(1),
    lastReading: history[history.length - 1], lastReadingDate: '2026-05-31',
    anomalies: [], riskScore: meterAge > 10 ? 10 : 0
  };
  CUSTOMERS.unshift(customer);
  emit('customerCreated', customer);
  return customer;
}

export function updateCustomer(id, data) {
  const c = CUSTOMERS.find(x => x.id === id);
  if (!c) return null;
  Object.assign(c, data);
  if (data.zoneId) {
    const z = ZONES.find(z => z.id === data.zoneId);
    if (z) c.zoneName = z.name;
  }
  emit('customerUpdated', c);
  return c;
}

export function deleteCustomer(id) {
  const i = CUSTOMERS.findIndex(x => x.id === id);
  if (i < 0) return false;
  CUSTOMERS.splice(i, 1);
  emit('customerDeleted', id);
  return true;
}

// ============ CRUD: TEAMS ============
function nextTeamId() {
  const max = TEAMS.reduce((m, t) => Math.max(m, t.id.charCodeAt(t.id.length - 1) - 64), 0);
  return `TEAM-${String.fromCharCode(65 + max)}`;
}

export function createTeam(data) {
  const id = nextTeamId();
  const team = {
    id,
    name: data.name || `Field Team ${id.slice(-1)}`,
    lead: data.lead, members: Number(data.members) || 3,
    region: data.region || 'Jakarta Pusat',
    specialties: data.specialties ? (Array.isArray(data.specialties) ? data.specialties : data.specialties.split(',').map(s => s.trim()).filter(Boolean)) : [],
    status: data.status || 'active', activeWO: 0
  };
  TEAMS.unshift(team);
  emit('teamCreated', team);
  return team;
}

export function updateTeam(id, data) {
  const t = TEAMS.find(x => x.id === id);
  if (!t) return null;
  Object.assign(t, data);
  if (data.specialties && !Array.isArray(data.specialties)) {
    t.specialties = data.specialties.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (data.members) t.members = Number(data.members);
  emit('teamUpdated', t);
  return t;
}

export function deleteTeam(id) {
  const i = TEAMS.findIndex(x => x.id === id);
  if (i < 0) return false;
  TEAMS.splice(i, 1);
  emit('teamDeleted', id);
  return true;
}

// ============ CRUD: WORK ORDERS (extends existing create) ============
export function updateWorkOrder(id, data) {
  const w = WORK_ORDERS.find(x => x.id === id);
  if (!w) return null;
  const changes = [];
  ['title', 'description', 'priority', 'type', 'dueDate', 'assignee', 'estRecoveryM3', 'zoneId'].forEach(k => {
    if (data[k] !== undefined && data[k] !== w[k]) { changes.push(`${k}: ${w[k]} → ${data[k]}`); w[k] = data[k]; }
  });
  if (data.estRecoveryM3) w.estRecoveryIDR = Number(data.estRecoveryM3) * 5000;
  if (changes.length) {
    w.updates.push({ ts: nowTs(), user: 'Budi Santoso', action: 'Edited', note: changes.join('; ') });
    logActivity('wo', w.id, `WO ${w.id} edited`, 'clipboard-list');
    emit('workOrderUpdated', w);
  }
  return w;
}

export function deleteWorkOrder(id) {
  const i = WORK_ORDERS.findIndex(x => x.id === id);
  if (i < 0) return false;
  WORK_ORDERS.splice(i, 1);
  logActivity('wo', id, `Work order ${id} cancelled`, 'x');
  emit('workOrderDeleted', id);
  return true;
}

// ============ CRUD: COMMERCIAL CASES ============
function nextCaseId() {
  const max = CASES.reduce((m, c) => Math.max(m, parseInt(c.id.slice(-4), 10) || 0), 0);
  return `CASE-${String(max + 1).padStart(4, '0')}`;
}

export function createCase(data) {
  const id = nextCaseId();
  const c = {
    id,
    type: data.type || 'zero_consumption',
    status: data.status || 'Open',
    customerId: data.customerId || null,
    customerName: data.customerName || 'Customer',
    customerType: data.customerType || 'Residential',
    zoneId: data.zoneId,
    zoneName: data.zoneName || (ZONES.find(z => z.id === data.zoneId)?.name || data.zoneId),
    estRevenueLossIDR: Number(data.estRevenueLossIDR) || 0,
    estRecoveryIDR: Number(data.estRecoveryIDR) || Math.round((Number(data.estRevenueLossIDR) || 0) * 0.7),
    monthsAffected: Number(data.monthsAffected) || 1,
    detectedAt: data.detectedAt || nowTs().slice(0, 10),
    dueDate: data.dueDate,
    closedAt: null,
    assignee: data.assignee || null,
    priority: data.priority || 'Medium',
    description: data.description || '',
    updates: [{ ts: nowTs(), user: 'Budi Santoso', action: 'Created', note: data.description || 'Manual case creation' }]
  };
  CASES.unshift(c);
  logActivity('case', c.id, `Case ${c.id} opened: ${c.customerName}`, 'banknote');
  pushNotification({ type: 'commercial', title: 'New commercial case', message: `${c.id} · ${c.customerName}`, target: c.id });
  emit('caseCreated', c);
  return c;
}

export function updateCase(id, data) {
  const c = CASES.find(x => x.id === id);
  if (!c) return null;
  const changes = [];
  ['type', 'status', 'priority', 'assignee', 'dueDate', 'description', 'estRevenueLossIDR', 'estRecoveryIDR', 'monthsAffected'].forEach(k => {
    if (data[k] !== undefined && data[k] !== c[k]) { changes.push(`${k}: ${c[k]} → ${data[k]}`); c[k] = data[k]; }
  });
  if (data.estRevenueLossIDR !== undefined) c.estRevenueLossIDR = Number(data.estRevenueLossIDR);
  if (data.estRecoveryIDR !== undefined) c.estRecoveryIDR = Number(data.estRecoveryIDR);
  if (data.monthsAffected !== undefined) c.monthsAffected = Number(data.monthsAffected);
  if (data.status && ['Resolved', 'WrittenOff'].includes(data.status)) c.closedAt = nowTs();
  if (changes.length) {
    c.updates.push({ ts: nowTs(), user: 'Budi Santoso', action: 'Updated', note: changes.join('; ') });
    emit('caseUpdated', c);
  }
  return c;
}

export function deleteCase(id) {
  const i = CASES.findIndex(x => x.id === id);
  if (i < 0) return false;
  CASES.splice(i, 1);
  emit('caseDeleted', id);
  return true;
}

export function updateCaseStatus(id, status, note = '') {
  const c = CASES.find(x => x.id === id);
  if (!c) return null;
  const prev = c.status;
  c.status = status;
  c.updates.push({ ts: nowTs(), user: 'Budi Santoso', action: status.replace(/([A-Z])/g, ' $1').trim(), note: note || `Status changed from ${prev} to ${status}` });
  if (['Resolved', 'WrittenOff'].includes(status)) c.closedAt = nowTs();
  emit('caseUpdated', c);
  return c;
}

// ============ CRUD: CAMPAIGNS ============
function nextCampaignId() {
  const nums = CAMPAIGNS.map(c => parseInt(c.id.slice(-3), 10) || 0);
  return `CMP-2026-${String(Math.max(...nums, 0) + 1).padStart(3, '0')}`;
}

export function createCampaign(data) {
  const c = {
    id: nextCampaignId(),
    name: data.name,
    status: data.status || 'planning',
    startedAt: data.startedAt || nowTs().slice(0, 10),
    plannedEnd: data.plannedEnd,
    targetCount: Number(data.targetCount) || 0,
    completedCount: 0, scheduledCount: 0,
    zoneIds: Array.isArray(data.zoneIds) ? data.zoneIds : (data.zoneIds ? data.zoneIds.split(',').map(s => s.trim()) : []),
    expectedRecoveryIDR: Number(data.expectedRecoveryIDR) || 0,
    type: data.type || 'audit',
    description: data.description || ''
  };
  CAMPAIGNS.unshift(c);
  logActivity('campaign', c.id, `Campaign ${c.id} created: ${c.name}`, 'briefcase');
  emit('campaignCreated', c);
  return c;
}

export function updateCampaign(id, data) {
  const c = CAMPAIGNS.find(x => x.id === id);
  if (!c) return null;
  Object.assign(c, data);
  if (data.targetCount !== undefined) c.targetCount = Number(data.targetCount);
  if (data.expectedRecoveryIDR !== undefined) c.expectedRecoveryIDR = Number(data.expectedRecoveryIDR);
  emit('campaignUpdated', c);
  return c;
}

export function deleteCampaign(id) {
  const i = CAMPAIGNS.findIndex(x => x.id === id);
  if (i < 0) return false;
  CAMPAIGNS.splice(i, 1);
  emit('campaignDeleted', id);
  return true;
}

// ============ CRUD: TARIFFS (PRICING MASTER DATA) ============
function nextTariffId(type) {
  const prefix = type === 'Residential' ? 'R' : type === 'Business' ? 'B' : 'S';
  const existing = TARIFFS.filter(t => t.code.startsWith(prefix)).map(t => parseInt(t.code.slice(1), 10) || 0);
  const next = Math.max(0, ...existing) + 1;
  return { id: `TAR-${prefix}${next}`, code: `${prefix}${next}` };
}

export function createTariff(data) {
  const { id, code } = nextTariffId(data.type || 'Residential');
  const tariff = {
    id, code,
    tier: data.tier || `${data.type} · ${code}`,
    rate: Number(data.rate) || 0,
    type: data.type || 'Residential',
    minUsage: Number(data.minUsage) || 0,
    maxUsage: data.maxUsage === '' || data.maxUsage === null ? null : Number(data.maxUsage),
    effectiveDate: data.effectiveDate || '2026-06-02',
    status: data.status || 'active',
    description: data.description || ''
  };
  TARIFFS.push(tariff);
  emit('tariffCreated', tariff);
  return tariff;
}

export function updateTariff(id, data) {
  const t = TARIFFS.find(x => x.id === id);
  if (!t) return null;
  ['tier', 'rate', 'type', 'minUsage', 'maxUsage', 'effectiveDate', 'status', 'description'].forEach(k => {
    if (data[k] !== undefined) {
      if (['rate', 'minUsage'].includes(k)) t[k] = Number(data[k]);
      else if (k === 'maxUsage') t[k] = data[k] === '' || data[k] === null ? null : Number(data[k]);
      else t[k] = data[k];
    }
  });
  emit('tariffUpdated', t);
  return t;
}

export function deleteTariff(id) {
  const i = TARIFFS.findIndex(x => x.id === id);
  if (i < 0) return false;
  TARIFFS.splice(i, 1);
  emit('tariffDeleted', id);
  return true;
}
