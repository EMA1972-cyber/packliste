// Packliste Service Worker — cached nur das Grundgerüst (HTML/Icons/Manifest),
// niemals Supabase-API-Calls. So bleiben Live-Daten immer aktuell, aber die
// App selbst lädt auch ohne Internetverbindung.
//
// Strategie: Network-first mit Cache-Fallback. Jeder Seitenaufruf holt sich
// zuerst die aktuelle Version aus dem Netz — kein "erst beim zweiten Laden
// aktuell"-Verhalten mehr wie bei cache-first. Nur wenn kein Netz verfügbar
// ist, springt der Cache als Fallback ein (Offline-Fähigkeit bleibt erhalten).

const CACHE_NAME = 'packliste-shell-v2';
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

  // Grundgerüst: Netz zuerst (network-first), Cache nur als Offline-Fallback
  event.respondWith(
    fetch(event.request).then(networkResp => {
      if (networkResp && networkResp.status === 200) {
        const clone = networkResp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return networkResp;
    }).catch(() => caches.match(event.request))
  );
});
