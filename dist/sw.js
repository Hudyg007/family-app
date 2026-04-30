/* Family Hub — Service Worker
   Bump CACHE_VERSION whenever you deploy to force all clients to update. */

const CACHE_VERSION = "v1777569196725";
const CACHE_NAME    = `family-app-${CACHE_VERSION}`;

// Derive base path from where the SW is installed (works in dev "/" and prod "/family-app/")
const BASE = self.registration.scope;
const PRECACHE = [
  BASE,
  BASE + "index.html",
  BASE + "icon-192.png",
  BASE + "icon-512.png",
  BASE + "apple-touch-icon.png",
];

/* Install: cache the app shell, then activate immediately */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())   // take over right away
  );
});

/* Activate: clear old caches, claim all clients */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/* Fetch: network-first for HTML/JS/CSS (so updates are picked up),
   cache-first for images and fonts */
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin API calls
  if (request.method !== "GET") return;
  if (url.origin !== location.origin &&
      !url.hostname.includes("fonts.g")) return;

  // Cache-first for fonts and images
  if (
    request.destination === "image" ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Network-first for everything else (HTML, JS, CSS)
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
