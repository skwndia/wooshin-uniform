const CACHE="wooshin-uniform-v321-live-update";
const ASSETS=[
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./qr.png",
  "./school-logo.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(()=>{})
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // HTML/navigation requests: always try newest network copy first.
  if (event.request.mode === "navigate" ||
      event.request.destination === "document" ||
      event.request.url.endsWith("/index.html")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put("./index.html", copy)).catch(()=>{});
          return response;
        })
        .catch(() =>
          caches.match("./index.html").then(r => r || caches.match("./"))
        )
    );
    return;
  }

  // Static assets: cache first, network fallback.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(()=>{});
        return response;
      });
    })
  );
});
