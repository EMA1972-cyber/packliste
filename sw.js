// Packliste Service Worker — cached nur das Grundgerüst (HTML/Icons/Manifest),
// niemals Supabase-API-Calls. So bleiben Live-Daten immer aktuell, aber die
// App selbst lädt auch ohne Internetverbindung.

const CACHE_NAME = 'packliste-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Niemals API-Aufrufe (Supabase etc.) cachen — immer live aus dem Netz
  if (url.origin !== self.location.origin) {
    return;
  }

  // Grundgerüst: erst Cache, dann Netz (cache-first), mit Netz-Update im Hintergrund
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResp => {
        if (networkResp && networkResp.status === 200) {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResp;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
