const CACHE_NAME = "ankit-kajal-planner-v1";
const STATIC_FILES = [
  "./",
  "./index.html",
  "./supabase-config.js",
  "./styles.css?v=pwa-mark-1",
  "./app.js?v=pwa-mark-1",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/brand-mark.svg",
  "./assets/haldi.svg",
  "./assets/sangeet.svg",
  "./assets/shaadi.svg",
  "./assets/baraat.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const base = self.registration.scope;
    await cache.addAll(STATIC_FILES.map((path) => new Request(new URL(path, base), { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("ankit-kajal-planner-") && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && request.destination !== "document") await cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === "navigate") return (await cache.match(new URL("./index.html", self.registration.scope))) || Response.error();
      return Response.error();
    }
  })());
});
