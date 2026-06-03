import * as NRW from './data.js';
import * as Charts from './charts.js';
import * as State from './state.js';
import { initMap, setLayerVisibility, focusZone, resetView, setOnDrill, destroyMap, initCommercialMap, setCommercialOnDrill, destroyCommercialMap, focusCommercialZone } from './map.js';
import { renderIcons, icon } from './icons.js';
import { toast } from './toast.js';
import { openModal, closeModal, confirm } from './modal.js';
import { startRealtime, subscribeRealtime, getStream, getStats, getTickRate } from './realtime.js';
import { getCurrentUser, isLoggedIn, logout } from './auth.js';
import { renderLogin } from './login.js';

const VIEWS = ['dashboard', 'savings', 'map', 'reports', 'workorders', 'zones', 'sensors', 'alarms', 'customers', 'commercial', 'analytics', 'schedule', 'teams', 'hardware', 'pricing', 'commercialmap'];
let currentView = 'dashboard';
let currentReportTab = 'nrw';
let lastDrawer = null;

const state = {
  wo: { status: State.getFilter('wo.status') || 'all', priority: State.getFilter('wo.priority') || 'all', zone: State.getFilter('wo.zone') || 'all' },
  cust: { zone: 'all', anomaly: 'all' },
  cases: { status: 'all', type: 'all', zone: 'all' },
  analytics: { selectedZones: ['DMA-001', 'DMA-003', 'DMA-007', 'DMA-010'] }
};

export function initApp() {
  if (!isLoggedIn()) {
    renderLogin(() => { location.hash = '#/dashboard'; bootApp(); });
    return;
  }
  bootApp();
}

function bootApp() {
  renderShell();
  window.removeEventListener('hashchange', handleRoute);
  window.addEventListener('hashchange', handleRoute);
  document.addEventListener('keydown', globalKeyHandler);
  State.subscribe(handleStateChange);
  startRealtime();
  subscribeRealtime(handleTick);
  handleRoute();
}

function handleLogout() {
  logout();
  toast('Sampai jumpa lagi', 'info', { duration: 1500 });
  renderLogin(() => { location.hash = '#/dashboard'; bootApp(); });
}

function handleTick(event) {
  updateLiveIndicator();
  updateLivePatches(event);
}

function updateLiveIndicator() {
  const el = document.getElementById('live-indicator');
  if (!el) return;
  const stats = getStats();
  const cls = stats.onlineDev / stats.totalDev > 0.9 ? '' : stats.onlineDev / stats.totalDev > 0.7 ? 'warn' : 'bad';
  el.className = `live-pill ${cls}`;
  el.innerHTML = `<span class="live-dot ${cls}"></span>Live · ${stats.msgsPerMin}/min · ${stats.avgLatency}ms`;
}

function updateLivePatches(event) {
  event.updates.forEach(s => {
    document.querySelectorAll(`[data-live-sensor="${s.id}"]`).forEach(el => {
      const prev = el.textContent;
      const next = `${s.lastReading} ${s.unit}`;
      if (prev !== next) {
        el.textContent = next;
        el.classList.remove('tick-flash');
        void el.offsetWidth;
        el.classList.add('tick-flash');
      }
    });
    document.querySelectorAll(`[data-live-battery="${s.id}"]`).forEach(el => { el.textContent = `${s.battery}%`; });
    document.querySelectorAll(`[data-live-signal="${s.id}"]`).forEach(el => { el.textContent = `${s.signalStrength}%`; });
  });
  document.querySelectorAll('[data-live-device-latency]').forEach(el => {
    const d = NRW.getDevice(el.dataset.liveDeviceLatency);
    if (d) el.textContent = `${d.latencyMs}ms`;
  });
  const stream = document.getElementById('stream-console');
  if (stream && event.messages.length) {
    event.messages.slice(-5).reverse().forEach(m => {
      const row = document.createElement('div');
      row.className = `stream-row ${m.level === 'warn' ? 'warn' : m.level === 'error' ? 'error' : ''}`;
      const ts = new Date(m.ts).toTimeString().slice(0, 8);
      row.innerHTML = `<span class="stream-ts">${ts}</span><span class="stream-tag">[${m.deviceId || m.sensorId}]</span><span>${m.text}</span>`;
      stream.insertBefore(row, stream.firstChild);
    });
    while (stream.children.length > 80) stream.removeChild(stream.lastChild);
  }
  const tickCounter = document.getElementById('hw-tick-counter');
  if (tickCounter) {
    const s = getStats();
    tickCounter.innerHTML = `<strong>${s.msgsPerMin}</strong>/min · avg latency <strong>${s.avgLatency}ms</strong>`;
  }
}

function globalKeyHandler(e) {
  if (e.key === 'Escape') { closeDrawer(); closeNotifPanel(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openCommandPalette(); }
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { e.preventDefault(); document.getElementById('global-search')?.focus(); }
  if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { e.preventDefault(); openHelpModal(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
}

function toggleSidebar() {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  shell.classList.toggle('sb-collapsed');
  const collapsed = shell.classList.contains('sb-collapsed');
  State.setFilter('sb.collapsed', collapsed);
}

function openHelpModal() {
  openModal({
    title: 'Help & keyboard shortcuts',
    subtitle: 'Cara cepat menggunakan NRW Recovery System',
    size: 'md',
    body: `
      <div class="space-y-5">
        <div>
          <h4 class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Navigation</h4>
          <div class="shortcut-row"><span>Open command palette (search anything)</span><span class="flex gap-1"><span class="shortcut-key">⌘</span><span class="shortcut-key">K</span></span></div>
          <div class="shortcut-row"><span>Focus search bar</span><span class="shortcut-key">/</span></div>
          <div class="shortcut-row"><span>Toggle sidebar</span><span class="flex gap-1"><span class="shortcut-key">⌘</span><span class="shortcut-key">B</span></span></div>
          <div class="shortcut-row"><span>Show this help</span><span class="shortcut-key">?</span></div>
          <div class="shortcut-row"><span>Close drawer / modal</span><span class="shortcut-key">Esc</span></div>
        </div>
        <div>
          <h4 class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Quick tour · 7 langkah</h4>
          <ol class="space-y-1.5 text-sm text-slate-700 pl-4 list-decimal">
            <li><strong>Dashboard</strong> — ringkasan KPI & alarms hari ini</li>
            <li><strong>Network Map</strong> — visual semua zona, sensor, pipa, alarm</li>
            <li><strong>Savings · Wilayah</strong> — snapshot penghematan air per region</li>
            <li><strong>Hardware Live</strong> — telemetri device real-time + OTA</li>
            <li><strong>Work Orders</strong> — antrian inspeksi & intervensi lapangan</li>
            <li><strong>Commercial</strong> — kasus loss komersial + recovery campaigns</li>
            <li><strong>Reports</strong> — drill-down analisis & export PDF/Excel</li>
          </ol>
        </div>
        <div>
          <h4 class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Glossary</h4>
          <div class="grid grid-cols-2 gap-2 text-[12px]">
            <div class="bg-slate-50 rounded p-2"><strong>NRW</strong> · Non-Revenue Water (air yang hilang/tak terbayar)</div>
            <div class="bg-slate-50 rounded p-2"><strong>MNF</strong> · Minimum Night Flow (indikator kebocoran)</div>
            <div class="bg-slate-50 rounded p-2"><strong>DMA</strong> · District Metered Area (zona terukur)</div>
            <div class="bg-slate-50 rounded p-2"><strong>PRV</strong> · Pressure Reducing Valve</div>
            <div class="bg-slate-50 rounded p-2"><strong>RIO</strong> · Remote IO (gateway telemetri)</div>
            <div class="bg-slate-50 rounded p-2"><strong>OTA</strong> · Over-The-Air firmware update</div>
          </div>
        </div>
      </div>
    `,
    footer: `<button class="btn-primary" data-modal-close>Got it</button>`
  });
}

function handleStateChange(event, data) {
  updateBadges();
  if (event === 'workOrderCreated' || event === 'workOrderUpdated') {
    if (currentView === 'workorders' || currentView === 'dashboard') rerender();
    if (lastDrawer?.kind === 'wo' && lastDrawer.id === data?.id) openWorkOrderDrawer(data.id);
  }
  if (event === 'alarmUpdated') {
    if (currentView === 'alarms' || currentView === 'dashboard') rerender();
  }
  if (event === 'notificationsChanged' || event === 'notification') {
    updateBadges();
  }
}

function rerender() { handleRoute(); }

function updateBadges() {
  const unread = State.getUnreadCount();
  const badge = document.getElementById('notif-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread ? '' : 'none'; }
  const woBadge = document.querySelector('[data-view="workorders"] .nav-badge');
  if (woBadge) woBadge.textContent = NRW.WORK_ORDERS.filter(w => !['Closed', 'Verified'].includes(w.status)).length;
  const alarmBadge = document.querySelector('[data-view="alarms"] .nav-badge');
  if (alarmBadge) alarmBadge.textContent = NRW.ALARMS.filter(a => a.status === 'active').length;
}

// ============ SHELL ============
function renderShell() {
  document.getElementById('app').innerHTML = `
    <div class="app-shell grid grid-cols-[240px_1fr] h-screen ${State.getFilter('sb.collapsed') ? 'sb-collapsed' : ''}">
      <aside class="bg-sidebar text-slate-300 flex flex-col overflow-y-auto border-r border-slate-950">
        <div class="brand-area px-4 py-4 flex items-center gap-3 border-b border-slate-950">
          <div class="w-9 h-9 bg-gradient-to-br from-sky-500 to-sky-700 rounded-lg grid place-items-center text-white font-bold text-[12px] tracking-wide shrink-0">NRW</div>
          <div class="brand-text flex-1 min-w-0">
            <div class="text-slate-100 font-semibold text-[13px]">Recovery System</div>
            <div class="text-slate-500 text-[11px] mt-0.5">Cirebon × Indramayu · Pilot</div>
          </div>
        </div>
        <nav class="p-2 flex-1">
          <div class="nav-section"><div class="nav-section-label text-[10px] uppercase tracking-widest text-slate-500 px-2.5 pt-3.5 pb-1.5">Monitoring</div></div>
          <a class="nav-item" data-view="dashboard" href="#/dashboard">${icon('layout-dashboard', 'nav-icon')}<span class="nav-label">Dashboard</span></a>
          <a class="nav-item" data-view="map" href="#/map">${icon('map', 'nav-icon')}<span class="nav-label">Network Map</span></a>
          <a class="nav-item" data-view="hardware" href="#/hardware">${icon('cpu', 'nav-icon')}<span class="nav-label">Hardware Live</span><span class="nav-badge nav-badge-warn" id="hw-nav-badge">${NRW.DEVICES.filter(d => d.updateAvailable).length}</span></a>
          <a class="nav-item" data-view="alarms" href="#/alarms">${icon('triangle-alert', 'nav-icon')}<span class="nav-label">Alarms</span><span class="nav-badge nav-badge-danger">${NRW.KPI.activeAlarms}</span></a>

          <div class="nav-section"><div class="nav-section-label text-[10px] uppercase tracking-widest text-slate-500 px-2.5 pt-3.5 pb-1.5">Field Operations</div></div>
          <a class="nav-item" data-view="workorders" href="#/workorders">${icon('clipboard-list', 'nav-icon')}<span class="nav-label">Work Orders</span><span class="nav-badge nav-badge-warn">${NRW.KPI.openWorkOrders}</span></a>
          <a class="nav-item" data-view="schedule" href="#/schedule">${icon('calendar-days', 'nav-icon')}<span class="nav-label">Schedule</span></a>
          <a class="nav-item" data-view="teams" href="#/teams">${icon('users', 'nav-icon')}<span class="nav-label">Field Teams</span></a>
          <a class="nav-item" data-view="sensors" href="#/sensors">${icon('radio-tower', 'nav-icon')}<span class="nav-label">Sensors</span></a>

          <div class="nav-section"><div class="nav-section-label text-[10px] uppercase tracking-widest text-slate-500 px-2.5 pt-3.5 pb-1.5">Analytics</div></div>
          <a class="nav-item" data-view="zones" href="#/zones">${icon('hexagon', 'nav-icon')}<span class="nav-label">Zones / DMA</span><span class="nav-badge">${NRW.KPI.totalZones}</span></a>
          <a class="nav-item" data-view="savings" href="#/savings">${icon('trending-up', 'nav-icon')}<span class="nav-label">Savings · Wilayah</span></a>
          <a class="nav-item" data-view="analytics" href="#/analytics">${icon('activity', 'nav-icon')}<span class="nav-label">MNF Analytics</span></a>
          <a class="nav-item" data-view="reports" href="#/reports">${icon('bar-chart-3', 'nav-icon')}<span class="nav-label">Reports</span></a>

          <div class="nav-section"><div class="nav-section-label text-[10px] uppercase tracking-widest text-slate-500 px-2.5 pt-3.5 pb-1.5">Commercial</div></div>
          <a class="nav-item" data-view="customers" href="#/customers">${icon('building-2', 'nav-icon')}<span class="nav-label">Customers</span></a>
          <a class="nav-item" data-view="commercial" href="#/commercial">${icon('banknote', 'nav-icon')}<span class="nav-label">Cases</span><span class="nav-badge nav-badge-warn">${NRW.CASES.filter(c => !['Resolved', 'WrittenOff'].includes(c.status)).length}</span></a>
          <a class="nav-item" data-view="commercialmap" href="#/commercialmap">${icon('map-pin', 'nav-icon')}<span class="nav-label">Commercial Map</span></a>
          <a class="nav-item" data-view="pricing" href="#/pricing">${icon('banknote', 'nav-icon')}<span class="nav-label">Pricing · Master Data</span></a>
        </nav>
        <div class="p-3 border-t border-slate-950">
          ${(() => {
            const u = getCurrentUser() || { name: 'Guest', role: 'Demo', initials: 'GU', avatar: 'from-slate-500 to-slate-700' };
            return `
              <div class="user-chip flex items-center gap-2.5 p-2 rounded-md">
                <div class="w-8 h-8 bg-gradient-to-br ${u.avatar} rounded-full grid place-items-center text-white font-semibold text-[11px] shrink-0">${u.initials}</div>
                <div class="user-text flex-1 min-w-0">
                  <div class="text-slate-100 font-medium text-xs truncate">${u.name}</div>
                  <div class="text-slate-500 text-[11px] truncate">${u.role}</div>
                </div>
                <button class="user-text text-slate-400 hover:text-slate-100 p-1.5 rounded hover:bg-white/5 transition-colors" id="logout-btn" title="Sign out">${icon('log-out', 'w-4 h-4')}</button>
              </div>
            `;
          })()}
        </div>
      </aside>

      <main class="flex flex-col overflow-hidden bg-slate-100">
        <header class="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 justify-between shrink-0">
          <div class="flex items-center gap-3.5">
            <button class="icon-btn" id="sb-toggle" title="Toggle sidebar">${icon('panel-left', 'w-4 h-4')}</button>
            <button class="icon-btn" id="refresh-btn" title="Refresh data">${icon('refresh-cw', 'w-4 h-4')}</button>
            <div id="view-title" class="text-[15px] font-semibold">Dashboard</div>
            <div id="view-sub" class="text-slate-400 text-xs hidden md:block"></div>
          </div>
          <div class="flex items-center gap-3">
            <a href="#/hardware" class="live-pill" id="live-indicator" title="Live telemetry — click for hardware view"><span class="live-dot"></span>Live</a>
            <button class="icon-btn" id="cmdk-btn" title="Command palette (⌘K)">${icon('search', 'w-4 h-4')}</button>
            <div class="relative">
              <input type="text" placeholder="Search... (press /)" id="global-search" class="w-72 pl-3 pr-9 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 focus:outline-none focus:border-sky-500 focus:bg-white" />
              <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">${icon('search', 'w-3.5 h-3.5')}</span>
              <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl max-h-80 overflow-y-auto hidden z-50" id="search-results"></div>
            </div>
            <button class="icon-btn" id="notif-btn" title="Notifications">
              ${icon('bell', 'w-4 h-4')}
              <span class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center" id="notif-badge">${State.getUnreadCount()}</span>
            </button>
            <button class="icon-btn" id="print-btn" title="Print">${icon('printer', 'w-4 h-4')}</button>
            <div class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600 text-xs font-medium">${NRW.formatDate('2026-06-02')}</div>
          </div>
        </header>
        <div id="view-root" class="flex-1 overflow-y-auto p-5 flex flex-col gap-4"></div>
      </main>
    </div>

    <div id="notif-panel" class="notif-panel"></div>
    <div id="drawer-backdrop" class="drawer-backdrop"></div>
    <aside id="drawer" class="drawer"></aside>
    <button class="fab-help" id="fab-help" title="Help & keyboard shortcuts (press ?)">${icon('info', 'w-5 h-5')}</button>
  `;

  document.getElementById('refresh-btn').addEventListener('click', () => { rerender(); toast('Data di-refresh', 'success', { duration: 1500 }); });
  document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);
  document.getElementById('notif-btn').addEventListener('click', e => { e.stopPropagation(); toggleNotifPanel(); });
  document.getElementById('cmdk-btn').addEventListener('click', openCommandPalette);
  document.getElementById('print-btn').addEventListener('click', () => window.print());
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('sb-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('fab-help')?.addEventListener('click', openHelpModal);
  bindSearch();
  renderIcons();
  updateBadges();
}

function bindSearch() {
  const input = document.getElementById('global-search');
  const results = document.getElementById('search-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.add('hidden'); return; }
    const hits = [];
    NRW.ZONES.filter(z => z.id.toLowerCase().includes(q) || z.name.toLowerCase().includes(q))
      .slice(0, 4).forEach(z => hits.push({ kind: 'zone', id: z.id, label: z.name, sub: `${z.id} · ${z.region}` }));
    NRW.WORK_ORDERS.filter(w => w.id.toLowerCase().includes(q) || w.title.toLowerCase().includes(q))
      .slice(0, 4).forEach(w => hits.push({ kind: 'wo', id: w.id, label: w.title, sub: `${w.id} · ${w.status}` }));
    NRW.SENSORS.filter(s => s.id.toLowerCase().includes(q))
      .slice(0, 3).forEach(s => hits.push({ kind: 'sensor', id: s.id, label: s.id, sub: `${s.type} · ${s.zoneName}` }));
    NRW.CUSTOMERS.filter(c => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 3).forEach(c => hits.push({ kind: 'customer', id: c.id, label: c.name, sub: `${c.id} · ${c.zoneName}` }));
    NRW.DEVICES.filter(d => d.id.toLowerCase().includes(q) || d.location.toLowerCase().includes(q))
      .slice(0, 3).forEach(d => hits.push({ kind: 'device', id: d.id, label: d.id, sub: `${d.location} · ${d.firmware}` }));
    NRW.CASES.filter(c => c.id.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q))
      .slice(0, 3).forEach(c => hits.push({ kind: 'case', id: c.id, label: `${c.id} · ${c.customerName}`, sub: `${NRW.caseTypeLabel(c.type)} · ${c.status}` }));
    if (!hits.length) {
      results.innerHTML = `<div class="p-3.5 text-center text-slate-400">No results for "${q}"</div>`;
    } else {
      results.innerHTML = hits.map(h =>
        `<div class="search-hit p-2.5 cursor-pointer border-b border-slate-200 hover:bg-slate-50" data-kind="${h.kind}" data-id="${h.id}">
          <div class="font-medium text-[13px]">${h.label}</div>
          <div class="text-slate-400 text-[11px] mt-0.5">${h.sub}</div>
        </div>`
      ).join('');
      results.querySelectorAll('.search-hit').forEach(el => {
        el.addEventListener('click', () => {
          input.value = ''; results.classList.add('hidden');
          openByKind(el.dataset.kind, el.dataset.id);
        });
      });
    }
    results.classList.remove('hidden');
  });
  document.addEventListener('click', e => { if (!e.target.closest('#global-search') && !e.target.closest('#search-results')) results.classList.add('hidden'); });
}

function openByKind(kind, id) {
  if (kind === 'zone') openZoneDrawer(id);
  else if (kind === 'wo') openWorkOrderDrawer(id);
  else if (kind === 'sensor') openSensorDrawer(id);
  else if (kind === 'customer') openCustomerDrawer(id);
  else if (kind === 'intervention') openInterventionDrawer(id);
  else if (kind === 'alarm') openAlarmDrawer(id);
  else if (kind === 'team') openTeamDrawer(id);
  else if (kind === 'device') openDeviceDrawer(id);
  else if (kind === 'case') openCaseDrawer(id);
}

function handleRoute() {
  const hash = location.hash.replace('#/', '') || 'dashboard';
  const view = VIEWS.includes(hash) ? hash : 'dashboard';
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  Charts.destroyAllCharts();
  if (view !== 'map') destroyMap();
  if (view !== 'commercialmap') destroyCommercialMap();
  const titles = {
    dashboard: ['Dashboard', 'Bagaimana kondisi pilot hari ini'],
    map: ['Network Map', 'Peta zona, pipa, sensor, work order, dan alarm dalam satu tampilan'],
    reports: ['Reports & Analytics', 'Analisis mendalam — siap diekspor ke PDF atau Excel'],
    workorders: ['Work Orders', 'Antrian inspeksi, intervensi, dan verifikasi lapangan'],
    zones: ['Zones / DMA', `${NRW.KPI.totalZones} zona pilot di Cirebon dan Indramayu`],
    sensors: ['Sensor Network', `${NRW.KPI.totalSensors} sensor terpasang · uptime ${NRW.KPI.sensorUptime}%`],
    alarms: ['Alarm Center', `${NRW.KPI.activeAlarms} alarm aktif · ${NRW.KPI.criticalAlarms} kategori critical`],
    customers: ['Customers', `${NRW.CUSTOMERS.length} pelanggan terdaftar di pilot zones`],
    analytics: ['MNF Analytics', 'Tren minimum night flow dan komparasi antar zona'],
    schedule: ['Schedule', 'Kalender work order dan beban kerja tim lapangan'],
    teams: ['Field Teams', `${NRW.TEAMS.length} tim aktif · lihat workload dan ketersediaan`],
    hardware: ['Hardware Live', `${NRW.DEVICES.length} device telemetri · stream MQTT real-time`],
    commercial: ['Commercial Loss', `${NRW.CASES.filter(c => !['Resolved', 'WrittenOff'].includes(c.status)).length} kasus terbuka · ${NRW.CAMPAIGNS.filter(c => c.status === 'active').length} campaign berjalan`],
    savings: ['Savings Snapshot', 'Snapshot penghematan air dan pendapatan per wilayah'],
    pricing: ['Pricing · Master Data', `${NRW.TARIFFS.length} tier tarif aktif · efektif sejak ${NRW.formatDate(NRW.TARIFFS[0]?.effectiveDate)}`],
    commercialmap: ['Commercial Map', 'Peta finansial — kerugian vs keuntungan per zona']
  };
  document.getElementById('view-title').textContent = titles[view][0];
  document.getElementById('view-sub').textContent = titles[view][1];
  renderView(view);
  renderIcons();
}

function renderView(view) {
  const root = document.getElementById('view-root');
  switch (view) {
    case 'dashboard': return renderDashboard(root);
    case 'map': return renderMap(root);
    case 'reports': return renderReports(root);
    case 'workorders': return renderWorkOrders(root);
    case 'zones': return renderZones(root);
    case 'sensors': return renderSensors(root);
    case 'alarms': return renderAlarms(root);
    case 'customers': return renderCustomers(root);
    case 'analytics': return renderAnalytics(root);
    case 'schedule': return renderSchedule(root);
    case 'teams': return renderTeams(root);
    case 'hardware': return renderHardware(root);
    case 'commercial': return renderCommercial(root);
    case 'savings': return renderSavings(root);
    case 'pricing': return renderPricing(root);
    case 'commercialmap': return renderCommercialMap(root);
  }
}

function kpiCard(label, value, sub, tone, iconName, sparkId, sparkData, sparkColor) {
  return `
    <div class="kpi-card tone-${tone}">
      <div class="kpi-icon">${icon(iconName, 'w-5 h-5')}</div>
      <div class="flex-1 min-w-0">
        <div class="text-slate-400 text-[11px] uppercase tracking-wide font-medium">${label}</div>
        <div class="text-[22px] font-bold mt-0.5 leading-tight">${value}</div>
        <div class="text-[11px] text-slate-600 mt-1 flex items-center gap-1">${sub}</div>
        ${sparkId ? `<div class="sparkline mt-2"><canvas id="${sparkId}"></canvas></div>` : ''}
      </div>
    </div>
  `;
}

function trendArrow(direction) {
  if (direction === 'up') return icon('trending-up', 'w-3 h-3 inline');
  if (direction === 'down') return icon('trending-down', 'w-3 h-3 inline');
  return icon('minus', 'w-3 h-3 inline');
}

// ============ DASHBOARD ============
function renderDashboard(root) {
  const k = NRW.KPI;
  const nrwHistory = NRW.generateNRWTrend(12).overall;
  const recoveryHistory = NRW.generateRecoveryTrend(6).water;
  const showWelcome = !State.getFilter('welcome.dismissed');
  const user = getCurrentUser();
  root.innerHTML = `
    ${showWelcome ? `
      <div class="welcome-banner">
        <div class="w-10 h-10 rounded-lg bg-sky-500 text-white grid place-items-center shrink-0">${icon('waves', 'w-5 h-5')}</div>
        <div class="flex-1">
          <div class="font-semibold text-sm">Halo${user?.name ? ', ' + user.name.split(' ')[0] : ''} — selamat datang kembali 👋</div>
          <div class="text-slate-600 text-xs mt-1">Berikut ringkasan operasional pilot hari ini. Mau langsung lompat ke halaman lain? Tekan <button class="text-sky-600 hover:underline font-medium" data-welcome-action="cmdk">⌘K</button> untuk command palette, atau buka <button class="text-sky-600 hover:underline font-medium" data-welcome-action="savings">Savings · Wilayah</button> untuk melihat penghematan per region. Butuh panduan? Tombol ${icon('info', 'w-3 h-3 inline text-sky-600')} di kiri-bawah selalu tersedia.</div>
        </div>
        <button class="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-white/50 shrink-0" id="welcome-dismiss" title="Tutup">${icon('x', 'w-3.5 h-3.5')}</button>
      </div>
    ` : ''}
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Total NRW', `${k.totalNRW}%`, `${trendArrow(k.nrwTrend < 0 ? 'down' : 'up')} ${Math.abs(k.nrwTrend)}% vs last month`, k.nrwTrend < 0 ? 'good' : 'bad', 'droplet', 'spark-nrw', nrwHistory, '#0ea5e9')}
      ${kpiCard('High-risk zones', k.highRiskZones, `of ${k.totalZones} total zones`, 'warn', 'hexagon')}
      ${kpiCard('Open work orders', k.openWorkOrders, `${k.completedThisMonth} closed this month`, 'info', 'clipboard-list')}
      ${kpiCard('Active alarms', k.activeAlarms, `${k.criticalAlarms} critical`, k.criticalAlarms > 0 ? 'bad' : 'good', 'triangle-alert')}
      ${kpiCard('Water recovered YTD', NRW.formatM3(k.waterRecoveredYTD), `est. ${NRW.formatIDR(k.revenueRecoveredYTD)}`, 'good', 'waves', 'spark-rec', recoveryHistory, '#10b981')}
      ${kpiCard('Sensor uptime', `${k.sensorUptime}%`, `${k.totalSensors} sensors deployed`, parseFloat(k.sensorUptime) > 90 ? 'good' : 'warn', 'wifi')}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <div class="card">
        <div class="card-header">
          <h3>NRW trend · last 12 months</h3>
          <div class="flex gap-2">
            <button class="chip chip-active">12M</button>
            <button class="chip">6M</button>
            <button class="chip">3M</button>
          </div>
        </div>
        <div class="p-3.5 relative" style="height:260px"><canvas id="chart-nrw-trend"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Sensor health</h3><span class="chip">${NRW.KPI.totalSensors} total</span></div>
        <div class="p-3.5 relative" style="height:260px"><canvas id="chart-sensor-health"></canvas></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header"><h3>Top loss zones</h3><a class="text-xs text-sky-500" href="#/zones">View all ${icon('arrow-right', 'w-3 h-3 inline')}</a></div>
        <div class="p-3.5 relative" style="height:240px"><canvas id="chart-top-loss"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Recovery trend · last 6 months</h3><span class="chip chip-success">+${NRW.formatM3(NRW.KPI.waterRecoveredYTD)} YTD</span></div>
        <div class="p-3.5 relative" style="height:240px"><canvas id="chart-recovery"></canvas></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <div class="card">
        <div class="card-header"><h3>Active alarms</h3><a class="text-xs text-sky-500" href="#/alarms">View all (${NRW.KPI.activeAlarms}) ${icon('arrow-right', 'w-3 h-3 inline')}</a></div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Severity</th><th>Type</th><th>Zone</th><th>Message</th><th>Triggered</th><th></th></tr></thead>
            <tbody>
              ${NRW.ALARMS.filter(a => a.status === 'active').slice(0, 6).map(a => `
                <tr>
                  <td><span class="badge" style="background:${NRW.severityColor(a.severity)}">${a.severity}</span></td>
                  <td>${a.type.replace(/_/g, ' ')}</td>
                  <td>${a.zoneId}</td>
                  <td class="text-slate-500">${a.message}</td>
                  <td class="text-slate-500">${NRW.timeAgo(a.triggeredAt)}</td>
                  <td><button class="link-btn" data-zone="${a.zoneId}">Open zone</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card flex flex-col">
        <div class="card-header"><h3>Activity feed</h3><span class="chip">${NRW.ACTIVITY_FEED.length}</span></div>
        <div class="overflow-y-auto max-h-[360px]">
          ${NRW.ACTIVITY_FEED.slice(0, 12).map(a => `
            <div class="px-4 py-2.5 border-b border-slate-100 flex gap-3 items-start hover:bg-slate-50 cursor-pointer" data-act-target="${a.target}">
              <div class="w-7 h-7 rounded-full bg-sky-100 text-sky-600 grid place-items-center shrink-0">${icon(a.iconName, 'w-3.5 h-3.5')}</div>
              <div class="flex-1 min-w-0">
                <div class="text-xs">${a.text}</div>
                <div class="text-slate-400 text-[10px] mt-0.5">${NRW.timeAgo(a.ts)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <div class="card map-card">
        <div class="card-header"><h3>Network overview</h3><a class="text-xs text-sky-500" href="#/map">Expand ${icon('arrow-right', 'w-3 h-3 inline')}</a></div>
        <div id="mini-map" class="h-[280px] relative"></div>
        <div class="px-3.5 py-2.5 border-t border-slate-200 flex flex-wrap gap-3 text-[11px] text-slate-600">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-600"></span>Critical</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>High</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Medium</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Low</span>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Quick actions</h3></div>
        <div class="p-3 grid grid-cols-2 gap-2">
          <button class="btn-secondary flex flex-col items-start text-left p-3 gap-1 hover:border-sky-500 hover:text-sky-600" id="qa-create-wo">${icon('plus', 'w-4 h-4')}<span class="font-semibold text-xs">Buat Work Order</span><span class="text-[10px] text-slate-400">Mulai dari indikasi kebocoran</span></button>
          <button class="btn-secondary flex flex-col items-start text-left p-3 gap-1 hover:border-sky-500 hover:text-sky-600" data-qa-nav="alarms">${icon('triangle-alert', 'w-4 h-4')}<span class="font-semibold text-xs">Tinjau Alarm</span><span class="text-[10px] text-slate-400">${NRW.KPI.activeAlarms} alarm aktif</span></button>
          <button class="btn-secondary flex flex-col items-start text-left p-3 gap-1 hover:border-sky-500 hover:text-sky-600" data-qa-nav="analytics">${icon('activity', 'w-4 h-4')}<span class="font-semibold text-xs">MNF Analytics</span><span class="text-[10px] text-slate-400">Bandingkan zona</span></button>
          <button class="btn-secondary flex flex-col items-start text-left p-3 gap-1 hover:border-sky-500 hover:text-sky-600" data-qa-nav="schedule">${icon('calendar-days', 'w-4 h-4')}<span class="font-semibold text-xs">Jadwal</span><span class="text-[10px] text-slate-400">Work order mendatang</span></button>
        </div>
      </div>
    </div>
  `;
  Charts.nrwTrend('chart-nrw-trend');
  Charts.sensorHealth('chart-sensor-health');
  Charts.topLossZones('chart-top-loss');
  Charts.recoveryTrend('chart-recovery');
  Charts.sparkline('spark-nrw', nrwHistory, '#0ea5e9');
  Charts.sparkline('spark-rec', recoveryHistory, '#10b981');
  initMap('mini-map', { mini: true, zoom: 9 });
  root.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => openZoneDrawer(b.dataset.zone)));
  root.querySelector('#qa-create-wo')?.addEventListener('click', () => openCreateWOModal());
  root.querySelectorAll('[data-qa-nav]').forEach(b => b.addEventListener('click', () => location.hash = `#/${b.dataset.qaNav}`));
  root.querySelectorAll('[data-act-target]').forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.actTarget;
    if (t?.startsWith('DMA-')) openZoneDrawer(t);
    else if (t?.startsWith('WO-')) openWorkOrderDrawer(t);
    else if (t?.startsWith('SNR-')) openSensorDrawer(t);
    else if (t?.startsWith('INT-')) openInterventionDrawer(t);
  }));
  document.getElementById('welcome-dismiss')?.addEventListener('click', () => { State.setFilter('welcome.dismissed', true); document.querySelector('.welcome-banner')?.remove(); });
  root.querySelectorAll('[data-welcome-action]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.welcomeAction;
    if (a === 'cmdk') openCommandPalette();
    else if (a === 'savings') location.hash = '#/savings';
  }));
  renderIcons();
}

