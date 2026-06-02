import { icon, renderIcons } from './icons.js';

const ICONS = {
  success: 'check',
  error: 'circle-alert',
  info: 'info',
  warn: 'triangle-alert'
};

function ensureContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(c);
  }
  return c;
}

export function toast(message, type = 'info', { duration = 3200 } = {}) {
  const container = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast-${type} pointer-events-auto`;
  el.innerHTML = `<span class="toast-icon">${icon(ICONS[type] || 'info', 'w-4 h-4')}</span><span class="flex-1">${message}</span><button class="toast-close" aria-label="Dismiss">${icon('x', 'w-3.5 h-3.5')}</button>`;
  container.appendChild(el);
  renderIcons();
  requestAnimationFrame(() => el.classList.add('toast-show'));
  const close = () => {
    el.classList.remove('toast-show');
    setTimeout(() => el.remove(), 250);
  };
  el.querySelector('.toast-close').addEventListener('click', close);
  if (duration) setTimeout(close, duration);
  return close;
}
