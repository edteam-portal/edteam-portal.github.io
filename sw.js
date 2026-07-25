// Laissez-passer tactique pour forcer le mode PWA (Plein écran)
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Le drone écoute mais laisse tout passer normalement
});