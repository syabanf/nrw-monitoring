import { Map, View, Feature, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Style, Stroke, Fill, Text, Circle as CircleStyle, RegularShape } from 'ol/style';

import {
  ZONES, SENSORS, WORK_ORDERS, ALARMS, PIPES,
  getZone, getSensor, JAKARTA_CENTER,
  classificationColor, severityColor, statusColor,
  formatM3, formatDateTime
} from './data.js';

let mapInstance = null;
let zoneLayer = null;
let sensorLayer = null;
let workOrderLayer = null;
let alarmLayer = null;
let pipeLayer = null;
let popupOverlay = null;
let onDrillFn = null;

export function initMap(containerId, options = {}) {
  const { center = JAKARTA_CENTER, zoom = 12, mini = false } = options;
  const projection = fromLonLat(center);

  zoneLayer = new VectorLayer({ source: new VectorSource({ features: buildZoneFeatures() }), style: zoneStyle, zIndex: 1 });
  pipeLayer = new VectorLayer({ source: new VectorSource({ features: buildPipeFeatures() }), style: pipeStyle, zIndex: 2, visible: !mini });
  sensorLayer = new VectorLayer({ source: new VectorSource({ features: buildSensorFeatures() }), style: sensorStyle, zIndex: 3, visible: !mini });
  workOrderLayer = new VectorLayer({ source: new VectorSource({ features: buildWorkOrderFeatures() }), style: workOrderStyle, zIndex: 4, visible: !mini });
  alarmLayer = new VectorLayer({ source: new VectorSource({ features: buildAlarmFeatures() }), style: alarmStyle, zIndex: 5, visible: !mini });

  mapInstance = new Map({
    target: containerId,
    layers: [
      new TileLayer({
        source: new XYZ({
          url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attributions: '© OpenStreetMap contributors',
          crossOrigin: 'anonymous'
        })
      }),
      zoneLayer, pipeLayer, sensorLayer, workOrderLayer, alarmLayer
    ],
    view: new View({ center: projection, zoom }),
    controls: []
  });

  if (!mini) {
    setupPopup(containerId);
    setupInteractions();
  }
  return mapInstance;
}

function buildZoneFeatures() {
  return ZONES.map(zone => {
    const coords = zone.polygon.map(ring => ring.map(c => fromLonLat(c)));
    const f = new Feature({ geometry: new Polygon(coords), kind: 'zone', data: zone });
    f.setId(zone.id);
    return f;
  });
}

function buildPipeFeatures() {
  return PIPES.map(p => {
    const coords = p.coords.map(c => fromLonLat(c));
    const f = new Feature({ geometry: new LineString(coords), kind: 'pipe', data: p });
    f.setId(p.id);
    return f;
  });
}

function pipeStyle(feature) {
  const p = feature.get('data');
  const color = p.status === 'repair_scheduled' ? '#f97316' : p.status === 'aging' ? '#f59e0b' : '#3b82f6';
  const width = Math.max(2, Math.min(6, p.diameter / 100));
  return new Style({ stroke: new Stroke({ color, width, lineDash: p.status === 'aging' ? [6, 4] : undefined }) });
}

function buildSensorFeatures() {
  return SENSORS.map(s => {
    const f = new Feature({ geometry: new Point(fromLonLat(s.coordinates)), kind: 'sensor', data: s });
    f.setId(s.id);
    return f;
  });
}

function buildWorkOrderFeatures() {
  const list = [];
  WORK_ORDERS.filter(w => !['Closed', 'Verified'].includes(w.status)).forEach(wo => {
    const zone = getZone(wo.zoneId);
    if (!zone) return;
    const offset = [(wo.id.charCodeAt(8) % 10 - 5) * 0.0008, (wo.id.charCodeAt(9) % 10 - 5) * 0.0008];
    const f = new Feature({
      geometry: new Point(fromLonLat([zone.center[0] + offset[0], zone.center[1] + offset[1]])),
      kind: 'workorder', data: wo
    });
    f.setId(wo.id);
    list.push(f);
  });
  return list;
}

function buildAlarmFeatures() {
  const list = [];
  ALARMS.filter(a => a.status === 'active' && ['critical', 'high'].includes(a.severity)).forEach(alarm => {
    let coords;
    if (alarm.sensorId) {
      const s = getSensor(alarm.sensorId);
      if (s) coords = s.coordinates;
    }
    if (!coords) {
      const z = getZone(alarm.zoneId);
      if (!z) return;
      coords = z.center;
    }
    const f = new Feature({ geometry: new Point(fromLonLat(coords)), kind: 'alarm', data: alarm });
    f.setId(alarm.id);
    list.push(f);
  });
  return list;
}

