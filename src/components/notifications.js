import { savePushSubscription } from '../lib/supabase.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[SW] Registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

export async function requestPushPermission(userId) {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported.');
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY not set — skipping push setup.');
    return false;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await savePushSubscription(userId, sub);
    console.log('[Push] Subscription saved to Supabase.');
    return true;
  } catch (err) {
    console.error('[Push] Failed to subscribe:', err);
    return false;
  }
}

export function renderNotificationBanner(userId) {
  if (Notification.permission === 'granted') return '';

  return `
    <div id="notif-banner"
      class="fixed left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-3 animate-slide-up"
      style="bottom: calc(72px + env(safe-area-inset-bottom, 0px))">
      <div class="bg-slate-800 border border-indigo-500/40 rounded-2xl shadow-2xl p-4">

        <!-- Top row: icon + text -->
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-bell text-indigo-400 text-sm"></i>
          </div>
          <div class="min-w-0">
            <p class="text-white text-sm font-semibold leading-snug">Stay on track with daily reminders</p>
            <p class="text-slate-400 text-xs mt-0.5">2 PM check-in &amp; 9 PM reflection — 30 seconds each</p>
          </div>
        </div>

        <!-- Button row: full width, always reachable -->
        <div class="flex gap-2">
          <button id="notif-dismiss"
            class="flex-1 text-slate-400 hover:text-white text-sm font-medium
                   bg-slate-700/60 hover:bg-slate-700 rounded-xl py-2.5 transition-colors">
            Not now
          </button>
          <button id="notif-enable"
            class="flex-[2] bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                   text-white text-sm font-semibold rounded-xl py-2.5 transition-colors
                   flex items-center justify-center gap-2">
            <i class="fa-solid fa-bell text-xs"></i>
            Enable Notifications
          </button>
        </div>

      </div>
    </div>
  `;
}

export function initNotificationBanner(userId) {
  const banner  = document.getElementById('notif-banner');
  const dismiss = document.getElementById('notif-dismiss');
  const enable  = document.getElementById('notif-enable');

  if (!banner) return;

  dismiss?.addEventListener('click', () => banner.remove());

  enable?.addEventListener('click', async () => {
    enable.textContent = '...';
    enable.disabled    = true;
    const ok = await requestPushPermission(userId);
    if (ok) {
      banner.innerHTML = `
        <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center text-emerald-400 text-sm font-medium">
          <i class="fa-solid fa-circle-check mr-2"></i>Reminders enabled — you're set.
        </div>`;
      setTimeout(() => banner.remove(), 2500);
    } else {
      banner.remove();
    }
  });
}