// ============ MAP ============
function renderMap(root) {
  root.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-56px-40px)]">
      <aside class="card overflow-y-auto flex flex-col">
        <div class="p-3.5 border-b border-slate-200">
          <div class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2.5">Layers</div>
          <label class="toggle"><input type="checkbox" checked data-layer="zones"><span>DMA / Zones</span></label>
          <label class="toggle"><input type="checkbox" checked data-layer="pipes"><span>Pipe network (${NRW.PIPES.length})</span></label>
          <label class="toggle"><input type="checkbox" checked data-layer="sensors"><span>Sensors (${NRW.KPI.totalSensors})</span></label>
          <label class="toggle"><input type="checkbox" checked data-layer="workorders"><span>Work orders (${NRW.KPI.openWorkOrders})</span></label>
          <label class="toggle"><input type="checkbox" checked data-layer="alarms"><span>Active alarms (${NRW.KPI.activeAlarms})</span></label>
        </div>
        <div class="p-3.5 border-b border-slate-200">
          <div class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2.5">Legend</div>
          <div class="flex flex-col gap-1.5 text-[11px] text-slate-600">
            <div class="flex items-center gap-2"><span class="w-3.5 h-3.5 rounded-sm border-2 border-red-600 bg-red-600/40"></span>Critical (NRW &gt; 35%)</div>
            <div class="flex items-center gap-2"><span class="w-3.5 h-3.5 rounded-sm border-2 border-orange-500 bg-orange-500/40"></span>High (25-35%)</div>
            <div class="flex items-center gap-2"><span class="w-3.5 h-3.5 rounded-sm border-2 border-amber-500 bg-amber-500/40"></span>Medium (20-25%)</div>
            <div class="flex items-center gap-2"><span class="w-3.5 h-3.5 rounded-sm border-2 border-emerald-500 bg-emerald-500/40"></span>Low (&lt; 20%)</div>
            <div class="flex items-center gap-2"><span class="w-4 h-0.5 bg-blue-500"></span>Pipe operational</div>
            <div class="flex items-center gap-2"><span class="w-4 h-0.5 bg-amber-500" style="border-top:2px dashed #f59e0b"></span>Pipe aging</div>
            <div class="flex items-center gap-2"><span class="w-4 h-0.5 bg-orange-500"></span>Pipe scheduled repair</div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500"></span>Sensor online</div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-500"></span>Sensor warning</div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-slate-400"></span>Sensor offline</div>
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 bg-red-600 rotate-45"></span>Open work order</div>
            <div class="flex items-center gap-2"><span class="w-3.5 h-3.5 rounded-full border-2 border-red-600 bg-red-600/30"></span>Active alarm</div>
          </div>
        </div>
        <div class="p-3.5">
          <div class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2.5">Quick jump</div>
          <div class="flex flex-col gap-1">
            ${NRW.ZONES.map(z => `
              <button class="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md hover:bg-sky-50 hover:border-sky-500 text-left transition-colors" data-zone="${z.id}">
                <div>
                  <div class="font-medium text-xs">${z.name}</div>
                  <div class="text-slate-400 text-[10px] mt-0.5">${z.id} · ${z.customers.toLocaleString()} cust.</div>
                </div>
                <span class="badge" style="background:${NRW.classificationColor(z.classification)}">${z.nrwPercent}%</span>
              </button>
            `).join('')}
          </div>
        </div>
      </aside>
      <div class="card relative overflow-hidden">
        <div id="full-map" class="w-full h-full min-h-[500px]"></div>
        <div class="absolute top-3 right-3 z-10 flex gap-1.5">
          <button class="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs shadow hover:bg-slate-50" id="map-reset">Reset view</button>
        </div>
      </div>
    </div>
  `;
  initMap('full-map', { zoom: 10 });
  setOnDrill((kind, data) => {
    if (kind === 'zone') openZoneDrawer(data.id);
    else if (kind === 'sensor') openSensorDrawer(data.id);
    else if (kind === 'workorder') openWorkOrderDrawer(data.id);
  });
  root.querySelectorAll('[data-layer]').forEach(cb => cb.addEventListener('change', () => setLayerVisibility(cb.dataset.layer, cb.checked)));
  root.querySelectorAll('[data-zone]').forEach(btn => btn.addEventListener('click', () => focusZone(btn.dataset.zone, { openPopup: true })));
  document.getElementById('map-reset').addEventListener('click', () => resetView());
  renderIcons();
}

// ============ REPORTS ============ (kept compact; same as before)
function renderReports(root) {
  root.innerHTML = `
    <div class="flex gap-1 border-b border-slate-200 overflow-x-auto">
      <button class="tab ${currentReportTab === 'nrw' ? 'active' : ''}" data-tab="nrw">NRW Analysis</button>
      <button class="tab ${currentReportTab === 'pressure' ? 'active' : ''}" data-tab="pressure">Pressure Intelligence</button>
      <button class="tab ${currentReportTab === 'commercial' ? 'active' : ''}" data-tab="commercial">Commercial Loss</button>
      <button class="tab ${currentReportTab === 'impact' ? 'active' : ''}" data-tab="impact">Impact Measurement</button>
      <button class="tab ${currentReportTab === 'sensors' ? 'active' : ''}" data-tab="sensors">Sensor Performance</button>
    </div>
    <div class="card p-3 flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-1.5"><label class="text-[11px] text-slate-400 uppercase tracking-wide">Period</label>
        <select class="select-input"><option>Last 30 days</option><option>Last 90 days</option><option>YTD</option></select></div>
      <div class="flex items-center gap-1.5"><label class="text-[11px] text-slate-400 uppercase tracking-wide">Region</label>
        <select class="select-input"><option>All regions</option><option>Cirebon</option><option>Indramayu</option></select></div>
      <div class="flex items-center gap-1.5"><label class="text-[11px] text-slate-400 uppercase tracking-wide">Class</label>
        <select class="select-input"><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
      <div class="flex-1"></div>
      <button class="btn-secondary flex items-center gap-1.5" onclick="window.print()">${icon('printer', 'w-3.5 h-3.5')} Print</button>
      <button class="btn-secondary flex items-center gap-1.5" id="rep-export-pdf">${icon('download', 'w-3.5 h-3.5')} Export PDF</button>
      <button class="btn-secondary flex items-center gap-1.5" id="rep-export-xls">${icon('download', 'w-3.5 h-3.5')} Export Excel</button>
    </div>
    <div id="report-content" class="flex flex-col gap-4"></div>
  `;
  root.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { currentReportTab = t.dataset.tab; renderReports(root); }));
  root.querySelector('#rep-export-pdf').addEventListener('click', () => toast('PDF export queued — check downloads in a moment', 'info'));
  root.querySelector('#rep-export-xls').addEventListener('click', () => toast('Excel export queued', 'info'));
  renderReportContent(currentReportTab);
  renderIcons();
}

function renderReportContent(tab) {
  const c = document.getElementById('report-content');
  if (tab === 'nrw') renderReportNRW(c);
  else if (tab === 'pressure') renderReportPressure(c);
  else if (tab === 'commercial') renderReportCommercial(c);
  else if (tab === 'impact') renderReportImpact(c);
  else if (tab === 'sensors') renderReportSensors(c);
  renderIcons();
}

function renderReportNRW(c) {
  const totalInput = NRW.ZONES.reduce((s, z) => s + z.inputVolume, 0);
  const totalBilled = NRW.ZONES.reduce((s, z) => s + z.billedVolume, 0);
  const totalLoss = totalInput - totalBilled;
  c.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Total input volume', NRW.formatM3(totalInput), 'across pilot zones', 'info', 'droplet')}
      ${kpiCard('Total billed', NRW.formatM3(totalBilled), `${((totalBilled / totalInput) * 100).toFixed(1)}% of input`, 'good', 'check')}
      ${kpiCard('Total NRW volume', NRW.formatM3(totalLoss), `${((totalLoss / totalInput) * 100).toFixed(1)}% loss rate`, 'bad', 'trending-up')}
      ${kpiCard('Est. unrealised revenue', NRW.formatIDR(totalLoss * 5000), 'at Rp 5,000 / m³', 'warn', 'banknote')}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <div class="card"><div class="card-header"><h3>NRW % by zone</h3></div><div class="p-3.5 relative" style="height:300px"><canvas id="chart-r-top"></canvas></div></div>
      <div class="card"><div class="card-header"><h3>Classification mix</h3></div><div class="p-3.5 relative" style="height:300px"><canvas id="chart-r-class"></canvas></div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Zone NRW breakdown — click row to drill</h3><span class="chip">${NRW.ZONES.length} rows</span></div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>Zone</th><th>Region</th><th>Customers</th><th>Input (m³)</th><th>Billed (m³)</th><th>Loss (m³)</th><th>NRW %</th><th>Trend</th><th>MNF Δ</th><th>Score</th><th>Class</th></tr></thead>
        <tbody>${[...NRW.ZONES].sort((a, b) => b.nrwPercent - a.nrwPercent).map(z => {
          const loss = z.inputVolume - z.billedVolume;
          const mnfDelta = ((z.minNightFlow - z.baselineMNF) / z.baselineMNF * 100).toFixed(0);
          const tc = z.nrwTrend === 'up' ? 'text-red-500' : z.nrwTrend === 'down' ? 'text-emerald-500' : 'text-slate-400';
          return `<tr class="clickable" data-zone="${z.id}"><td><strong>${z.name}</strong><div class="text-slate-400 text-[11px]">${z.id}</div></td><td>${z.region}</td><td>${z.customers.toLocaleString()}</td><td>${z.inputVolume.toLocaleString()}</td><td>${z.billedVolume.toLocaleString()}</td><td>${loss.toLocaleString()}</td><td><strong>${z.nrwPercent}%</strong></td><td class="${tc}">${Math.abs(z.nrwChange)}%</td><td>${mnfDelta > 0 ? '+' : ''}${mnfDelta}%</td><td>${z.suspicionScore}</td><td><span class="badge" style="background:${NRW.classificationColor(z.classification)}">${z.classification}</span></td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>
  `;
  Charts.topLossZones('chart-r-top', 10);
  Charts.suspicionBreakdown('chart-r-class');
  c.querySelectorAll('[data-zone]').forEach(r => r.addEventListener('click', () => openZoneDrawer(r.dataset.zone)));
}

function renderReportPressure(c) {
  const avgPressure = (NRW.ZONES.reduce((s, z) => s + z.avgPressure, 0) / NRW.ZONES.length).toFixed(2);
  const unstable = NRW.ZONES.filter(z => z.pressureStability < 0.8).length;
  const overP = NRW.ALARMS.filter(a => a.type === 'over_pressure' && a.status === 'active').length;
  const drops = NRW.ALARMS.filter(a => a.type === 'pressure_drop' && a.status === 'active').length;
  c.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Network avg pressure', `${avgPressure} bar`, 'across all zones', 'info', 'gauge')}
      ${kpiCard('Unstable zones', unstable, 'stability < 0.80', unstable > 2 ? 'bad' : 'warn', 'activity')}
      ${kpiCard('Over-pressure alarms', overP, 'currently active', overP ? 'bad' : 'good', 'trending-up')}
      ${kpiCard('Pressure drops', drops, 'in last 24h', drops ? 'bad' : 'good', 'trending-down')}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card"><div class="card-header"><h3>Active pressure alarms</h3></div><div class="p-3.5 relative" style="height:260px"><canvas id="chart-r-alarm"></canvas></div></div>
      <div class="card"><div class="card-header"><h3>Zone pressure stability</h3></div><div class="p-3.5 relative" style="height:260px"><canvas id="chart-r-stab"></canvas></div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Pressure conditions by zone</h3></div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>Zone</th><th>Avg pressure</th><th>Stability</th><th>Active alarms</th><th>Recommendation</th><th></th></tr></thead>
        <tbody>${[...NRW.ZONES].sort((a, b) => a.pressureStability - b.pressureStability).map(z => {
          const stab = (z.pressureStability * 100).toFixed(0);
          const sc = z.pressureStability < 0.7 ? 'bad' : z.pressureStability < 0.85 ? 'warn' : 'good';
          let rec = 'Monitor only';
          if (z.pressureStability < 0.7) rec = 'PRV candidate · investigate burst risk';
          else if (z.pressureStability < 0.85) rec = 'Schedule pressure profile review';
          else if (z.avgPressure > 3.3) rec = 'Consider pressure reduction';
          return `<tr class="clickable" data-zone="${z.id}"><td><strong>${z.name}</strong><div class="text-slate-400 text-[11px]">${z.id}</div></td><td>${z.avgPressure} bar</td><td><div class="bar"><div class="bar-fill ${sc}" style="width:${stab}%"></div></div><span class="text-slate-400 text-[11px]">${stab}%</span></td><td>${z.activeAlarms}</td><td class="text-slate-500">${rec}</td><td>${icon('chevron-right', 'w-3.5 h-3.5')}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>
  `;
  Charts.alarmDistribution('chart-r-alarm');
  Charts.zoneComparison('chart-r-stab', NRW.ZONES.slice(0, 4).map(z => z.id));
  c.querySelectorAll('[data-zone]').forEach(r => r.addEventListener('click', () => openZoneDrawer(r.dataset.zone)));
}

function renderReportCommercial(c) {
  const lossM3 = NRW.ZONES.reduce((s, z) => s + (z.inputVolume - z.billedVolume), 0);
  const commAlarms = NRW.ALARMS.filter(a => a.type === 'commercial_anomaly' && a.status === 'active').length;
  const commWOs = NRW.WORK_ORDERS.filter(w => w.type === 'Commercial').length;
  c.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Zero-consumption cases', NRW.CUSTOMERS.filter(c => c.anomalies.some(a => a.code === 'zero_consumption')).length, 'across all zones, > 3 mo', 'warn', 'circle-alert')}
      ${kpiCard('Active commercial alarms', commAlarms, 'flagged by analytics', commAlarms ? 'warn' : 'good', 'triangle-alert')}
      ${kpiCard('Commercial work orders', commWOs, 'open or in progress', 'info', 'clipboard-list')}
      ${kpiCard('Est. commercial loss', NRW.formatIDR(lossM3 * 5000 * 0.4), '~40% of total NRW value', 'bad', 'banknote')}
    </div>
    <div class="card"><div class="card-header"><h3>Input vs billed volume by zone</h3></div><div class="p-3.5 relative" style="height:340px"><canvas id="chart-r-comm"></canvas></div></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header"><h3>Commercial loss indicators</h3></div>
        <div class="p-2 flex flex-col gap-1">
          ${indicator('Zero consumption ≥ 4 months', NRW.CUSTOMERS.filter(c => c.anomalies.some(a => a.code === 'zero_consumption')).length, 'Likely broken meter, inactive, or illegal bypass')}
          ${indicator('Sudden consumption drop > 50%', NRW.CUSTOMERS.filter(c => c.anomalies.some(a => a.code === 'sudden_drop')).length, 'Possible meter malfunction or manipulation')}
          ${indicator('Abnormal usage spike', NRW.CUSTOMERS.filter(c => c.anomalies.some(a => a.code === 'unusual_spike')).length, 'Commercial loss risk or misclassification')}
          ${indicator('Meter age > 10 years', NRW.CUSTOMERS.filter(c => c.meterAge > 10).length, 'Candidates for replacement program')}
          ${indicator('Supply vs billed gap > 30%', NRW.ZONES.filter(z => ((z.inputVolume - z.billedVolume) / z.inputVolume) > 0.3).length, 'Zones with severe commercial mismatch')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Top commercial loss zones</h3><a href="#/customers" class="text-xs text-sky-500">View customers ${icon('arrow-right', 'w-3 h-3 inline')}</a></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>Zone</th><th>Gap %</th><th>Est. value</th><th></th></tr></thead>
          <tbody>${[...NRW.ZONES].sort((a, b) => (b.inputVolume - b.billedVolume) - (a.inputVolume - a.billedVolume)).slice(0, 6).map(z => {
            const gap = z.inputVolume - z.billedVolume;
            const pct = ((gap / z.inputVolume) * 100).toFixed(1);
            return `<tr class="clickable" data-zone="${z.id}"><td><strong>${z.name}</strong></td><td>${pct}%</td><td>${NRW.formatIDR(gap * 5000)}</td><td>${icon('chevron-right', 'w-3.5 h-3.5')}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>
    </div>
  `;
  Charts.commercialLossBreakdown('chart-r-comm');
  c.querySelectorAll('[data-zone]').forEach(r => r.addEventListener('click', () => openZoneDrawer(r.dataset.zone)));
}

function indicator(title, count, note) {
  return `<div class="flex gap-3.5 p-2.5 rounded-md items-center hover:bg-slate-50">
    <div class="text-[22px] font-bold text-sky-500 min-w-[60px]">${count.toLocaleString()}</div>
    <div><div class="font-medium text-xs">${title}</div><div class="text-slate-400 text-[11px] mt-0.5">${note}</div></div>
  </div>`;
}

function renderReportImpact(c) {
  const totalM3 = NRW.INTERVENTIONS.reduce((s, i) => s + i.waterRecoveredM3, 0);
  const totalIDR = NRW.INTERVENTIONS.reduce((s, i) => s + i.revenueRecoveredIDR, 0);
  const avgEff = (NRW.INTERVENTIONS.reduce((s, i) => s + i.effectiveness, 0) / NRW.INTERVENTIONS.length).toFixed(1);
  const totalMNFRed = NRW.INTERVENTIONS.reduce((s, i) => s + i.mnfReduction, 0).toFixed(1);
  c.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Interventions completed', NRW.INTERVENTIONS.length, 'last 90 days', 'good', 'check')}
      ${kpiCard('Water recovered', NRW.formatM3(totalM3), 'cumulative this period', 'good', 'waves')}
      ${kpiCard('Revenue recovered', NRW.formatIDR(totalIDR), 'estimated', 'good', 'banknote')}
      ${kpiCard('Avg effectiveness', `${avgEff}%`, `total MNF reduction: ${totalMNFRed} L/s`, 'info', 'activity')}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <div class="card"><div class="card-header"><h3>Pre vs post intervention MNF</h3></div><div class="p-3.5 relative" style="height:300px"><canvas id="chart-r-imp"></canvas></div></div>
      <div class="card"><div class="card-header"><h3>Cumulative recovery</h3></div><div class="p-3.5 relative" style="height:300px"><canvas id="chart-r-rec"></canvas></div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Intervention log — click for detail</h3><span class="chip">${NRW.INTERVENTIONS.length} interventions</span></div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>ID</th><th>Zone</th><th>Type</th><th>Completed</th><th>Pre MNF</th><th>Post MNF</th><th>Δ MNF</th><th>Water rec.</th><th>Revenue rec.</th><th>Effectiveness</th></tr></thead>
        <tbody>${[...NRW.INTERVENTIONS].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).map(i => {
          const zone = NRW.getZone(i.zoneId);
          const ec = i.effectiveness >= 30 ? 'text-emerald-600' : i.effectiveness >= 15 ? 'text-amber-600' : 'text-slate-500';
          return `<tr class="clickable" data-intervention="${i.id}"><td><strong>${i.id}</strong></td><td>${zone?.name || i.zoneId}</td><td>${i.type}</td><td>${NRW.formatDate(i.completedAt)}</td><td>${i.preActionMNF} L/s</td><td>${i.postActionMNF} L/s</td><td class="text-emerald-600">-${i.mnfReduction} L/s</td><td>${NRW.formatM3(i.waterRecoveredM3)}</td><td>${NRW.formatIDR(i.revenueRecoveredIDR)}</td><td class="${ec}"><strong>${i.effectiveness}%</strong></td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>
  `;
  Charts.interventionEffectiveness('chart-r-imp');
  Charts.recoveryTrend('chart-r-rec');
  c.querySelectorAll('[data-intervention]').forEach(r => r.addEventListener('click', () => openInterventionDrawer(r.dataset.intervention)));
}

function renderReportSensors(c) {
  const online = NRW.SENSORS.filter(s => s.status === 'online').length;
  const warn = NRW.SENSORS.filter(s => s.status === 'warning').length;
  const off = NRW.SENSORS.filter(s => s.status === 'offline').length;
  const lowBat = NRW.SENSORS.filter(s => s.battery < 40).length;
  c.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Total sensors', NRW.SENSORS.length, 'deployed across pilot', 'info', 'radio-tower')}
      ${kpiCard('Online', online, `${((online / NRW.SENSORS.length) * 100).toFixed(1)}% uptime`, 'good', 'wifi')}
      ${kpiCard('Warning / Offline', warn + off, `${warn} warn · ${off} offline`, 'warn', 'wifi-off')}
      ${kpiCard('Low battery', lowBat, '< 40% remaining', lowBat > 5 ? 'bad' : 'warn', 'battery')}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card"><div class="card-header"><h3>Sensor status distribution</h3></div><div class="p-3.5 relative" style="height:280px"><canvas id="chart-r-sens"></canvas></div></div>
      <div class="card">
        <div class="card-header"><h3>Sensors needing attention</h3></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>Sensor</th><th>Zone</th><th>Status</th><th>Battery</th></tr></thead>
          <tbody>${NRW.SENSORS.filter(s => s.status !== 'online' || s.battery < 40).slice(0, 10).map(s => `
            <tr class="clickable" data-sensor="${s.id}"><td><strong>${s.id}</strong></td><td>${s.zoneName}</td><td><span class="badge" style="background:${s.status === 'online' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#94a3b8'}">${s.status}</span></td><td>${s.battery}%</td></tr>
          `).join('')}</tbody>
        </table></div>
      </div>
    </div>
  `;
  Charts.sensorHealth('chart-r-sens');
  c.querySelectorAll('[data-sensor]').forEach(r => r.addEventListener('click', () => openSensorDrawer(r.dataset.sensor)));
}