function zoneStyle(feature) {
  const zone = feature.get('data');
  const color = classificationColor(zone.classification);
  return new Style({
    stroke: new Stroke({ color, width: 2 }),
    fill: new Fill({ color: hexToRgba(color, 0.22) }),
    text: new Text({
      text: zone.id,
      font: 'bold 11px Inter, sans-serif',
      fill: new Fill({ color: '#0f172a' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      offsetY: -2
    })
  });
}

function sensorStyle(feature) {
  const s = feature.get('data');
  const color = s.status === 'online' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#94a3b8';
  const shape = s.type === 'flow' ? 'square' : s.type === 'pressure' ? 'circle' : 'triangle';
  return new Style({
    image: shape === 'circle'
      ? new CircleStyle({ radius: 5, fill: new Fill({ color }), stroke: new Stroke({ color: '#fff', width: 1.5 }) })
      : new RegularShape({
          points: shape === 'square' ? 4 : 3,
          radius: 6,
          angle: shape === 'square' ? Math.PI / 4 : 0,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: '#fff', width: 1.5 })
        })
  });
}

function workOrderStyle(feature) {
  const wo = feature.get('data');
  const color = wo.priority === 'Critical' ? '#dc2626' : wo.priority === 'High' ? '#f97316' : wo.priority === 'Medium' ? '#f59e0b' : '#3b82f6';
  return new Style({
    image: new RegularShape({
      points: 4, radius: 9, angle: Math.PI / 4,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#fff', width: 2 })
    }),
    text: new Text({
      text: 'W',
      font: 'bold 10px Inter, sans-serif',
      fill: new Fill({ color: '#fff' })
    })
  });
}

function alarmStyle(feature) {
  const a = feature.get('data');
  const color = a.severity === 'critical' ? '#dc2626' : '#f97316';
  return new Style({
    image: new CircleStyle({
      radius: 11,
      fill: new Fill({ color: hexToRgba(color, 0.4) }),
      stroke: new Stroke({ color, width: 2 })
    })
  });
}

