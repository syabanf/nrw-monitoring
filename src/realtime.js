// Real-time hardware tick engine — simulates live MQTT telemetry
// Mutates SENSORS / DEVICES in place and publishes events to subscribers.

import { SENSORS, DEVICES } from './data.js';

const TICK_MS = 2000;
const STREAM_MAX = 80;
const STREAM = [];

let intervalId = null;
let tickCount = 0;
const subs = new Set();

function pushStream(entry) {
  STREAM.unshift(entry);
  if (STREAM.length > STREAM_MAX) STREAM.length = STREAM_MAX;
}

function publish(event) {
  subs.forEach(fn => { try { fn(event); } catch (e) { console.error(e); } });
}

function fmtTs(d = new Date()) {
  return d.toTimeString().slice(0, 8);
}

function tick() {
  tickCount++;
  const now = new Date();
  const updates = [];
  const messages = [];

  const onlineSensors = SENSORS.filter(s => s.status === 'online');
  onlineSensors.forEach(s => {
    const drift = (Math.random() - 0.5) * 0.06;
    const baseline = s.type === 'flow' ? 12 : s.type === 'pressure' ? 2.5 : 45;
    const pull = (baseline - s.lastReading) * 0.05;
    const next = s.lastReading + (s.lastReading * drift) + pull;
    s.lastReading = +Math.max(0.1, next).toFixed(2);
    s.lastReadingTime = now.toISOString();
    if (Math.random() < 0.015) s.battery = Math.max(0, s.battery - 1);
    s.signalStrength = Math.max(20, Math.min(100, s.signalStrength + Math.round((Math.random() - 0.5) * 4)));
    updates.push(s);
    if (Math.random() < 0.4) {
      const msg = { ts: now.toISOString(), sensorId: s.id, type: s.type, zoneId: s.zoneId, value: s.lastReading, unit: s.unit, level: 'info', text: `${s.id} ${s.type}=${s.lastReading}${s.unit}` };
      messages.push(msg);
      pushStream(msg);
    }
  });

  DEVICES.forEach(d => {
    if (d.status === 'online') {
      d.lastHeartbeat = now.toISOString();
      d.latencyMs = Math.max(40, Math.min(500, d.latencyMs + Math.round((Math.random() - 0.5) * 30)));
      d.signal = Math.max(20, Math.min(100, d.signal + Math.round((Math.random() - 0.5) * 3)));
      if (d.battery !== null) {
        if (Math.random() < 0.01) d.battery = Math.max(0, d.battery - 1);
      }
      if (tickCount % 5 === 0) {
        const msg = { ts: now.toISOString(), deviceId: d.id, level: 'info', text: `${d.id} heartbeat · ${d.latencyMs}ms · signal ${d.signal}%` };
        pushStream(msg);
        messages.push(msg);
      }
    }
  });

  if (tickCount % 12 === 0) {
    const offlineDev = DEVICES.find(d => d.status === 'offline');
    if (offlineDev && Math.random() < 0.3) {
      pushStream({ ts: now.toISOString(), deviceId: offlineDev.id, level: 'warn', text: `${offlineDev.id} reconnect attempt failed (timeout 5000ms)` });
    }
  }

  publish({ kind: 'tick', updates, messages, time: now.toISOString(), tickCount });
}

export function startRealtime() {
  if (intervalId) return;
  for (let i = 0; i < 10; i++) tick();
  intervalId = setInterval(tick, TICK_MS);
}

export function stopRealtime() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

export function subscribeRealtime(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function getStream() { return STREAM; }
export function getTickRate() { return TICK_MS; }
export function getTickCount() { return tickCount; }

export function getStats() {
  const onlineDev = DEVICES.filter(d => d.status === 'online').length;
  const onlineSnr = SENSORS.filter(s => s.status === 'online').length;
  const totalMsgsPerHour = DEVICES.filter(d => d.status === 'online').reduce((s, d) => s + d.msgsPerHour, 0);
  const avgLatency = Math.round(DEVICES.filter(d => d.status === 'online').reduce((s, d) => s + d.latencyMs, 0) / Math.max(1, onlineDev));
  const otaPending = DEVICES.filter(d => d.updateAvailable).length;
  return { onlineDev, totalDev: DEVICES.length, onlineSnr, totalSnr: SENSORS.length, msgsPerMin: Math.round(totalMsgsPerHour / 60), avgLatency, otaPending };
}
