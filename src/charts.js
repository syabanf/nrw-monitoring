import Chart from 'chart.js/auto';
import {
  ZONES, SENSORS, WORK_ORDERS, ALARMS, INTERVENTIONS,
  generateNRWTrend, generateRecoveryTrend, generateTimeseries, getZone,
  classificationColor, statusColor, formatIDR, formatM3
} from './data.js';

const instances = new Map();

const palette = {
  primary: '#0ea5e9', primarySoft: 'rgba(14, 165, 233, 0.15)',
  secondary: '#0369a1',
  success: '#10b981', successSoft: 'rgba(16, 185, 129, 0.15)',
  warning: '#f59e0b', warningSoft: 'rgba(245, 158, 11, 0.18)',
  danger: '#ef4444', dangerSoft: 'rgba(239, 68, 68, 0.18)',
  muted: '#94a3b8', grid: 'rgba(148, 163, 184, 0.2)', text: '#475569'
};

Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = palette.text;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;
Chart.defaults.plugins.legend.labels.usePointStyle = true;

function destroy(id) {
  if (instances.has(id)) { instances.get(id).destroy(); instances.delete(id); }
}

function create(id, config) {
  destroy(id);
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  const chart = new Chart(ctx, config);
  instances.set(id, chart);
  return chart;
}

export function destroyAllCharts() {
  instances.forEach(c => c.destroy());
  instances.clear();
}

export function destroyChart(id) { destroy(id); }

function lineOptions({ yLabel = '', yMin, xTicks = 8 } = {}) {
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: xTicks } },
      y: { beginAtZero: yMin !== undefined, grid: { color: palette.grid }, title: yLabel ? { display: true, text: yLabel } : undefined }
    }
  };
}

export function nrwTrend(canvasId) {
  const data = generateNRWTrend(12);
  return create(canvasId, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        { label: 'Total NRW %', data: data.overall, borderColor: palette.primary, backgroundColor: palette.primarySoft, fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5 },
        { label: 'Physical loss', data: data.physical, borderColor: palette.danger, backgroundColor: 'transparent', tension: 0.35, borderWidth: 2, borderDash: [4, 3], pointRadius: 2 },
        { label: 'Commercial loss', data: data.commercial, borderColor: palette.warning, backgroundColor: 'transparent', tension: 0.35, borderWidth: 2, borderDash: [4, 3], pointRadius: 2 }
      ]
    },
    options: lineOptions({ yLabel: '%', yMin: 0 })
  });
}

export function topLossZones(canvasId, limit = 5) {
  const sorted = [...ZONES].sort((a, b) => b.nrwPercent - a.nrwPercent).slice(0, limit);
  return create(canvasId, {
    type: 'bar',
    data: {
      labels: sorted.map(z => z.name),
      datasets: [{ label: 'NRW %', data: sorted.map(z => z.nrwPercent), backgroundColor: sorted.map(z => classificationColor(z.classification)), borderRadius: 4, maxBarThickness: 32 }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: ctx => { const z = sorted[ctx.dataIndex]; return [`Score: ${z.suspicionScore}`, `Loss: ${formatM3(z.inputVolume - z.billedVolume)}`]; } } } },
      scales: { x: { beginAtZero: true, grid: { color: palette.grid }, ticks: { callback: v => v + '%' } }, y: { grid: { display: false } } }
    }
  });
}

