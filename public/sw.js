// StageHost Backstage & Cue Sheet Offline Service Worker
const CACHE_NAME = 'stagehost-v1';
const OFFLINE_URLS = [
  '/schedule',
  '/manifest.json',
  '/globe.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for navigation and static assets
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first strategy for dynamic schedule & cue sheets, falling back to cache when offline
  if (url.pathname.startsWith('/schedule') || url.pathname.startsWith('/receipt')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/schedule');
          });
        })
    );
    return;
  }

  // Cache-first for static assets
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }
});

// ==========================================
// PUSH NOTIFICATIONS (WebPush Background Handler)
// ==========================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'StageHost Notification',
    body: 'You have a new update on StageHost.',
    icon: '/globe.svg',
    badge: '/globe.svg',
    url: '/inquiries',
    tag: 'stagehost-notification',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/globe.svg',
    badge: data.badge || '/globe.svg',
    tag: data.tag || 'stagehost-inquiry',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: {
      url: data.url || '/inquiries',
    },
    actions: [
      { action: 'open', title: 'View Inquiries' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/inquiries';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if any tab is already open with the target origin
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
