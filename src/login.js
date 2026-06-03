import { login, quickLogin, USERS } from './auth.js';
import { renderIcons, icon } from './icons.js';
import { toast } from './toast.js';

const USER_TIPS = {
  'budi@pdam.id': 'Approves work orders, validates intervention results, and signs off on recovery KPIs.',
  'dewi@pdam.id': 'Triages incoming alarms, dispatches teams, and runs the daily operations console.',
  'sari@pdam.id': 'Investigates commercial loss patterns, builds reports, manages billing audits.',
  'sutrisno@pdam.id': 'Receives field assignments, uploads inspection photos & GPS, updates WO status from the field.',
  'rachman@pdam.id': 'Reads executive dashboards, monitors recovery ROI, signs off on quarterly KPIs.',
  'admin@pdam.id': 'Full system access — manages users, integrations, and master data.'
};

export function renderLogin(onSuccess) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <!-- LEFT: Brand / Marketing pane -->
      <aside class="relative bg-gradient-to-br from-sidebar via-sidebar2 to-sidebar text-slate-100 p-10 lg:p-14 flex flex-col overflow-hidden">
        <div class="absolute inset-0 opacity-30 pointer-events-none" style="background-image: radial-gradient(circle at 25% 20%, rgba(14,165,233,0.4) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.25) 0%, transparent 50%);"></div>
        <div class="absolute inset-0 opacity-[0.06] pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 40px 40px;"></div>

        <div class="relative z-10 flex items-center gap-3">
          <div class="w-11 h-11 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl grid place-items-center text-white font-bold tracking-wide shadow-lg">NRW</div>
          <div>
            <div class="font-semibold text-base">Recovery System</div>
            <div class="text-slate-400 text-[12px]">PDAM Jakarta · Pilot</div>
          </div>
        </div>

        <div class="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          <div class="text-[11px] uppercase tracking-widest text-sky-400 font-semibold mb-3">NON-REVENUE WATER MANAGEMENT</div>
          <h1 class="text-3xl lg:text-4xl font-bold leading-tight mb-4 text-white">Move from fragmented monitoring to structured recovery workflow.</h1>
          <p class="text-slate-300 text-sm leading-relaxed mb-8">Identify high-loss zones, classify likely loss sources, prioritise field action, and measure before-after recovery — all in one operations engine.</p>

          <div class="grid grid-cols-3 gap-3">
            <div class="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3">
              <div class="text-2xl font-bold text-sky-400">10</div>
              <div class="text-[11px] text-slate-400 mt-0.5">DMA / Zones monitored</div>
            </div>
            <div class="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3">
              <div class="text-2xl font-bold text-emerald-400">77</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Sensors deployed</div>
            </div>
            <div class="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-3">
              <div class="text-2xl font-bold text-amber-400">12.8k</div>
              <div class="text-[11px] text-slate-400 mt-0.5">m³ recovered YTD</div>
            </div>
          </div>

          <div class="mt-8 flex items-center gap-3 text-[12px] text-slate-400">
            <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>System operational</div>
            <span class="text-slate-700">·</span>
            <span>v0.2.0 · 02 Jun 2026</span>
          </div>
        </div>

        <div class="relative z-10 text-[11px] text-slate-500">
          © 2026 PDAM Jakarta · NRW Recovery System
        </div>
      </aside>

      <!-- RIGHT: Login form pane -->
      <main class="flex items-center justify-center p-6 lg:p-10 bg-white overflow-y-auto">
        <div class="w-full max-w-md">
          <!-- Demo banner -->
          <div class="flex items-center gap-2.5 px-3.5 py-2.5 bg-sky-50 border border-sky-200 rounded-lg mb-6">
            <div class="w-7 h-7 bg-sky-500 rounded-full grid place-items-center text-white shrink-0">${icon('eye', 'w-3.5 h-3.5')}</div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-sky-900">Demo environment</div>
              <div class="text-[11px] text-sky-700">Pick any role below — no real PDAM data is affected.</div>
            </div>
          </div>

          <div class="mb-5">
            <h2 class="text-xl font-semibold mb-1">Welcome back</h2>
            <p class="text-slate-500 text-sm">Sign in to your operations dashboard</p>
          </div>

          <!-- Demo accounts FIRST for fast access -->
          <div class="flex items-center gap-2 mb-3">
            <div class="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Tour as</div>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>
          <div class="grid grid-cols-1 gap-2 mb-5">
            ${USERS.map(u => `
              <button class="quick-user flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-lg hover:border-sky-500 hover:bg-sky-50 transition-colors text-left group" data-quick="${u.email}">
                <div class="w-9 h-9 bg-gradient-to-br ${u.avatar} rounded-full grid place-items-center text-white font-semibold text-[11px] shrink-0">${u.initials}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2"><div class="text-[13px] font-semibold truncate">${u.name}</div><span class="text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">${u.role}</span></div>
                  <div class="text-[10.5px] text-slate-500 truncate mt-0.5">${USER_TIPS[u.email] || u.email}</div>
                </div>
                ${icon('arrow-right', 'w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all')}
              </button>
            `).join('')}
          </div>

          <!-- Manual sign-in -->
          <div class="flex items-center gap-2 mb-3">
            <div class="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Or sign in manually</div>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>
          <form id="login-form" class="flex flex-col gap-3" autocomplete="on">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Email</label>
                <input type="email" name="email" required autocomplete="email" class="select-input w-full mt-1 py-2 text-sm" placeholder="you@pdam.id" />
              </div>
              <div>
                <label class="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Password</label>
                <div class="relative mt-1">
                  <input type="password" name="password" required autocomplete="current-password" class="select-input w-full py-2 pr-9 text-sm" placeholder="demo123" />
                  <button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" id="toggle-pw" tabindex="-1">${icon('eye', 'w-3.5 h-3.5')}</button>
                </div>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <label class="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input type="checkbox" name="remember" class="accent-sky-500" checked />
                Keep me signed in
              </label>
              <a href="#" class="text-[11px] text-sky-500 hover:text-sky-700" id="forgot-link">Forgot password?</a>
            </div>
            <div id="login-error" class="hidden text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-center gap-2"></div>
            <button type="submit" class="btn-primary w-full py-2 text-sm font-semibold flex items-center justify-center gap-2" id="login-submit">
              ${icon('log-in', 'w-4 h-4')}
              Sign in
            </button>
          </form>

          <div class="mt-6 text-center text-[11px] text-slate-400">
            Password for all demo accounts: <code class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">demo123</code>
          </div>
        </div>
      </main>
    </div>
  `;
  renderIcons();

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const togglePw = document.getElementById('toggle-pw');
  const pwInput = form.querySelector('[name="password"]');

  function showError(message) {
    errorEl.innerHTML = `${icon('circle-alert', 'w-4 h-4')}<span>${message}</span>`;
    errorEl.classList.remove('hidden');
    renderIcons();
    form.classList.add('animate-shake');
    setTimeout(() => form.classList.remove('animate-shake'), 500);
  }

  function clearError() { errorEl.classList.add('hidden'); }

  togglePw.addEventListener('click', () => {
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
    togglePw.innerHTML = icon(pwInput.type === 'password' ? 'eye' : 'eye-off', 'w-4 h-4');
    renderIcons();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearError();
    const data = Object.fromEntries(new FormData(form).entries());
    submitBtn.disabled = true;
    submitBtn.innerHTML = `${icon('refresh-cw', 'w-4 h-4 animate-spin')} Signing in...`;
    renderIcons();
    setTimeout(() => {
      const result = login({ email: data.email, password: data.password, remember: data.remember === 'on' });
      if (!result.ok) {
        showError(result.error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${icon('check', 'w-4 h-4')} Sign in`;
        renderIcons();
        return;
      }
      toast(`Welcome back, ${result.user.name}`, 'success');
      onSuccess(result.user);
    }, 450);
  });

  document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const result = quickLogin(btn.dataset.quick);
      if (!result.ok) { showError(result.error); return; }
      toast(`Signed in as ${result.user.name}`, 'success');
      onSuccess(result.user);
    });
  });

  document.getElementById('forgot-link').addEventListener('click', e => {
    e.preventDefault();
    toast('Password reset would email a magic link — not implemented in prototype', 'info');
  });
}
