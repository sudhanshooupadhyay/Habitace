import './style.css';
import { supabase, fetchUser, getSession, signOut } from './lib/supabase.js';
import { renderAuth, initAuth, renderPasswordReset, initPasswordReset } from './components/auth.js';
import { renderDashboard, initDashboard } from './components/dashboard.js';
import { renderVault, initVault } from './components/symptomVault.js';
import { renderAnalytics, initAnalytics } from './components/analytics.js';
import { renderZen, initZen } from './components/zenCenter.js';
import { renderOnboarding, initOnboarding } from './components/onboarding.js';
import { renderResources, initResources } from './components/resources.js';
import {
  registerServiceWorker,
  renderNotificationBanner,
  initNotificationBanner,
} from './components/notifications.js';

// ─── App state ────────────────────────────────────────────────
let currentUser    = null;
let currentProfile = null;
let activeSection  = 'dashboard';

// ─── PWA Install prompt ───────────────────────────────────────
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Show the install button if the app shell is already rendered
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.classList.remove('hidden');
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  document.getElementById('pwa-install-btn')?.classList.add('hidden');
});

const SECTIONS = ['dashboard', 'vault', 'analytics', 'zen', 'resources'];

// ─── Boot ─────────────────────────────────────────────────────
async function boot() {
  await registerServiceWorker();

  // If arriving from a password-reset email, let onAuthStateChange handle it
  const isRecovery = window.location.hash.includes('type=recovery');

  if (!isRecovery) {
    const session = await getSession();
    if (session?.user) {
      currentUser = session.user;
      await loadApp();
    } else {
      renderLoginScreen();
    }
  }

  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // User clicked the reset link — show the set-new-password screen
      document.getElementById('app').innerHTML = renderPasswordReset();
      initPasswordReset(async () => {
        currentUser = (await getSession())?.user;
        if (currentUser) await loadApp();
        else renderLoginScreen();
      });
    } else if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      await loadApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      renderLoginScreen();
    }
  });
}

// ─── Auth screen ──────────────────────────────────────────────
function renderLoginScreen() {
  document.getElementById('app').innerHTML = renderAuth();
  initAuth(); // auth state handled by onAuthStateChange above
}

// ─── Main app shell ───────────────────────────────────────────
async function loadApp() {
  try {
    currentProfile = await fetchUser(currentUser.id);
  } catch (_) {
    // Profile not yet created (trigger handles it); retry once
    await new Promise((r) => setTimeout(r, 800));
    try { currentProfile = await fetchUser(currentUser.id); } catch (_) {}
  }

  renderAppShell();
  navigateTo('dashboard');

  // ── Onboarding check ────────────────────────────────────────
  // Show modal on top of the shell if this is a first-time user
  if (!currentProfile?.onboarding_complete) {
    const slot = document.getElementById('notif-banner-slot');
    if (slot) {
      slot.insertAdjacentHTML('beforebegin', renderOnboarding());
      initOnboarding(currentUser.id, async () => {
        // Refresh profile and re-render dashboard with biometrics
        try { currentProfile = await fetchUser(currentUser.id); } catch (_) {}
        navigateTo('dashboard');
      });
    }
  }
}

