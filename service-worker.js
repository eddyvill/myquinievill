const CACHE_NAME = 'quiniela-2026-v7';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/data.js',
  './js/config.js',
  './js/admin.js',
  './js/knockout.js',
  './js/scoring.js',
  './icons/icon.svg',
  './icons/maskable-icon.svg',
  './icons/favicon.svg',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@300;400;600;700&display=swap'
];

const CROSS_ORIGIN_CACHE = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@300;400;600;700&display=swap'
];

// Instalación: precargar recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        const localAssets = STATIC_ASSETS.filter(url => !url.startsWith('http'));
        return cache.addAll(localAssets).catch(() => {
          console.warn('[SW] No se pudieron precachear algunos recursos locales');
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches antiguas
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

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar solicitudes de Firebase, APIs propias ni Chrome extensions
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firebase') ||
    url.pathname.includes('/api') ||
    request.url.startsWith('chrome-extension://')
  ) {
    return;
  }

  // Recursos de CDN: cache-first con fallback a red
  if (CROSS_ORIGIN_CACHE.some((asset) => request.url.includes(asset))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Recursos locales: network-first para siempre traer la ultima version en produccion
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Sin conexión', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || new Response('Sin conexion', { status: 503, statusText: 'Service Unavailable' });
  }
}
