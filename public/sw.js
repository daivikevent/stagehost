// BookMyArtist Backstage, Portfolio & Cue Sheet Offline Service Worker (Phase 1)
const CACHE_NAME = 'bookmyartist-v2';
const OFFLINE_URLS = [
  '/schedule',
  '/directory',
  '/manifest.json',
  '/brand/logo-icon.svg',
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

  // Network-first strategy for dynamic schedules, cue sheets, agreements, and offline portfolio viewing
  if (
    url.pathname.startsWith('/schedule') ||
    url.pathname.startsWith('/receipt') ||
    url.pathname.startsWith('/agreement') ||
    url.pathname.startsWith('/review') ||
    (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next') && !url.pathname.includes('.'))
  ) {
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
    url.pathname.startsWith('/brand') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
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
    title: 'BookMyArtist Notification',
    body: 'You have a new update on BookMyArtist.',
    icon: '/brand/logo-icon.svg',
    badge: '/brand/logo-icon.svg',
    url: '/inquiries',
    tag: 'bookmyartist-notification',
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
    icon: data.icon || '/brand/logo-icon.svg',
    badge: data.badge || '/brand/logo-icon.svg',
    tag: data.tag || 'bookmyartist-inquiry',
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
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
