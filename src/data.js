// Pilot serves PDAM Tirta Giri Nata (Cirebon) × PDAM Tirta Darma Ayu (Indramayu).
// Map center sits between both service areas on the north coast of West Java.
export const JAKARTA_CENTER = [108.44, -6.55];
export const PILOT_CENTER = JAKARTA_CENTER;

export const ZONES = [
  // ===== CIREBON (5 zones) =====
  { id: 'DMA-001', name: 'Kejaksan Pusat', region: 'Cirebon', type: 'DMA', customers: 1450, sensors: 8, inputVolume: 45230, billedVolume: 32100, nrwPercent: 29.0, nrwTrend: 'down', nrwChange: -2.4, suspicionScore: 78, classification: 'High', center: [108.5520, -6.7320], bbox: [108.5440, -6.7390, 108.5600, -6.7250], minNightFlow: 4.2, baselineMNF: 2.8, avgPressure: 2.8, pressureStability: 0.85, activeAlarms: 2, openWorkOrders: 1, lastIntervention: '2026-04-18', estRevenue: 161250000 },
  { id: 'DMA-002', name: 'Lemahwungkuk Pelabuhan', region: 'Cirebon', type: 'Branch Zone', customers: 980, sensors: 6, inputVolume: 38450, billedVolume: 32680, nrwPercent: 15.0, nrwTrend: 'stable', nrwChange: 0.3, suspicionScore: 32, classification: 'Low', center: [108.5685, -6.7385], bbox: [108.5605, -6.7460, 108.5765, -6.7310], minNightFlow: 1.8, baselineMNF: 1.6, avgPressure: 3.2, pressureStability: 0.94, activeAlarms: 0, openWorkOrders: 0, lastIntervention: '2026-02-10', estRevenue: 158340000 },
  { id: 'DMA-003', name: 'Sumber Kabupaten', region: 'Cirebon', type: 'DMA', customers: 2120, sensors: 11, inputVolume: 62890, billedVolume: 38320, nrwPercent: 39.1, nrwTrend: 'up', nrwChange: 4.2, suspicionScore: 91, classification: 'Critical', center: [108.4800, -6.7600], bbox: [108.4700, -6.7700, 108.4900, -6.7500], minNightFlow: 8.7, baselineMNF: 3.4, avgPressure: 2.1, pressureStability: 0.62, activeAlarms: 4, openWorkOrders: 2, lastIntervention: '2025-11-22', estRevenue: 192600000 },
  { id: 'DMA-004', name: 'Plered Batik', region: 'Cirebon', type: 'DMA', customers: 1230, sensors: 9, inputVolume: 51200, billedVolume: 36850, nrwPercent: 28.0, nrwTrend: 'down', nrwChange: -1.8, suspicionScore: 71, classification: 'High', center: [108.4500, -6.7100], bbox: [108.4410, -6.7185, 108.4590, -6.7015], minNightFlow: 5.3, baselineMNF: 3.1, avgPressure: 2.6, pressureStability: 0.78, activeAlarms: 1, openWorkOrders: 1, lastIntervention: '2026-03-30', estRevenue: 184250000 },
  { id: 'DMA-005', name: 'Weru Heritage', region: 'Cirebon', type: 'Pressure Zone', customers: 720, sensors: 5, inputVolume: 28940, billedVolume: 22150, nrwPercent: 23.5, nrwTrend: 'down', nrwChange: -3.1, suspicionScore: 58, classification: 'Medium', center: [108.5100, -6.7250], bbox: [108.5035, -6.7315, 108.5165, -6.7185], minNightFlow: 2.9, baselineMNF: 2.4, avgPressure: 2.9, pressureStability: 0.88, activeAlarms: 1, openWorkOrders: 0, lastIntervention: '2026-05-08', estRevenue: 110750000 },

  // ===== INDRAMAYU (5 zones) =====
  { id: 'DMA-006', name: 'Balongan Industrial', region: 'Indramayu', type: 'Branch Zone', customers: 540, sensors: 7, inputVolume: 84300, billedVolume: 71200, nrwPercent: 15.5, nrwTrend: 'stable', nrwChange: 0.1, suspicionScore: 38, classification: 'Low', center: [108.4000, -6.3650], bbox: [108.3900, -6.3750, 108.4100, -6.3550], minNightFlow: 12.1, baselineMNF: 11.5, avgPressure: 3.5, pressureStability: 0.91, activeAlarms: 0, openWorkOrders: 0, lastIntervention: '2026-01-15', estRevenue: 356000000 },
  { id: 'DMA-007', name: 'Indramayu Kota', region: 'Indramayu', type: 'DMA', customers: 1980, sensors: 10, inputVolume: 58940, billedVolume: 39850, nrwPercent: 32.4, nrwTrend: 'up', nrwChange: 2.7, suspicionScore: 84, classification: 'High', center: [108.3232, -6.3373], bbox: [108.3140, -6.3460, 108.3324, -6.3286], minNightFlow: 6.4, baselineMNF: 3.2, avgPressure: 2.4, pressureStability: 0.71, activeAlarms: 3, openWorkOrders: 2, lastIntervention: '2025-12-12', estRevenue: 199250000 },
  { id: 'DMA-008', name: 'Haurgeulis Agri', region: 'Indramayu', type: 'Pressure Zone', customers: 890, sensors: 6, inputVolume: 42180, billedVolume: 35420, nrwPercent: 16.0, nrwTrend: 'stable', nrwChange: -0.5, suspicionScore: 41, classification: 'Low', center: [108.0700, -6.4400], bbox: [108.0625, -6.4475, 108.0775, -6.4325], minNightFlow: 2.3, baselineMNF: 2.1, avgPressure: 3.1, pressureStability: 0.92, activeAlarms: 0, openWorkOrders: 1, lastIntervention: '2026-03-02', estRevenue: 177100000 },
  { id: 'DMA-009', name: 'Sindang Coastal', region: 'Indramayu', type: 'DMA', customers: 1240, sensors: 8, inputVolume: 39820, billedVolume: 28640, nrwPercent: 28.1, nrwTrend: 'down', nrwChange: -1.2, suspicionScore: 68, classification: 'Medium', center: [108.3500, -6.3500], bbox: [108.3415, -6.3585, 108.3585, -6.3415], minNightFlow: 4.7, baselineMNF: 3.5, avgPressure: 2.7, pressureStability: 0.81, activeAlarms: 1, openWorkOrders: 1, lastIntervention: '2026-04-25', estRevenue: 143200000 },
  { id: 'DMA-010', name: 'Jatibarang Hub', region: 'Indramayu', type: 'DMA', customers: 1680, sensors: 7, inputVolume: 31650, billedVolume: 19450, nrwPercent: 38.5, nrwTrend: 'up', nrwChange: 5.8, suspicionScore: 88, classification: 'Critical', center: [108.3000, -6.4733], bbox: [108.2915, -6.4820, 108.3085, -6.4645], minNightFlow: 7.2, baselineMNF: 2.9, avgPressure: 2.0, pressureStability: 0.58, activeAlarms: 3, openWorkOrders: 2, lastIntervention: '2025-09-18', estRevenue: 97250000 }
];

ZONES.forEach(z => {
  const [w, s, e, n] = z.bbox;
  z.polygon = [[[w, s], [e, s], [e, n], [w, n], [w, s]]];
});