function renderAppShell() {
  document.getElementById('app').innerHTML = `
    <!-- Toast container -->
    <div id="toast-container"></div>

    <!-- App wrapper -->
    <div class="max-w-lg mx-auto min-h-screen flex flex-col">

      <!-- Top bar -->
      <header class="sticky top-0 z-30 bg-navy-800/90 backdrop-blur-sm border-b border-slate-700/50">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <i class="fa-solid fa-brain text-sm text-indigo-400"></i>
            </div>
            <span class="text-white font-semibold text-sm">Discipline</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2 py-1">
              <i class="fa-solid fa-star text-indigo-400 text-xs"></i>
              <span id="header-level" class="text-indigo-400 text-xs font-bold">
                Lv.${currentProfile?.current_level || 1}
              </span>
            </div>
            <div class="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
              <i class="fa-solid fa-trophy text-amber-400 text-xs"></i>
              <span id="header-xp" class="text-amber-400 text-xs font-medium">
                ${currentProfile?.total_xp || 0} XP
              </span>
            </div>

            <!-- PWA Install button (hidden until beforeinstallprompt fires) -->
            <button id="pwa-install-btn"
              class="hidden items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20
                     hover:bg-indigo-500/20 rounded-lg px-2 py-1 transition-colors"
              title="Install app">
              <i class="fa-solid fa-download text-indigo-400 text-xs"></i>
              <span class="text-indigo-400 text-xs font-medium hidden sm:inline">Install</span>
            </button>

            <!-- Google avatar + sign-out -->
            <div class="relative group">
              ${(() => {
                const avatarUrl = currentUser?.user_metadata?.avatar_url;
                const name      = currentUser?.user_metadata?.full_name || currentUser?.email || '';
                const initials  = name.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';
                return avatarUrl
                  ? `<img src="${avatarUrl}" alt="Profile"
                          class="w-8 h-8 rounded-full object-cover border-2 border-indigo-500/50
                                 cursor-pointer hover:border-indigo-400 transition-all"
                          referrerpolicy="no-referrer" />`
                  : `<div class="w-8 h-8 rounded-full bg-indigo-600/60 border-2 border-indigo-500/50
                                flex items-center justify-center cursor-pointer
                                hover:border-indigo-400 transition-all">
                       <span class="text-white text-xs font-bold">${initials}</span>
                     </div>`;
              })()}
              <!-- Sign-out popover on hover -->
              <button id="signout-btn"
                class="absolute right-0 top-full mt-1.5 whitespace-nowrap
                       bg-slate-800 border border-slate-700 text-slate-300 hover:text-white
                       text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl
                       opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
                       transition-all duration-150 flex items-center gap-1.5 z-50"
                title="Sign out">
                <i class="fa-solid fa-right-from-bracket text-xs"></i>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content area -->
      <main id="main-content" class="flex-1 px-4 py-5 pb-28">
        <!-- Injected by navigateTo() -->
      </main>

      <!-- Bottom navigation -->
      <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-30
                  bg-navy-800/95 backdrop-blur-sm border-t border-slate-700/50 pb-safe">
        <div class="flex justify-around px-1 pt-2 pb-2">
          <button class="nav-item" data-section="dashboard">
            <i class="fa-solid fa-house"></i>
            <span>Home</span>
          </button>
          <button class="nav-item" data-section="vault">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Vault</span>
          </button>
          <button class="nav-item" data-section="analytics">
            <i class="fa-solid fa-chart-line"></i>
            <span>Stats</span>
          </button>
          <button class="nav-item" data-section="resources">
            <i class="fa-brands fa-youtube"></i>
            <span>Learn</span>
          </button>
          <button class="nav-item" data-section="zen">
            <i class="fa-solid fa-spa"></i>
            <span>Zen</span>
          </button>
        </div>
      </nav>

    </div>

    <!-- Notification banner slot -->
    <div id="notif-banner-slot"></div>
  `;

  // Wire up nav
  document.querySelectorAll('.nav-item[data-section]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.section));
  });

  // Sign out
  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    try {
      await signOut();
    } catch (err) {
      showToast('Sign-out failed: ' + err.message, 'error');
    }
  });

  // PWA install
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredInstallPrompt = null;
      document.getElementById('pwa-install-btn')?.classList.add('hidden');
    }
  });

  // Show install btn if prompt is already queued (re-render case)
  if (deferredInstallPrompt) {
    document.getElementById('pwa-install-btn')?.classList.remove('hidden');
  }

  // ── Cross-component events ──────────────────────────────────
  // Focus-area "action" buttons dispatch this to trigger tab navigation
  document.addEventListener('navigate', (e) => navigateTo(e.detail));

  // Habit toggles dispatch this after awarding XP so the header stays fresh
  document.addEventListener('xp-updated', (e) => {
    const user = e.detail?.user;
    if (!user) return;
    currentProfile = user;
    const el = document.getElementById('header-xp');
    if (el) el.textContent = `${user.total_xp || 0} XP`;
    // Update header level badge if present
    const lvlEl = document.getElementById('header-level');
    if (lvlEl) lvlEl.textContent = `Lv.${user.current_level || 1}`;
  });

  // Notification banner (deferred — don't block render)
  setTimeout(() => {
    const slot = document.getElementById('notif-banner-slot');
    if (slot && Notification.permission !== 'granted') {
      slot.innerHTML = renderNotificationBanner(currentUser.id);
      initNotificationBanner(currentUser.id);
    }
  }, 3000);
}

// ─── Navigation ───────────────────────────────────────────────
async function navigateTo(section) {
  if (!SECTIONS.includes(section)) return;
  activeSection = section;

  // Update nav highlighting
  document.querySelectorAll('.nav-item[data-section]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  const main = document.getElementById('main-content');
  if (!main) return;

  // Render section HTML
  switch (section) {
    case 'dashboard':
      main.innerHTML = renderDashboard(currentProfile, currentUser);
      await initDashboard(currentUser.id);
      break;

    case 'vault':
      main.innerHTML = renderVault(currentProfile?.has_anxiety !== false);
      await initVault(currentUser.id, currentProfile?.has_anxiety !== false);
      break;

    case 'analytics':
      main.innerHTML = renderAnalytics();
      await initAnalytics(currentUser.id);
      break;

    case 'zen':
      main.innerHTML = renderZen();
      initZen(currentUser.id);
      break;

    case 'resources':
      main.innerHTML = renderResources();
      await initResources(currentUser.id, currentProfile, currentUser);
      break;
  }

  // Refresh XP header after any section transition
  refreshHeaderXp();

  // Scroll to top
  main.parentElement?.scrollTo({ top: 0 });
}

// ─── XP header refresh ───────────────────────────────────────
async function refreshHeaderXp() {
  try {
    const fresh = await fetchUser(currentUser.id);
    currentProfile = fresh;
    const el = document.getElementById('header-xp');
    if (el) el.textContent = `${fresh.total_xp || 0} XP`;
  } catch (_) {}
}

// ─── Toast system ────────────────────────────────────────────
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colorMap = {
    info:    'bg-slate-700 border-slate-600 text-white',
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    error:   'bg-red-500/20 border-red-500/40 text-red-300',
    warning: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  };

  const iconMap = {
    info:    'fa-circle-info',
    success: 'fa-circle-check',
    error:   'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
  };

  const toast = document.createElement('div');
  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm max-w-sm ${colorMap[type] || colorMap.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || iconMap.info} flex-shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ─── Start ────────────────────────────────────────────────────
boot().catch(console.error);
