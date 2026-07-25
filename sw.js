self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
    // Le drone intercepte la requête et laisse passer normalement,
    // ce qui valide le test de sécurité PWA de Google Chrome.
    e.respondWith(fetch(e.request).catch(() => {
        return new Response("Hors ligne");
    }));
});