export const SENSORS = [];
let sensorCounter = 1;
ZONES.forEach(zone => {
  const types = ['flow', 'pressure', 'acoustic'];
  const locations = ['Inlet Main', 'Outlet North', 'Outlet South', 'Junction A', 'Junction B', 'Distribution Loop', 'Service Line', 'Reservoir Tap', 'PRV Downstream', 'Customer Cluster', 'Boundary Meter'];
  for (let i = 0; i < zone.sensors; i++) {
    const type = types[i % types.length];
    const offsetX = (Math.sin(sensorCounter * 1.7) * 0.008);
    const offsetY = (Math.cos(sensorCounter * 2.3) * 0.006);
    const r = ((sensorCounter * 9301 + 49297) % 233280) / 233280;
    let status = 'online';
    if (r < 0.06) status = 'offline';
    else if (r < 0.18) status = 'warning';
    SENSORS.push({
      id: `SNR-${String(sensorCounter).padStart(4, '0')}`,
      type, zoneId: zone.id, zoneName: zone.name,
      location: locations[i % locations.length],
      coordinates: [zone.center[0] + offsetX, zone.center[1] + offsetY],
      status,
      battery: Math.floor(40 + r * 60),
      signalStrength: Math.floor(50 + r * 50),
      lastReading: type === 'flow' ? +(2 + r * 18).toFixed(2)
                  : type === 'pressure' ? +(1.5 + r * 2.5).toFixed(2)
                  : +(20 + r * 60).toFixed(1),
      unit: type === 'flow' ? 'L/s' : type === 'pressure' ? 'bar' : 'dB',
      lastReadingTime: '2026-06-02T08:45:00',
      installedAt: '2025-08-15'
    });
    sensorCounter++;
  }
});

export const WORK_ORDERS = [
  { id: 'WO-2026-0142', title: 'Investigate critical MNF spike', zoneId: 'DMA-003', type: 'Inspection', priority: 'Critical', status: 'InProgress', assignee: 'Tim Cirebon Alpha', createdBy: 'Budi Santoso', createdAt: '2026-05-28T10:00:00', dueDate: '2026-06-03', description: 'MNF jumped from 3.4 to 8.7 L/s over 2 weeks. Acoustic sensor SNR-0021 detected unusual noise pattern at Junction B. Verify pipe condition and inspect for hidden leakage.', suspicionScore: 91, estRecoveryM3: 2400, estRecoveryIDR: 12000000,
    updates: [
      { ts: '2026-05-28T10:00', user: 'Budi Santoso', action: 'Created', note: 'Auto-generated from suspicion score threshold' },
      { ts: '2026-05-28T14:22', user: 'Dewi Anggraini', action: 'Assigned', note: 'Assigned to Tim Cirebon Alpha, priority Critical' },
      { ts: '2026-05-29T08:15', user: 'Tim Cirebon Alpha', action: 'In Progress', note: 'Team dispatched, ETA on site 09:30' },
      { ts: '2026-05-29T11:45', user: 'Tim Cirebon Alpha', action: 'Field Note', note: 'Surface inspection complete, no visible leak. Will deploy ground microphone tomorrow.' },
      { ts: '2026-05-30T15:20', user: 'Tim Cirebon Alpha', action: 'Field Note', note: 'Suspected sub-surface leak at coordinate near valve V-203. Excavation requested.' }
    ],
    evidence: [
      { type: 'photo', label: 'Junction B surface', ts: '2026-05-29T11:30' },
      { type: 'photo', label: 'Acoustic reading', ts: '2026-05-30T15:10' },
      { type: 'gps', label: 'Suspected leak point', coords: [106.8014, -6.2249], ts: '2026-05-30T15:20' }
    ] },
  { id: 'WO-2026-0141', title: 'Pressure instability investigation', zoneId: 'DMA-007', type: 'Inspection', priority: 'High', status: 'Assigned', assignee: 'Tim Cirebon Bravo', createdBy: 'Budi Santoso', createdAt: '2026-05-30T09:14:00', dueDate: '2026-06-04', description: 'Pressure stability dropped to 0.71. Repeated drops detected during peak hours suggest demand-supply imbalance or partially closed valve.', suspicionScore: 84, estRecoveryM3: 1850, estRecoveryIDR: 9250000,
    updates: [
      { ts: '2026-05-30T09:14', user: 'Budi Santoso', action: 'Created', note: 'Generated from pressure intelligence alert' },
      { ts: '2026-05-30T13:00', user: 'Dewi Anggraini', action: 'Assigned', note: 'Tim Cirebon Bravo notified' }
    ], evidence: [] },
  { id: 'WO-2026-0140', title: 'Customer meter audit - zero consumption cluster', zoneId: 'DMA-010', type: 'Commercial', priority: 'High', status: 'PendingEvidence', assignee: 'Tim Indramayu Charlie', createdBy: 'Sari Wijaya', createdAt: '2026-05-25T11:20:00', dueDate: '2026-06-02', description: '23 customers with zero consumption for 4+ months in Jatibarang Hub cluster. Verify meter condition and check for illegal bypass.', suspicionScore: 76, estRecoveryM3: 980, estRecoveryIDR: 4900000,
    updates: [
      { ts: '2026-05-25T11:20', user: 'Sari Wijaya', action: 'Created', note: 'Commercial loss analytics flagged cluster' },
      { ts: '2026-05-25T14:30', user: 'Dewi Anggraini', action: 'Assigned', note: 'Tim Indramayu Charlie assigned' },
      { ts: '2026-05-27T10:00', user: 'Tim Indramayu Charlie', action: 'In Progress', note: 'Started door-to-door audit' },
      { ts: '2026-05-31T16:40', user: 'Tim Indramayu Charlie', action: 'Pending Evidence', note: '18 of 23 audited. 4 broken meters, 2 inactive, 12 normal usage with meter reading error.' }
    ],
    evidence: [
      { type: 'photo', label: 'Broken meter #1', ts: '2026-05-27T10:45' },
      { type: 'photo', label: 'Broken meter #2', ts: '2026-05-27T11:30' },
      { type: 'document', label: 'Audit checklist', ts: '2026-05-31T16:35' }
    ] },
  { id: 'WO-2026-0139', title: 'Verify burst repair on main line', zoneId: 'DMA-001', type: 'Verification', priority: 'Medium', status: 'Verified', assignee: 'Tim Cirebon Alpha', createdBy: 'Budi Santoso', createdAt: '2026-05-20T08:00:00', dueDate: '2026-05-30', closedAt: '2026-05-29T16:00', description: 'Verify post-repair conditions after main pipe burst at Kejaksan Pusat. Confirm MNF reduction and pressure recovery.', suspicionScore: 65, estRecoveryM3: 3200, estRecoveryIDR: 16000000, actualRecoveryM3: 3450, actualRecoveryIDR: 17250000,
    updates: [
      { ts: '2026-05-20T08:00', user: 'Budi Santoso', action: 'Created', note: '' },
      { ts: '2026-05-20T11:30', user: 'Dewi Anggraini', action: 'Assigned', note: '' },
      { ts: '2026-05-21T09:00', user: 'Tim Cirebon Alpha', action: 'Completed', note: 'Measurements taken, MNF down to 4.2 L/s' },
      { ts: '2026-05-29T16:00', user: 'Dewi Anggraini', action: 'Verified', note: 'Recovery confirmed, exceeded estimate by 7.8%' }
    ],
    evidence: [
      { type: 'photo', label: 'Pre-repair', ts: '2026-05-21T09:00' },
      { type: 'photo', label: 'Post-repair', ts: '2026-05-21T11:00' },
      { type: 'document', label: 'MNF report', ts: '2026-05-21T15:00' }
    ] },
  { id: 'WO-2026-0138', title: 'PRV calibration check', zoneId: 'DMA-008', type: 'Maintenance', priority: 'Medium', status: 'Assigned', assignee: 'Tim Indramayu Delta', createdBy: 'Sari Wijaya', createdAt: '2026-05-29T14:30:00', dueDate: '2026-06-05', description: 'Routine PRV calibration based on quarterly schedule.', suspicionScore: 41, estRecoveryM3: 0, estRecoveryIDR: 0,
    updates: [
      { ts: '2026-05-29T14:30', user: 'Sari Wijaya', action: 'Created', note: 'Scheduled maintenance' },
      { ts: '2026-05-29T16:00', user: 'Dewi Anggraini', action: 'Assigned', note: '' }
    ], evidence: [] },
  { id: 'WO-2026-0137', title: 'High suspicion - acoustic anomaly', zoneId: 'DMA-004', type: 'Inspection', priority: 'High', status: 'Completed', assignee: 'Tim Cirebon Bravo', createdBy: 'Budi Santoso', createdAt: '2026-05-22T09:00:00', dueDate: '2026-05-30', description: 'Acoustic sensor flagged sustained noise pattern at Plered service line.', suspicionScore: 71, estRecoveryM3: 1500, estRecoveryIDR: 7500000, actualRecoveryM3: 1620, actualRecoveryIDR: 8100000,
    updates: [
      { ts: '2026-05-22T09:00', user: 'Budi Santoso', action: 'Created', note: '' },
      { ts: '2026-05-22T13:00', user: 'Dewi Anggraini', action: 'Assigned', note: '' },
      { ts: '2026-05-25T10:00', user: 'Tim Cirebon Bravo', action: 'In Progress', note: 'Located leak at service line connection' },
      { ts: '2026-05-26T14:00', user: 'Tim Cirebon Bravo', action: 'Completed', note: 'Repair complete, awaiting verification cycle' }
    ],
    evidence: [
      { type: 'photo', label: 'Leak located', ts: '2026-05-25T10:30' },
      { type: 'photo', label: 'Repair complete', ts: '2026-05-26T14:00' }
    ] },
  { id: 'WO-2026-0136', title: 'Sensor SNR-0019 offline > 48h', zoneId: 'DMA-003', type: 'Maintenance', priority: 'Medium', status: 'InProgress', assignee: 'Tim Indramayu Delta', createdBy: 'System', createdAt: '2026-05-31T03:15:00', dueDate: '2026-06-04', description: 'Pressure sensor offline since 2026-05-29 01:30. Battery reading was 23% before disconnect.', suspicionScore: 0, estRecoveryM3: 0, estRecoveryIDR: 0,
    updates: [
      { ts: '2026-05-31T03:15', user: 'System', action: 'Created', note: 'Auto-generated' },
      { ts: '2026-06-01T08:00', user: 'Dewi Anggraini', action: 'Assigned', note: '' },
      { ts: '2026-06-02T07:30', user: 'Tim Indramayu Delta', action: 'In Progress', note: 'En route with replacement battery' }
    ], evidence: [] },
  { id: 'WO-2026-0135', title: 'Verify commercial loss recovery', zoneId: 'DMA-005', type: 'Verification', priority: 'Low', status: 'Closed', assignee: 'Sari Wijaya', createdBy: 'Sari Wijaya', createdAt: '2026-05-05T10:00:00', dueDate: '2026-05-15', closedAt: '2026-05-14T17:00', description: 'Confirm billing correction and meter replacements yielded expected revenue recovery.', suspicionScore: 58, estRecoveryM3: 880, estRecoveryIDR: 4400000, actualRecoveryM3: 720, actualRecoveryIDR: 3600000,
    updates: [
      { ts: '2026-05-05T10:00', user: 'Sari Wijaya', action: 'Created', note: '' },
      { ts: '2026-05-14T17:00', user: 'Sari Wijaya', action: 'Closed', note: '82% of estimate achieved' }
    ],
    evidence: [{ type: 'document', label: 'Billing audit report', ts: '2026-05-14T16:30' }] },
  { id: 'WO-2026-0134', title: 'Investigate sudden flow drop', zoneId: 'DMA-009', type: 'Inspection', priority: 'Medium', status: 'Draft', assignee: null, createdBy: 'System', createdAt: '2026-06-01T22:40:00', dueDate: '2026-06-06', description: 'Flow rate at inlet dropped 35% in 30 minutes. Possible valve issue or upstream interruption.', suspicionScore: 62, estRecoveryM3: 1100, estRecoveryIDR: 5500000,
    updates: [{ ts: '2026-06-01T22:40', user: 'System', action: 'Created', note: 'Auto-generated from flow anomaly detection' }], evidence: [] },
  { id: 'WO-2026-0133', title: 'Schedule routine MNF baseline', zoneId: 'DMA-006', type: 'Maintenance', priority: 'Low', status: 'Closed', assignee: 'Analyst Team', createdBy: 'Budi Santoso', createdAt: '2026-04-20T08:00:00', dueDate: '2026-04-30', closedAt: '2026-04-28T14:00', description: 'Quarterly MNF baseline re-measurement.', suspicionScore: 0, estRecoveryM3: 0, estRecoveryIDR: 0,
    updates: [
      { ts: '2026-04-20T08:00', user: 'Budi Santoso', action: 'Created', note: '' },
      { ts: '2026-04-28T14:00', user: 'Analyst Team', action: 'Closed', note: 'Baseline updated to 11.5 L/s' }
    ],
    evidence: [{ type: 'document', label: 'Baseline report', ts: '2026-04-28T13:45' }] }
];

