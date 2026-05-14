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
      style="bottom: calc(76px + env(safe-area-inset-bottom, 0px))">
      <div class="rounded-2xl p-4 shadow-2xl"
           style="background:rgba(15,23,42,0.96);border:1px solid rgba(99,102,241,0.35);
                  box-shadow:0 -4px 32px rgba(99,102,241,0.12),0 8px 32px rgba(0,0,0,0.5);
                  backdrop-filter:blur(20px);">

        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style="background:linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15));">
            <i class="fa-solid fa-bell text-indigo-400"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-white text-sm font-bold">Enable notifications to stay on track</p>
            <p class="text-slate-500 text-xs mt-0.5">Check-ins, alarms &amp; habit reminders — even in background</p>
          </div>
          <button id="notif-dismiss" class="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 p-1">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <div class="flex gap-2">
          <button id="notif-enable"
            class="flex-1 text-white text-sm font-bold rounded-xl py-3 transition-all
                   flex items-center justify-center gap-2"
            style="background:linear-gradient(135deg,#4f46e5,#7c3aed);
                   box-shadow:0 4px 15px rgba(79,70,229,0.35);">
            <i class="fa-solid fa-bell text-sm"></i>
            Allow Notifications
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