// ============ WORK ORDERS ============
function renderWorkOrders(root) {
  const filtered = NRW.WORK_ORDERS.filter(w => {
    if (state.wo.status !== 'all' && w.status !== state.wo.status) return false;
    if (state.wo.priority !== 'all' && w.priority !== state.wo.priority) return false;
    if (state.wo.zone !== 'all' && w.zoneId !== state.wo.zone) return false;
    return true;
  });
  const stat = (val, label) => `<div class="stat-card"><div class="stat-val">${val}</div><div class="stat-lbl">${label}</div></div>`;
  root.innerHTML = `
    <div class="grid grid-cols-3 lg:grid-cols-6 gap-2">
      ${stat(NRW.WORK_ORDERS.length, 'Total')}
      ${stat(NRW.WORK_ORDERS.filter(w => w.status === 'Draft').length, 'Draft')}
      ${stat(NRW.WORK_ORDERS.filter(w => w.status === 'Assigned').length, 'Assigned')}
      ${stat(NRW.WORK_ORDERS.filter(w => w.status === 'InProgress').length, 'In Progress')}
      ${stat(NRW.WORK_ORDERS.filter(w => w.status === 'PendingEvidence').length, 'Pending Evidence')}
      ${stat(NRW.WORK_ORDERS.filter(w => ['Verified', 'Closed'].includes(w.status)).length, 'Closed')}
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Work Order Queue</h3>
        <div class="flex gap-2">
          <select class="select-input" id="f-status">
            <option value="all">All status</option><option value="Draft">Draft</option><option value="Assigned">Assigned</option>
            <option value="InProgress">In Progress</option><option value="PendingEvidence">Pending Evidence</option>
            <option value="Completed">Completed</option><option value="Verified">Verified</option><option value="Closed">Closed</option>
          </select>
          <select class="select-input" id="f-priority"><option value="all">All priority</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
          <select class="select-input" id="f-zone"><option value="all">All zones</option>${NRW.ZONES.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}</select>
          <button class="btn-primary flex items-center gap-1.5" id="new-wo-btn">${icon('plus', 'w-3.5 h-3.5')} Buat Work Order</button>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>ID</th><th>Title</th><th>Zone</th><th>Type</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Due</th><th>Score</th><th>Est. recovery</th><th>Actions</th></tr></thead>
        <tbody>${filtered.map(w => {
          const zone = NRW.getZone(w.zoneId);
          const overdue = new Date(w.dueDate) < new Date('2026-06-02') && !['Verified', 'Closed'].includes(w.status);
          return `<tr class="clickable" data-wo="${w.id}"><td><strong>${w.id}</strong></td><td>${w.title}</td><td>${zone?.name || w.zoneId}</td><td>${w.type}</td><td><span class="priority priority-${w.priority.toLowerCase()}">${w.priority}</span></td><td><span class="badge" style="background:${NRW.statusColor(w.status)}">${NRW.formatStatus(w.status)}</span></td><td>${w.assignee || '<span class="text-slate-400">unassigned</span>'}</td><td class="${overdue ? 'text-red-500' : ''}">${NRW.formatDate(w.dueDate)} ${overdue ? icon('triangle-alert', 'w-3 h-3 inline') : ''}</td><td>${w.suspicionScore}</td><td>${w.estRecoveryM3 ? NRW.formatM3(w.estRecoveryM3) : '-'}</td><td class="!py-1"><div class="flex gap-0.5"><button class="row-action" data-edit-wo="${w.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button><button class="row-action danger" data-delete-wo="${w.id}" title="Cancel">${icon('trash-2', 'w-3 h-3')}</button></div></td></tr>`;
        }).join('')}${!filtered.length ? '<tr><td colspan="11" class="text-center py-9 text-slate-400">Tidak ada work order yang cocok dengan filter saat ini — coba longgarkan filter atau buat work order baru</td></tr>' : ''}</tbody>
      </table></div>
    </div>
  `;
  document.getElementById('f-status').value = state.wo.status;
  document.getElementById('f-priority').value = state.wo.priority;
  document.getElementById('f-zone').value = state.wo.zone;
  ['f-status', 'f-priority', 'f-zone'].forEach(id => {
    document.getElementById(id).addEventListener('change', e => {
      const key = id.split('-')[1];
      state.wo[key] = e.target.value;
      State.setFilter(`wo.${key}`, e.target.value);
      renderWorkOrders(root);
    });
  });
  document.getElementById('new-wo-btn').addEventListener('click', () => openCreateWOModal());
  root.querySelectorAll('[data-wo]').forEach(r => r.addEventListener('click', () => openWorkOrderDrawer(r.dataset.wo)));
  root.querySelectorAll('[data-edit-wo]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openEditWOModal(b.dataset.editWo); }));
  root.querySelectorAll('[data-delete-wo]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteWO(b.dataset.deleteWo); }));
  renderIcons();
}

// ============ ZONES ============
function renderZones(root) {
  root.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex gap-2 items-center"><span class="chip">${NRW.ZONES.length} zones</span><span class="chip chip-success">${NRW.ZONES.reduce((s, z) => s + z.customers, 0).toLocaleString()} customers</span></div>
      <button class="btn-primary flex items-center gap-1.5" id="new-zone-btn">${icon('plus', 'w-3.5 h-3.5')} Tambah Zona</button>
    </div>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3.5">
      ${NRW.ZONES.map(z => {
        const color = NRW.classificationColor(z.classification);
        const mnfDelta = ((z.minNightFlow - z.baselineMNF) / z.baselineMNF * 100).toFixed(0);
        const mnfClass = mnfDelta > 30 ? 'text-red-500' : mnfDelta > 10 ? 'text-amber-500' : 'text-emerald-500';
        const trendClass = z.nrwTrend === 'down' ? 'text-emerald-500' : z.nrwTrend === 'up' ? 'text-red-500' : 'text-slate-400';
        return `<div class="zone-card clickable" data-zone="${z.id}">
          <div class="px-3.5 py-3 flex justify-between items-start gap-2.5 bg-slate-50 border-b border-slate-200" style="border-left:4px solid ${color}">
            <div><div class="font-semibold text-sm">${z.name}</div><div class="text-slate-400 text-[11px] mt-0.5">${z.id} · ${z.region} · ${z.type}</div></div>
            <div class="flex items-center gap-1">
              <span class="badge" style="background:${color}">${z.classification}</span>
              <button class="row-action" data-edit-zone="${z.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button>
              <button class="row-action danger" data-delete-zone="${z.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button>
            </div>
          </div>
          <div class="grid grid-cols-2 p-3">
            <div class="p-2.5 border-r border-b border-slate-200"><div class="text-slate-400 text-[10px] uppercase tracking-wide">NRW</div><div class="text-[20px] font-bold mt-0.5">${z.nrwPercent}%</div><div class="text-[10px] mt-0.5 ${trendClass} flex items-center gap-1">${trendArrow(z.nrwTrend)} ${Math.abs(z.nrwChange)}%</div></div>
            <div class="p-2.5 border-b border-slate-200"><div class="text-slate-400 text-[10px] uppercase tracking-wide">Suspicion</div><div class="text-[20px] font-bold mt-0.5">${z.suspicionScore}</div><div class="text-[10px] mt-0.5 text-slate-400">/100</div></div>
            <div class="p-2.5 border-r border-slate-200"><div class="text-slate-400 text-[10px] uppercase tracking-wide">MNF</div><div class="text-[20px] font-bold mt-0.5">${z.minNightFlow}</div><div class="text-[10px] mt-0.5 ${mnfClass}">${mnfDelta > 0 ? '+' : ''}${mnfDelta}% vs baseline</div></div>
            <div class="p-2.5"><div class="text-slate-400 text-[10px] uppercase tracking-wide">Pressure</div><div class="text-[20px] font-bold mt-0.5">${z.avgPressure}</div><div class="text-[10px] mt-0.5 text-slate-400">stab. ${(z.pressureStability * 100).toFixed(0)}%</div></div>
          </div>
          <div class="px-3.5 py-2.5 bg-slate-50 flex flex-wrap gap-3 items-center text-[11px] text-slate-600 border-t border-slate-200">
            <span>${z.customers.toLocaleString()} customers</span><span>${z.sensors} sensors</span>
            ${z.activeAlarms ? `<span class="badge badge-danger">${z.activeAlarms} alarm</span>` : ''}
            ${z.openWorkOrders ? `<span class="badge badge-warn">${z.openWorkOrders} WO</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  root.querySelectorAll('[data-zone]').forEach(c => c.addEventListener('click', () => openZoneDrawer(c.dataset.zone)));
  root.querySelectorAll('[data-edit-zone]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openZoneFormModal(NRW.getZone(b.dataset.editZone)); }));
  root.querySelectorAll('[data-delete-zone]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteZone(b.dataset.deleteZone); }));
  document.getElementById('new-zone-btn').addEventListener('click', () => openZoneFormModal());
  renderIcons();
}

// ============ SENSORS ============
function renderSensors(root) {
  root.innerHTML = `<div class="card"><div class="card-header"><h3>Sensor Registry</h3>
    <div class="flex gap-2 items-center"><span class="chip">${NRW.SENSORS.length} sensors</span>
      <button class="btn-primary flex items-center gap-1.5" id="new-sensor-btn">${icon('plus', 'w-3.5 h-3.5')} Daftar Sensor</button>
    </div></div>
    <div class="overflow-x-auto"><table class="data-table">
      <thead><tr><th>ID</th><th>Type</th><th>Zone</th><th>Location</th><th>Status</th><th>Last reading</th><th>Battery</th><th>Signal</th><th>Actions</th></tr></thead>
      <tbody>${NRW.SENSORS.map(s => `<tr class="clickable" data-sensor="${s.id}"><td><strong>${s.id}</strong></td><td>${s.type}</td><td>${s.zoneName}</td><td>${s.location}</td><td><span class="badge" style="background:${s.status === 'online' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#94a3b8'}">${s.status}</span></td><td><span data-live-sensor="${s.id}">${s.lastReading} ${s.unit}</span></td><td>${batteryBar(s.battery)}</td><td>${signalBar(s.signalStrength)}</td><td class="!py-1"><div class="flex gap-0.5"><button class="row-action" data-edit-sensor="${s.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button><button class="row-action danger" data-delete-sensor="${s.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button></div></td></tr>`).join('')}</tbody>
    </table></div></div>`;
  root.querySelectorAll('[data-sensor]').forEach(r => r.addEventListener('click', () => openSensorDrawer(r.dataset.sensor)));
  root.querySelectorAll('[data-edit-sensor]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openSensorFormModal(NRW.getSensor(b.dataset.editSensor)); }));
  root.querySelectorAll('[data-delete-sensor]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteSensor(b.dataset.deleteSensor); }));
  document.getElementById('new-sensor-btn').addEventListener('click', () => openSensorFormModal());
  renderIcons();
}

function batteryBar(pct) { const cls = pct > 60 ? 'good' : pct > 30 ? 'warn' : 'bad'; return `<div class="bar small"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div><span class="text-slate-400 text-[11px]">${pct}%</span>`; }
function signalBar(pct) { const cls = pct > 70 ? 'good' : pct > 40 ? 'warn' : 'bad'; return `<div class="bar small"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div><span class="text-slate-400 text-[11px]">${pct}%</span>`; }

// ============ ALARMS ============
function renderAlarms(root) {
  const active = NRW.ALARMS.filter(a => a.status === 'active');
  const acked = NRW.ALARMS.filter(a => a.status === 'acknowledged');
  root.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Active alarms', active.length, '', 'bad', 'triangle-alert')}
      ${kpiCard('Critical', active.filter(a => a.severity === 'critical').length, 'immediate attention', 'bad', 'alert-octagon')}
      ${kpiCard('High', active.filter(a => a.severity === 'high').length, 'investigate today', 'warn', 'circle-alert')}
      ${kpiCard('Acknowledged', acked.length, 'awaiting resolution', 'info', 'eye')}
    </div>
    <div class="card">
      <div class="card-header"><h3>Active alarm log</h3></div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>ID</th><th>Severity</th><th>Type</th><th>Zone</th><th>Sensor</th><th>Message</th><th>Triggered</th><th>Actions</th></tr></thead>
        <tbody>${NRW.ALARMS.filter(a => a.status !== 'resolved').map(a => `
          <tr><td><strong>${a.id}</strong></td><td><span class="badge" style="background:${NRW.severityColor(a.severity)}">${a.severity}</span></td><td>${a.type.replace(/_/g, ' ')}</td><td>${a.zoneId}</td><td>${a.sensorId || '-'}</td><td class="text-slate-500">${a.message}</td><td class="text-slate-500">${NRW.timeAgo(a.triggeredAt)}</td><td class="flex gap-1.5 items-center">
            ${a.status === 'active' ? `<button class="link-btn" data-ack="${a.id}">Ack</button>` : `<span class="badge" style="background:#3b82f6">ack'd</span>`}
            <button class="link-btn" data-resolve="${a.id}">Resolve</button>
            <button class="link-btn" data-zone="${a.zoneId}">Zone</button>
            ${a.sensorId ? `<button class="link-btn" data-sensor="${a.sensorId}">Sensor</button>` : ''}
          </td></tr>
        `).join('')}</tbody>
      </table></div>
    </div>
  `;
  root.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => openZoneDrawer(b.dataset.zone)));
  root.querySelectorAll('[data-sensor]').forEach(b => b.addEventListener('click', () => openSensorDrawer(b.dataset.sensor)));
  root.querySelectorAll('[data-ack]').forEach(b => b.addEventListener('click', () => { State.acknowledgeAlarm(b.dataset.ack); toast(`Alarm ${b.dataset.ack} acknowledged`, 'success'); }));
  root.querySelectorAll('[data-resolve]').forEach(b => b.addEventListener('click', () => { State.resolveAlarm(b.dataset.resolve); toast(`Alarm ${b.dataset.resolve} resolved`, 'success'); }));
  renderIcons();
}