export const ALARMS = [
  { id: 'ALM-2026-3201', type: 'pressure_drop', severity: 'critical', zoneId: 'DMA-003', sensorId: 'SNR-0019', triggeredAt: '2026-06-02T07:42:00', message: 'Pressure dropped from 2.4 to 1.1 bar in 8 minutes', status: 'active' },
  { id: 'ALM-2026-3200', type: 'flow_anomaly', severity: 'critical', zoneId: 'DMA-003', sensorId: 'SNR-0017', triggeredAt: '2026-06-02T03:15:00', message: 'Night flow exceeded threshold by 156%', status: 'active' },
  { id: 'ALM-2026-3199', type: 'over_pressure', severity: 'high', zoneId: 'DMA-007', sensorId: 'SNR-0055', triggeredAt: '2026-06-02T05:30:00', message: 'Pressure exceeded 4.2 bar maximum', status: 'active' },
  { id: 'ALM-2026-3198', type: 'sensor_offline', severity: 'medium', zoneId: 'DMA-007', sensorId: 'SNR-0058', triggeredAt: '2026-06-01T22:15:00', message: 'Sensor lost communication > 6h', status: 'active' },
  { id: 'ALM-2026-3197', type: 'flow_anomaly', severity: 'high', zoneId: 'DMA-001', sensorId: 'SNR-0003', triggeredAt: '2026-06-01T19:20:00', message: 'Sustained MNF above baseline + 40%', status: 'active' },
  { id: 'ALM-2026-3196', type: 'pressure_instability', severity: 'high', zoneId: 'DMA-003', sensorId: 'SNR-0020', triggeredAt: '2026-06-01T14:45:00', message: 'Pressure variance exceeded stability threshold', status: 'active' },
  { id: 'ALM-2026-3195', type: 'commercial_anomaly', severity: 'medium', zoneId: 'DMA-010', sensorId: null, triggeredAt: '2026-06-01T08:00:00', message: '7 new zero-consumption customers detected', status: 'active' },
  { id: 'ALM-2026-3194', type: 'over_pressure', severity: 'high', zoneId: 'DMA-007', sensorId: 'SNR-0054', triggeredAt: '2026-05-31T22:30:00', message: 'Pressure exceeded 4.0 bar threshold', status: 'active' },
  { id: 'ALM-2026-3193', type: 'flow_anomaly', severity: 'medium', zoneId: 'DMA-010', sensorId: 'SNR-0067', triggeredAt: '2026-05-31T20:00:00', message: 'Night flow trending above baseline for 5 nights', status: 'active' },
  { id: 'ALM-2026-3192', type: 'sensor_battery', severity: 'medium', zoneId: 'DMA-005', sensorId: 'SNR-0034', triggeredAt: '2026-05-31T11:00:00', message: 'Battery below 30%', status: 'active' },
  { id: 'ALM-2026-3191', type: 'pressure_drop', severity: 'critical', zoneId: 'DMA-010', sensorId: 'SNR-0064', triggeredAt: '2026-05-31T06:18:00', message: 'Sudden pressure drop, possible burst', status: 'active' },
  { id: 'ALM-2026-3190', type: 'flow_anomaly', severity: 'high', zoneId: 'DMA-010', sensorId: 'SNR-0066', triggeredAt: '2026-05-30T23:50:00', message: 'Abnormal night flow signature', status: 'active' }
];