export function sensorHealth(canvasId) {
  const counts = SENSORS.reduce((a, s) => { a[s.status] = (a[s.status] || 0) + 1; return a; }, {});
  return create(canvasId, {
    type: 'doughnut',
    data: { labels: ['Online', 'Warning', 'Offline'], datasets: [{ data: [counts.online || 0, counts.warning || 0, counts.offline || 0], backgroundColor: [palette.success, palette.warning, palette.muted], borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} sensors (${((ctx.parsed / SENSORS.length) * 100).toFixed(1)}%)` } } } }
  });
}

export function recoveryTrend(canvasId) {
  const data = generateRecoveryTrend(6);
  return create(canvasId, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        { label: 'Water recovered (m³)', data: data.water, backgroundColor: palette.primary, borderRadius: 4, yAxisID: 'y', maxBarThickness: 36 },
        { label: 'Revenue recovered', data: data.revenue, type: 'line', borderColor: palette.success, backgroundColor: 'transparent', tension: 0.3, borderWidth: 2.5, yAxisID: 'y1', pointRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { display: false } },
        y: { position: 'left', beginAtZero: true, grid: { color: palette.grid }, title: { display: true, text: 'Water (m³)' } },
        y1: { position: 'right', beginAtZero: true, grid: { display: false }, title: { display: true, text: 'Revenue (IDR)' }, ticks: { callback: v => formatIDR(v) } }
      }
    }
  });
}

export function flowProfile(canvasId, zoneId) {
  const ts = generateTimeseries(zoneId, 7);
  return create(canvasId, {
    type: 'line',
    data: { labels: ts.flow.map(p => p.t), datasets: [{ label: 'Flow (L/s)', data: ts.flow.map(p => p.v), borderColor: palette.primary, backgroundColor: palette.primarySoft, fill: true, tension: 0.2, borderWidth: 1.5, pointRadius: 0 }] },
    options: lineOptions({ yLabel: 'L/s', xTicks: 12 })
  });
}

export function pressureProfile(canvasId, zoneId) {
  const ts = generateTimeseries(zoneId, 7);
  return create(canvasId, {
    type: 'line',
    data: { labels: ts.pressure.map(p => p.t), datasets: [{ label: 'Pressure (bar)', data: ts.pressure.map(p => p.v), borderColor: palette.secondary, backgroundColor: 'rgba(3, 105, 161, 0.12)', fill: true, tension: 0.2, borderWidth: 1.5, pointRadius: 0 }] },
    options: lineOptions({ yLabel: 'bar', xTicks: 12 })
  });
}

export function mnfTrend(canvasId, zoneId) {
  const ts = generateTimeseries(zoneId, 30);
  const zone = getZone(zoneId);
  return create(canvasId, {
    type: 'line',
    data: {
      labels: ts.mnf.map(p => p.t),
      datasets: [
        { label: 'Minimum Night Flow', data: ts.mnf.map(p => p.v), borderColor: palette.danger, backgroundColor: palette.dangerSoft, fill: true, tension: 0.3, borderWidth: 2, pointRadius: 2 },
        { label: 'Baseline', data: ts.mnf.map(() => zone.baselineMNF), borderColor: palette.muted, backgroundColor: 'transparent', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 }
      ]
    },
    options: lineOptions({ yLabel: 'L/s', yMin: 0 })
  });
}

export function suspicionBreakdown(canvasId) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  ZONES.forEach(z => { counts[z.classification]++; });
  return create(canvasId, {
    type: 'doughnut',
    data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: Object.keys(counts).map(c => classificationColor(c)), borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' } } }
  });
}

export function workOrderStatus(canvasId) {
  const counts = {};
  WORK_ORDERS.forEach(w => { counts[w.status] = (counts[w.status] || 0) + 1; });
  const labels = Object.keys(counts);
  return create(canvasId, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Count', data: Object.values(counts), backgroundColor: labels.map(l => statusColor(l)), borderRadius: 4, maxBarThickness: 40 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: palette.grid }, ticks: { precision: 0 } } } }
  });
}

export function interventionEffectiveness(canvasId) {
  const data = [...INTERVENTIONS].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  return create(canvasId, {
    type: 'bar',
    data: {
      labels: data.map(i => i.id.slice(-4)),
      datasets: [
        { label: 'Pre-action MNF', data: data.map(i => i.preActionMNF), backgroundColor: palette.muted, borderRadius: 3, maxBarThickness: 22 },
        { label: 'Post-action MNF', data: data.map(i => i.postActionMNF), backgroundColor: palette.success, borderRadius: 3, maxBarThickness: 22 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' }, tooltip: { callbacks: { afterLabel: ctx => { const i = data[ctx.dataIndex]; return [`Recovered: ${formatM3(i.waterRecoveredM3)}`, `Effectiveness: ${i.effectiveness}%`]; } } } },
      scales: { x: { grid: { display: false }, title: { display: true, text: 'Intervention ID (last 4)' } }, y: { beginAtZero: true, grid: { color: palette.grid }, title: { display: true, text: 'MNF (L/s)' } } }
    }
  });
}

export function alarmDistribution(canvasId) {
  const counts = {};
  ALARMS.filter(a => a.status === 'active').forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
  return create(canvasId, {
    type: 'polarArea',
    data: { labels: Object.keys(counts).map(k => k.replace(/_/g, ' ')), datasets: [{ data: Object.values(counts), backgroundColor: ['rgba(220, 38, 38, 0.65)','rgba(249, 115, 22, 0.65)','rgba(245, 158, 11, 0.65)','rgba(168, 85, 247, 0.65)','rgba(59, 130, 246, 0.65)','rgba(20, 184, 166, 0.65)'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
  });
}

export function zoneComparison(canvasId, zoneIds) {
  const zones = zoneIds.map(id => getZone(id)).filter(Boolean);
  return create(canvasId, {
    type: 'radar',
    data: {
      labels: ['NRW %', 'Suspicion', 'MNF Δ vs baseline', 'Pressure instab.', 'Active alarms', 'Open WO'],
      datasets: zones.map((z, i) => {
        const colors = ['#0ea5e9', '#ef4444', '#f59e0b', '#10b981'];
        const c = colors[i % colors.length];
        return {
          label: z.name,
          data: [z.nrwPercent, z.suspicionScore, Math.min(((z.minNightFlow - z.baselineMNF) / z.baselineMNF) * 100, 100), (1 - z.pressureStability) * 100, z.activeAlarms * 10, z.openWorkOrders * 15],
          borderColor: c, backgroundColor: c + '26', borderWidth: 2, pointRadius: 3
        };
      })
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } } } }
  });
}

export function commercialLossBreakdown(canvasId) {
  const sorted = [...ZONES].sort((a, b) => (b.inputVolume - b.billedVolume) - (a.inputVolume - a.billedVolume));
  return create(canvasId, {
    type: 'bar',
    data: {
      labels: sorted.map(z => z.name),
      datasets: [
        { label: 'Billed', data: sorted.map(z => z.billedVolume), backgroundColor: palette.success, stack: 's1', maxBarThickness: 26 },
        { label: 'Loss (unbilled)', data: sorted.map(z => z.inputVolume - z.billedVolume), backgroundColor: palette.danger, stack: 's1', borderRadius: { topLeft: 3, topRight: 3 }, maxBarThickness: 26 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { autoSkip: false, maxRotation: 35, minRotation: 35 } },
        y: { stacked: true, beginAtZero: true, grid: { color: palette.grid }, title: { display: true, text: 'Volume (m³)' } }
      }
    }
  });
}

export function customChart(canvasId, config) { return create(canvasId, config); }

export function sparkline(canvasId, data, color = '#0ea5e9') {
  return create(canvasId, {
    type: 'line',
    data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, backgroundColor: color + '22', fill: true, tension: 0.4, borderWidth: 1.5, pointRadius: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      elements: { line: { borderJoinStyle: 'round' } }
    }
  });
}

export function suspicionFactors(canvasId, factors) {
  return create(canvasId, {
    type: 'bar',
    data: {
      labels: factors.map(f => f.factor),
      datasets: [{
        label: 'Contribution',
        data: factors.map(f => Math.round(f.value * f.weight / 100)),
        backgroundColor: factors.map(f => f.value > 70 ? '#dc2626' : f.value > 40 ? '#f59e0b' : '#10b981'),
        borderRadius: 4,
        maxBarThickness: 20
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => { const f = factors[ctx.dataIndex]; return [`Weight: ${f.weight}%`, `Raw score: ${Math.round(f.value)}/100`, `Contribution: ${ctx.parsed.x} pts`]; } } } },
      scales: { x: { beginAtZero: true, max: 30, grid: { color: 'rgba(148,163,184,0.2)' }, title: { display: true, text: 'Weighted score contribution' } }, y: { grid: { display: false } } }
    }
  });
}

export function customerConsumption(canvasId, history) {
  const labels = ['M-12','M-11','M-10','M-9','M-8','M-7','M-6','M-5','M-4','M-3','M-2','M-1'].slice(-history.length);
  return create(canvasId, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Monthly consumption (m³)', data: history, backgroundColor: history.map((v, i) => { if (v === 0) return '#dc2626'; if (i > 0 && v < history[i-1] * 0.5) return '#f97316'; if (i > 0 && v > history[i-1] * 1.8) return '#a855f7'; return '#0ea5e9'; }), borderRadius: 3, maxBarThickness: 28 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' }, title: { display: true, text: 'm³' } } } }
  });
}

export function mnfHeatmap(canvasId, zones) {
  const datasets = zones.map((z, i) => {
    const colors = ['#0ea5e9', '#ef4444', '#f59e0b', '#10b981', '#a855f7', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'];
    return {
      label: z.name,
      data: Array.from({ length: 30 }, (_, d) => {
        const r = ((i * 9301 + d * 49297) % 233280) / 233280;
        const noise = (r - 0.5) * 0.4;
        return +(z.baselineMNF + (z.minNightFlow - z.baselineMNF) * (d / 30) + noise).toFixed(2);
      }),
      borderColor: colors[i % colors.length],
      backgroundColor: 'transparent',
      borderWidth: 1.8,
      pointRadius: 0,
      tension: 0.3
    };
  });
  return create(canvasId, {
    type: 'line',
    data: { labels: Array.from({ length: 30 }, (_, i) => `Day -${29 - i}`), datasets },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' }, title: { display: true, text: 'MNF (L/s)' } } } }
  });
}
