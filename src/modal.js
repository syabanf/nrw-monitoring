import { icon, renderIcons } from './icons.js';

let currentClose = null;

export function openModal({ title, subtitle = '', body, footer = '', size = 'md', onAction, onClose }) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 p-4';
  const widthCls = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size] || 'max-w-xl';
  overlay.innerHTML = `
    <div class="modal-card bg-white rounded-xl shadow-2xl w-full ${widthCls} max-h-[90vh] flex flex-col overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200 flex justify-between items-start gap-3">
        <div>
          <h2 class="text-base font-semibold">${title}</h2>
          ${subtitle ? `<div class="text-slate-500 text-xs mt-0.5">${subtitle}</div>` : ''}
        </div>
        <button class="icon-btn" data-modal-close>${icon('x', 'w-4 h-4')}</button>
      </div>
      <div class="px-5 py-4 overflow-y-auto flex-1" id="modal-body">${typeof body === 'string' ? body : ''}</div>
      ${footer ? `<div class="px-5 py-3 border-t border-slate-200 flex gap-2 justify-end" id="modal-footer">${footer}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  if (typeof body !== 'string') document.getElementById('modal-body').appendChild(body);
  renderIcons();

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', escHandler);
    currentClose = null;
    onClose && onClose();
  };
  currentClose = close;

  overlay.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', close));
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  if (onAction) {
    overlay.querySelectorAll('[data-action]').forEach(b => {
      b.addEventListener('click', () => {
        const result = onAction(b.dataset.action, overlay);
        if (result !== false) close();
      });
    });
  }

  const escHandler = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', escHandler);

  return { close, element: overlay };
}

export function closeModal() {
  if (currentClose) currentClose();
}