export const INTERVENTIONS = [
  { id: 'INT-2026-0089', workOrderId: 'WO-2026-0139', zoneId: 'DMA-001', type: 'Burst Repair', completedAt: '2026-05-21', preActionMNF: 6.8, postActionMNF: 4.2, mnfReduction: 2.6, waterRecoveredM3: 3450, revenueRecoveredIDR: 17250000, effectiveness: 38.2 },
  { id: 'INT-2026-0088', workOrderId: 'WO-2026-0137', zoneId: 'DMA-004', type: 'Service Line Repair', completedAt: '2026-05-26', preActionMNF: 6.4, postActionMNF: 5.3, mnfReduction: 1.1, waterRecoveredM3: 1620, revenueRecoveredIDR: 8100000, effectiveness: 17.2 },
  { id: 'INT-2026-0087', workOrderId: 'WO-2026-0135', zoneId: 'DMA-005', type: 'Meter Replacement', completedAt: '2026-05-14', preActionMNF: 3.2, postActionMNF: 2.9, mnfReduction: 0.3, waterRecoveredM3: 720, revenueRecoveredIDR: 3600000, effectiveness: 9.4 },
  { id: 'INT-2026-0086', workOrderId: 'WO-2026-0128', zoneId: 'DMA-002', type: 'PRV Adjustment', completedAt: '2026-04-30', preActionMNF: 2.1, postActionMNF: 1.8, mnfReduction: 0.3, waterRecoveredM3: 520, revenueRecoveredIDR: 2600000, effectiveness: 14.3 },
  { id: 'INT-2026-0085', workOrderId: 'WO-2026-0125', zoneId: 'DMA-009', type: 'Service Line Repair', completedAt: '2026-04-25', preActionMNF: 5.9, postActionMNF: 4.7, mnfReduction: 1.2, waterRecoveredM3: 1840, revenueRecoveredIDR: 9200000, effectiveness: 20.3 },
  { id: 'INT-2026-0084', workOrderId: 'WO-2026-0120', zoneId: 'DMA-008', type: 'Meter Replacement', completedAt: '2026-04-12', preActionMNF: 2.6, postActionMNF: 2.3, mnfReduction: 0.3, waterRecoveredM3: 450, revenueRecoveredIDR: 2250000, effectiveness: 11.5 },
  { id: 'INT-2026-0083', workOrderId: 'WO-2026-0118', zoneId: 'DMA-001', type: 'Bulk Meter Calibration', completedAt: '2026-04-08', preActionMNF: 7.2, postActionMNF: 6.8, mnfReduction: 0.4, waterRecoveredM3: 680, revenueRecoveredIDR: 3400000, effectiveness: 5.5 },
  { id: 'INT-2026-0082', workOrderId: 'WO-2026-0115', zoneId: 'DMA-006', type: 'Customer Audit', completedAt: '2026-03-22', preActionMNF: 12.4, postActionMNF: 12.1, mnfReduction: 0.3, waterRecoveredM3: 380, revenueRecoveredIDR: 1900000, effectiveness: 2.4 },
  { id: 'INT-2026-0081', workOrderId: 'WO-2026-0112', zoneId: 'DMA-004', type: 'Burst Repair', completedAt: '2026-03-30', preActionMNF: 7.8, postActionMNF: 5.3, mnfReduction: 2.5, waterRecoveredM3: 3120, revenueRecoveredIDR: 15600000, effectiveness: 32.1 }
];

export function generateTimeseries(zoneId, days = 30) {
  const zone = ZONES.find(z => z.id === zoneId);
  if (!zone) return { flow: [], pressure: [], mnf: [] };
  const flow = [], pressure = [], mnf = [];
  const baseFlow = zone.inputVolume / 30 / 24 / 3.6;
  for (let d = days - 1; d >= 0; d--) {
    for (let h = 0; h < 24; h++) {
      const t = `Day -${d} ${String(h).padStart(2, '0')}:00`;
      const seed = (d * 24 + h);
      const r1 = ((seed * 9301 + 49297) % 233280) / 233280;
      const r2 = ((seed * 1103 + 12345) % 233280) / 233280;
      const dayFactor = (h >= 6 && h <= 22) ? 1 + Math.sin((h - 6) * Math.PI / 16) * 0.6 : 0.25 + r1 * 0.15;
      const noise = (r2 - 0.5) * 0.2;
      flow.push({ t, v: +(baseFlow * dayFactor * (1 + noise)).toFixed(2) });
      pressure.push({ t, v: +(zone.avgPressure * (1 + (r1 - 0.5) * 0.3 * (2 - zone.pressureStability))).toFixed(2) });
    }
    const nightHours = [1, 2, 3, 4];
    const nightFlow = nightHours.reduce((s, h) => {
      const idx = (days - 1 - d) * 24 + h;
      return s + (flow[idx]?.v || 0);
    }, 0) / 4;
    mnf.push({ t: `Day -${d}`, v: +nightFlow.toFixed(2), baseline: zone.baselineMNF });
  }
  return { flow, pressure, mnf };
}

export function generateNRWTrend(months = 12) {
  const labels = [], overall = [], physical = [], commercial = [];
  const base = 32;
  for (let m = months - 1; m >= 0; m--) {
    const d = new Date('2026-06-01');
    d.setMonth(d.getMonth() - m);
    labels.push(d.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
    const r = ((m * 9301 + 49297) % 233280) / 233280;
    const trend = base - (months - m) * 0.4 + (r - 0.5) * 2;
    overall.push(+trend.toFixed(1));
    physical.push(+(trend * 0.62 + (r - 0.5) * 1).toFixed(1));
    commercial.push(+(trend * 0.38 + (r - 0.5) * 0.5).toFixed(1));
  }
  return { labels, overall, physical, commercial };
}

export function generateRecoveryTrend(months = 6) {
  const labels = [], water = [], revenue = [];
  for (let m = months - 1; m >= 0; m--) {
    const d = new Date('2026-06-01');
    d.setMonth(d.getMonth() - m);
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
    const r = ((m * 9301 + 49297) % 233280) / 233280;
    const w = 2400 + (months - m) * 380 + r * 800;
    water.push(Math.round(w));
    revenue.push(Math.round(w * 5000));
  }
  return { labels, water, revenue };
}

export const KPI = {
  totalNRW: 26.4,
  nrwTrend: -1.8,
  highRiskZones: ZONES.filter(z => ['High', 'Critical'].includes(z.classification)).length,
  openWorkOrders: WORK_ORDERS.filter(w => !['Closed', 'Verified'].includes(w.status)).length,
  completedThisMonth: WORK_ORDERS.filter(w => w.status === 'Verified' || w.status === 'Closed').length,
  waterRecoveredYTD: INTERVENTIONS.reduce((s, i) => s + i.waterRecoveredM3, 0),
  revenueRecoveredYTD: INTERVENTIONS.reduce((s, i) => s + i.revenueRecoveredIDR, 0),
  sensorUptime: ((SENSORS.filter(s => s.status === 'online').length / SENSORS.length) * 100).toFixed(1),
  activeAlarms: ALARMS.filter(a => a.status === 'active').length,
  criticalAlarms: ALARMS.filter(a => a.status === 'active' && a.severity === 'critical').length,
  avgResolutionDays: 6.8,
  totalCustomers: ZONES.reduce((s, z) => s + z.customers, 0),
  totalSensors: SENSORS.length,
  totalZones: ZONES.length
};

export function formatIDR(amount) {
  const sign = amount < 0 ? '−' : '';
  const abs = Math.abs(amount);
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)} M`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(1)} jt`;
  if (abs >= 1e3) return `${sign}Rp ${(abs / 1e3).toFixed(0)} rb`;
  return `${sign}Rp ${abs}`;
}
export function formatM3(volume) {
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)} jt m³`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}k m³`;
  return `${volume} m³`;
}
export function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export const getZone = id => ZONES.find(z => z.id === id);
export const getSensor = id => SENSORS.find(s => s.id === id);
export const getWorkOrder = id => WORK_ORDERS.find(w => w.id === id);
export const getZoneSensors = id => SENSORS.filter(s => s.zoneId === id);
export const getZoneWorkOrders = id => WORK_ORDERS.filter(w => w.zoneId === id);
export const getZoneInterventions = id => INTERVENTIONS.filter(i => i.zoneId === id);
export const getZoneAlarms = id => ALARMS.filter(a => a.zoneId === id);

