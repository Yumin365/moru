/* 모루 service worker.
 * This file is a template: the Vite build (vite.config.ts) injects the build version
 * and the list of app files, then writes it to dist/sw.js.
 *
 * Strategy
 *  - App shell (HTML/JS/CSS/icons): precached on install → app opens offline.
 *  - Navigations: network-first, falling back to the cached index.html.
 *  - Same-origin assets: cache-first.
 *  - Fonts (Google Fonts, Pretendard on jsDelivr): stale-while-revalidate.
 *  - YouTube (player, videos, thumbnails, API): NEVER cached — always straight to network.
 */
const VERSION = '__BUILD_VERSION__';
const CACHE = `moru-${VERSION}`;
const FONT_CACHE = 'moru-fonts';
const PRECACHE = self.__PRECACHE_MANIFEST__;

const NEVER_CACHE = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'ytimg.com',
  'googlevideo.com',
  'ggpht.com',
  'doubleclick.net',
  'google.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE && key !== FONT_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (NEVER_CACHE.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) return;

  // Fonts → stale-while-revalidate
  const isFont =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/pretendard'));
  if (isFont) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Page loads → network-first so new deployments show up, cached shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./')) || caches.match('index.html')),
    );
    return;
  }

  // Hashed static assets → cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