function hexToRgba(hex, a) {
  const v = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function setupPopup(containerId) {
  const container = document.getElementById(containerId);
  let popupEl = container.querySelector('.map-popup');
  if (!popupEl) {
    popupEl = document.createElement('div');
    popupEl.className = 'map-popup';
    popupEl.style.display = 'none';
    container.appendChild(popupEl);
  }
  popupOverlay = new Overlay({
    element: popupEl,
    autoPan: { animation: { duration: 200 } },
    offset: [0, -12],
    positioning: 'bottom-center'
  });
  mapInstance.addOverlay(popupOverlay);
}

function setupInteractions() {
  mapInstance.on('pointermove', e => {
    mapInstance.getTargetElement().style.cursor = mapInstance.hasFeatureAtPixel(e.pixel) ? 'pointer' : '';
  });
  mapInstance.on('singleclick', e => {
    const features = mapInstance.getFeaturesAtPixel(e.pixel);
    if (!features.length) { hidePopup(); return; }
    const sorted = features.sort((a, b) => {
      const order = { alarm: 0, workorder: 1, sensor: 2, pipe: 3, zone: 4 };
      return order[a.get('kind')] - order[b.get('kind')];
    });
    showPopup(sorted[0], e.coordinate);
  });
}

function showPopup(feature, coordinate) {
  const kind = feature.get('kind');
  const data = feature.get('data');
  const el = popupOverlay.getElement();
  el.innerHTML = popupContent(kind, data);
  el.style.display = 'block';
  popupOverlay.setPosition(coordinate);
  const drillBtn = el.querySelector('[data-drill]');
  if (drillBtn) {
    drillBtn.onclick = () => {
      hidePopup();
      if (onDrillFn) onDrillFn(kind, data);
    };
  }
}

function hidePopup() {
  if (popupOverlay) {
    popupOverlay.getElement().style.display = 'none';
    popupOverlay.setPosition(undefined);
  }
}

function popupContent(kind, data) {
  if (kind === 'zone') {
    const color = classificationColor(data.classification);
    return `
      <div class="popup-header">
        <strong>${data.name}</strong>
        <span class="popup-id">${data.id}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>Region</span><strong>${data.region}</strong></div>
        <div class="popup-row"><span>Customers</span><strong>${data.customers.toLocaleString()}</strong></div>
        <div class="popup-row"><span>NRW</span><strong style="color:${color}">${data.nrwPercent}%</strong></div>
        <div class="popup-row"><span>Suspicion</span><strong>${data.suspicionScore} (${data.classification})</strong></div>
        <div class="popup-row"><span>MNF</span><strong>${data.minNightFlow} L/s</strong></div>
        <div class="popup-row"><span>Active alarms</span><strong>${data.activeAlarms}</strong></div>
      </div>
      <button class="popup-btn" data-drill>Open zone detail</button>
    `;
  }
  if (kind === 'sensor') {
    const color = data.status === 'online' ? '#10b981' : data.status === 'warning' ? '#f59e0b' : '#94a3b8';
    return `
      <div class="popup-header">
        <strong>${data.id}</strong>
        <span class="popup-id">${data.type.toUpperCase()}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>Zone</span><strong>${data.zoneName}</strong></div>
        <div class="popup-row"><span>Location</span><strong>${data.location}</strong></div>
        <div class="popup-row"><span>Status</span><strong style="color:${color}">● ${data.status}</strong></div>
        <div class="popup-row"><span>Last reading</span><strong>${data.lastReading} ${data.unit}</strong></div>
        <div class="popup-row"><span>Battery</span><strong>${data.battery}%</strong></div>
        <div class="popup-row"><span>Signal</span><strong>${data.signalStrength}%</strong></div>
      </div>
      <button class="popup-btn" data-drill>View sensor history</button>
    `;
  }
  if (kind === 'workorder') {
    const color = statusColor(data.status);
    return `
      <div class="popup-header">
        <strong>${data.id}</strong>
        <span class="popup-id" style="background:${color}">${data.status}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>Title</span><strong>${data.title}</strong></div>
        <div class="popup-row"><span>Priority</span><strong>${data.priority}</strong></div>
        <div class="popup-row"><span>Assignee</span><strong>${data.assignee || 'Unassigned'}</strong></div>
        <div class="popup-row"><span>Est. recovery</span><strong>${formatM3(data.estRecoveryM3)}</strong></div>
      </div>
      <button class="popup-btn" data-drill>Open work order</button>
    `;
  }
  if (kind === 'pipe') {
    const color = data.status === 'repair_scheduled' ? '#f97316' : data.status === 'aging' ? '#f59e0b' : '#3b82f6';
    return `
      <div class="popup-header">
        <strong>${data.id}</strong>
        <span class="popup-id" style="background:${color}">${data.status.replace('_', ' ')}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>Segment</span><strong>${data.from} → ${data.to}</strong></div>
        <div class="popup-row"><span>Diameter</span><strong>DN${data.diameter}</strong></div>
        <div class="popup-row"><span>Material</span><strong>${data.material}</strong></div>
        <div class="popup-row"><span>Length</span><strong>${data.lengthM} m</strong></div>
        <div class="popup-row"><span>Age</span><strong>${data.age} years</strong></div>
      </div>
    `;
  }
  if (kind === 'alarm') {
    const color = severityColor(data.severity);
    return `
      <div class="popup-header">
        <strong style="color:${color}">${data.severity.toUpperCase()} ALARM</strong>
        <span class="popup-id">${data.id}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>Type</span><strong>${data.type.replace(/_/g, ' ')}</strong></div>
        <div class="popup-row"><span>Zone</span><strong>${data.zoneId}</strong></div>
        ${data.sensorId ? `<div class="popup-row"><span>Sensor</span><strong>${data.sensorId}</strong></div>` : ''}
        <div class="popup-row"><span>Triggered</span><strong>${formatDateTime(data.triggeredAt)}</strong></div>
        <div class="popup-row" style="grid-template-columns:1fr"><span style="color:#475569">${data.message}</span></div>
      </div>
    `;
  }
  return '';
}

export function setLayerVisibility(name, visible) {
  const layers = { sensors: sensorLayer, workorders: workOrderLayer, alarms: alarmLayer, zones: zoneLayer, pipes: pipeLayer };
  if (layers[name]) layers[name].setVisible(visible);
}

export function focusZone(zoneId, opts = {}) {
  const zone = getZone(zoneId);
  if (!zone || !mapInstance) return;
  const extent = transformExtent(zone.bbox, 'EPSG:4326', 'EPSG:3857');
  mapInstance.getView().fit(extent, { duration: 500, padding: [50, 50, 50, 50], maxZoom: 16 });
  if (opts.openPopup) {
    const feature = zoneLayer.getSource().getFeatureById(zoneId);
    if (feature) showPopup(feature, fromLonLat(zone.center));
  }
}

export function resetView() {
  if (!mapInstance) return;
  mapInstance.getView().animate({ center: fromLonLat(JAKARTA_CENTER), zoom: 12, duration: 400 });
}

export function setOnDrill(fn) { onDrillFn = fn; }

export function destroyMap() {
  if (mapInstance) {
    mapInstance.setTarget(null);
    mapInstance = null;
  }
}
