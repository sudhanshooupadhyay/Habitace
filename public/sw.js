// ─── Discipline Tracker — Service Worker ──────────────────────
// Handles: Push notifications, offline cache (cache-first for assets)

const CACHE_NAME = 'discipline-v1';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch (network-first, cache fallback) ────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML/asset responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Discipline Tracker', body: 'Time for your daily check-in.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body:    data.body,
    icon:    '/icons/icon-192.png',
    badge:   '/icons/badge-72.png',
    tag:     'discipline-checkin',
    renotify: true,
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/' },
    actions: [
      { action: 'open',    title: 'Open App'  },
      { action: 'dismiss', title: 'Dismiss'   },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Discipline Tracker', options)
  );
});

// ── Notification click ───────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push subscription change ─────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe and notify the app to update Supabase
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
    }).then((newSub) => {
      // Post message to all clients to update the subscription in Supabase
      return clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((c) =>
          c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: newSub.toJSON() })
        );
      });
    })
  );
});