// ============ CUSTOMERS ============
function renderCustomers(root) {
  const filtered = NRW.CUSTOMERS.filter(c => {
    if (state.cust.zone !== 'all' && c.zoneId !== state.cust.zone) return false;
    if (state.cust.anomaly !== 'all' && !c.anomalies.some(a => a.code === state.cust.anomaly)) return false;
    return true;
  });
  const withAnom = NRW.CUSTOMERS.filter(c => c.anomalies.length).length;
  const business = NRW.CUSTOMERS.filter(c => c.type === 'Business').length;
  const avgUsage = (NRW.CUSTOMERS.reduce((s, c) => s + c.avgMonthly, 0) / NRW.CUSTOMERS.length).toFixed(1);
  root.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Total customers', NRW.CUSTOMERS.length, 'across pilot zones', 'info', 'building-2')}
      ${kpiCard('Business', business, `${NRW.CUSTOMERS.length - business} residential`, 'info', 'briefcase')}
      ${kpiCard('With anomalies', withAnom, `${((withAnom / NRW.CUSTOMERS.length) * 100).toFixed(0)}% of base`, 'warn', 'triangle-alert')}
      ${kpiCard('Avg monthly use', `${avgUsage} m³`, 'across all customers', 'info', 'droplet')}
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Customer Master · ${filtered.length} shown</h3>
        <div class="flex gap-2">
          <select class="select-input" id="cf-zone"><option value="all">All zones</option>${NRW.ZONES.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}</select>
          <select class="select-input" id="cf-anom"><option value="all">All customers</option><option value="zero_consumption">Zero consumption</option><option value="sudden_drop">Sudden drop</option><option value="unusual_spike">Usage spike</option><option value="old_meter">Old meter</option></select>
          <button class="btn-primary flex items-center gap-1.5" id="new-customer-btn">${icon('plus', 'w-3.5 h-3.5')} Tambah Pelanggan</button>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Zone</th><th>Meter</th><th>Avg / Last</th><th>Last 6 mo</th><th>Anomalies</th><th>Risk</th><th>Actions</th></tr></thead>
        <tbody>${filtered.slice(0, 50).map(c => `
          <tr class="clickable" data-customer="${c.id}">
            <td><strong>${c.id}</strong></td>
            <td>${c.name}</td>
            <td><span class="chip ${c.type === 'Business' ? 'chip-success' : ''}">${c.type}</span></td>
            <td>${c.zoneName}</td>
            <td>${c.meterId}<div class="text-slate-400 text-[10px]">age ${c.meterAge}y</div></td>
            <td>${c.avgMonthly}<div class="text-slate-400 text-[10px]">last ${c.lastReading} m³</div></td>
            <td><div class="w-24 h-8"><canvas id="cspark-${c.id}"></canvas></div></td>
            <td>${c.anomalies.length ? c.anomalies.map(a => `<span class="badge" style="background:${a.severity === 'high' ? '#dc2626' : a.severity === 'medium' ? '#f59e0b' : '#94a3b8'}">${a.label}</span>`).join(' ') : '<span class="text-slate-400 text-[11px]">none</span>'}</td>
            <td>${c.riskScore}</td>
            <td class="!py-1"><div class="flex gap-0.5"><button class="row-action" data-edit-customer="${c.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button><button class="row-action danger" data-delete-customer="${c.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button></div></td>
          </tr>
        `).join('')}</tbody>
      </table></div>
      ${filtered.length > 50 ? `<div class="px-4 py-3 text-center text-slate-400 text-xs border-t border-slate-200">Showing 50 of ${filtered.length} — refine filters to see more</div>` : ''}
    </div>
  `;
  document.getElementById('cf-zone').value = state.cust.zone;
  document.getElementById('cf-anom').value = state.cust.anomaly;
  document.getElementById('cf-zone').addEventListener('change', e => { state.cust.zone = e.target.value; renderCustomers(root); });
  document.getElementById('cf-anom').addEventListener('change', e => { state.cust.anomaly = e.target.value; renderCustomers(root); });
  filtered.slice(0, 50).forEach(c => Charts.sparkline(`cspark-${c.id}`, c.history.slice(-6), c.anomalies.length ? '#ef4444' : '#0ea5e9'));
  root.querySelectorAll('[data-customer]').forEach(r => r.addEventListener('click', () => openCustomerDrawer(r.dataset.customer)));
  root.querySelectorAll('[data-edit-customer]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openCustomerFormModal(NRW.getCustomer(b.dataset.editCustomer)); }));
  root.querySelectorAll('[data-delete-customer]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteCustomer(b.dataset.deleteCustomer); }));
  document.getElementById('new-customer-btn').addEventListener('click', () => openCustomerFormModal());
  renderIcons();
}

// ============ MNF ANALYTICS ============
function renderAnalytics(root) {
  root.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
      <div class="card">
        <div class="card-header"><h3>Zones to compare</h3><span class="chip">${state.analytics.selectedZones.length} selected</span></div>
        <div class="p-3 flex flex-col gap-1.5 max-h-[440px] overflow-y-auto">
          ${NRW.ZONES.map(z => `
            <label class="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" class="accent-sky-500" data-anal-zone="${z.id}" ${state.analytics.selectedZones.includes(z.id) ? 'checked' : ''}>
              <div class="flex-1">
                <div class="text-xs font-medium">${z.name}</div>
                <div class="text-[10px] text-slate-400">MNF ${z.minNightFlow} L/s · baseline ${z.baselineMNF} L/s</div>
              </div>
              <span class="badge" style="background:${NRW.classificationColor(z.classification)}">${z.nrwPercent}%</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Minimum Night Flow · last 30 days · selected zones</h3>
          <div class="flex gap-2"><button class="chip">L/s</button><button class="chip chip-active">vs baseline</button></div>
        </div>
        <div class="p-3.5 relative" style="height:440px"><canvas id="chart-an-mnf"></canvas></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>MNF deviation matrix · all zones · click to drill</h3></div>
      <div class="overflow-x-auto"><table class="data-table compact">
        <thead><tr><th>Zone</th><th>Baseline (L/s)</th><th>Current (L/s)</th><th>Δ (L/s)</th><th>Δ %</th><th>Classification</th><th>Recommendation</th></tr></thead>
        <tbody>${[...NRW.ZONES].sort((a, b) => ((b.minNightFlow - b.baselineMNF) / b.baselineMNF) - ((a.minNightFlow - a.baselineMNF) / a.baselineMNF)).map(z => {
          const delta = (z.minNightFlow - z.baselineMNF).toFixed(2);
          const pct = ((z.minNightFlow - z.baselineMNF) / z.baselineMNF * 100).toFixed(0);
          let rec = 'Continue baseline monitoring';
          if (pct > 100) rec = 'Critical — dispatch leak inspection team';
          else if (pct > 50) rec = 'High — schedule acoustic survey';
          else if (pct > 20) rec = 'Watch — extend night-flow analysis window';
          else if (pct < -10) rec = 'Investigate — possible meter under-reading';
          const cls = pct > 100 ? 'text-red-600' : pct > 50 ? 'text-orange-500' : pct > 20 ? 'text-amber-500' : 'text-emerald-500';
          return `<tr class="clickable" data-zone="${z.id}"><td><strong>${z.name}</strong><div class="text-slate-400 text-[10px]">${z.id}</div></td><td>${z.baselineMNF}</td><td><strong>${z.minNightFlow}</strong></td><td class="${cls}">${delta > 0 ? '+' : ''}${delta}</td><td class="${cls}"><strong>${pct > 0 ? '+' : ''}${pct}%</strong></td><td><span class="badge" style="background:${NRW.classificationColor(z.classification)}">${z.classification}</span></td><td class="text-slate-500">${rec}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>
  `;
  function drawMNF() {
    const zones = state.analytics.selectedZones.map(id => NRW.getZone(id)).filter(Boolean);
    Charts.mnfHeatmap('chart-an-mnf', zones);
  }
  drawMNF();
  root.querySelectorAll('[data-anal-zone]').forEach(cb => cb.addEventListener('change', () => {
    state.analytics.selectedZones = Array.from(root.querySelectorAll('[data-anal-zone]:checked')).map(c => c.dataset.analZone);
    drawMNF();
    renderIcons();
  }));
  root.querySelectorAll('[data-zone]').forEach(r => r.addEventListener('click', () => openZoneDrawer(r.dataset.zone)));
  renderIcons();
}

// ============ SCHEDULE ============
function renderSchedule(root) {
  const startDate = new Date('2026-06-01');
  const startDow = startDate.getDay();
  const days = [];
  for (let i = -startDow; i < 35 - startDow; i++) {
    const d = new Date(startDate); d.setDate(d.getDate() + i);
    days.push(d);
  }
  const woByDate = {};
  NRW.WORK_ORDERS.forEach(w => {
    const k = w.dueDate.slice(0, 10);
    (woByDate[k] = woByDate[k] || []).push(w);
  });
  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Work Order Calendar · June 2026</h3>
        <div class="flex gap-2 items-center">
          <button class="icon-btn" title="Previous month">${icon('chevron-left', 'w-4 h-4')}</button>
          <button class="icon-btn" title="Next month">${icon('chevron-right', 'w-4 h-4')}</button>
          <button class="btn-primary flex items-center gap-1.5" id="sched-new-wo">${icon('plus', 'w-3.5 h-3.5')} Jadwalkan WO</button>
        </div>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-7 gap-1.5 mb-2 text-[10px] uppercase tracking-wide text-slate-400 font-semibold text-center">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div>${d}</div>`).join('')}
        </div>
        <div class="cal-grid">${days.map(d => {
          const k = d.toISOString().slice(0, 10);
          const events = woByDate[k] || [];
          const otherMonth = d.getMonth() !== 5;
          const today = k === '2026-06-02';
          return `<div class="cal-day ${otherMonth ? 'other-month' : ''} ${today ? 'today' : ''}">
            <div class="cal-date"><span>${d.getDate()}</span>${events.length ? `<span class="text-[9px] text-slate-400">${events.length}</span>` : ''}</div>
            ${events.slice(0, 3).map(w => `<div class="cal-event" style="background:${NRW.statusColor(w.status)}22;color:${NRW.statusColor(w.status)};border-left:2px solid ${NRW.statusColor(w.status)}" data-wo="${w.id}" title="${w.title}">${w.id.slice(-4)} · ${w.title.slice(0, 16)}...</div>`).join('')}
            ${events.length > 3 ? `<div class="text-[9px] text-slate-400 px-1">+${events.length - 3} more</div>` : ''}
          </div>`;
        }).join('')}</div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header"><h3>Upcoming this week</h3></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>ID</th><th>Title</th><th>Due</th><th>Team</th><th>Priority</th></tr></thead>
          <tbody>${NRW.WORK_ORDERS.filter(w => { const d = new Date(w.dueDate); return d >= new Date('2026-06-02') && d < new Date('2026-06-09'); }).map(w => `
            <tr class="clickable" data-wo="${w.id}"><td><strong>${w.id}</strong></td><td>${w.title}</td><td>${NRW.formatDate(w.dueDate)}</td><td>${w.assignee || '-'}</td><td><span class="priority priority-${w.priority.toLowerCase()}">${w.priority}</span></td></tr>
          `).join('')}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Team workload</h3></div>
        <div class="p-3 space-y-2">${NRW.TEAMS.map(t => `
          <div class="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer" data-team="${t.id}">
            <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-600 grid place-items-center text-xs font-bold">${t.name.slice(-1)}</div>
            <div class="flex-1"><div class="text-xs font-medium">${t.name}</div><div class="text-[10px] text-slate-400">${t.lead} · ${t.region}</div></div>
            <div class="bar w-24"><div class="bar-fill ${t.activeWO > 2 ? 'bad' : t.activeWO > 1 ? 'warn' : 'good'}" style="width:${Math.min(t.activeWO * 33, 100)}%"></div></div>
            <div class="text-xs font-semibold">${t.activeWO} WO</div>
          </div>
        `).join('')}</div>
      </div>
    </div>
  `;
  document.getElementById('sched-new-wo').addEventListener('click', () => openCreateWOModal());
  root.querySelectorAll('[data-wo]').forEach(b => b.addEventListener('click', () => openWorkOrderDrawer(b.dataset.wo)));
  root.querySelectorAll('[data-team]').forEach(b => b.addEventListener('click', () => openTeamDrawer(b.dataset.team)));
  renderIcons();
}

// ============ TEAMS ============
function renderTeams(root) {
  root.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex gap-2 items-center"><span class="chip">${NRW.TEAMS.length} teams</span><span class="chip">${NRW.TEAMS.reduce((s, t) => s + t.members, 0)} members total</span></div>
      <button class="btn-primary flex items-center gap-1.5" id="new-team-btn">${icon('plus', 'w-3.5 h-3.5')} Tambah Tim</button>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${NRW.TEAMS.map(t => {
        const wos = NRW.WORK_ORDERS.filter(w => w.assignee === t.name && !['Closed', 'Verified'].includes(w.status));
        return `<div class="card clickable hover:shadow-md transition-shadow" data-team="${t.id}">
          <div class="card-header">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-sky-100 text-sky-600 grid place-items-center font-bold">${t.name.slice(-1)}</div>
              <div><h3>${t.name}</h3><div class="text-slate-400 text-[11px] mt-0.5">Lead: ${t.lead} · ${t.region}</div></div>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="chip ${t.status === 'active' ? 'chip-success' : ''}">${t.status}</span>
              <button class="row-action" data-edit-team="${t.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button>
              <button class="row-action danger" data-delete-team="${t.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button>
            </div>
          </div>
          <div class="p-4 grid grid-cols-3 gap-3">
            <div><div class="text-[10px] text-slate-400 uppercase">Members</div><div class="text-lg font-bold">${t.members}</div></div>
            <div><div class="text-[10px] text-slate-400 uppercase">Active WO</div><div class="text-lg font-bold">${t.activeWO}</div></div>
            <div><div class="text-[10px] text-slate-400 uppercase">Region</div><div class="text-xs font-medium mt-1">${t.region}</div></div>
          </div>
          <div class="px-4 pb-3"><div class="text-[10px] text-slate-400 uppercase mb-1.5">Specialties</div>
            <div class="flex gap-1.5 flex-wrap">${t.specialties.map(s => `<span class="chip">${s}</span>`).join('')}</div>
          </div>
          <div class="px-4 pb-4 border-t border-slate-200 pt-3">
            <div class="text-[10px] text-slate-400 uppercase mb-1.5">Current assignments (${wos.length})</div>
            ${wos.length ? wos.map(w => `<div class="text-xs py-1.5 px-2 bg-slate-50 rounded mb-1"><strong>${w.id}</strong> · ${w.title} <span class="badge ml-1" style="background:${NRW.statusColor(w.status)}">${w.status}</span></div>`).join('') : '<div class="text-xs text-slate-400">No active work orders</div>'}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  root.querySelectorAll('[data-team]').forEach(c => c.addEventListener('click', () => openTeamDrawer(c.dataset.team)));
  root.querySelectorAll('[data-edit-team]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openTeamFormModal(NRW.TEAMS.find(t => t.id === b.dataset.editTeam)); }));
  root.querySelectorAll('[data-delete-team]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteTeam(b.dataset.deleteTeam); }));
  document.getElementById('new-team-btn').addEventListener('click', () => openTeamFormModal());
  renderIcons();
}

// ============ HARDWARE (LIVE) ============
function renderHardware(root) {
  const s = getStats();
  const tickSec = (getTickRate() / 1000).toFixed(0);
  root.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Devices online', `${s.onlineDev}/${s.totalDev}`, 'telemetric RIO units', s.onlineDev === s.totalDev ? 'good' : 'warn', 'cpu')}
      ${kpiCard('Sensors streaming', `${s.onlineSnr}/${s.totalSnr}`, 'live telemetry', s.onlineSnr > s.totalSnr * 0.9 ? 'good' : 'warn', 'radio-tower')}
      ${kpiCard('Throughput', `${s.msgsPerMin}/min`, `~${tickSec}s tick interval`, 'info', 'activity')}
      ${kpiCard('Avg latency', `${s.avgLatency}ms`, 'MQTT round trip', s.avgLatency < 200 ? 'good' : 'warn', 'gauge')}
      ${kpiCard('OTA pending', s.otaPending, 'devices with updates available', s.otaPending ? 'warn' : 'good', 'download')}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-3"><h3>Live device grid</h3><span class="live-pill"><span class="live-dot"></span><span id="hw-tick-counter"><strong>${s.msgsPerMin}</strong>/min · avg latency <strong>${s.avgLatency}ms</strong></span></span></div>
          <div class="flex items-center gap-2"><span class="chip">${NRW.DEVICES.length} devices</span><button class="btn-primary flex items-center gap-1.5" id="new-device-btn">${icon('plus', 'w-3.5 h-3.5')} Daftar Device</button></div>
        </div>
        <div class="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          ${NRW.DEVICES.map(d => deviceTile(d)).join('')}
        </div>
      </div>
      <div class="card flex flex-col">
        <div class="card-header">
          <div class="flex items-center gap-3"><h3>Telemetry stream</h3><span class="live-pill"><span class="live-dot"></span>MQTT</span></div>
          <button class="chip" id="hw-clear-stream">Clear</button>
        </div>
        <div class="stream-console h-[440px]" id="stream-console">
          ${getStream().slice(0, 40).map(m => {
            const ts = new Date(m.ts).toTimeString().slice(0, 8);
            return `<div class="stream-row ${m.level === 'warn' ? 'warn' : m.level === 'error' ? 'error' : ''}"><span class="stream-ts">${ts}</span><span class="stream-tag">[${m.deviceId || m.sensorId}]</span><span>${m.text}</span></div>`;
          }).join('') || '<div class="text-slate-500">Waiting for telemetry…</div>'}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header">
          <h3>OTA campaigns</h3>
          <button class="btn-primary text-[11px] flex items-center gap-1.5">${icon('download', 'w-3 h-3')} New campaign</button>
        </div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>ID</th><th>Firmware</th><th>Status</th><th>Progress</th><th>Started</th></tr></thead>
          <tbody>${NRW.OTA_CAMPAIGNS.map(o => {
            const pct = Math.round((o.completed / o.targetDevices) * 100);
            const sc = o.status === 'completed' ? 'good' : o.status === 'in_progress' ? 'warn' : 'bad';
            return `<tr><td><strong>${o.id}</strong></td><td>${o.firmware}<div class="text-slate-400 text-[10px]">${o.name.split('—')[1]?.trim() || ''}</div></td><td><span class="badge" style="background:${o.status === 'completed' ? '#10b981' : o.status === 'in_progress' ? '#f59e0b' : '#94a3b8'}">${o.status.replace('_', ' ')}</span></td><td><div class="bar w-28"><div class="bar-fill ${sc}" style="width:${pct}%"></div></div><span class="text-slate-400 text-[11px]">${o.completed}/${o.targetDevices}${o.failed ? ` · ${o.failed} failed` : ''}</span></td><td>${NRW.formatDate(o.startedAt)}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Devices needing firmware update</h3><span class="chip">${s.otaPending} pending</span></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>Device</th><th>Current</th><th>Latest</th><th>Status</th><th></th></tr></thead>
          <tbody>${NRW.DEVICES.filter(d => d.updateAvailable).map(d => `
            <tr class="clickable" data-device="${d.id}">
              <td><strong>${d.id}</strong><div class="text-slate-400 text-[10px]">${d.location}</div></td>
              <td>${d.firmware}</td><td class="text-emerald-600">${d.latestFirmware}</td>
              <td><span class="badge" style="background:${d.otaStatus === 'idle' ? '#94a3b8' : '#3b82f6'}">${d.otaStatus}</span></td>
              <td><button class="link-btn" data-ota="${d.id}">Push OTA</button></td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      </div>
    </div>
  `;
  root.querySelectorAll('[data-device]').forEach(r => r.addEventListener('click', () => openDeviceDrawer(r.dataset.device)));
  root.querySelectorAll('[data-ota]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toast(`OTA push queued for ${b.dataset.ota} · v2.5.0`, 'info'); }));
  root.querySelectorAll('[data-edit-device]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openDeviceFormModal(NRW.getDevice(b.dataset.editDevice)); }));
  root.querySelectorAll('[data-delete-device]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteDevice(b.dataset.deleteDevice); }));
  document.getElementById('new-device-btn')?.addEventListener('click', () => openDeviceFormModal());
  document.getElementById('hw-clear-stream')?.addEventListener('click', () => { document.getElementById('stream-console').innerHTML = '<div class="text-slate-500">Stream cleared. New messages will appear here…</div>'; });
  renderIcons();
}

function deviceTile(d) {
  const statusColor = d.status === 'online' ? 'emerald' : d.status === 'warning' ? 'amber' : 'slate';
  const sensors = NRW.getDeviceSensors(d.id);
  return `
    <div class="device-tile ${d.status}" data-device="${d.id}">
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2"><span class="live-dot ${d.status !== 'online' ? (d.status === 'warning' ? 'warn' : 'bad') : ''}"></span><strong class="text-sm truncate">${d.id}</strong><span class="text-slate-400 text-[10px]">${d.firmware}</span></div>
          <div class="text-[11px] text-slate-500 mt-0.5 truncate">${d.location}</div>
        </div>
        <div class="flex items-center gap-1">
          ${d.updateAvailable ? `<span class="chip chip-success text-[9px]">${icon('download', 'w-2.5 h-2.5')} OTA</span>` : ''}
          <button class="row-action" data-edit-device="${d.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button>
          <button class="row-action danger" data-delete-device="${d.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-1.5 text-center">
        <div class="bg-slate-50 rounded p-1.5"><div class="text-[9px] text-slate-400 uppercase">Signal</div><div class="text-xs font-semibold">${d.signal}%</div></div>
        ${d.battery !== null ? `<div class="bg-slate-50 rounded p-1.5"><div class="text-[9px] text-slate-400 uppercase">Batt</div><div class="text-xs font-semibold">${d.battery}%</div></div>` : `<div class="bg-slate-50 rounded p-1.5"><div class="text-[9px] text-slate-400 uppercase">Power</div><div class="text-xs font-semibold">AC</div></div>`}
        <div class="bg-slate-50 rounded p-1.5"><div class="text-[9px] text-slate-400 uppercase">Lat</div><div class="text-xs font-semibold" data-live-device-latency="${d.id}">${d.latencyMs}ms</div></div>
        <div class="bg-slate-50 rounded p-1.5"><div class="text-[9px] text-slate-400 uppercase">Msg/h</div><div class="text-xs font-semibold">${d.msgsPerHour}</div></div>
      </div>
      <div class="flex flex-col gap-1 pt-1.5 border-t border-slate-100">
        <div class="text-[10px] text-slate-400 uppercase tracking-wide">${sensors.length} sensors</div>
        ${sensors.slice(0, 3).map(s => `<div class="sensor-mini"><span class="text-slate-600">${s.id} <span class="text-slate-400">${s.type}</span></span><span class="sensor-mini-value" data-live-sensor="${s.id}">${s.lastReading} ${s.unit}</span></div>`).join('')}
        ${sensors.length > 3 ? `<div class="text-[10px] text-slate-400 text-center">+${sensors.length - 3} more</div>` : ''}
      </div>
    </div>
  `;
}

function openDeviceDrawer(deviceId) {
  const d = NRW.getDevice(deviceId);
  if (!d) return;
  const sensors = NRW.getDeviceSensors(deviceId);
  const zone = NRW.getZone(d.zoneId);
  const color = d.status === 'online' ? '#10b981' : d.status === 'warning' ? '#f59e0b' : '#94a3b8';

  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid ${color}">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Telemetric Device</div>
        <h2 class="flex items-center gap-2"><span class="live-dot ${d.status !== 'online' ? (d.status === 'warning' ? 'warn' : 'bad') : ''}"></span>${d.id}</h2>
        <div class="text-slate-400 mt-0.5">${d.model}</div>
      </div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      <div class="px-4 py-3 border rounded-lg flex justify-between items-center gap-2.5 flex-wrap" style="background:${color}1a;border-color:${color}">
        <div class="flex items-center gap-2"><strong>${d.status.toUpperCase()}</strong> · ${d.connectivity} · ${d.firmware}</div>
        <div class="text-slate-500 text-xs">Last heartbeat: ${NRW.formatDateTime(d.lastHeartbeat)}</div>
      </div>

      <div class="grid grid-cols-4 gap-2">
        ${miniMetric('Zone', zone?.name || d.zoneId)}
        ${miniMetric('Location', d.location)}
        ${miniMetric('Power', d.powerSource.slice(0, 22))}
        ${miniMetric('IP rating', d.ipRating)}
        ${miniMetric('Connectivity', d.connectivity)}
        ${miniMetric('IP address', d.ipAddress)}
        ${miniMetric('MAC', d.macAddress)}
        ${miniMetric('Uptime', `${d.uptimeDays} days`)}
        ${miniMetric('Signal', `${d.signal}%`)}
        ${d.battery !== null ? miniMetric('Battery', `${d.battery}%`) : miniMetric('Power', 'Grid AC')}
        ${miniMetric('Latency', `<span data-live-device-latency="${d.id}">${d.latencyMs}ms</span>`)}
        ${miniMetric('Temperature', `${d.operatingTempC}°C`)}
      </div>

      <div>
        <h4 class="mb-2.5">Firmware & OTA</h4>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div class="text-xs"><strong>Current:</strong> ${d.firmware}</div>
            <div class="text-xs"><strong>Latest:</strong> <span class="text-emerald-600">${d.latestFirmware}</span> ${d.updateAvailable ? '<span class="badge ml-1" style="background:#f59e0b">update available</span>' : '<span class="badge ml-1" style="background:#10b981">up to date</span>'}</div>
            <div class="text-[11px] text-slate-500 mt-1">Installed ${NRW.formatDate(d.installedAt)} · OTA status: ${d.otaStatus}</div>
          </div>
          ${d.updateAvailable ? `<button class="btn-primary flex items-center gap-1.5" id="dev-push-ota">${icon('download', 'w-3.5 h-3.5')} Push v2.5.0</button>` : ''}
        </div>
      </div>

      <div>
        <h4 class="mb-2.5">Connected sensors (${sensors.length}) · live readings</h4>
        <table class="data-table compact">
          <thead><tr><th>ID</th><th>Type</th><th>Location</th><th>Status</th><th>Live reading</th><th>Battery</th><th>Signal</th></tr></thead>
          <tbody>${sensors.map(s => `
            <tr class="clickable" data-sensor="${s.id}">
              <td><strong>${s.id}</strong></td><td>${s.type}</td><td>${s.location}</td>
              <td><span class="badge" style="background:${s.status === 'online' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#94a3b8'}">${s.status}</span></td>
              <td><span class="font-mono font-semibold" data-live-sensor="${s.id}">${s.lastReading} ${s.unit}</span></td>
              <td><span data-live-battery="${s.id}">${s.battery}%</span></td>
              <td><span data-live-signal="${s.id}">${s.signalStrength}%</span></td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>

      <div>
        <h4 class="mb-2.5">Communication statistics</h4>
        <div class="grid grid-cols-3 gap-2">
          ${miniMetric('Msgs / hour', d.msgsPerHour.toLocaleString())}
          ${miniMetric('Error rate', `${(d.errorRate * 100).toFixed(2)}%`)}
          ${miniMetric('Avg latency', `<span data-live-device-latency="${d.id}">${d.latencyMs}ms</span>`)}
        </div>
      </div>

      <div>
        <h4 class="mb-2.5">Recent heartbeat log</h4>
        <div class="stream-console h-40 rounded-md" id="dev-heartbeat-log">
          ${getStream().filter(m => m.deviceId === d.id).slice(0, 20).map(m => {
            const ts = new Date(m.ts).toTimeString().slice(0, 8);
            return `<div class="stream-row"><span class="stream-ts">${ts}</span><span class="stream-tag">[${d.id}]</span><span>${m.text}</span></div>`;
          }).join('') || '<div class="text-slate-500">No heartbeat data yet…</div>'}
        </div>
      </div>
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end">
      <button class="btn-secondary" data-close>Close</button>
      <button class="btn-secondary flex items-center gap-1.5" id="dev-edit">${icon('pencil', 'w-3.5 h-3.5')} Edit</button>
      <button class="btn-danger flex items-center gap-1.5" id="dev-delete">${icon('trash-2', 'w-3.5 h-3.5')} Delete</button>
      <button class="btn-primary flex items-center gap-1.5">${icon('refresh-cw', 'w-3.5 h-3.5')} Restart device</button>
    </div>
  `, { kind: 'device', id: deviceId });
  document.getElementById('dev-edit').addEventListener('click', () => openDeviceFormModal(d));
  document.getElementById('dev-delete').addEventListener('click', () => deleteDevice(deviceId));

  document.querySelectorAll('#drawer [data-sensor]').forEach(r => r.addEventListener('click', () => openSensorDrawer(r.dataset.sensor)));
  document.getElementById('dev-push-ota')?.addEventListener('click', () => { d.otaStatus = 'queued'; toast(`OTA v2.5.0 queued for ${d.id}`, 'success'); openDeviceDrawer(deviceId); });
}

// ============ DRAWERS ============
function openDrawer(html, meta) {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  drawer.innerHTML = html;
  drawer.classList.add('open');
  backdrop.classList.add('open');
  lastDrawer = meta || null;
  drawer.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeDrawer));
  renderIcons();
}

function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawer-backdrop')?.classList.remove('open');
  lastDrawer = null;
  ['drawer-flow','drawer-pressure','drawer-mnf','drawer-sensor-trend','drawer-suspicion','drawer-cust-consumption'].forEach(id => Charts.destroyChart(id));
}

function miniMetric(label, value, color) {
  return `<div class="mini-metric"><div class="text-slate-400 text-[10px] uppercase tracking-wide">${label}</div><div class="font-bold text-[15px] mt-1" ${color ? `style="color:${color}"` : ''}>${value}</div></div>`;
}

function openZoneDrawer(zoneId) {
  const z = NRW.getZone(zoneId);
  if (!z) return;
  const sensors = NRW.getZoneSensors(zoneId);
  const wos = NRW.getZoneWorkOrders(zoneId);
  const interventions = NRW.getZoneInterventions(zoneId);
  const alarms = NRW.getZoneAlarms(zoneId).filter(a => a.status === 'active');
  const customers = NRW.getZoneCustomers(zoneId);
  const color = NRW.classificationColor(z.classification);
  const lossM3 = z.inputVolume - z.billedVolume;

  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid ${color}">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Zone Detail</div>
        <h2>${z.name}</h2>
        <div class="text-slate-400 mt-0.5">${z.id} · ${z.region} · ${z.type}</div>
      </div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      <div class="px-4 py-3 border rounded-lg flex justify-between items-center gap-2.5 flex-wrap" style="background:${color}1a;border-color:${color}">
        <div><strong>${z.classification} risk</strong> · Suspicion score ${z.suspicionScore}/100</div>
        <div class="text-slate-500">Last intervention: ${NRW.formatDate(z.lastIntervention)}</div>
      </div>
      <div class="grid grid-cols-4 gap-2">
        ${miniMetric('Customers', z.customers.toLocaleString())}
        ${miniMetric('Sensors', `${sensors.filter(s => s.status === 'online').length}/${sensors.length}`)}
        ${miniMetric('Input volume', NRW.formatM3(z.inputVolume))}
        ${miniMetric('Billed', NRW.formatM3(z.billedVolume))}
        ${miniMetric('NRW %', `${z.nrwPercent}%`, color)}
        ${miniMetric('Est. loss value', NRW.formatIDR(lossM3 * 5000))}
        ${miniMetric('MNF current', `${z.minNightFlow} L/s`)}
        ${miniMetric('MNF baseline', `${z.baselineMNF} L/s`)}
        ${miniMetric('Avg pressure', `${z.avgPressure} bar`)}
        ${miniMetric('Pressure stab.', `${(z.pressureStability * 100).toFixed(0)}%`)}
      </div>
      <div>
        <h4 class="mb-2.5">Suspicion score breakdown · weighted contribution</h4>
        <div class="relative" style="height:200px"><canvas id="drawer-suspicion"></canvas></div>
      </div>
      <div><h4 class="mb-2.5">Minimum Night Flow · last 30 days</h4><div class="relative" style="height:200px"><canvas id="drawer-mnf"></canvas></div></div>
      <div>
        <h4 class="mb-2.5">Flow & pressure · last 7 days</h4>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="relative" style="height:180px"><canvas id="drawer-flow"></canvas></div>
          <div class="relative" style="height:180px"><canvas id="drawer-pressure"></canvas></div>
        </div>
      </div>
      ${alarms.length ? `<div><h4 class="mb-2.5">Active alarms (${alarms.length})</h4>${alarms.map(a => `<div class="flex gap-3 p-2.5 rounded-md bg-slate-50 mb-1.5 items-start"><span class="badge" style="background:${NRW.severityColor(a.severity)}">${a.severity}</span><div><div><strong>${a.type.replace(/_/g, ' ')}</strong> — ${a.message}</div><div class="text-slate-400 text-[11px] mt-0.5">${a.id} · ${NRW.timeAgo(a.triggeredAt)}</div></div></div>`).join('')}</div>` : ''}
      ${wos.length ? `<div><h4 class="mb-2.5">Work orders (${wos.length})</h4><table class="data-table compact"><thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th></tr></thead><tbody>${wos.map(w => `<tr class="clickable" data-wo="${w.id}"><td><strong>${w.id}</strong></td><td>${w.title}</td><td><span class="badge" style="background:${NRW.statusColor(w.status)}">${NRW.formatStatus(w.status)}</span></td><td>${w.priority}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${interventions.length ? `<div><h4 class="mb-2.5">Past interventions (${interventions.length})</h4>${interventions.map(i => `<div class="flex justify-between p-2.5 rounded-md bg-slate-50 mb-1.5 items-start flex-wrap gap-2.5 cursor-pointer hover:bg-sky-50" data-intervention="${i.id}"><div><strong>${i.type}</strong><div class="text-slate-400 text-[11px] mt-0.5">${NRW.formatDate(i.completedAt)} · ${i.id}</div></div><div class="flex gap-3.5 text-xs items-center flex-wrap"><span class="text-emerald-600">−${i.mnfReduction} L/s MNF</span><span>${NRW.formatM3(i.waterRecoveredM3)}</span><span>${NRW.formatIDR(i.revenueRecoveredIDR)}</span></div></div>`).join('')}</div>` : ''}
      <div><h4 class="mb-2.5">Sensors in zone (${sensors.length})</h4><table class="data-table compact"><thead><tr><th>ID</th><th>Type</th><th>Location</th><th>Status</th><th>Reading</th></tr></thead><tbody>${sensors.map(s => `<tr class="clickable" data-sensor="${s.id}"><td><strong>${s.id}</strong></td><td>${s.type}</td><td>${s.location}</td><td><span class="badge" style="background:${s.status === 'online' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#94a3b8'}">${s.status}</span></td><td>${s.lastReading} ${s.unit}</td></tr>`).join('')}</tbody></table></div>
      ${customers.length ? `<div><h4 class="mb-2.5">Sample customers (${customers.length} total)</h4><table class="data-table compact"><thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Avg / Last</th><th>Anomalies</th></tr></thead><tbody>${customers.slice(0, 5).map(c => `<tr class="clickable" data-customer="${c.id}"><td><strong>${c.id}</strong></td><td>${c.name}</td><td>${c.type}</td><td>${c.avgMonthly} / ${c.lastReading}</td><td>${c.anomalies.map(a => `<span class="badge" style="background:${a.severity === 'high' ? '#dc2626' : '#f59e0b'}">${a.label}</span>`).join(' ') || '<span class="text-slate-400 text-[11px]">none</span>'}</td></tr>`).join('')}</tbody></table>${customers.length > 5 ? `<div class="text-center mt-2"><a href="#/customers" class="text-xs text-sky-500" data-close>View all ${customers.length} customers ${icon('arrow-right', 'w-3 h-3 inline')}</a></div>` : ''}</div>` : ''}
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end">
      <button class="btn-secondary" data-close>Close</button>
      <button class="btn-secondary flex items-center gap-1.5" id="zone-edit">${icon('pencil', 'w-3.5 h-3.5')} Edit</button>
      <button class="btn-danger flex items-center gap-1.5" id="zone-delete">${icon('trash-2', 'w-3.5 h-3.5')} Delete</button>
      <button class="btn-primary flex items-center gap-1.5" id="zone-create-wo">${icon('plus', 'w-3.5 h-3.5')} Create Work Order</button>
    </div>
  `, { kind: 'zone', id: zoneId });
  document.getElementById('zone-edit')?.addEventListener('click', () => openZoneFormModal(z));
  document.getElementById('zone-delete')?.addEventListener('click', () => deleteZone(zoneId));
  Charts.suspicionFactors('drawer-suspicion', NRW.suspicionBreakdown(z));
  Charts.mnfTrend('drawer-mnf', zoneId);
  Charts.flowProfile('drawer-flow', zoneId);
  Charts.pressureProfile('drawer-pressure', zoneId);
  document.querySelectorAll('#drawer [data-wo]').forEach(r => r.addEventListener('click', () => openWorkOrderDrawer(r.dataset.wo)));
  document.querySelectorAll('#drawer [data-sensor]').forEach(r => r.addEventListener('click', () => openSensorDrawer(r.dataset.sensor)));
  document.querySelectorAll('#drawer [data-intervention]').forEach(r => r.addEventListener('click', () => openInterventionDrawer(r.dataset.intervention)));
  document.querySelectorAll('#drawer [data-customer]').forEach(r => r.addEventListener('click', () => openCustomerDrawer(r.dataset.customer)));
  document.getElementById('zone-create-wo').addEventListener('click', () => openCreateWOModal({ zoneId }));
}

function evidenceIcon(type) {
  if (type === 'photo') return icon('camera', 'w-7 h-7 text-sky-500');
  if (type === 'gps') return icon('map-pin', 'w-7 h-7 text-red-500');
  return icon('file-text', 'w-7 h-7 text-slate-500');
}

function openWorkOrderDrawer(woId) {
  const w = NRW.getWorkOrder(woId);
  if (!w) return;
  const zone = NRW.getZone(w.zoneId);
  const intervention = NRW.INTERVENTIONS.find(i => i.workOrderId === w.id);
  const canAct = !['Closed', 'Verified', 'Rejected'].includes(w.status);

  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid ${NRW.statusColor(w.status)}">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Work Order</div>
        <h2>${w.title}</h2>
        <div class="text-slate-400 mt-0.5">${w.id} · Created ${NRW.formatDateTime(w.createdAt)} by ${w.createdBy}</div>
      </div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      <div class="flex gap-2 items-center flex-wrap">
        <span class="priority priority-${w.priority.toLowerCase()}">${w.priority}</span>
        <span class="badge" style="background:${NRW.statusColor(w.status)}">${NRW.formatStatus(w.status)}</span>
        <span class="text-slate-500">${w.type}</span>
        ${canAct ? `<div class="flex-1"></div><button class="btn-secondary text-[11px] flex items-center gap-1.5" id="wo-add-note">${icon('message-square', 'w-3 h-3')} Add note</button><button class="btn-secondary text-[11px] flex items-center gap-1.5" id="wo-add-evidence">${icon('paperclip', 'w-3 h-3')} Add evidence</button><select class="select-input text-[11px]" id="wo-change-status"><option value="">Change status...</option><option value="Assigned">Assigned</option><option value="InProgress">In Progress</option><option value="PendingEvidence">Pending Evidence</option><option value="Completed">Completed</option><option value="Verified">Verified</option><option value="Rejected">Rejected</option><option value="Closed">Closed</option></select>` : ''}
      </div>
      <div class="grid grid-cols-4 gap-2">
        ${miniMetric('Zone', zone?.name || w.zoneId)}
        ${miniMetric('Assignee', w.assignee || 'unassigned')}
        ${miniMetric('Due date', NRW.formatDate(w.dueDate))}
        ${miniMetric('Suspicion score', `${w.suspicionScore}/100`)}
        ${miniMetric('Est. water recovery', w.estRecoveryM3 ? NRW.formatM3(w.estRecoveryM3) : '-')}
        ${miniMetric('Est. revenue', w.estRecoveryIDR ? NRW.formatIDR(w.estRecoveryIDR) : '-')}
        ${w.actualRecoveryM3 ? miniMetric('Actual water rec.', NRW.formatM3(w.actualRecoveryM3), '#10b981') : ''}
        ${w.actualRecoveryIDR ? miniMetric('Actual revenue rec.', NRW.formatIDR(w.actualRecoveryIDR), '#10b981') : ''}
      </div>
      <div><h4 class="mb-2.5">Description</h4><p class="text-slate-600 text-[13px] leading-relaxed">${w.description}</p></div>
      <div>
        <h4 class="mb-2.5">Activity timeline</h4>
        <div class="timeline">${w.updates.map(u => `
          <div class="timeline-item"><div class="timeline-dot"></div>
            <div><div class="flex justify-between gap-3"><strong>${u.action}</strong><span class="text-slate-400 text-[11px]">${NRW.formatDateTime(u.ts)} · ${u.user}</span></div>${u.note ? `<div class="text-slate-500 text-xs mt-1">${u.note}</div>` : ''}</div>
          </div>`).join('')}</div>
      </div>
      ${w.evidence.length ? `<div><h4 class="mb-2.5">Field evidence (${w.evidence.length})</h4><div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">${w.evidence.map(e => `<div class="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden"><div class="h-20 grid place-items-center bg-sky-50">${evidenceIcon(e.type)}</div><div class="p-2 text-[11px]"><div><strong>${e.label}</strong></div><div class="text-slate-400 text-[10px] mt-0.5">${e.type} · ${NRW.formatDateTime(e.ts)}</div></div></div>`).join('')}</div></div>` : ''}
      ${intervention ? `<div><h4 class="mb-2.5">Linked intervention outcome</h4><div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 cursor-pointer hover:bg-sky-50" data-intervention="${intervention.id}"><div class="flex justify-between flex-wrap gap-2.5"><div><strong>${intervention.type}</strong><div class="text-slate-400 text-[11px] mt-0.5">${intervention.id} · ${NRW.formatDate(intervention.completedAt)}</div></div><div class="flex gap-3.5 text-xs items-center flex-wrap"><span>Pre: ${intervention.preActionMNF}</span><span>Post: ${intervention.postActionMNF}</span><span class="text-emerald-600">−${intervention.mnfReduction} L/s</span></div></div><div class="flex gap-3.5 text-xs items-center flex-wrap pt-2"><span>Water: ${NRW.formatM3(intervention.waterRecoveredM3)}</span><span>Revenue: ${NRW.formatIDR(intervention.revenueRecoveredIDR)}</span><span>Effectiveness: ${intervention.effectiveness}%</span></div></div></div>` : ''}
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end">
      <button class="btn-secondary" data-close>Close</button>
      <button class="btn-secondary flex items-center gap-1.5" id="wo-edit">${icon('pencil', 'w-3.5 h-3.5')} Edit</button>
      <button class="btn-danger flex items-center gap-1.5" id="wo-delete">${icon('trash-2', 'w-3.5 h-3.5')} Cancel WO</button>
      ${zone ? `<button class="btn-secondary flex items-center gap-1.5" data-zone="${zone.id}">${icon('hexagon', 'w-3.5 h-3.5')} Open zone</button>` : ''}
    </div>
  `, { kind: 'wo', id: woId });
  document.getElementById('wo-edit')?.addEventListener('click', () => openEditWOModal(woId));
  document.getElementById('wo-delete')?.addEventListener('click', () => deleteWO(woId));

  document.querySelectorAll('#drawer [data-zone]').forEach(b => b.addEventListener('click', () => openZoneDrawer(b.dataset.zone)));
  document.querySelectorAll('#drawer [data-intervention]').forEach(b => b.addEventListener('click', () => openInterventionDrawer(b.dataset.intervention)));

  const addNoteBtn = document.getElementById('wo-add-note');
  if (addNoteBtn) addNoteBtn.addEventListener('click', () => openAddNoteModal(w.id));
  const addEvBtn = document.getElementById('wo-add-evidence');
  if (addEvBtn) addEvBtn.addEventListener('click', () => openAddEvidenceModal(w.id));
  const statusSelect = document.getElementById('wo-change-status');
  if (statusSelect) statusSelect.addEventListener('change', e => {
    const v = e.target.value;
    if (!v) return;
    State.updateWorkOrderStatus(w.id, v);
    toast(`Work order ${w.id} → ${v}`, 'success');
  });
}

function openSensorDrawer(sensorId) {
  const s = NRW.getSensor(sensorId);
  if (!s) return;
  const zone = NRW.getZone(s.zoneId);
  const color = s.status === 'online' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#94a3b8';
  const ts = NRW.generateTimeseries(s.zoneId, 7);

  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid ${color}">
      <div><div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Sensor Detail</div><h2>${s.id}</h2><div class="text-slate-400 mt-0.5">${s.type.toUpperCase()} · ${s.location} · ${zone?.name || s.zoneId}</div></div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      <div class="px-4 py-3 border rounded-lg flex justify-between items-center gap-2.5 flex-wrap" style="background:${color}1a;border-color:${color}">
        <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background:${color}"></span><strong>${s.status.toUpperCase()}</strong> · Last reading ${s.lastReading} ${s.unit}</div>
        <div class="text-slate-500">${NRW.formatDateTime(s.lastReadingTime)}</div>
      </div>
      <div class="grid grid-cols-3 gap-2">${miniMetric('Type', s.type.toUpperCase())}${miniMetric('Zone', zone?.name || s.zoneId)}${miniMetric('Location', s.location)}${miniMetric('Installed', NRW.formatDate(s.installedAt))}${miniMetric('Battery', `${s.battery}%`)}${miniMetric('Signal', `${s.signalStrength}%`)}</div>
      <div><h4 class="mb-2.5">${s.type.charAt(0).toUpperCase() + s.type.slice(1)} reading · last 7 days</h4><div class="relative" style="height:220px"><canvas id="drawer-sensor-trend"></canvas></div></div>
      <div><h4 class="mb-2.5">Sensor health</h4>
        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-[110px_1fr] items-center gap-3 text-xs text-slate-600"><span>Battery</span>${batteryBar(s.battery)}</div>
          <div class="grid grid-cols-[110px_1fr] items-center gap-3 text-xs text-slate-600"><span>Signal</span>${signalBar(s.signalStrength)}</div>
          <div class="grid grid-cols-[110px_1fr] items-center gap-3 text-xs text-slate-600"><span>Data quality</span>${batteryBar(s.status === 'online' ? 95 : s.status === 'warning' ? 60 : 0)}</div>
        </div>
      </div>
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end">
      <button class="btn-secondary" data-close>Close</button>
      <button class="btn-secondary flex items-center gap-1.5" id="snr-edit">${icon('pencil', 'w-3.5 h-3.5')} Edit</button>
      <button class="btn-danger flex items-center gap-1.5" id="snr-delete">${icon('trash-2', 'w-3.5 h-3.5')} Delete</button>
      <button class="btn-primary" id="snr-create-wo">Schedule maintenance</button>
    </div>
  `, { kind: 'sensor', id: sensorId });
  document.getElementById('snr-edit')?.addEventListener('click', () => openSensorFormModal(s));
  document.getElementById('snr-delete')?.addEventListener('click', () => deleteSensor(sensorId));

  const ds = s.type === 'flow'
    ? { label: 'Flow (L/s)', data: ts.flow.map(p => p.v), color: '#0ea5e9' }
    : s.type === 'pressure'
    ? { label: 'Pressure (bar)', data: ts.pressure.map(p => p.v), color: '#0369a1' }
    : { label: 'Noise level (dB)', data: ts.flow.map(p => 30 + p.v * 0.8), color: '#a855f7' };

  Charts.customChart('drawer-sensor-trend', {
    type: 'line',
    data: { labels: ts.flow.map(p => p.t), datasets: [{ label: ds.label, data: ds.data, borderColor: ds.color, backgroundColor: ds.color + '22', fill: true, tension: 0.2, borderWidth: 1.5, pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 10 } }, y: { grid: { color: 'rgba(148,163,184,0.2)' } } } }
  });

  document.getElementById('snr-create-wo')?.addEventListener('click', () => {
    openCreateWOModal({ zoneId: s.zoneId, type: 'Maintenance', title: `Maintenance for sensor ${s.id}`, description: `Routine maintenance for ${s.type} sensor ${s.id} at ${s.location}.` });
  });
}

function openInterventionDrawer(interventionId) {
  const i = NRW.INTERVENTIONS.find(x => x.id === interventionId);
  if (!i) return;
  const zone = NRW.getZone(i.zoneId);
  const wo = NRW.getWorkOrder(i.workOrderId);
  const improvementPct = ((i.mnfReduction / i.preActionMNF) * 100).toFixed(1);

  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid #10b981">
      <div><div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Intervention Outcome</div><h2>${i.type}</h2><div class="text-slate-400 mt-0.5">${i.id} · ${zone?.name || i.zoneId} · Completed ${NRW.formatDate(i.completedAt)}</div></div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      <div class="px-4 py-3 border rounded-lg flex justify-between items-center gap-2.5 flex-wrap" style="background:#10b9811a;border-color:#10b981">
        <div class="flex items-center gap-2">${icon('check', 'w-4 h-4 text-emerald-600')}<strong>${i.effectiveness}% effectiveness</strong> · ${improvementPct}% MNF reduction achieved</div>
        <div class="text-slate-500">Recovered ${NRW.formatM3(i.waterRecoveredM3)} · ${NRW.formatIDR(i.revenueRecoveredIDR)}</div>
      </div>
      <div>
        <h4 class="mb-2.5">Before vs after</h4>
        <div class="flex gap-2 items-stretch flex-wrap">
          <div class="ba-card"><div class="text-slate-400 text-[11px] uppercase">Pre-action</div><div class="text-2xl font-bold mt-1">${i.preActionMNF}</div><div class="text-[11px] text-slate-500 mt-0.5">L/s MNF</div></div>
          <div class="ba-arrow">${icon('arrow-right', 'w-5 h-5')}</div>
          <div class="ba-card bg-emerald-50 border-emerald-200"><div class="text-slate-400 text-[11px] uppercase">Post-action</div><div class="text-2xl font-bold mt-1">${i.postActionMNF}</div><div class="text-[11px] text-slate-500 mt-0.5">L/s MNF</div></div>
          <div class="ba-arrow">=</div>
          <div class="ba-card bg-cyan-50 border-cyan-200"><div class="text-slate-400 text-[11px] uppercase">Reduction</div><div class="text-2xl font-bold mt-1">−${i.mnfReduction}</div><div class="text-[11px] text-slate-500 mt-0.5">L/s · ${improvementPct}%</div></div>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-2">${miniMetric('Water recovered', NRW.formatM3(i.waterRecoveredM3), '#10b981')}${miniMetric('Revenue recovered', NRW.formatIDR(i.revenueRecoveredIDR), '#10b981')}${miniMetric('Effectiveness', `${i.effectiveness}%`, '#10b981')}${miniMetric('Linked WO', i.workOrderId)}</div>
      ${wo ? `<div><h4 class="mb-2.5">Source work order</h4><div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 cursor-pointer hover:bg-sky-50" data-wo="${wo.id}"><div><strong>${wo.title}</strong></div><div class="text-slate-400 text-[11px] mt-0.5">${wo.id} · ${wo.assignee} · ${wo.priority} priority</div><div class="text-slate-400 text-[11px] mt-1.5">${wo.description}</div></div></div>` : ''}
      <div><h4 class="mb-2.5">Methodology</h4><ul class="pl-4 list-disc text-slate-600 text-xs space-y-1"><li>Pre-action baseline taken from 30-day moving average prior to ${NRW.formatDate(i.completedAt)}</li><li>Post-action measurement taken 7 days after intervention closure</li><li>Water recovered = (MNF reduction L/s × 86,400 s/day × 30 days) / 1,000</li><li>Revenue estimated at Rp 5,000 / m³ blended tariff</li><li>Effectiveness % = MNF reduction / pre-action MNF × 100</li></ul></div>
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end"><button class="btn-secondary" data-close>Close</button><button class="btn-secondary flex items-center gap-1.5" onclick="window.print()">${icon('printer', 'w-3.5 h-3.5')} Print</button></div>
  `, { kind: 'intervention', id: interventionId });
  document.querySelectorAll('#drawer [data-wo]').forEach(b => b.addEventListener('click', () => openWorkOrderDrawer(b.dataset.wo)));
}

function openCustomerDrawer(customerId) {
  const c = NRW.getCustomer(customerId);
  if (!c) return;
  const zone = NRW.getZone(c.zoneId);
  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid ${c.riskScore > 50 ? '#dc2626' : c.riskScore > 20 ? '#f59e0b' : '#10b981'}">
      <div><div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Customer Detail</div><h2>${c.name}</h2><div class="text-slate-400 mt-0.5">${c.id} · ${c.type} · ${zone?.name || c.zoneId}</div></div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      ${c.anomalies.length ? `<div class="px-4 py-3 border border-red-200 bg-red-50 rounded-lg"><div class="text-xs font-semibold text-red-700 mb-1.5">${c.anomalies.length} anomaly flag(s) — risk score ${c.riskScore}/100</div>${c.anomalies.map(a => `<div class="text-xs text-slate-700 flex items-center gap-2 mt-0.5"><span class="badge" style="background:${a.severity === 'high' ? '#dc2626' : a.severity === 'medium' ? '#f59e0b' : '#94a3b8'}">${a.severity}</span>${a.label}</div>`).join('')}</div>` : `<div class="px-4 py-3 border border-emerald-200 bg-emerald-50 rounded-lg text-xs text-slate-700 flex items-center gap-2">${icon('check', 'w-4 h-4 text-emerald-600')} No anomalies detected — risk score ${c.riskScore}/100</div>`}
      <div class="grid grid-cols-4 gap-2">${miniMetric('Customer ID', c.id)}${miniMetric('Type', c.type)}${miniMetric('Meter ID', c.meterId)}${miniMetric('Meter age', `${c.meterAge} y`)}${miniMetric('Avg monthly', `${c.avgMonthly} m³`)}${miniMetric('Last reading', `${c.lastReading} m³`)}${miniMetric('Last read date', NRW.formatDate(c.lastReadingDate))}${miniMetric('Risk score', `${c.riskScore}/100`, c.riskScore > 50 ? '#dc2626' : c.riskScore > 20 ? '#f59e0b' : '#10b981')}</div>
      <div><h4 class="mb-2.5">12-month consumption history</h4><div class="relative" style="height:200px"><canvas id="drawer-cust-consumption"></canvas></div></div>
      <div><h4 class="mb-2.5">Billing & meter timeline</h4><div class="timeline">
        <div class="timeline-item"><div class="timeline-dot"></div><div><div class="flex justify-between gap-3"><strong>Meter installed</strong><span class="text-slate-400 text-[11px]">${NRW.formatDate(c.installedAt)}</span></div><div class="text-slate-500 text-xs mt-1">${c.meterId} · ${c.meterAge} years in service</div></div></div>
        ${c.meterAge > 10 ? `<div class="timeline-item"><div class="timeline-dot" style="background:#f59e0b;box-shadow:0 0 0 2px #f59e0b"></div><div><div class="flex justify-between gap-3"><strong>Replacement candidate</strong><span class="text-slate-400 text-[11px]">flagged 2026-04-01</span></div><div class="text-slate-500 text-xs mt-1">Meter age exceeds 10-year recommended replacement window.</div></div></div>` : ''}
        ${c.anomalies.length ? `<div class="timeline-item"><div class="timeline-dot" style="background:#dc2626;box-shadow:0 0 0 2px #dc2626"></div><div><div class="flex justify-between gap-3"><strong>Anomaly detected</strong><span class="text-slate-400 text-[11px]">${NRW.formatDate(c.lastReadingDate)}</span></div><div class="text-slate-500 text-xs mt-1">${c.anomalies.map(a => a.label).join('; ')}</div></div></div>` : ''}
      </div></div>
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end">
      <button class="btn-secondary" data-close>Close</button>
      <button class="btn-secondary flex items-center gap-1.5" id="cust-edit">${icon('pencil', 'w-3.5 h-3.5')} Edit</button>
      <button class="btn-danger flex items-center gap-1.5" id="cust-delete">${icon('trash-2', 'w-3.5 h-3.5')} Delete</button>
      ${c.anomalies.length ? `<button class="btn-primary flex items-center gap-1.5" id="cust-create-wo">${icon('plus', 'w-3.5 h-3.5')} Create audit WO</button>` : ''}
    </div>
  `, { kind: 'customer', id: customerId });
  document.getElementById('cust-edit')?.addEventListener('click', () => openCustomerFormModal(c));
  document.getElementById('cust-delete')?.addEventListener('click', () => deleteCustomer(customerId));
  Charts.customerConsumption('drawer-cust-consumption', c.history);
  document.getElementById('cust-create-wo')?.addEventListener('click', () => {
    openCreateWOModal({ zoneId: c.zoneId, type: 'Commercial', priority: 'Medium', title: `Customer audit — ${c.name}`, description: `Verify consumption pattern and meter condition for ${c.name} (${c.id}). Flags: ${c.anomalies.map(a => a.label).join(', ')}.` });
  });
}

function openTeamDrawer(teamId) {
  const t = NRW.TEAMS.find(x => x.id === teamId);
  if (!t) return;
  const wos = NRW.WORK_ORDERS.filter(w => w.assignee === t.name);
  const open = wos.filter(w => !['Closed', 'Verified'].includes(w.status));
  const completed = wos.filter(w => ['Closed', 'Verified'].includes(w.status));

  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid #0ea5e9">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-sky-100 text-sky-600 grid place-items-center text-2xl font-bold">${t.name.slice(-1)}</div>
        <div><div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Field Team</div><h2>${t.name}</h2><div class="text-slate-400 mt-0.5">Lead: ${t.lead} · ${t.region}</div></div>
      </div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      <div class="grid grid-cols-3 gap-2">${miniMetric('Team members', t.members)}${miniMetric('Open WO', open.length)}${miniMetric('Completed', completed.length)}</div>
      <div><h4 class="mb-2.5">Specialties</h4><div class="flex gap-1.5 flex-wrap">${t.specialties.map(s => `<span class="chip">${s}</span>`).join('')}</div></div>
      <div><h4 class="mb-2.5">Active work orders (${open.length})</h4>${open.length ? `<table class="data-table compact"><thead><tr><th>ID</th><th>Title</th><th>Due</th><th>Status</th></tr></thead><tbody>${open.map(w => `<tr class="clickable" data-wo="${w.id}"><td><strong>${w.id}</strong></td><td>${w.title}</td><td>${NRW.formatDate(w.dueDate)}</td><td><span class="badge" style="background:${NRW.statusColor(w.status)}">${NRW.formatStatus(w.status)}</span></td></tr>`).join('')}</tbody></table>` : '<div class="text-slate-400 text-xs">No active work orders</div>'}</div>
      ${completed.length ? `<div><h4 class="mb-2.5">Recently closed (${completed.length})</h4><table class="data-table compact"><thead><tr><th>ID</th><th>Title</th><th>Closed</th><th>Status</th></tr></thead><tbody>${completed.slice(0, 5).map(w => `<tr class="clickable" data-wo="${w.id}"><td><strong>${w.id}</strong></td><td>${w.title}</td><td>${NRW.formatDate(w.closedAt || w.dueDate)}</td><td><span class="badge" style="background:${NRW.statusColor(w.status)}">${NRW.formatStatus(w.status)}</span></td></tr>`).join('')}</tbody></table></div>` : ''}
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end">
      <button class="btn-secondary" data-close>Close</button>
      <button class="btn-secondary flex items-center gap-1.5" id="team-edit">${icon('pencil', 'w-3.5 h-3.5')} Edit</button>
      <button class="btn-danger flex items-center gap-1.5" id="team-delete">${icon('trash-2', 'w-3.5 h-3.5')} Delete</button>
      <button class="btn-primary flex items-center gap-1.5" id="team-assign">${icon('plus', 'w-3.5 h-3.5')} Assign new WO</button>
    </div>
  `, { kind: 'team', id: teamId });
  document.getElementById('team-edit').addEventListener('click', () => openTeamFormModal(t));
  document.getElementById('team-delete').addEventListener('click', () => deleteTeam(teamId));
  document.querySelectorAll('#drawer [data-wo]').forEach(b => b.addEventListener('click', () => openWorkOrderDrawer(b.dataset.wo)));
  document.getElementById('team-assign').addEventListener('click', () => openCreateWOModal({ assignee: t.name }));
}

// ============ MODALS ============
function openCreateWOModal(prefill = {}) {
  const today = new Date('2026-06-02');
  const due = new Date(today); due.setDate(due.getDate() + 5);
  const dueDate = due.toISOString().slice(0, 10);

  openModal({
    title: 'Create Work Order',
    subtitle: 'Generate an inspection, intervention, or maintenance task',
    size: 'md',
    body: `
      <form id="wo-form" class="flex flex-col gap-3">
        <div>
          <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Title *</label>
          <input name="title" required class="select-input w-full mt-1" placeholder="e.g. Investigate suspected leak in DMA-003" value="${prefill.title || ''}" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Zone *</label>
            <select name="zoneId" required class="select-input w-full mt-1">
              <option value="">Select zone...</option>
              ${NRW.ZONES.map(z => `<option value="${z.id}" ${prefill.zoneId === z.id ? 'selected' : ''}>${z.name} (${z.id})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Type *</label>
            <select name="type" required class="select-input w-full mt-1">
              <option ${prefill.type === 'Inspection' ? 'selected' : ''}>Inspection</option>
              <option ${prefill.type === 'Commercial' ? 'selected' : ''}>Commercial</option>
              <option ${prefill.type === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
              <option ${prefill.type === 'Verification' ? 'selected' : ''}>Verification</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Priority *</label>
            <select name="priority" required class="select-input w-full mt-1">
              <option ${prefill.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option ${prefill.priority === 'Medium' || !prefill.priority ? 'selected' : ''}>Medium</option>
              <option ${prefill.priority === 'High' ? 'selected' : ''}>High</option>
              <option ${prefill.priority === 'Critical' ? 'selected' : ''}>Critical</option>
            </select>
          </div>
          <div>
            <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Assign to</label>
            <select name="assignee" class="select-input w-full mt-1">
              <option value="">Leave as Draft</option>
              ${NRW.TEAMS.map(t => `<option value="${t.name}" ${prefill.assignee === t.name ? 'selected' : ''}>${t.name} (${t.activeWO} active)</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Due date *</label>
            <input type="date" name="dueDate" required class="select-input w-full mt-1" value="${dueDate}" />
          </div>
        </div>
        <div>
          <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Estimated recovery (m³)</label>
          <input type="number" name="estRecoveryM3" min="0" class="select-input w-full mt-1" placeholder="0" />
        </div>
        <div>
          <label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Description</label>
          <textarea name="description" rows="3" class="select-input w-full mt-1" placeholder="What needs to be done? Why?">${prefill.description || ''}</textarea>
        </div>
      </form>
    `,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">Create Work Order</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const form = overlay.querySelector('#wo-form');
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.title || !data.zoneId || !data.dueDate) { toast('Mohon lengkapi field wajib', 'error'); return false; }
      const wo = State.createWorkOrder(data);
      toast(`Work order ${wo.id} dibuat`, 'success');
      setTimeout(() => openWorkOrderDrawer(wo.id), 250);
      return true;
    }
  });
}

function openAddNoteModal(woId) {
  openModal({
    title: 'Add field note',
    subtitle: `Append a timestamped note to work order ${woId}`,
    size: 'sm',
    body: `<textarea id="note-text" rows="5" class="select-input w-full" placeholder="e.g. Located leak at coordinate near valve V-203. Excavation requested."></textarea>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">Add note</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const note = overlay.querySelector('#note-text').value.trim();
      if (!note) { toast('Tolong tulis catatannya dulu', 'error'); return false; }
      State.addWorkOrderNote(woId, note);
      toast('Catatan ditambahkan ke timeline', 'success');
      return true;
    }
  });
}

function openAddEvidenceModal(woId) {
  openModal({
    title: 'Add evidence',
    subtitle: `Attach photo, GPS point, or document to ${woId}`,
    size: 'sm',
    body: `
      <div class="flex flex-col gap-3">
        <div><label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Type *</label><select id="ev-type" class="select-input w-full mt-1"><option value="photo">Photo</option><option value="gps">GPS point</option><option value="document">Document</option></select></div>
        <div><label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Label *</label><input id="ev-label" class="select-input w-full mt-1" placeholder="e.g. Sub-surface leak at junction" /></div>
      </div>
    `,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">Attach</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const type = overlay.querySelector('#ev-type').value;
      const label = overlay.querySelector('#ev-label').value.trim();
      if (!label) { toast('Mohon isi labelnya', 'error'); return false; }
      State.addEvidence(woId, { type, label });
      toast('Bukti terlampir', 'success');
      return true;
    }
  });
}

function openAlarmDrawer(id) {
  const a = NRW.ALARMS.find(x => x.id === id);
  if (a) openZoneDrawer(a.zoneId);
}

// ============ NOTIFICATION PANEL ============
function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (panel.classList.contains('open')) { closeNotifPanel(); return; }
  panel.innerHTML = `
    <div class="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
      <div><h3 class="font-semibold text-sm">Notifications</h3><div class="text-[10px] text-slate-400 mt-0.5">${State.getUnreadCount()} unread of ${NRW.NOTIFICATIONS.length}</div></div>
      <button class="text-[11px] text-sky-500 hover:text-sky-700" id="notif-mark-all">Mark all read</button>
    </div>
    <div class="overflow-y-auto flex-1">
      ${NRW.NOTIFICATIONS.length ? NRW.NOTIFICATIONS.slice(0, 20).map(n => {
        const color = NRW.notificationColor(n.type);
        return `<div class="notif-row ${!n.read ? 'unread' : ''}" data-notif-id="${n.id}" data-notif-target="${n.target || ''}">
          <div class="notif-dot" style="background:${color}22;color:${color}">${icon(NRW.notificationIcon(n.type), 'w-3.5 h-3.5')}</div>
          <div class="flex-1 min-w-0"><div class="text-[12px] font-medium truncate">${n.title}</div><div class="text-[11px] text-slate-500 mt-0.5">${n.message}</div><div class="text-[10px] text-slate-400 mt-1">${NRW.timeAgo(n.ts)}</div></div>
        </div>`;
      }).join('') : '<div class="p-8 text-center text-slate-400 text-xs">No notifications</div>'}
    </div>
  `;
  panel.classList.add('open');
  renderIcons();
  document.getElementById('notif-mark-all')?.addEventListener('click', () => { State.markAllNotificationsRead(); toggleNotifPanel(); toggleNotifPanel(); });
  panel.querySelectorAll('[data-notif-id]').forEach(el => {
    el.addEventListener('click', () => {
      State.markNotificationRead(el.dataset.notifId);
      const t = el.dataset.notifTarget;
      closeNotifPanel();
      if (t?.startsWith('DMA-')) openZoneDrawer(t);
      else if (t?.startsWith('WO-')) openWorkOrderDrawer(t);
      else if (t?.startsWith('SNR-')) openSensorDrawer(t);
      else if (t?.startsWith('INT-')) openInterventionDrawer(t);
    });
  });
  setTimeout(() => document.addEventListener('click', notifOutsideClick), 10);
}

function notifOutsideClick(e) {
  if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) closeNotifPanel();
}

function closeNotifPanel() {
  document.getElementById('notif-panel')?.classList.remove('open');
  document.removeEventListener('click', notifOutsideClick);
}

// ============ PRICING · MASTER DATA ============
function renderPricing(root) {
  const byTariff = NRW.customersByTariff();
  const totalCustomers = NRW.CUSTOMERS.length;
  const expectedRevenue = NRW.TARIFFS.reduce((s, t) => {
    const list = byTariff[t.id] || [];
    return s + list.reduce((ss, c) => ss + (c.avgMonthly * t.rate), 0);
  }, 0);
  const subsidisedShare = (() => {
    const list = byTariff['TAR-R1'] || [];
    return ((list.length / Math.max(1, totalCustomers)) * 100).toFixed(1);
  })();
  const businessShare = NRW.TARIFFS.filter(t => t.type === 'Business').reduce((s, t) => s + (byTariff[t.id]?.length || 0), 0);

  root.innerHTML = `
    <div class="page-intro">
      <div class="page-intro-icon">${icon('banknote', 'w-5 h-5')}</div>
      <div class="flex-1">
        <div class="font-semibold text-sm">Master data pricing</div>
        <div class="text-slate-500 text-xs mt-0.5">Atur struktur tariff per blok konsumsi & tipe pelanggan. Perubahan akan otomatis diterapkan pada estimasi recovery, billing audit, dan commercial cases.</div>
      </div>
      <button class="btn-primary flex items-center gap-1.5" id="new-tariff-btn">${icon('plus', 'w-3.5 h-3.5')} Tambah Tarif</button>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Active tariff tiers', NRW.TARIFFS.filter(t => t.status === 'active').length, `${NRW.TARIFFS.length} total tiers`, 'info', 'banknote')}
      ${kpiCard('Expected monthly revenue', NRW.formatIDR(expectedRevenue), 'based on customer master', 'good', 'trending-up')}
      ${kpiCard('Subsidised customers (R1)', `${subsidisedShare}%`, `${(byTariff['TAR-R1'] || []).length} dari ${totalCustomers}`, 'warn', 'building-2')}
      ${kpiCard('Business customers', businessShare, `${((businessShare / totalCustomers) * 100).toFixed(0)}% of base`, 'info', 'briefcase')}
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Tariff matrix · ${NRW.TARIFFS.length} tiers</h3>
        <div class="flex gap-2 items-center">
          <span class="chip">Effective ${NRW.formatDate(NRW.TARIFFS[0]?.effectiveDate)}</span>
          <button class="btn-secondary text-xs flex items-center gap-1.5" onclick="window.print()">${icon('printer', 'w-3 h-3')} Print matrix</button>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>Code</th><th>Tier name</th><th>Type</th><th>Usage range (m³)</th><th>Rate (Rp/m³)</th><th>Customers</th><th>Est. mo revenue</th><th>Status</th><th>Effective</th><th>Actions</th></tr></thead>
        <tbody>${NRW.TARIFFS.map(t => {
          const list = byTariff[t.id] || [];
          const revenue = list.reduce((s, c) => s + (c.avgMonthly * t.rate), 0);
          const usageLabel = t.maxUsage === null ? `${t.minUsage}+ m³` : `${t.minUsage}–${t.maxUsage} m³`;
          const typeColor = t.type === 'Business' ? 'chip-success' : t.type === 'Social' ? '' : '';
          return `<tr class="clickable" data-edit-tariff="${t.id}">
            <td><strong class="font-mono">${t.code}</strong></td>
            <td>${t.tier}<div class="text-slate-400 text-[10px] mt-0.5">${t.description}</div></td>
            <td><span class="chip ${typeColor}">${t.type}</span></td>
            <td>${usageLabel}</td>
            <td><strong>Rp ${t.rate.toLocaleString()}</strong></td>
            <td>${list.length.toLocaleString()}<div class="text-slate-400 text-[10px]">${((list.length / Math.max(1, totalCustomers)) * 100).toFixed(1)}%</div></td>
            <td>${NRW.formatIDR(revenue)}</td>
            <td><span class="badge" style="background:${t.status === 'active' ? '#10b981' : '#94a3b8'}">${t.status}</span></td>
            <td class="text-slate-500">${NRW.formatDate(t.effectiveDate)}</td>
            <td class="!py-1"><div class="flex gap-0.5"><button class="row-action" data-edit-tariff-btn="${t.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button><button class="row-action danger" data-delete-tariff="${t.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button></div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
      <div class="card">
        <div class="card-header"><h3>Distribusi pelanggan per tariff</h3></div>
        <div class="p-3.5 relative" style="height:260px"><canvas id="chart-tariff-dist"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Riwayat versi tariff</h3><span class="chip">${NRW.TARIFF_HISTORY.length} versions</span></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>Version</th><th>Effective</th><th>Status</th><th>Changes</th></tr></thead>
          <tbody>${NRW.TARIFF_HISTORY.map(h => `
            <tr><td><strong>${h.version}</strong></td><td>${NRW.formatDate(h.effectiveDate)}</td>
            <td><span class="badge" style="background:${h.status === 'active' ? '#10b981' : '#94a3b8'}">${h.status}</span></td>
            <td class="text-slate-500">${h.changes}<div class="text-slate-400 text-[10px] mt-0.5">Approved by ${h.approvedBy} · ${h.tariffSnapshot} tariffs</div></td></tr>
          `).join('')}</tbody>
        </table></div>
      </div>
    </div>

    <div class="card p-4 flex items-center justify-between gap-3 flex-wrap bg-amber-50 border-amber-200">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-600 grid place-items-center">${icon('triangle-alert', 'w-4 h-4')}</div>
        <div>
          <div class="font-semibold text-sm text-amber-900">Catatan untuk admin master data</div>
          <div class="text-amber-800 text-xs mt-0.5">Perubahan tariff harus disetujui board PDAM. Versi baru akan dijadikan baseline untuk semua estimasi recovery & billing audit ke depan.</div>
        </div>
      </div>
      <button class="btn-secondary flex items-center gap-1.5">${icon('download', 'w-3.5 h-3.5')} Export to ERP/Billing</button>
    </div>
  `;

  // Chart
  Charts.customChart('chart-tariff-dist', {
    type: 'bar',
    data: {
      labels: NRW.TARIFFS.map(t => t.code),
      datasets: [{
        label: 'Customers',
        data: NRW.TARIFFS.map(t => (byTariff[t.id] || []).length),
        backgroundColor: NRW.TARIFFS.map(t => t.type === 'Business' ? '#10b981' : t.type === 'Social' ? '#a855f7' : '#0ea5e9'),
        borderRadius: 4, maxBarThickness: 36
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: ctx => { const t = NRW.TARIFFS[ctx.dataIndex]; return [`${t.tier}`, `Rp ${t.rate.toLocaleString()}/m³`]; } } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' }, ticks: { precision: 0 } } } }
  });

  document.getElementById('new-tariff-btn').addEventListener('click', () => openTariffFormModal());
  root.querySelectorAll('[data-edit-tariff]').forEach(r => r.addEventListener('click', () => openTariffFormModal(NRW.getTariff(r.dataset.editTariff))));
  root.querySelectorAll('[data-edit-tariff-btn]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openTariffFormModal(NRW.getTariff(b.dataset.editTariffBtn)); }));
  root.querySelectorAll('[data-delete-tariff]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteTariff(b.dataset.deleteTariff); }));
  renderIcons();
}

function openTariffFormModal(tariff = null) {
  const isEdit = !!tariff;
  openModal({
    title: isEdit ? `Edit tariff · ${tariff.code}` : 'Add new tariff tier',
    subtitle: isEdit ? 'Update pricing structure' : 'Define a new pricing block',
    size: 'md',
    body: `<form id="tariff-form" class="flex flex-col gap-3">
      ${field('Tier name (display)', 'tier', tariff?.tier || '', { required: true, placeholder: 'e.g. Residential · 11-20 m³' })}
      <div class="grid grid-cols-3 gap-3">
        ${selectField('Type', 'type', ['Residential', 'Business', 'Social'], tariff?.type || 'Residential', { required: true })}
        ${field('Min usage (m³)', 'minUsage', tariff?.minUsage ?? 0, { type: 'number' })}
        ${field('Max usage (m³, blank = unlimited)', 'maxUsage', tariff?.maxUsage ?? '', { type: 'number' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Rate (Rp / m³)', 'rate', tariff?.rate ?? 0, { type: 'number', required: true })}
        ${field('Effective date', 'effectiveDate', tariff?.effectiveDate || '2026-06-02', { type: 'date' })}
      </div>
      ${selectField('Status', 'status', ['active', 'archived'], tariff?.status || 'active')}
      ${field('Description', 'description', tariff?.description || '', { rows: 2 })}
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Add tariff'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#tariff-form')).entries());
      if (!data.tier || !data.rate) { toast('Nama tier dan tarif wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateTariff(tariff.id, data); toast(`Tarif ${tariff.code} tersimpan`, 'success'); }
      else { const t = State.createTariff(data); toast(`Tarif ${t.code} berhasil ditambahkan`, 'success'); }
      rerender();
      return true;
    }
  });
}

function deleteTariff(id) {
  const t = NRW.getTariff(id);
  if (!t) return;
  confirm({
    title: 'Hapus tier tarif ini?',
    message: `Tariff <strong>${t.tier}</strong> (Rp ${t.rate.toLocaleString()}/m³) will be removed. Pelanggan yang sekarang di tier ini akan dipindahkan otomatis ke tier berikutnya.`,
    confirmLabel: 'Hapus tarif',
    onConfirm: () => { State.deleteTariff(id); toast(`Tarif ${t.code} dihapus`, 'success'); rerender(); }
  });
}

// ============ COMMERCIAL MAP ============
function renderCommercialMap(root) {
  const ranked = NRW.ZONES.map(z => ({ zone: z, m: NRW.zoneCommercialMetrics(z.id) })).sort((a, b) => a.m.netPosition - b.m.netPosition);
  const worst = ranked.slice(0, 5);
  const best = ranked.slice(-5).reverse();
  const totalAtRisk = ranked.reduce((s, r) => s + r.m.revenueAtRisk, 0);
  const totalRecovered = ranked.reduce((s, r) => s + r.m.totalRecovered, 0);

  root.innerHTML = `
    <div class="page-intro">
      <div class="page-intro-icon">${icon('map-pin', 'w-5 h-5')}</div>
      <div class="flex-1">
        <div class="font-semibold text-sm">Commercial Map · Kerugian vs Keuntungan per Zona</div>
        <div class="text-slate-500 text-xs mt-0.5">Setiap zona diwarnai berdasarkan posisi finansial bersih (recovered − revenue at risk). Klik zona untuk detail kasus komersial.</div>
      </div>
      <div class="flex gap-2 items-center">
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500"><span class="w-3 h-3 rounded-sm bg-red-600"></span>Loss</div>
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500"><span class="w-3 h-3 rounded-sm bg-amber-500"></span>Mixed</div>
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500"><span class="w-3 h-3 rounded-sm bg-emerald-500"></span>Profit</div>
      </div>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Revenue at risk', NRW.formatIDR(totalAtRisk), 'across all zones', 'bad', 'trending-down')}
      ${kpiCard('Recovered YTD', NRW.formatIDR(totalRecovered), 'commercial + interventions', 'good', 'trending-up')}
      ${kpiCard('Net position', `${totalRecovered - totalAtRisk >= 0 ? '+' : ''}${NRW.formatIDR(totalRecovered - totalAtRisk)}`, totalRecovered >= totalAtRisk ? 'pilot is net positive' : 'losses exceed recovery', totalRecovered >= totalAtRisk ? 'good' : 'bad', 'banknote')}
      ${kpiCard('Profitable zones', ranked.filter(r => r.m.netPosition >= 0).length, `of ${ranked.length} zones`, 'info', 'hexagon')}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-[calc(100vh-56px-40px-100px)]">
      <div class="card relative overflow-hidden">
        <div id="commercial-map-canvas" class="w-full h-full min-h-[500px]"></div>
        <div class="absolute top-3 right-3 z-10 flex gap-1.5">
          <button class="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs shadow hover:bg-slate-50" id="cm-reset">Reset view</button>
        </div>
      </div>

      <aside class="flex flex-col gap-3 overflow-y-auto">
        <div class="card">
          <div class="card-header"><h3 class="text-xs">🔴 Top loss zones</h3></div>
          <div class="flex flex-col">
            ${worst.map((r, i) => `
              <div class="px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer flex items-center gap-3" data-jump-zone="${r.zone.id}">
                <div class="text-slate-400 font-bold text-xs w-6">#${i + 1}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium truncate">${r.zone.name}</div>
                  <div class="text-[10px] text-slate-500">${r.m.openCases.length} open cases</div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-red-600">${NRW.formatIDR(Math.abs(r.m.netPosition))}</div>
                  <div class="text-[9px] text-slate-400">net loss</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="text-xs">🟢 Top profit zones</h3></div>
          <div class="flex flex-col">
            ${best.map((r, i) => `
              <div class="px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer flex items-center gap-3" data-jump-zone="${r.zone.id}">
                <div class="text-slate-400 font-bold text-xs w-6">#${i + 1}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-medium truncate">${r.zone.name}</div>
                  <div class="text-[10px] text-slate-500">${r.m.resolvedCases.length} resolved cases</div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-bold text-emerald-600">${NRW.formatIDR(r.m.totalRecovered)}</div>
                  <div class="text-[9px] text-slate-400">recovered</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="text-xs">Legend · skala net position</h3></div>
          <div class="p-3 flex flex-col gap-1.5 text-[11px]">
            <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-sm" style="background:#15803d"></span>&gt; Rp 100 jt profit</div>
            <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-sm" style="background:#10b981"></span>Rp 30–100 jt profit</div>
            <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-sm" style="background:#84cc16"></span>Rp 0–30 jt profit</div>
            <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-sm" style="background:#f59e0b"></span>Rp 0–30 jt loss</div>
            <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-sm" style="background:#f97316"></span>Rp 30–80 jt loss</div>
            <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-sm" style="background:#dc2626"></span>&gt; Rp 80 jt loss</div>
            <div class="border-t border-slate-200 pt-2 mt-1">
              <div class="text-slate-500">Circles = open commercial cases</div>
              <div class="text-slate-400 text-[10px]">size proportional to revenue loss</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `;

  initCommercialMap('commercial-map-canvas', { zoom: 10 });
  setCommercialOnDrill((kind, data) => {
    if (kind === 'zone') openZoneDrawer(data.id);
    else if (kind === 'case') openCaseDrawer(data.id);
  });
  root.querySelectorAll('[data-jump-zone]').forEach(b => b.addEventListener('click', () => focusCommercialZone(b.dataset.jumpZone)));
  document.getElementById('cm-reset').addEventListener('click', () => focusCommercialZone(NRW.ZONES[0].id));
  renderIcons();
}

// ============ SAVINGS · PENGHEMATAN PER WILAYAH ============
function regionAggregate(regionName) {
  const zones = NRW.ZONES.filter(z => z.region === regionName);
  const zoneIds = zones.map(z => z.id);
  const interventions = NRW.INTERVENTIONS.filter(i => zoneIds.includes(i.zoneId));
  const totalWater = interventions.reduce((s, i) => s + i.waterRecoveredM3, 0);
  const totalRevenue = interventions.reduce((s, i) => s + i.revenueRecoveredIDR, 0);
  const totalCustomers = zones.reduce((s, z) => s + z.customers, 0);
  const totalSensors = zones.reduce((s, z) => s + z.sensors, 0);
  const totalInput = zones.reduce((s, z) => s + z.inputVolume, 0);
  const totalBilled = zones.reduce((s, z) => s + z.billedVolume, 0);
  const avgNRW = zones.reduce((s, z) => s + z.nrwPercent, 0) / Math.max(1, zones.length);
  const downCount = zones.filter(z => z.nrwTrend === 'down').length;
  const mnfRedTotal = interventions.reduce((s, i) => s + i.mnfReduction, 0);
  return { name: regionName, zones, interventions, totalWater, totalRevenue, totalCustomers, totalSensors, totalInput, totalBilled, totalLoss: totalInput - totalBilled, avgNRW, interventionCount: interventions.length, downCount, mnfRedTotal };
}

function renderSavings(root) {
  const regions = [...new Set(NRW.ZONES.map(z => z.region))];
  const aggregates = regions.map(regionAggregate);
  const totalWater = aggregates.reduce((s, a) => s + a.totalWater, 0);
  const totalRevenue = aggregates.reduce((s, a) => s + a.totalRevenue, 0);
  const annualTargetWater = 50000;
  const annualTargetRevenue = 250000000;
  const waterProgress = Math.round((totalWater / annualTargetWater) * 100);
  const revenueProgress = Math.round((totalRevenue / annualTargetRevenue) * 100);

  const colors = { 'Cirebon': '#0ea5e9', 'Indramayu': '#10b981' };

  const zoneLeaderboard = [...NRW.ZONES].map(z => {
    const zInts = NRW.INTERVENTIONS.filter(i => i.zoneId === z.id);
    return {
      zone: z,
      water: zInts.reduce((s, i) => s + i.waterRecoveredM3, 0),
      revenue: zInts.reduce((s, i) => s + i.revenueRecoveredIDR, 0),
      count: zInts.length,
      mnfRed: zInts.reduce((s, i) => s + i.mnfReduction, 0)
    };
  }).sort((a, b) => b.water - a.water);

  const monthlyTrend = (() => {
    const labels = [];
    const datasets = aggregates.map(a => ({ region: a.name, color: colors[a.name] || '#94a3b8', data: [] }));
    const baseDate = new Date('2026-06-01');
    for (let m = 5; m >= 0; m--) {
      const d = new Date(baseDate); d.setMonth(d.getMonth() - m);
      labels.push(d.toLocaleString('en-US', { month: 'short' }));
      datasets.forEach(ds => {
        const monthInts = NRW.INTERVENTIONS.filter(i => {
          const id = new Date(i.completedAt);
          const aggZones = NRW.ZONES.filter(z => z.region === ds.region).map(z => z.id);
          return aggZones.includes(i.zoneId) && id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
        });
        const water = monthInts.reduce((s, i) => s + i.waterRecoveredM3, 0);
        ds.data.push(water || +(800 + Math.sin(m * 0.7) * 400 + (ds.region === 'Indramayu' ? 600 : 200)).toFixed(0));
      });
    }
    return { labels, datasets };
  })();

  root.innerHTML = `
    <!-- Intro banner -->
    <div class="card bg-gradient-to-r from-sky-500 to-emerald-500 text-white border-0">
      <div class="p-5 flex items-center gap-5 flex-wrap">
        <div class="w-12 h-12 bg-white/15 rounded-xl grid place-items-center backdrop-blur shrink-0">${icon('waves', 'w-6 h-6')}</div>
        <div class="flex-1 min-w-0">
          <h2 class="text-white text-xl font-bold">Snapshot Penghematan Air per Wilayah</h2>
          <p class="text-white/85 text-sm mt-1">Ringkasan recovery air, pendapatan, dan dampak intervensi NRW dirinci per region dan zona pilot.</p>
        </div>
        <div class="text-right">
          <div class="text-[11px] uppercase tracking-wider text-white/70">Pilot total</div>
          <div class="text-2xl font-bold">${NRW.formatM3(totalWater)}</div>
          <div class="text-white/80 text-xs">${NRW.formatIDR(totalRevenue)} recovered YTD</div>
        </div>
      </div>
    </div>

    <!-- Annual target progress -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header"><h3>Air terselamatkan vs target tahunan</h3><span class="chip">2026 target</span></div>
        <div class="p-4">
          <div class="flex items-end justify-between mb-2">
            <div><div class="text-2xl font-bold">${NRW.formatM3(totalWater)}</div><div class="text-slate-400 text-xs">of ${NRW.formatM3(annualTargetWater)} annual target</div></div>
            <div class="text-right"><div class="text-2xl font-bold text-emerald-600">${waterProgress}%</div><div class="text-slate-400 text-xs">progress</div></div>
          </div>
          <div class="bar w-full !h-3"><div class="bar-fill good" style="width:${Math.min(waterProgress, 100)}%"></div></div>
          <div class="text-[11px] text-slate-500 mt-2">${waterProgress >= 100 ? '✓ Target tercapai!' : `Sisa ${NRW.formatM3(annualTargetWater - totalWater)} untuk mencapai target.`}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Revenue recovery vs target</h3><span class="chip">FY 2026</span></div>
        <div class="p-4">
          <div class="flex items-end justify-between mb-2">
            <div><div class="text-2xl font-bold">${NRW.formatIDR(totalRevenue)}</div><div class="text-slate-400 text-xs">of ${NRW.formatIDR(annualTargetRevenue)} target</div></div>
            <div class="text-right"><div class="text-2xl font-bold text-sky-600">${revenueProgress}%</div><div class="text-slate-400 text-xs">progress</div></div>
          </div>
          <div class="bar w-full !h-3"><div class="bar-fill ${revenueProgress >= 100 ? 'good' : revenueProgress >= 50 ? 'warn' : 'bad'}" style="width:${Math.min(revenueProgress, 100)}%"></div></div>
          <div class="text-[11px] text-slate-500 mt-2">${revenueProgress >= 100 ? '✓ Pendapatan terselamatkan melampaui target.' : `Sisa ${NRW.formatIDR(annualTargetRevenue - totalRevenue)} untuk mencapai target tahun ini.`}</div>
        </div>
      </div>
    </div>

    <!-- Regional hero cards -->
    <div class="grid grid-cols-1 lg:grid-cols-${aggregates.length} gap-4">
      ${aggregates.map(a => {
        const color = colors[a.name] || '#0ea5e9';
        const lossPct = ((a.totalLoss / a.totalInput) * 100).toFixed(1);
        return `<div class="card overflow-hidden" style="border-top:3px solid ${color}">
          <div class="p-5">
            <div class="flex justify-between items-start gap-3 mb-3">
              <div>
                <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Wilayah</div>
                <h3 class="text-lg font-bold mt-0.5">${a.name}</h3>
                <div class="text-slate-500 text-xs mt-0.5">${a.zones.length} zona · ${a.totalCustomers.toLocaleString()} pelanggan · ${a.totalSensors} sensor</div>
              </div>
              <div class="w-12 h-12 rounded-xl grid place-items-center shrink-0" style="background:${color}1a;color:${color}">${icon('map-pin', 'w-6 h-6')}</div>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-4">
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-[10px] uppercase text-slate-400 tracking-wide">Air terselamatkan</div>
                <div class="text-xl font-bold mt-1">${NRW.formatM3(a.totalWater)}</div>
                <div class="text-[10px] text-emerald-600 mt-0.5">${a.interventionCount} interventions</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-[10px] uppercase text-slate-400 tracking-wide">Pendapatan recovered</div>
                <div class="text-xl font-bold mt-1">${NRW.formatIDR(a.totalRevenue)}</div>
                <div class="text-[10px] text-sky-600 mt-0.5">YTD 2026</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-[10px] uppercase text-slate-400 tracking-wide">NRW rata-rata</div>
                <div class="text-xl font-bold mt-1">${a.avgNRW.toFixed(1)}%</div>
                <div class="text-[10px] ${a.downCount > a.zones.length / 2 ? 'text-emerald-600' : 'text-amber-600'} mt-0.5 flex items-center gap-1">${icon(a.downCount > a.zones.length / 2 ? 'trending-down' : 'trending-up', 'w-3 h-3')} ${a.downCount}/${a.zones.length} zona membaik</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-[10px] uppercase text-slate-400 tracking-wide">MNF reduction</div>
                <div class="text-xl font-bold mt-1">${a.mnfRedTotal.toFixed(1)} L/s</div>
                <div class="text-[10px] text-slate-500 mt-0.5">cumulative</div>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span class="text-slate-500">Loss ratio: <strong class="text-slate-900">${lossPct}%</strong></span>
              <button class="text-sky-500 hover:text-sky-700 font-medium" data-region-zones="${a.name}">Lihat zona →</button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>

    <!-- Monthly trend -->
    <div class="card">
      <div class="card-header"><h3>Tren bulanan recovery per wilayah (6 bulan terakhir)</h3><span class="chip">m³ water saved</span></div>
      <div class="p-3.5 relative" style="height:280px"><canvas id="chart-savings-trend"></canvas></div>
    </div>

    <!-- Zone leaderboard -->
    <div class="card">
      <div class="card-header">
        <h3>Leaderboard zona · ranking penghematan</h3>
        <div class="flex gap-1.5">
          <button class="chip chip-active" data-sort="water">By water</button>
          <button class="chip" data-sort="revenue">By revenue</button>
          <button class="chip" data-sort="count">By count</button>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="data-table">
        <thead><tr><th>Rank</th><th>Zona</th><th>Wilayah</th><th>Interventions</th><th>Air terselamatkan</th><th>Pendapatan</th><th>MNF reduction</th><th>Status</th></tr></thead>
        <tbody>${zoneLeaderboard.map((row, idx) => {
          const z = row.zone;
          const rankClass = idx === 0 ? 'text-amber-600 font-bold' : idx === 1 ? 'text-slate-500 font-bold' : idx === 2 ? 'text-orange-700 font-bold' : 'text-slate-400';
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
          return `<tr class="clickable" data-zone="${z.id}">
            <td class="${rankClass}">${idx < 3 ? `<span class="text-base mr-1">${medal}</span>` : medal}</td>
            <td><strong>${z.name}</strong><div class="text-slate-400 text-[10px]">${z.id}</div></td>
            <td>${z.region}</td>
            <td>${row.count}</td>
            <td><strong>${NRW.formatM3(row.water)}</strong></td>
            <td>${NRW.formatIDR(row.revenue)}</td>
            <td class="text-emerald-600">${row.mnfRed > 0 ? `−${row.mnfRed.toFixed(1)} L/s` : '-'}</td>
            <td><span class="badge" style="background:${NRW.classificationColor(z.classification)}">${z.classification}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>

    <!-- Top interventions + breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header"><h3>Top interventions berdasarkan recovery</h3><span class="chip">${NRW.INTERVENTIONS.length} total</span></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>Type</th><th>Zona</th><th>Selesai</th><th>Air</th><th>Effectiveness</th></tr></thead>
          <tbody>${[...NRW.INTERVENTIONS].sort((a, b) => b.waterRecoveredM3 - a.waterRecoveredM3).slice(0, 8).map(i => {
            const z = NRW.getZone(i.zoneId);
            return `<tr class="clickable" data-intervention="${i.id}">
              <td><strong>${i.type}</strong></td>
              <td>${z?.name || i.zoneId}</td>
              <td>${NRW.formatDate(i.completedAt)}</td>
              <td>${NRW.formatM3(i.waterRecoveredM3)}</td>
              <td><span class="${i.effectiveness >= 30 ? 'text-emerald-600 font-bold' : i.effectiveness >= 15 ? 'text-amber-600' : 'text-slate-500'}">${i.effectiveness}%</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Recovery breakdown per source</h3></div>
        <div class="p-3.5 relative" style="height:240px"><canvas id="chart-savings-source"></canvas></div>
        <div class="px-4 pb-4 text-[11px] text-slate-500">Distribusi recovery dari kebocoran fisik (burst, service line) vs komersial (meter, audit pelanggan).</div>
      </div>
    </div>

    <!-- Per-zone water saved bar -->
    <div class="card">
      <div class="card-header"><h3>Penghematan air per zona (sortable)</h3></div>
      <div class="p-3.5 relative" style="height:320px"><canvas id="chart-savings-zone"></canvas></div>
    </div>

    <!-- Export footer -->
    <div class="card p-4 flex items-center justify-between flex-wrap gap-3">
      <div class="text-sm text-slate-600">Export snapshot ini untuk laporan bulanan ke management atau ke regulator.</div>
      <div class="flex gap-2">
        <button class="btn-secondary flex items-center gap-1.5" onclick="window.print()">${icon('printer', 'w-3.5 h-3.5')} Print</button>
        <button class="btn-secondary flex items-center gap-1.5" id="savings-pdf">${icon('download', 'w-3.5 h-3.5')} PDF</button>
        <button class="btn-primary flex items-center gap-1.5" id="savings-xlsx">${icon('download', 'w-3.5 h-3.5')} Excel</button>
      </div>
    </div>
  `;

  // Charts
  Charts.customChart('chart-savings-trend', {
    type: 'line',
    data: {
      labels: monthlyTrend.labels,
      datasets: monthlyTrend.datasets.map(ds => ({
        label: ds.region, data: ds.data,
        borderColor: ds.color, backgroundColor: ds.color + '22',
        fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 3
      }))
    },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${NRW.formatM3(c.parsed.y)}` } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' }, title: { display: true, text: 'm³' } } } }
  });

  // Recovery source breakdown (mock physical vs commercial split)
  const physTypes = ['Burst Repair', 'Service Line Repair', 'PRV Adjustment'];
  const commTypes = ['Meter Replacement', 'Customer Audit', 'Bulk Meter Calibration'];
  const physWater = NRW.INTERVENTIONS.filter(i => physTypes.includes(i.type)).reduce((s, i) => s + i.waterRecoveredM3, 0);
  const commWater = NRW.INTERVENTIONS.filter(i => commTypes.includes(i.type)).reduce((s, i) => s + i.waterRecoveredM3, 0);
  Charts.customChart('chart-savings-source', {
    type: 'doughnut',
    data: { labels: ['Physical loss recovery', 'Commercial loss recovery'], datasets: [{ data: [physWater, commWater], backgroundColor: ['#ef4444', '#0ea5e9'], borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.label}: ${NRW.formatM3(c.parsed)} (${((c.parsed / (physWater + commWater)) * 100).toFixed(0)}%)` } } } }
  });

  // Per-zone water saved bar
  Charts.customChart('chart-savings-zone', {
    type: 'bar',
    data: {
      labels: zoneLeaderboard.map(r => r.zone.name),
      datasets: [{ label: 'Air terselamatkan (m³)', data: zoneLeaderboard.map(r => r.water), backgroundColor: zoneLeaderboard.map(r => colors[r.zone.region] || '#94a3b8'), borderRadius: 4, maxBarThickness: 38 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => NRW.formatM3(c.parsed.y) } } }, scales: { x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 35, minRotation: 35 } }, y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' }, title: { display: true, text: 'm³' } } } }
  });

  root.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => openZoneDrawer(b.dataset.zone)));
  root.querySelectorAll('[data-intervention]').forEach(b => b.addEventListener('click', () => openInterventionDrawer(b.dataset.intervention)));
  root.querySelectorAll('[data-region-zones]').forEach(b => b.addEventListener('click', () => {
    location.hash = '#/zones';
    toast(`Showing zones in ${b.dataset.regionZones}`, 'info', { duration: 2000 });
  }));
  document.getElementById('savings-pdf').addEventListener('click', () => toast('PDF export queued — laporan dalam proses', 'info'));
  document.getElementById('savings-xlsx').addEventListener('click', () => toast('Excel export queued', 'info'));
  renderIcons();
}

// ============ COMMERCIAL ============
function renderCommercial(root) {
  const filtered = NRW.CASES.filter(c => {
    if (state.cases.status !== 'all' && c.status !== state.cases.status) return false;
    if (state.cases.type !== 'all' && c.type !== state.cases.type) return false;
    if (state.cases.zone !== 'all' && c.zoneId !== state.cases.zone) return false;
    return true;
  });
  const openCases = NRW.CASES.filter(c => !['Resolved', 'WrittenOff'].includes(c.status));
  const totalAtRisk = openCases.reduce((s, c) => s + c.estRevenueLossIDR, 0);
  const resolvedRev = NRW.CASES.filter(c => c.status === 'Resolved').reduce((s, c) => s + c.estRecoveryIDR, 0);
  const activeCampaigns = NRW.CAMPAIGNS.filter(c => c.status === 'active').length;
  const writtenOff = NRW.CASES.filter(c => c.status === 'WrittenOff').reduce((s, c) => s + c.estRevenueLossIDR, 0);

  root.innerHTML = `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      ${kpiCard('Open cases', openCases.length, `${NRW.CASES.filter(c => c.priority === 'Critical' && !['Resolved','WrittenOff'].includes(c.status)).length} critical`, 'warn', 'circle-alert')}
      ${kpiCard('Revenue at risk', NRW.formatIDR(totalAtRisk), 'across open cases', 'bad', 'banknote')}
      ${kpiCard('Recovered (resolved)', NRW.formatIDR(resolvedRev), `${NRW.CASES.filter(c => c.status === 'Resolved').length} cases closed`, 'good', 'check')}
      ${kpiCard('Active campaigns', activeCampaigns, `${NRW.CAMPAIGNS.reduce((s, c) => s + c.targetCount, 0).toLocaleString()} total targets`, 'info', 'briefcase')}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      <div class="card">
        <div class="card-header">
          <h3>Commercial cases · ${filtered.length} shown</h3>
          <div class="flex gap-2 items-center flex-wrap">
            <select class="select-input" id="cs-status"><option value="all">All status</option><option>Open</option><option>InAudit</option><option>AwaitingCustomer</option><option>PendingReplacement</option><option>Resolved</option><option>WrittenOff</option></select>
            <select class="select-input" id="cs-type"><option value="all">All types</option><option value="zero_consumption">Zero consumption</option><option value="sudden_drop">Sudden drop</option><option value="meter_malfunction">Meter malfunction</option><option value="illegal_connection">Illegal connection</option><option value="billing_dispute">Billing dispute</option><option value="meter_age">Meter age</option></select>
            <select class="select-input" id="cs-zone"><option value="all">All zones</option>${NRW.ZONES.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}</select>
            <button class="btn-primary flex items-center gap-1.5" id="new-case-btn">${icon('plus', 'w-3.5 h-3.5')} Buka Kasus</button>
          </div>
        </div>
        <div class="overflow-x-auto"><table class="data-table">
          <thead><tr><th>ID</th><th>Type</th><th>Customer</th><th>Zone</th><th>Months</th><th>Loss / Recovery</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Due</th><th>Actions</th></tr></thead>
          <tbody>${filtered.map(c => {
            const overdue = c.dueDate && new Date(c.dueDate) < new Date('2026-06-02') && !['Resolved','WrittenOff'].includes(c.status);
            return `<tr class="clickable" data-case="${c.id}">
              <td><strong>${c.id}</strong></td>
              <td><div class="flex items-center gap-1.5">${icon(NRW.caseTypeIcon(c.type), 'w-3.5 h-3.5 text-slate-500')}<span>${NRW.caseTypeLabel(c.type)}</span></div></td>
              <td>${c.customerName}<div class="text-slate-400 text-[10px]">${c.customerType}</div></td>
              <td>${c.zoneName}</td>
              <td>${c.monthsAffected}</td>
              <td>${NRW.formatIDR(c.estRevenueLossIDR)}<div class="text-emerald-600 text-[10px]">rec. ${NRW.formatIDR(c.estRecoveryIDR)}</div></td>
              <td><span class="priority priority-${c.priority.toLowerCase()}">${c.priority}</span></td>
              <td><span class="badge" style="background:${NRW.caseStatusColor(c.status)}">${NRW.formatStatus(c.status)}</span></td>
              <td>${c.assignee || '<span class="text-slate-400">unassigned</span>'}</td>
              <td class="${overdue ? 'text-red-500' : ''}">${c.dueDate ? NRW.formatDate(c.dueDate) : '-'} ${overdue ? icon('triangle-alert', 'w-3 h-3 inline') : ''}</td>
              <td class="!py-1"><div class="flex gap-0.5"><button class="row-action" data-edit-case="${c.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button><button class="row-action danger" data-delete-case="${c.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button></div></td>
            </tr>`;
          }).join('') || '<tr><td colspan="11" class="text-center py-9 text-slate-400">Belum ada kasus yang cocok — coba ubah filter, atau buka kasus baru dari customer yang mencurigakan</td></tr>'}</tbody>
        </table></div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="card">
          <div class="card-header"><h3>Cases by status</h3></div>
          <div class="p-3.5 relative" style="height:200px"><canvas id="chart-cases-status"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Revenue impact by type</h3></div>
          <div class="p-3.5 relative" style="height:200px"><canvas id="chart-cases-impact"></canvas></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Recovery campaigns</h3>
        <button class="btn-primary flex items-center gap-1.5" id="new-campaign-btn">${icon('plus', 'w-3.5 h-3.5')} Buat Campaign</button>
      </div>
      <div class="p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        ${NRW.CAMPAIGNS.map(c => {
          const pct = c.targetCount ? Math.round((c.completedCount / c.targetCount) * 100) : 0;
          const sc = c.status === 'completed' ? 'good' : c.status === 'active' ? 'warn' : 'bad';
          const statusBg = c.status === 'completed' ? '#10b981' : c.status === 'active' ? '#f59e0b' : '#94a3b8';
          return `<div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2"><strong class="text-sm">${c.name}</strong><span class="badge" style="background:${statusBg}">${c.status}</span></div>
                <div class="text-slate-400 text-[11px] mt-0.5">${c.id} · ${NRW.formatDate(c.startedAt)} → ${NRW.formatDate(c.plannedEnd)}</div>
              </div>
            </div>
            <div class="text-xs text-slate-600 mb-2.5">${c.description}</div>
            <div class="flex justify-between text-[11px] mb-1"><span class="text-slate-500">Progress</span><span class="font-semibold">${c.completedCount}/${c.targetCount} (${pct}%)</span></div>
            <div class="bar w-full !h-2 mb-2.5"><div class="bar-fill ${sc}" style="width:${pct}%"></div></div>
            <div class="flex justify-between items-center text-[11px]">
              <div>
                <div class="text-slate-400 uppercase tracking-wide">Expected recovery</div>
                <div class="font-bold text-sm">${NRW.formatIDR(c.expectedRecoveryIDR)}</div>
              </div>
              <div class="flex gap-1">
                <button class="row-action" data-edit-campaign="${c.id}" title="Edit">${icon('pencil', 'w-3 h-3')}</button>
                <button class="row-action danger" data-delete-campaign="${c.id}" title="Delete">${icon('trash-2', 'w-3 h-3')}</button>
              </div>
            </div>
            <div class="flex gap-1 mt-2 flex-wrap">${c.zoneIds.map(z => `<span class="chip text-[9px]">${z}</span>`).join('')}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header"><h3>Tariff structure</h3><span class="chip">${NRW.TARIFFS.length} tiers</span></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>Tier</th><th>Type</th><th>Rate (Rp/m³)</th><th>Notes</th></tr></thead>
          <tbody>${NRW.TARIFFS.map(t => `<tr><td><strong>${t.tier}</strong></td><td><span class="chip ${t.type === 'Business' ? 'chip-success' : ''}">${t.type}</span></td><td>Rp ${t.rate.toLocaleString()}</td><td class="text-slate-500">${t.description}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Top revenue-at-risk zones</h3></div>
        <div class="overflow-x-auto"><table class="data-table compact">
          <thead><tr><th>Zone</th><th>Open cases</th><th>Months exposure</th><th>Loss estimate</th></tr></thead>
          <tbody>${NRW.ZONES.map(z => {
            const zoneCases = NRW.CASES.filter(c => c.zoneId === z.id && !['Resolved','WrittenOff'].includes(c.status));
            const loss = zoneCases.reduce((s, c) => s + c.estRevenueLossIDR, 0);
            const months = zoneCases.reduce((s, c) => s + c.monthsAffected, 0);
            return { z, zoneCases, loss, months };
          }).filter(r => r.zoneCases.length).sort((a, b) => b.loss - a.loss).slice(0, 6).map(r => `
            <tr class="clickable" data-zone="${r.z.id}">
              <td><strong>${r.z.name}</strong></td>
              <td>${r.zoneCases.length}</td>
              <td>${r.months}</td>
              <td>${NRW.formatIDR(r.loss)}</td>
            </tr>
          `).join('')}</tbody>
        </table></div>
      </div>
    </div>
  `;

  document.getElementById('cs-status').value = state.cases.status;
  document.getElementById('cs-type').value = state.cases.type;
  document.getElementById('cs-zone').value = state.cases.zone;
  ['cs-status', 'cs-type', 'cs-zone'].forEach(id => document.getElementById(id).addEventListener('change', e => { state.cases[id.split('-')[1]] = e.target.value; renderCommercial(root); }));
  root.querySelectorAll('[data-case]').forEach(r => r.addEventListener('click', () => openCaseDrawer(r.dataset.case)));
  root.querySelectorAll('[data-edit-case]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openCaseFormModal(NRW.getCase(b.dataset.editCase)); }));
  root.querySelectorAll('[data-delete-case]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteCase(b.dataset.deleteCase); }));
  root.querySelectorAll('[data-edit-campaign]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openCampaignFormModal(NRW.getCampaign(b.dataset.editCampaign)); }));
  root.querySelectorAll('[data-delete-campaign]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); deleteCampaign(b.dataset.deleteCampaign); }));
  root.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => openZoneDrawer(b.dataset.zone)));
  document.getElementById('new-case-btn').addEventListener('click', () => openCaseFormModal());
  document.getElementById('new-campaign-btn').addEventListener('click', () => openCampaignFormModal());

  // Charts
  const statusCounts = {};
  NRW.CASES.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
  Charts.customChart('chart-cases-status', {
    type: 'doughnut',
    data: { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: Object.keys(statusCounts).map(s => NRW.caseStatusColor(s)), borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { boxWidth: 8, font: { size: 10 } } } } }
  });
  const typeImpact = {};
  NRW.CASES.forEach(c => { typeImpact[NRW.caseTypeLabel(c.type)] = (typeImpact[NRW.caseTypeLabel(c.type)] || 0) + c.estRevenueLossIDR; });
  Charts.customChart('chart-cases-impact', {
    type: 'bar',
    data: { labels: Object.keys(typeImpact), datasets: [{ data: Object.values(typeImpact), backgroundColor: '#ef4444', borderRadius: 3, maxBarThickness: 18 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => NRW.formatIDR(ctx.parsed.x) } } }, scales: { x: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' }, ticks: { callback: v => NRW.formatIDR(v) } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
  });

  renderIcons();
}

function deleteCase(id) {
  const c = NRW.getCase(id);
  if (!c) return;
  confirm({
    title: 'Hapus kasus ini?',
    message: `Case <strong>${c.id}</strong> for ${c.customerName} (loss estimate ${NRW.formatIDR(c.estRevenueLossIDR)}) akan dihapus dari log kasus.`,
    confirmLabel: 'Hapus kasus',
    onConfirm: () => { State.deleteCase(id); toast(`Kasus ${id} dihapus`, 'success'); closeDrawer(); rerender(); }
  });
}

function deleteCampaign(id) {
  const c = NRW.getCampaign(id);
  if (!c) return;
  confirm({
    title: 'Hapus campaign ini?',
    message: `Campaign <strong>${c.name}</strong> will be removed. Kasus yang sudah ter-generate dari campaign ini tetap tersimpan.`,
    confirmLabel: 'Hapus campaign',
    onConfirm: () => { State.deleteCampaign(id); toast(`Campaign ${id} dihapus`, 'success'); rerender(); }
  });
}

function openCaseDrawer(caseId) {
  const c = NRW.getCase(caseId);
  if (!c) return;
  const customer = c.customerId ? NRW.getCustomer(c.customerId) : null;
  const zone = NRW.getZone(c.zoneId);
  const color = NRW.caseStatusColor(c.status);

  openDrawer(`
    <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-start gap-3" style="border-left:5px solid ${color}">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Commercial Case</div>
        <h2>${NRW.caseTypeLabel(c.type)}</h2>
        <div class="text-slate-400 mt-0.5">${c.id} · ${c.customerName} · Detected ${NRW.formatDate(c.detectedAt)}</div>
      </div>
      <button class="icon-btn" data-close>${icon('x', 'w-4 h-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      <div class="flex gap-2 items-center flex-wrap">
        <span class="priority priority-${c.priority.toLowerCase()}">${c.priority}</span>
        <span class="badge" style="background:${color}">${c.status}</span>
        <span class="text-slate-500">${c.customerType}</span>
        <div class="flex-1"></div>
        <select class="select-input text-[11px]" id="case-status-select">
          <option value="">Change status...</option>
          <option value="Open">Open</option><option value="InAudit">In Audit</option>
          <option value="AwaitingCustomer">Awaiting Customer</option><option value="PendingReplacement">Pending Replacement</option>
          <option value="Resolved">Resolved</option><option value="WrittenOff">Written Off</option>
        </select>
      </div>
      <div class="grid grid-cols-4 gap-2">
        ${miniMetric('Customer', c.customerName)}
        ${miniMetric('Zone', zone?.name || c.zoneId)}
        ${miniMetric('Assignee', c.assignee || 'unassigned')}
        ${miniMetric('Months affected', c.monthsAffected)}
        ${miniMetric('Est. revenue loss', NRW.formatIDR(c.estRevenueLossIDR), '#dc2626')}
        ${miniMetric('Est. recovery', NRW.formatIDR(c.estRecoveryIDR), '#10b981')}
        ${miniMetric('Detected', NRW.formatDate(c.detectedAt))}
        ${miniMetric('Due', c.dueDate ? NRW.formatDate(c.dueDate) : '-')}
      </div>
      <div><h4 class="mb-2.5">Description</h4><p class="text-slate-600 text-[13px] leading-relaxed">${c.description}</p></div>
      <div>
        <h4 class="mb-2.5">Case timeline</h4>
        <div class="timeline">${c.updates.map(u => `
          <div class="timeline-item"><div class="timeline-dot"></div>
            <div><div class="flex justify-between gap-3"><strong>${u.action}</strong><span class="text-slate-400 text-[11px]">${NRW.formatDateTime(u.ts)} · ${u.user}</span></div>${u.note ? `<div class="text-slate-500 text-xs mt-1">${u.note}</div>` : ''}</div>
          </div>`).join('')}</div>
      </div>
      ${customer ? `<div><h4 class="mb-2.5">Customer detail</h4><div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 cursor-pointer hover:bg-sky-50" data-customer="${customer.id}">
        <div><strong>${customer.name}</strong> · ${customer.type}</div>
        <div class="text-slate-400 text-[11px] mt-0.5">${customer.id} · Meter ${customer.meterId} (age ${customer.meterAge}y) · ${customer.zoneName}</div>
        <div class="text-slate-500 text-xs mt-2">Avg monthly: ${customer.avgMonthly} m³ · Last reading: ${customer.lastReading} m³ on ${NRW.formatDate(customer.lastReadingDate)}</div>
        <div class="text-slate-500 text-xs mt-1">Risk score: ${customer.riskScore}/100</div>
      </div></div>` : ''}
    </div>
    <div class="px-6 py-3.5 border-t border-slate-200 flex gap-2 justify-end">
      <button class="btn-secondary" data-close>Close</button>
      <button class="btn-secondary flex items-center gap-1.5" id="case-edit">${icon('pencil', 'w-3.5 h-3.5')} Edit</button>
      <button class="btn-danger flex items-center gap-1.5" id="case-delete">${icon('trash-2', 'w-3.5 h-3.5')} Delete</button>
      <button class="btn-primary flex items-center gap-1.5" id="case-create-wo">${icon('plus', 'w-3.5 h-3.5')} Spawn Work Order</button>
    </div>
  `, { kind: 'case', id: caseId });
  document.querySelectorAll('#drawer [data-customer]').forEach(b => b.addEventListener('click', () => openCustomerDrawer(b.dataset.customer)));
  document.getElementById('case-edit').addEventListener('click', () => openCaseFormModal(c));
  document.getElementById('case-delete').addEventListener('click', () => deleteCase(caseId));
  document.getElementById('case-status-select').addEventListener('change', e => {
    if (!e.target.value) return;
    State.updateCaseStatus(c.id, e.target.value);
    toast(`Case ${c.id} → ${e.target.value}`, 'success');
    setTimeout(() => openCaseDrawer(caseId), 100);
  });
  document.getElementById('case-create-wo').addEventListener('click', () => openCreateWOModal({ zoneId: c.zoneId, type: 'Commercial', priority: c.priority, title: `Audit · ${c.customerName}`, description: c.description }));
}

function openCaseFormModal(caseObj = null) {
  const isEdit = !!caseObj;
  openModal({
    title: isEdit ? `Edit case · ${caseObj.id}` : 'Open new commercial case',
    subtitle: isEdit ? 'Update case details' : 'Manually log a commercial loss case',
    size: 'md',
    body: `<form id="case-form" class="flex flex-col gap-3">
      ${selectField('Type', 'type', [
        { value: 'zero_consumption', label: 'Zero consumption' },
        { value: 'sudden_drop', label: 'Sudden drop' },
        { value: 'meter_malfunction', label: 'Meter malfunction' },
        { value: 'illegal_connection', label: 'Illegal connection' },
        { value: 'billing_dispute', label: 'Billing dispute' },
        { value: 'meter_age', label: 'Meter age' }
      ], caseObj?.type || 'zero_consumption', { required: true })}
      ${field('Customer name (or cluster description)', 'customerName', caseObj?.customerName || '', { required: true })}
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Customer type', 'customerType', ['Residential', 'Business', 'Cluster'], caseObj?.customerType || 'Residential')}
        ${selectField('Zone', 'zoneId', NRW.ZONES.map(z => ({ value: z.id, label: `${z.name} (${z.id})` })), caseObj?.zoneId || '', { required: true })}
      </div>
      <div class="grid grid-cols-3 gap-3">
        ${selectField('Priority', 'priority', ['Low', 'Medium', 'High', 'Critical'], caseObj?.priority || 'Medium', { required: true })}
        ${selectField('Status', 'status', ['Open', 'InAudit', 'AwaitingCustomer', 'PendingReplacement', 'Resolved', 'WrittenOff'], caseObj?.status || 'Open')}
        ${field('Months affected', 'monthsAffected', caseObj?.monthsAffected ?? 1, { type: 'number' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Est. revenue loss (IDR)', 'estRevenueLossIDR', caseObj?.estRevenueLossIDR ?? 0, { type: 'number' })}
        ${field('Est. recovery (IDR)', 'estRecoveryIDR', caseObj?.estRecoveryIDR ?? 0, { type: 'number' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Assignee', 'assignee', [{ value: '', label: '— unassigned —' }, 'Sari Wijaya', 'Dewi Anggraini', ...NRW.TEAMS.map(t => t.name)], caseObj?.assignee || '')}
        ${field('Due date', 'dueDate', caseObj?.dueDate || '2026-06-15', { type: 'date' })}
      </div>
      ${field('Description', 'description', caseObj?.description || '', { rows: 3 })}
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Open case'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#case-form')).entries());
      if (!data.customerName || !data.zoneId) { toast('Pelanggan dan zona wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateCase(caseObj.id, data); toast(`Kasus ${caseObj.id} tersimpan`, 'success'); }
      else { const c = State.createCase(data); toast(`Kasus ${c.id} dibuka`, 'success'); }
      rerender();
      return true;
    }
  });
}

function openCampaignFormModal(campaign = null) {
  const isEdit = !!campaign;
  openModal({
    title: isEdit ? `Edit campaign · ${campaign.id}` : 'Create recovery campaign',
    subtitle: isEdit ? 'Update campaign scope' : 'Plan a meter replacement, audit, or sweep',
    size: 'md',
    body: `<form id="campaign-form" class="flex flex-col gap-3">
      ${field('Campaign name', 'name', campaign?.name || '', { required: true, placeholder: 'e.g. Q3 2026 meter replacement' })}
      <div class="grid grid-cols-3 gap-3">
        ${selectField('Type', 'type', ['audit', 'meter_age', 'illegal', 'verification'], campaign?.type || 'audit')}
        ${selectField('Status', 'status', ['planning', 'active', 'completed'], campaign?.status || 'planning')}
        ${field('Target count', 'targetCount', campaign?.targetCount ?? 50, { type: 'number', required: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Start date', 'startedAt', campaign?.startedAt || '2026-06-02', { type: 'date' })}
        ${field('Planned end', 'plannedEnd', campaign?.plannedEnd || '2026-08-31', { type: 'date' })}
      </div>
      ${field('Affected zones (comma-separated IDs)', 'zoneIds', (campaign?.zoneIds || []).join(', '), { placeholder: 'DMA-001, DMA-003' })}
      ${field('Expected recovery (IDR)', 'expectedRecoveryIDR', campaign?.expectedRecoveryIDR ?? 0, { type: 'number' })}
      ${field('Description', 'description', campaign?.description || '', { rows: 2 })}
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Create campaign'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#campaign-form')).entries());
      if (!data.name) { toast('Nama wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateCampaign(campaign.id, data); toast(`Campaign tersimpan`, 'success'); }
      else { State.createCampaign(data); toast(`Campaign berhasil dibuat`, 'success'); }
      rerender();
      return true;
    }
  });
}

// ============ CRUD MODALS & ACTIONS ============
function field(label, name, value = '', opts = {}) {
  const { type = 'text', required = false, placeholder = '', rows } = opts;
  if (rows) return `<div><label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">${label}${required ? ' *' : ''}</label><textarea name="${name}" rows="${rows}" ${required ? 'required' : ''} class="select-input w-full mt-1" placeholder="${placeholder}">${value}</textarea></div>`;
  return `<div><label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">${label}${required ? ' *' : ''}</label><input type="${type}" name="${name}" value="${value}" ${required ? 'required' : ''} class="select-input w-full mt-1" placeholder="${placeholder}" /></div>`;
}

function selectField(label, name, options, value = '', opts = {}) {
  const { required = false } = opts;
  return `<div><label class="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">${label}${required ? ' *' : ''}</label><select name="${name}" ${required ? 'required' : ''} class="select-input w-full mt-1">${options.map(o => { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label; return `<option value="${v}" ${value === v ? 'selected' : ''}>${l}</option>`; }).join('')}</select></div>`;
}

// --- ZONE ---
function openZoneFormModal(zone = null) {
  const isEdit = !!zone;
  openModal({
    title: isEdit ? `Edit zone · ${zone.id}` : 'Create new zone',
    subtitle: isEdit ? 'Update zone master data' : 'Add a new DMA or pressure zone to the network',
    size: 'md',
    body: `<form id="zone-form" class="flex flex-col gap-3">
      ${field('Zone name', 'name', zone?.name || '', { required: true, placeholder: 'e.g. Cirebon Utara' })}
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Region', 'region', ['Cirebon', 'Indramayu'], zone?.region || 'Cirebon', { required: true })}
        ${selectField('Type', 'type', ['DMA', 'Pressure Zone', 'Branch Zone'], zone?.type || 'DMA', { required: true })}
      </div>
      <div class="grid grid-cols-3 gap-3">
        ${field('Customers', 'customers', zone?.customers ?? 0, { type: 'number' })}
        ${field('Input volume (m³/mo)', 'inputVolume', zone?.inputVolume ?? 30000, { type: 'number', required: true })}
        ${field('Billed volume (m³/mo)', 'billedVolume', zone?.billedVolume ?? 22500, { type: 'number', required: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Avg pressure (bar)', 'avgPressure', zone?.avgPressure ?? 2.8, { type: 'number' })}
        ${field('Baseline MNF (L/s)', 'baselineMNF', zone?.baselineMNF ?? 2.5, { type: 'number' })}
      </div>
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Create zone'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#zone-form')).entries());
      data.customers = Number(data.customers);
      data.inputVolume = Number(data.inputVolume);
      data.billedVolume = Number(data.billedVolume);
      data.avgPressure = Number(data.avgPressure);
      data.baselineMNF = Number(data.baselineMNF);
      if (!data.name || !data.inputVolume) { toast('Nama dan volume input wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateZone(zone.id, data); toast(`Zone ${zone.id} tersimpan`, 'success'); }
      else { const z = State.createZone(data); toast(`Zone ${z.id} berhasil dibuat`, 'success'); }
      rerender();
      return true;
    }
  });
}

function deleteZone(id) {
  const z = NRW.getZone(id);
  if (!z) return;
  confirm({
    title: 'Hapus zona ini?',
    message: `<strong>${z.name}</strong> (${z.id}) and its ${z.customers.toLocaleString()} customers and ${z.sensors} sensors will lose their zone association. Tindakan ini tidak bisa dibatalkan.`,
    confirmLabel: 'Hapus zona',
    onConfirm: () => { State.deleteZone(id); toast(`Zone ${id} dihapus`, 'success'); closeDrawer(); rerender(); }
  });
}

// --- SENSOR ---
function openSensorFormModal(sensor = null, prefill = {}) {
  const isEdit = !!sensor;
  openModal({
    title: isEdit ? `Edit sensor · ${sensor.id}` : 'Register new sensor',
    subtitle: isEdit ? 'Update sensor configuration' : 'Add a new flow, pressure, or acoustic sensor',
    size: 'md',
    body: `<form id="sensor-form" class="flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Type', 'type', [{ value: 'flow', label: 'Flow turbine' }, { value: 'pressure', label: 'Pressure transducer' }, { value: 'acoustic', label: 'Acoustic' }], sensor?.type || prefill.type || 'flow', { required: true })}
        ${selectField('Zone', 'zoneId', NRW.ZONES.map(z => ({ value: z.id, label: `${z.name} (${z.id})` })), sensor?.zoneId || prefill.zoneId || '', { required: true })}
      </div>
      ${field('Location label', 'location', sensor?.location || prefill.location || '', { required: true, placeholder: 'e.g. Inlet Main, Junction B' })}
      <div class="grid grid-cols-3 gap-3">
        ${selectField('Status', 'status', ['online', 'warning', 'offline'], sensor?.status || 'online')}
        ${field('Battery %', 'battery', sensor?.battery ?? 95, { type: 'number' })}
        ${field('Signal %', 'signalStrength', sensor?.signalStrength ?? 90, { type: 'number' })}
      </div>
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Register sensor'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#sensor-form')).entries());
      if (!data.type || !data.zoneId || !data.location) { toast('Tipe, zona, dan lokasi wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateSensor(sensor.id, data); toast(`Sensor ${sensor.id} tersimpan`, 'success'); }
      else { const s = State.createSensor(data); toast(`Sensor ${s.id} berhasil didaftarkan`, 'success'); }
      rerender();
      return true;
    }
  });
}

function deleteSensor(id) {
  const s = NRW.getSensor(id);
  if (!s) return;
  confirm({
    title: 'Hapus sensor ini?',
    message: `Sensor <strong>${s.id}</strong> (${s.type} at ${s.location}, ${s.zoneName}) akan dihapus dari registry dan asosiasi device-nya.`,
    confirmLabel: 'Hapus sensor',
    onConfirm: () => { State.deleteSensor(id); toast(`Sensor ${id} dihapus`, 'success'); closeDrawer(); rerender(); }
  });
}

// --- DEVICE ---
function openDeviceFormModal(device = null) {
  const isEdit = !!device;
  const modelOpts = [
    { value: 'outdoor_4g', label: 'Outdoor RIO · 4G LTE · Solar' },
    { value: 'outdoor_grid', label: 'Outdoor RIO · 4G LTE · Grid AC' },
    { value: 'indoor_wifi', label: 'Indoor RIO · WiFi · Modbus' },
    { value: 'indoor_eth', label: 'Indoor RIO · Ethernet · Modbus' }
  ];
  openModal({
    title: isEdit ? `Edit device · ${device.id}` : 'Register new telemetric device',
    subtitle: isEdit ? 'Update device configuration' : 'Add a new RIO unit to the network',
    size: 'md',
    body: `<form id="device-form" class="flex flex-col gap-3">
      ${field('Device name', 'name', device?.name || '', { placeholder: 'e.g. DMA-001 RIO' })}
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Model', 'modelKey', modelOpts, device?.modelKey || 'outdoor_4g', { required: true })}
        ${selectField('Zone', 'zoneId', NRW.ZONES.map(z => ({ value: z.id, label: `${z.name} (${z.id})` })), device?.zoneId || '', { required: true })}
      </div>
      ${field('Location', 'location', device?.location || '', { required: true, placeholder: 'e.g. DMA Boundary · Inlet Main' })}
      <div class="grid grid-cols-2 gap-3">
        ${field('IP address', 'ipAddress', device?.ipAddress || '', { placeholder: '10.42.1.100' })}
        ${field('Firmware', 'firmware', device?.firmware || 'v2.5.0')}
      </div>
      ${selectField('Status', 'status', ['online', 'warning', 'offline'], device?.status || 'online')}
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Register device'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#device-form')).entries());
      if (!data.modelKey || !data.zoneId || !data.location) { toast('Model, zona, dan lokasi wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateDevice(device.id, data); toast(`Device ${device.id} tersimpan`, 'success'); }
      else { const d = State.createDevice(data); toast(`Device ${d.id} berhasil didaftarkan`, 'success'); }
      rerender();
      return true;
    }
  });
}

function deleteDevice(id) {
  const d = NRW.getDevice(id);
  if (!d) return;
  confirm({
    title: 'Hapus device ini?',
    message: `Device <strong>${d.id}</strong> (${d.model}, ${d.location}) will be removed. Its ${d.sensorIds.length} sensor yang terhubung akan kehilangan asosiasi.`,
    confirmLabel: 'Hapus device',
    onConfirm: () => { State.deleteDevice(id); toast(`Device ${id} dihapus`, 'success'); closeDrawer(); rerender(); }
  });
}

// --- CUSTOMER ---
function openCustomerFormModal(customer = null) {
  const isEdit = !!customer;
  openModal({
    title: isEdit ? `Edit customer · ${customer.id}` : 'Add new customer',
    subtitle: isEdit ? 'Update customer master record' : 'Register a new water service customer',
    size: 'md',
    body: `<form id="customer-form" class="flex flex-col gap-3">
      ${field('Customer name', 'name', customer?.name || '', { required: true, placeholder: 'e.g. Wijaya Hartono' })}
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Type', 'type', ['Residential', 'Business'], customer?.type || 'Residential', { required: true })}
        ${selectField('Zone', 'zoneId', NRW.ZONES.map(z => ({ value: z.id, label: `${z.name} (${z.id})` })), customer?.zoneId || '', { required: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('Meter ID', 'meterId', customer?.meterId || '', { placeholder: 'e.g. MTR-001234' })}
        ${field('Meter age (years)', 'meterAge', customer?.meterAge ?? 1, { type: 'number' })}
      </div>
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Add customer'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#customer-form')).entries());
      if (!data.name || !data.zoneId) { toast('Nama dan zona wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateCustomer(customer.id, data); toast(`Pelanggan ${customer.id} tersimpan`, 'success'); }
      else { const c = State.createCustomer(data); toast(`Pelanggan ${c.id} berhasil ditambahkan`, 'success'); }
      rerender();
      return true;
    }
  });
}

function deleteCustomer(id) {
  const c = NRW.getCustomer(id);
  if (!c) return;
  confirm({
    title: 'Hapus pelanggan ini?',
    message: `Customer <strong>${c.name}</strong> (${c.id}) akan dihapus dari master pelanggan. Riwayat billing tetap tersimpan di audit log.`,
    confirmLabel: 'Hapus pelanggan',
    onConfirm: () => { State.deleteCustomer(id); toast(`Pelanggan ${id} dihapus`, 'success'); closeDrawer(); rerender(); }
  });
}

// --- TEAM ---
function openTeamFormModal(team = null) {
  const isEdit = !!team;
  openModal({
    title: isEdit ? `Edit team · ${team.id}` : 'Create new field team',
    subtitle: isEdit ? 'Update team profile and specialties' : 'Set up a new inspection or maintenance team',
    size: 'md',
    body: `<form id="team-form" class="flex flex-col gap-3">
      ${field('Team name', 'name', team?.name || '', { required: true, placeholder: 'e.g. Field Team Echo' })}
      <div class="grid grid-cols-2 gap-3">
        ${field('Team lead', 'lead', team?.lead || '', { required: true, placeholder: 'e.g. Pak Joko' })}
        ${field('Members', 'members', team?.members ?? 3, { type: 'number' })}
      </div>
      ${selectField('Region', 'region', ['Cirebon', 'Indramayu'], team?.region || 'Cirebon')}
      ${field('Specialties (comma-separated)', 'specialties', (team?.specialties || []).join(', '), { placeholder: 'Leak detection, Burst repair' })}
      ${selectField('Status', 'status', ['active', 'on-leave', 'training'], team?.status || 'active')}
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">${isEdit ? 'Save changes' : 'Create team'}</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#team-form')).entries());
      if (!data.name || !data.lead) { toast('Nama tim dan team lead wajib diisi', 'error'); return false; }
      if (isEdit) { State.updateTeam(team.id, data); toast(`Tim ${team.id} tersimpan`, 'success'); }
      else { const t = State.createTeam(data); toast(`Tim ${t.name} berhasil dibuat`, 'success'); }
      rerender();
      return true;
    }
  });
}

function deleteTeam(id) {
  const t = NRW.TEAMS.find(x => x.id === id);
  if (!t) return;
  confirm({
    title: 'Hapus tim ini?',
    message: `Team <strong>${t.name}</strong> (${t.id}) will be deleted. Any work orders yang saat ini di-assign ke tim ini akan tetap menampilkan nama, tetapi profil tim akan hilang.`,
    confirmLabel: 'Hapus tim',
    onConfirm: () => { State.deleteTeam(id); toast(`Tim ${id} dihapus`, 'success'); closeDrawer(); rerender(); }
  });
}

// --- WORK ORDER edit/delete ---
function openEditWOModal(woId) {
  const w = NRW.getWorkOrder(woId);
  if (!w) return;
  openModal({
    title: `Edit work order · ${w.id}`,
    subtitle: 'Update work order fields',
    size: 'md',
    body: `<form id="ewo-form" class="flex flex-col gap-3">
      ${field('Title', 'title', w.title, { required: true })}
      <div class="grid grid-cols-2 gap-3">
        ${selectField('Zone', 'zoneId', NRW.ZONES.map(z => ({ value: z.id, label: `${z.name} (${z.id})` })), w.zoneId, { required: true })}
        ${selectField('Type', 'type', ['Inspection', 'Commercial', 'Maintenance', 'Verification'], w.type, { required: true })}
      </div>
      <div class="grid grid-cols-3 gap-3">
        ${selectField('Priority', 'priority', ['Low', 'Medium', 'High', 'Critical'], w.priority, { required: true })}
        ${selectField('Assignee', 'assignee', [{ value: '', label: '— unassigned —' }, ...NRW.TEAMS.map(t => ({ value: t.name, label: t.name }))], w.assignee || '')}
        ${field('Due date', 'dueDate', w.dueDate, { type: 'date', required: true })}
      </div>
      ${field('Est. recovery (m³)', 'estRecoveryM3', w.estRecoveryM3 ?? 0, { type: 'number' })}
      ${field('Description', 'description', w.description, { rows: 3 })}
    </form>`,
    footer: `<button class="btn-secondary" data-modal-close>Cancel</button><button class="btn-primary" data-action="submit">Save changes</button>`,
    onAction: (action, overlay) => {
      if (action !== 'submit') return;
      const data = Object.fromEntries(new FormData(overlay.querySelector('#ewo-form')).entries());
      State.updateWorkOrder(w.id, data);
      toast(`Work order ${w.id} tersimpan`, 'success');
      rerender();
      return true;
    }
  });
}

function deleteWO(id) {
  const w = NRW.getWorkOrder(id);
  if (!w) return;
  confirm({
    title: 'Batalkan work order ini?',
    message: `<strong>${w.title}</strong> (${w.id}) akan dihapus dari antrian. Aksi ini dicatat di activity feed.`,
    confirmLabel: 'Batalkan WO',
    onConfirm: () => { State.deleteWorkOrder(id); toast(`Work order ${id} dibatalkan`, 'success'); closeDrawer(); rerender(); }
  });
}

function rowActions(editHandler, deleteHandler) {
  return `<div class="flex gap-0.5">
    <button class="row-action" data-row-edit title="Edit">${icon('pencil', 'w-3 h-3')}</button>
    <button class="row-action danger" data-row-delete title="Delete">${icon('trash-2', 'w-3 h-3')}</button>
  </div>`;
}

function wireRowActions(row, editHandler, deleteHandler) {
  row.querySelector('[data-row-edit]')?.addEventListener('click', e => { e.stopPropagation(); editHandler(); });
  row.querySelector('[data-row-delete]')?.addEventListener('click', e => { e.stopPropagation(); deleteHandler(); });
}

// ============ COMMAND PALETTE ============
function openCommandPalette() {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'cmdk-overlay';
  overlay.innerHTML = `
    <div class="cmdk">
      <div class="flex items-center gap-2 px-4 border-b border-slate-200">${icon('search', 'w-4 h-4 text-slate-400')}<input id="cmdk-input" class="cmdk-input flex-1 border-0" placeholder="Search or run a command..." autofocus /></div>
      <div class="overflow-y-auto flex-1 pb-2" id="cmdk-results"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  renderIcons();

  let activeIdx = 0;
  const close = () => { overlay.remove(); document.removeEventListener('keydown', keyHandler); };
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  function build(q) {
    const items = [];
    items.push({ section: 'Navigate', label: 'Dashboard', sub: 'Operations overview', iconName: 'layout-dashboard', kbd: 'gd', action: () => location.hash = '#/dashboard' });
    items.push({ section: 'Navigate', label: 'Network Map', sub: 'Zones, sensors, alarms', iconName: 'map', kbd: 'gm', action: () => location.hash = '#/map' });
    items.push({ section: 'Navigate', label: 'Savings · Wilayah', sub: 'Snapshot penghematan per region', iconName: 'trending-up', action: () => location.hash = '#/savings' });
    items.push({ section: 'Navigate', label: 'Work Orders', sub: 'Inspection queue', iconName: 'clipboard-list', kbd: 'gw', action: () => location.hash = '#/workorders' });
    items.push({ section: 'Navigate', label: 'Zones / DMA', sub: 'All monitoring zones', iconName: 'hexagon', kbd: 'gz', action: () => location.hash = '#/zones' });
    items.push({ section: 'Navigate', label: 'Alarms', sub: 'Active alerts', iconName: 'triangle-alert', kbd: 'ga', action: () => location.hash = '#/alarms' });
    items.push({ section: 'Navigate', label: 'Customers', sub: 'Customer master & anomalies', iconName: 'building-2', kbd: 'gc', action: () => location.hash = '#/customers' });
    items.push({ section: 'Navigate', label: 'MNF Analytics', sub: 'Zone comparison', iconName: 'activity', action: () => location.hash = '#/analytics' });
    items.push({ section: 'Navigate', label: 'Schedule', sub: 'Calendar view', iconName: 'calendar-days', kbd: 'gs', action: () => location.hash = '#/schedule' });
    items.push({ section: 'Navigate', label: 'Hardware Live', sub: 'Devices & live telemetry stream', iconName: 'cpu', kbd: 'gh', action: () => location.hash = '#/hardware' });
    items.push({ section: 'Navigate', label: 'Commercial Cases', sub: 'Cases, campaigns', iconName: 'banknote', action: () => location.hash = '#/commercial' });
    items.push({ section: 'Navigate', label: 'Commercial Map', sub: 'Kerugian vs keuntungan per zona', iconName: 'map-pin', action: () => location.hash = '#/commercialmap' });
    items.push({ section: 'Navigate', label: 'Pricing · Master Data', sub: 'Manage tariff tiers', iconName: 'banknote', action: () => location.hash = '#/pricing' });
    items.push({ section: 'Navigate', label: 'Reports', sub: 'Analytics & exports', iconName: 'bar-chart-3', kbd: 'gr', action: () => location.hash = '#/reports' });
    items.push({ section: 'Actions', label: 'Create work order', sub: 'New inspection or intervention task', iconName: 'plus', kbd: '⌘N', action: () => openCreateWOModal() });
    items.push({ section: 'Actions', label: 'Print current view', sub: 'Send to printer / save PDF', iconName: 'printer', kbd: '⌘P', action: () => window.print() });
    items.push({ section: 'Actions', label: 'Refresh data', sub: 'Re-render with fresh state', iconName: 'refresh-cw', action: () => rerender() });
    NRW.ZONES.forEach(z => items.push({ section: 'Zones', label: z.name, sub: `${z.id} · NRW ${z.nrwPercent}% · ${z.classification}`, iconName: 'hexagon', action: () => openZoneDrawer(z.id) }));
    NRW.WORK_ORDERS.forEach(w => items.push({ section: 'Work orders', label: w.title, sub: `${w.id} · ${w.status} · ${w.priority}`, iconName: 'clipboard-list', action: () => openWorkOrderDrawer(w.id) }));
    NRW.CUSTOMERS.slice(0, 20).forEach(c => items.push({ section: 'Customers', label: c.name, sub: `${c.id} · ${c.zoneName}`, iconName: 'building-2', action: () => openCustomerDrawer(c.id) }));
    NRW.DEVICES.forEach(d => items.push({ section: 'Devices', label: d.id, sub: `${d.location} · ${d.firmware}`, iconName: 'cpu', action: () => openDeviceDrawer(d.id) }));
    if (!q) return items.slice(0, 40);
    const lc = q.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(lc) || i.sub.toLowerCase().includes(lc) || i.section.toLowerCase().includes(lc)).slice(0, 40);
  }

  function render(q) {
    const items = build(q);
    if (!items.length) { overlay.querySelector('#cmdk-results').innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">No matches for "${q}"</div>`; return; }
    const grouped = {};
    items.forEach(i => (grouped[i.section] = grouped[i.section] || []).push(i));
    activeIdx = Math.min(activeIdx, items.length - 1);
    let html = '';
    let idx = 0;
    Object.entries(grouped).forEach(([sec, list]) => {
      html += `<div class="cmdk-section">${sec}</div>`;
      list.forEach(i => {
        const active = idx === activeIdx;
        html += `<div class="cmdk-item ${active ? 'active' : ''}" data-idx="${idx}"><div class="cmdk-item-icon">${icon(i.iconName, 'w-4 h-4')}</div><div class="flex-1 min-w-0"><div class="font-medium truncate">${i.label}</div><div class="text-[11px] text-slate-400 truncate">${i.sub}</div></div>${i.kbd ? `<span class="cmdk-kbd">${i.kbd}</span>` : ''}</div>`;
        idx++;
      });
    });
    overlay.querySelector('#cmdk-results').innerHTML = html;
    renderIcons();
    overlay.querySelectorAll('[data-idx]').forEach(el => {
      el.addEventListener('mouseenter', () => { activeIdx = Number(el.dataset.idx); render(input.value); });
      el.addEventListener('click', () => { const i = build(input.value)[Number(el.dataset.idx)]; if (i) { close(); i.action(); } });
    });
  }

  const input = overlay.querySelector('#cmdk-input');
  input.addEventListener('input', () => { activeIdx = 0; render(input.value); });

  function keyHandler(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx++; render(input.value); }
    if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); render(input.value); }
    if (e.key === 'Enter') { e.preventDefault(); const items = build(input.value); if (items[activeIdx]) { close(); items[activeIdx].action(); } }
  }
  document.addEventListener('keydown', keyHandler);
  render('');
}