export const classificationColor = c => ({ Critical: '#dc2626', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' }[c] || '#94a3b8');
export const severityColor = s => ({ critical: '#dc2626', high: '#f97316', medium: '#f59e0b', low: '#10b981' }[s] || '#94a3b8');
export const statusColor = s => ({ Draft: '#94a3b8', Assigned: '#3b82f6', InProgress: '#f59e0b', PendingEvidence: '#a855f7', Completed: '#10b981', Verified: '#059669', Rejected: '#ef4444', Closed: '#64748b' }[s] || '#94a3b8');

// Humanise camelCase / PascalCase / snake_case status strings for display.
// "InProgress" → "In progress", "WrittenOff" → "Written off", "zero_consumption" → "Zero consumption"
export function formatStatus(s) {
  if (!s) return '';
  const spaced = String(s).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function timeAgo(iso) {
  const d = new Date(iso);
  const now = new Date('2026-06-02T09:00:00');
  const mins = Math.floor((now - d) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

// ============ CUSTOMERS ============
const CUSTOMER_NAMES = [
  'Wijaya Hartono', 'Sari Kusuma', 'Eko Pratama', 'Rini Setiawati', 'Bambang Suryono',
  'Dewi Lestari', 'Agus Setiyono', 'Mariana Santoso', 'Yudi Hartanto', 'Indah Permata',
  'Hendro Wibowo', 'Lina Marlina', 'Suryadi Tanjung', 'Putri Anggraini', 'Joko Susilo',
  'Kartika Sari', 'Bayu Pradana', 'Nurul Hidayah', 'Rama Saputra', 'Wahyu Adityawarman',
  'Sinta Octaviani', 'Hadi Wijaya', 'Maya Sari', 'Dimas Pranata', 'Anita Rahmawati',
  'Rizky Ramadhan', 'Cici Suharti', 'Fajar Nugroho', 'Diana Puspitasari', 'Andika Pradana',
  'Lia Permatasari', 'Tony Halim', 'Ratna Dewi', 'Iwan Setiawan', 'Mira Anggraini',
  'Bagus Wicaksono', 'Tika Saraswati', 'Hari Mulyadi', 'Selly Wahyuni', 'Reza Mahendra',
  'Vera Anggraeni', 'Pandu Saputro', 'Linda Permana', 'Aji Pranoto', 'Wulan Sari',
  'Erik Halim', 'Tania Maharani', 'Doni Permana', 'Citra Dewi', 'Yoga Pratama',
  'Hotel Bentani Cirebon', 'PT Kilang Pertamina Balongan', 'Apartemen Indramayu Permai', 'RSUD Gunung Jati',
  'Cirebon Super Block Mall', 'Hotel Aston Cirebon', 'PT Industri Tekstil Sumber', 'Indramayu City Mall',
  'Keraton Kasepuhan Heritage', 'PT Pupuk Kujang Indramayu'
];

const ANOMALY_TYPES = [
  { code: 'zero_consumption', label: 'Zero consumption 4+ mo', severity: 'high' },
  { code: 'sudden_drop', label: 'Sudden 50%+ drop', severity: 'high' },
  { code: 'unusual_spike', label: 'Abnormal usage spike', severity: 'medium' },
  { code: 'old_meter', label: 'Meter age > 10y', severity: 'low' },
  { code: 'reading_inconsistent', label: 'Reading inconsistency', severity: 'medium' }
];

export const CUSTOMERS = [];
let custCounter = 1;
CUSTOMER_NAMES.forEach(name => {
  const r = ((custCounter * 9301 + 49297) % 233280) / 233280;
  const zone = ZONES[Math.floor(r * ZONES.length)];
  const isBusiness = name.startsWith('PT ') || name.startsWith('Hotel') || name.startsWith('RS ') || name.startsWith('Mall') || name.startsWith('Apartemen');
  const baseUsage = isBusiness ? 80 + r * 220 : 12 + r * 28;
  const history = [];
  for (let m = 11; m >= 0; m--) {
    const r2 = ((custCounter * (m + 1) * 1103 + 12345) % 233280) / 233280;
    const factor = 0.85 + r2 * 0.3;
    history.push(+(baseUsage * factor).toFixed(1));
  }
  const anomalies = [];
  if (r < 0.08) { history[history.length - 1] = 0; history[history.length - 2] = 0; history[history.length - 3] = 0; history[history.length - 4] = 0; anomalies.push(ANOMALY_TYPES[0]); }
  else if (r < 0.18) { history[history.length - 1] = +(history[history.length - 2] * 0.3).toFixed(1); anomalies.push(ANOMALY_TYPES[1]); }
  else if (r > 0.85) { history[history.length - 1] = +(history[history.length - 2] * 2.4).toFixed(1); anomalies.push(ANOMALY_TYPES[2]); }
  const meterAge = Math.floor(2 + r * 13);
  if (meterAge > 10) anomalies.push(ANOMALY_TYPES[3]);
  if (r > 0.7 && r < 0.78) anomalies.push(ANOMALY_TYPES[4]);

  CUSTOMERS.push({
    id: `CST-${String(custCounter).padStart(5, '0')}`,
    name, zoneId: zone.id, zoneName: zone.name,
    type: isBusiness ? 'Business' : 'Residential',
    meterId: `MTR-${String(custCounter * 7).padStart(6, '0')}`,
    meterAge,
    installedAt: `${2026 - meterAge}-05-15`,
    history,
    avgMonthly: +(history.reduce((s, v) => s + v, 0) / history.length).toFixed(1),
    lastReading: history[history.length - 1],
    lastReadingDate: '2026-05-31',
    anomalies,
    riskScore: Math.round(anomalies.reduce((s, a) => s + ({ high: 35, medium: 20, low: 10 }[a.severity] || 0), 0))
  });
  custCounter++;
});

// ============ PIPES ============
export const PIPES = [];
const pipeConnections = [
  ['DMA-001', 'DMA-002'], ['DMA-001', 'DMA-010'], ['DMA-002', 'DMA-008'],
  ['DMA-002', 'DMA-003'], ['DMA-003', 'DMA-004'], ['DMA-003', 'DMA-009'],
  ['DMA-004', 'DMA-005'], ['DMA-005', 'DMA-006'], ['DMA-007', 'DMA-008'],
  ['DMA-007', 'DMA-001'], ['DMA-009', 'DMA-004'], ['DMA-010', 'DMA-007']
];
pipeConnections.forEach(([a, b], i) => {
  const za = ZONES.find(z => z.id === a);
  const zb = ZONES.find(z => z.id === b);
  if (!za || !zb) return;
  const dia = [200, 300, 400, 500][i % 4];
  const installYear = 2008 + (i % 12);
  const r = ((i * 9301 + 49297) % 233280) / 233280;
  let status = 'operational';
  if (r < 0.15) status = 'repair_scheduled';
  else if (r < 0.25) status = 'aging';
  PIPES.push({
    id: `PIP-${String(i + 1).padStart(3, '0')}`,
    from: a, to: b,
    coords: [za.center, zb.center],
    diameter: dia,
    material: ['HDPE', 'Ductile Iron', 'Steel', 'PVC'][i % 4],
    installYear,
    age: 2026 - installYear,
    status,
    lengthM: Math.round(800 + r * 2200)
  });
});

// ============ NOTIFICATIONS ============
export const NOTIFICATIONS = [
  { id: 'NTF-2026-0012', ts: '2026-06-02T07:45:00', type: 'alarm_critical', title: 'Critical alarm in DMA-003', message: 'Pressure dropped 1.3 bar in 8 min', target: 'DMA-003', read: false },
  { id: 'NTF-2026-0011', ts: '2026-06-02T07:20:00', type: 'wo_due', title: 'WO-2026-0140 due today', message: 'Customer meter audit · Tim Indramayu Charlie', target: 'WO-2026-0140', read: false },
  { id: 'NTF-2026-0010', ts: '2026-06-02T06:15:00', type: 'alarm_high', title: 'High alarm in DMA-007', message: 'Over-pressure threshold exceeded', target: 'DMA-007', read: false },
  { id: 'NTF-2026-0009', ts: '2026-06-01T22:15:00', type: 'sensor_offline', title: 'Sensor offline', message: 'SNR-0058 lost communication for 6+ hours', target: 'SNR-0058', read: false },
  { id: 'NTF-2026-0008', ts: '2026-06-01T17:30:00', type: 'wo_complete', title: 'Work order completed', message: 'WO-2026-0137 · Plered service line repair', target: 'WO-2026-0137', read: true },
  { id: 'NTF-2026-0007', ts: '2026-06-01T16:00:00', type: 'intervention', title: 'Recovery confirmed', message: 'INT-2026-0089 exceeded estimate by 7.8%', target: 'INT-2026-0089', read: true },
  { id: 'NTF-2026-0006', ts: '2026-06-01T11:00:00', type: 'commercial', title: 'Commercial anomaly detected', message: '7 zero-consumption customers in DMA-010', target: 'DMA-010', read: true },
  { id: 'NTF-2026-0005', ts: '2026-05-31T14:30:00', type: 'wo_assigned', title: 'Work order assigned', message: 'WO-2026-0141 → Tim Cirebon Bravo', target: 'WO-2026-0141', read: true }
];

// ============ ACTIVITY FEED ============
export const ACTIVITY_FEED = [
  { ts: '2026-06-02T08:45:00', type: 'sensor', iconName: 'radio-tower', text: 'Sensor SNR-0019 went offline', target: 'SNR-0019' },
  { ts: '2026-06-02T07:42:00', type: 'alarm', iconName: 'triangle-alert', text: 'Critical pressure drop in DMA-003', target: 'DMA-003' },
  { ts: '2026-06-02T03:15:00', type: 'alarm', iconName: 'triangle-alert', text: 'Night flow exceeded baseline +156% in DMA-003', target: 'DMA-003' },
  { ts: '2026-06-01T17:00:00', type: 'wo', iconName: 'check', text: 'WO-2026-0137 marked complete', target: 'WO-2026-0137' },
  { ts: '2026-06-01T16:00:00', type: 'intervention', iconName: 'waves', text: 'INT-2026-0089: 3,450 m³ recovered', target: 'INT-2026-0089' },
  { ts: '2026-06-01T14:22:00', type: 'wo', iconName: 'clipboard-list', text: 'WO-2026-0142 assigned to Tim Cirebon Alpha', target: 'WO-2026-0142' },
  { ts: '2026-06-01T11:00:00', type: 'commercial', iconName: 'banknote', text: '7 zero-consumption customers detected in DMA-010', target: 'DMA-010' },
  { ts: '2026-06-01T09:30:00', type: 'wo', iconName: 'clipboard-list', text: 'WO-2026-0141 created from pressure alert', target: 'WO-2026-0141' },
  { ts: '2026-05-31T20:00:00', type: 'alarm', iconName: 'triangle-alert', text: 'Night flow trending high in DMA-010 for 5 nights', target: 'DMA-010' },
  { ts: '2026-05-31T16:40:00', type: 'wo', iconName: 'clipboard-list', text: 'WO-2026-0140 pending evidence — 18/23 audited', target: 'WO-2026-0140' },
  { ts: '2026-05-31T11:00:00', type: 'sensor', iconName: 'battery', text: 'Sensor SNR-0034 battery below 30%', target: 'SNR-0034' },
  { ts: '2026-05-31T06:18:00', type: 'alarm', iconName: 'triangle-alert', text: 'Possible burst in DMA-010 — pressure drop', target: 'DMA-010' }
];

// ============ TEAMS ============
export const TEAMS = [
  { id: 'TEAM-A', name: 'Tim Cirebon Alpha', lead: 'Pak Sutrisno', members: 4, region: 'Cirebon', specialties: ['Leak detection', 'Burst repair'], status: 'active', activeWO: 1 },
  { id: 'TEAM-B', name: 'Tim Cirebon Bravo', lead: 'Pak Hendrik', members: 4, region: 'Cirebon', specialties: ['Pressure management', 'PRV calibration'], status: 'active', activeWO: 1 },
  { id: 'TEAM-C', name: 'Tim Indramayu Charlie', lead: 'Pak Yudi', members: 3, region: 'Indramayu', specialties: ['Customer audit', 'Meter replacement'], status: 'active', activeWO: 1 },
  { id: 'TEAM-D', name: 'Tim Indramayu Delta', lead: 'Pak Rachman', members: 3, region: 'Indramayu', specialties: ['Sensor maintenance', 'Network repair'], status: 'active', activeWO: 2 }
];

// ============ HARDWARE / DEVICES ============
const DEVICE_MODELS = {
  outdoor_4g: { label: 'Outdoor RIO · 4G LTE · Solar', power: 'Solar 10WP + Battery 4.2V 18Ah', connectivity: '4G LTE', ip: 'IP66' },
  outdoor_grid: { label: 'Outdoor RIO · 4G LTE · Grid', power: '220VAC mains', connectivity: '4G LTE', ip: 'IP66' },
  indoor_wifi: { label: 'Indoor RIO · WiFi · Modbus', power: '12VDC', connectivity: '2.4 GHz WiFi', ip: 'IP60' },
  indoor_eth: { label: 'Indoor RIO · Ethernet · Modbus', power: '12VDC', connectivity: 'Ethernet RJ45', ip: 'IP60' }
};

export const DEVICES = [];
ZONES.forEach((zone, i) => {
  const modelKey = i % 4 === 0 ? 'indoor_wifi' : i % 4 === 1 ? 'outdoor_grid' : i % 4 === 2 ? 'outdoor_4g' : 'indoor_eth';
  const model = DEVICE_MODELS[modelKey];
  const r = ((i * 9301 + 49297) % 233280) / 233280;
  const fwMajor = 2; const fwMinor = 4; const fwPatch = i % 3;
  const firmware = `v${fwMajor}.${fwMinor}.${fwPatch}`;
  const updateAvailable = i % 3 !== 0;
  const status = r < 0.07 ? 'offline' : r < 0.15 ? 'warning' : 'online';
  const isOutdoor = modelKey.startsWith('outdoor');
  DEVICES.push({
    id: `DEV-${String(i + 1).padStart(3, '0')}`,
    name: `${zone.id} RIO`,
    modelKey,
    model: model.label,
    powerSource: model.power,
    connectivity: model.connectivity,
    ipRating: model.ip,
    location: `${zone.name} · ${isOutdoor ? 'DMA Boundary' : 'Pump Room'}`,
    zoneId: zone.id,
    coordinates: [zone.center[0] + (r - 0.5) * 0.004, zone.center[1] + (r - 0.5) * 0.003],
    ipAddress: `10.42.${zone.id.slice(-1)}.${100 + i}`,
    macAddress: `8C:1F:64:${(0xA0 + i).toString(16).toUpperCase()}:${(0x10 + i * 7).toString(16).padStart(2, '0').toUpperCase()}:${(0x42 + i).toString(16).padStart(2, '0').toUpperCase()}`,
    firmware,
    latestFirmware: `v2.5.0`,
    updateAvailable,
    otaStatus: 'idle',
    installedAt: '2025-08-15',
    lastHeartbeat: '2026-06-02T08:45:23',
    uptimeDays: Math.round(180 + r * 200),
    status,
    signal: Math.round(60 + r * 40),
    battery: isOutdoor ? Math.round(70 + r * 30) : null,
    msgsPerHour: Math.round(60 + r * 240),
    errorRate: +(r * 0.05).toFixed(3),
    latencyMs: Math.round(80 + r * 250),
    sensorIds: SENSORS.filter(s => s.zoneId === zone.id).map(s => s.id),
    operatingTempC: isOutdoor ? Math.round(28 + r * 12) : Math.round(20 + r * 8)
  });
});

export const OTA_CAMPAIGNS = [
  { id: 'OTA-2026-005', name: 'v2.5.0 — Pressure smoothing + Modbus stability', firmware: 'v2.5.0', status: 'in_progress', startedAt: '2026-05-28', targetDevices: 7, completed: 2, failed: 0 },
  { id: 'OTA-2026-004', name: 'v2.4.2 — Battery telemetry fix', firmware: 'v2.4.2', status: 'completed', startedAt: '2026-04-10', targetDevices: 10, completed: 10, failed: 0 },
  { id: 'OTA-2026-003', name: 'v2.4.1 — MQTT keepalive optimization', firmware: 'v2.4.1', status: 'completed', startedAt: '2026-03-05', targetDevices: 10, completed: 9, failed: 1 }
];

export const getDevice = id => DEVICES.find(d => d.id === id);
export const getZoneDevice = zoneId => DEVICES.find(d => d.zoneId === zoneId);
export const getDeviceSensors = deviceId => {
  const d = getDevice(deviceId);
  if (!d) return [];
  return d.sensorIds.map(sid => SENSORS.find(s => s.id === sid)).filter(Boolean);
};

// ============ HELPERS ============
export const getCustomer = id => CUSTOMERS.find(c => c.id === id);
export const getZoneCustomers = id => CUSTOMERS.filter(c => c.zoneId === id);

export function suspicionBreakdown(zone) {
  const mnfDeviation = Math.min(((zone.minNightFlow - zone.baselineMNF) / zone.baselineMNF) * 100, 100);
  const pressureInstab = (1 - zone.pressureStability) * 100;
  return [
    { factor: 'MNF anomaly', weight: 30, value: Math.max(0, Math.min(mnfDeviation * 1.2, 100)) },
    { factor: 'Pressure instability', weight: 20, value: Math.min(pressureInstab * 2, 100) },
    { factor: 'Flow increase trend', weight: 15, value: zone.nrwTrend === 'up' ? 70 + zone.nrwChange * 5 : 30 },
    { factor: 'Acoustic indication', weight: 15, value: zone.activeAlarms > 0 ? 60 + zone.activeAlarms * 10 : 20 },
    { factor: 'Repair history', weight: 10, value: zone.openWorkOrders * 25 + 20 },
    { factor: 'Commercial anomaly', weight: 10, value: Math.min(zone.nrwPercent * 1.5, 100) }
  ];
}

export function notificationIcon(type) {
  return ({
    alarm_critical: 'triangle-alert',
    alarm_high: 'circle-alert',
    wo_due: 'clock',
    wo_assigned: 'clipboard-list',
    wo_complete: 'check',
    wo_created: 'plus',
    sensor_offline: 'wifi-off',
    intervention: 'waves',
    commercial: 'banknote'
  })[type] || 'bell';
}

// ============ COMMERCIAL CASES ============
const CASE_TYPES = {
  zero_consumption: { label: 'Zero consumption', icon: 'circle-alert', priority: 'High' },
  sudden_drop: { label: 'Sudden consumption drop', icon: 'trending-down', priority: 'Medium' },
  meter_malfunction: { label: 'Suspected meter malfunction', icon: 'gauge', priority: 'Medium' },
  illegal_connection: { label: 'Illegal connection suspected', icon: 'triangle-alert', priority: 'Critical' },
  billing_dispute: { label: 'Billing dispute', icon: 'message-square', priority: 'Medium' },
  meter_age: { label: 'Meter replacement candidate', icon: 'wrench', priority: 'Low' }
};

const CASE_STATUSES = ['Open', 'InAudit', 'AwaitingCustomer', 'PendingReplacement', 'Resolved', 'WrittenOff'];

export const CASES = [];
let caseCounter = 1;
CUSTOMERS.filter(c => c.anomalies.length).slice(0, 18).forEach(c => {
  const anom = c.anomalies[0];
  let type = 'zero_consumption';
  if (anom.code === 'sudden_drop') type = 'sudden_drop';
  else if (anom.code === 'unusual_spike') type = 'meter_malfunction';
  else if (anom.code === 'old_meter') type = 'meter_age';
  else if (anom.code === 'reading_inconsistent') type = 'billing_dispute';
  const r = ((caseCounter * 9301 + 49297) % 233280) / 233280;
  const status = r < 0.45 ? 'Open' : r < 0.65 ? 'InAudit' : r < 0.78 ? 'AwaitingCustomer' : r < 0.88 ? 'PendingReplacement' : r < 0.96 ? 'Resolved' : 'WrittenOff';
  const monthsAffected = Math.floor(2 + r * 7);
  const monthlyLoss = c.avgMonthly * (c.type === 'Business' ? 5000 : 5000);
  const estRevenueLossIDR = Math.round(monthsAffected * monthlyLoss * (type === 'zero_consumption' ? 1 : type === 'sudden_drop' ? 0.5 : 0.3));
  const created = new Date('2026-06-02');
  created.setDate(created.getDate() - Math.floor(r * 45));
  const due = new Date('2026-06-02');
  due.setDate(due.getDate() + Math.floor(r * 14));
  CASES.push({
    id: `CASE-${String(caseCounter).padStart(4, '0')}`,
    type, status,
    customerId: c.id, customerName: c.name, customerType: c.type,
    zoneId: c.zoneId, zoneName: c.zoneName,
    estRevenueLossIDR,
    estRecoveryIDR: Math.round(estRevenueLossIDR * 0.7),
    monthsAffected,
    detectedAt: created.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    closedAt: ['Resolved', 'WrittenOff'].includes(status) ? '2026-05-25' : null,
    assignee: ['Sari Wijaya', 'Dewi Anggraini', 'Tim Indramayu Charlie'][caseCounter % 3],
    priority: CASE_TYPES[type].priority,
    description: `${CASE_TYPES[type].label} detected for customer ${c.name} (${c.id}) in zone ${c.zoneName}. ${monthsAffected} months affected.`,
    updates: [
      { ts: created.toISOString(), user: 'System', action: 'Detected', note: `Auto-flagged by commercial loss analytics — ${anom.label}` },
      ...(status !== 'Open' ? [{ ts: created.toISOString().replace(/T.*/, 'T10:00:00'), user: 'Sari Wijaya', action: 'Triaged', note: 'Case assigned for audit' }] : []),
      ...(['Resolved', 'WrittenOff'].includes(status) ? [{ ts: '2026-05-25T15:00:00', user: ['Sari Wijaya', 'Dewi Anggraini'][caseCounter % 2], action: status === 'Resolved' ? 'Resolved' : 'Written off', note: status === 'Resolved' ? `Meter replaced, billing corrected · recovered Rp ${(estRevenueLossIDR / 1e6).toFixed(1)}M` : 'Customer no longer at address, written off as unrecoverable' }] : [])
    ]
  });
  caseCounter++;
});

CASES.unshift({
  id: 'CASE-0019',
  type: 'illegal_connection',
  status: 'InAudit',
  customerId: null, customerName: '23 customers — Jatibarang cluster', customerType: 'Cluster',
  zoneId: 'DMA-010', zoneName: 'Jatibarang Hub',
  estRevenueLossIDR: 145000000, estRecoveryIDR: 87000000, monthsAffected: 6,
  detectedAt: '2026-05-25', dueDate: '2026-06-15', closedAt: null,
  assignee: 'Tim Indramayu Charlie', priority: 'Critical',
  description: 'Cluster of 23 customers in Jatibarang Hub with zero consumption for 4+ months. Sub-surface inspection revealed possible illegal tap upstream. Coordinated audit + structural inspection required.',
  updates: [
    { ts: '2026-05-25T11:00:00', user: 'System', action: 'Detected', note: 'Cluster flagged by zone-level commercial analytics' },
    { ts: '2026-05-25T14:30:00', user: 'Sari Wijaya', action: 'Triaged', note: 'Escalated to Critical — likely illegal tap' },
    { ts: '2026-05-27T10:00:00', user: 'Tim Indramayu Charlie', action: 'In Audit', note: 'Started door-to-door, 18/23 customers audited' },
    { ts: '2026-05-31T16:40:00', user: 'Tim Indramayu Charlie', action: 'Field Note', note: '4 broken meters, 2 inactive (verified vacated), 12 normal usage with meter reading error; 5 households still pending visit' }
  ]
});

// ============ METER REPLACEMENT CAMPAIGNS ============
export const CAMPAIGNS = [
  { id: 'CMP-2026-001', name: 'Q2 2026 — Meter age 15+ replacement', status: 'active', startedAt: '2026-04-01', plannedEnd: '2026-07-31', targetCount: 412, completedCount: 187, scheduledCount: 95, zoneIds: ['DMA-001', 'DMA-003', 'DMA-005', 'DMA-007', 'DMA-009'], expectedRecoveryIDR: 850000000, type: 'meter_age', description: 'Replace all customer meters older than 15 years across high-priority zones.' },
  { id: 'CMP-2026-002', name: 'Sumber cluster — Mass audit', status: 'active', startedAt: '2026-05-15', plannedEnd: '2026-06-30', targetCount: 87, completedCount: 32, scheduledCount: 20, zoneIds: ['DMA-003'], expectedRecoveryIDR: 245000000, type: 'audit', description: 'Door-to-door audit of zero-consumption + sudden-drop customers in Sumber Kabupaten.' },
  { id: 'CMP-2026-003', name: 'Jatibarang illegal connection sweep', status: 'planning', startedAt: '2026-06-10', plannedEnd: '2026-07-31', targetCount: 145, completedCount: 0, scheduledCount: 35, zoneIds: ['DMA-010'], expectedRecoveryIDR: 320000000, type: 'illegal', description: 'Structural inspection + customer audit to identify illegal connections upstream of Jatibarang DMA inlet.' },
  { id: 'CMP-2026-000', name: 'Q1 2026 — High-volume customer review', status: 'completed', startedAt: '2026-01-15', plannedEnd: '2026-03-31', targetCount: 64, completedCount: 64, scheduledCount: 0, zoneIds: ['DMA-002', 'DMA-006', 'DMA-008'], expectedRecoveryIDR: 420000000, actualRecoveryIDR: 378000000, type: 'audit', description: 'Audit of all top-quartile commercial customers — completed.' }
];

// ============ TARIFF STRUCTURE (MASTER DATA) ============
export const TARIFFS = [
  { id: 'TAR-R1', code: 'R1', tier: 'Residential · 0-10 m³', rate: 1500, type: 'Residential', minUsage: 0, maxUsage: 10, effectiveDate: '2026-01-01', status: 'active', description: 'Social tariff for low-income households (subsidised block)' },
  { id: 'TAR-R2', code: 'R2', tier: 'Residential · 11-20 m³', rate: 3500, type: 'Residential', minUsage: 11, maxUsage: 20, effectiveDate: '2026-01-01', status: 'active', description: 'Standard residential block' },
  { id: 'TAR-R3', code: 'R3', tier: 'Residential · 21+ m³', rate: 5500, type: 'Residential', minUsage: 21, maxUsage: null, effectiveDate: '2026-01-01', status: 'active', description: 'Progressive tariff — discourages high usage' },
  { id: 'TAR-B1', code: 'B1', tier: 'Business · Small', rate: 6500, type: 'Business', minUsage: 0, maxUsage: 50, effectiveDate: '2026-01-01', status: 'active', description: 'Small shops, offices, restaurants' },
  { id: 'TAR-B2', code: 'B2', tier: 'Business · Medium', rate: 8500, type: 'Business', minUsage: 51, maxUsage: 200, effectiveDate: '2026-01-01', status: 'active', description: 'Hospitality, medium commercial / mall' },
  { id: 'TAR-B3', code: 'B3', tier: 'Business · Industrial', rate: 11500, type: 'Business', minUsage: 201, maxUsage: null, effectiveDate: '2026-01-01', status: 'active', description: 'Industrial users, large hotels, hospitals' },
  { id: 'TAR-S1', code: 'S1', tier: 'Social · Public', rate: 800, type: 'Social', minUsage: 0, maxUsage: null, effectiveDate: '2026-01-01', status: 'active', description: 'Mosque, public water tap, school washroom' }
];

export const TARIFF_HISTORY = [
  { version: 'v2026.1', effectiveDate: '2026-01-01', status: 'active', changes: 'Annual tariff revision · +8% across the board · added Social Public tariff', approvedBy: 'PDAM Board', tariffSnapshot: 7 },
  { version: 'v2024.2', effectiveDate: '2024-07-01', status: 'archived', changes: 'Mid-year adjustment · industrial tariff +12%', approvedBy: 'PDAM Board', tariffSnapshot: 6 },
  { version: 'v2024.1', effectiveDate: '2024-01-01', status: 'archived', changes: 'Annual revision · 6 tariff blocks', approvedBy: 'PDAM Board', tariffSnapshot: 6 }
];

export const getTariff = id => TARIFFS.find(t => t.id === id);
export function customersByTariff() {
  const map = {};
  TARIFFS.forEach(t => { map[t.id] = []; });
  CUSTOMERS.forEach(c => {
    let bestTier;
    if (c.type === 'Business') {
      bestTier = TARIFFS.find(t => t.type === 'Business' && c.avgMonthly >= t.minUsage && (t.maxUsage === null || c.avgMonthly <= t.maxUsage));
    } else {
      bestTier = TARIFFS.find(t => t.type === 'Residential' && c.avgMonthly >= t.minUsage && (t.maxUsage === null || c.avgMonthly <= t.maxUsage));
    }
    if (bestTier) map[bestTier.id].push(c);
  });
  return map;
}

// Commercial zone aggregates — for commercial map view
export function zoneCommercialMetrics(zoneId) {
  const cases = CASES.filter(c => c.zoneId === zoneId);
  const openCases = cases.filter(c => !['Resolved', 'WrittenOff'].includes(c.status));
  const resolvedCases = cases.filter(c => c.status === 'Resolved');
  const revenueAtRisk = openCases.reduce((s, c) => s + c.estRevenueLossIDR, 0);
  const revenueRecovered = resolvedCases.reduce((s, c) => s + c.estRecoveryIDR, 0);
  const interventionRev = INTERVENTIONS.filter(i => i.zoneId === zoneId).reduce((s, i) => s + i.revenueRecoveredIDR, 0);
  const totalRecovered = revenueRecovered + interventionRev;
  return { cases, openCases, resolvedCases, revenueAtRisk, totalRecovered, netPosition: totalRecovered - revenueAtRisk };
}

export function caseTypeLabel(type) { return CASE_TYPES[type]?.label || type; }
export function caseTypeIcon(type) { return CASE_TYPES[type]?.icon || 'circle-alert'; }
export function caseStatusColor(status) {
  return ({ Open: '#dc2626', InAudit: '#f59e0b', AwaitingCustomer: '#a855f7', PendingReplacement: '#3b82f6', Resolved: '#10b981', WrittenOff: '#64748b' })[status] || '#94a3b8';
}
export const getCase = id => CASES.find(c => c.id === id);
export const getCampaign = id => CAMPAIGNS.find(c => c.id === id);

export function notificationColor(type) {
  return ({
    alarm_critical: '#dc2626',
    alarm_high: '#f97316',
    wo_due: '#f59e0b',
    wo_assigned: '#3b82f6',
    wo_complete: '#10b981',
    wo_created: '#0ea5e9',
    sensor_offline: '#94a3b8',
    intervention: '#10b981',
    commercial: '#a855f7'
  })[type] || '#64748b';
}
