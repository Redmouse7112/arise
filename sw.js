// Service worker de Arise: cache de la app para uso offline.
const V = 'arise-v3-3';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'css/base.css', 'css/ui.css',
  'js/app.js', 'js/data.js', 'js/store.js', 'js/xp.js', 'js/timer.js', 'js/ui.js', 'js/habitos.js', 'js/entreno.js', 'js/novedades.js', 'js/aviso.js', 'js/modal.js', 'js/instalar.js',
  'js/views/estado.js', 'js/views/hoy.js', 'js/views/plan.js', 'js/views/ejercicio.js', 'js/views/comida.js', 'js/views/lectura.js', 'js/views/mas.js', 'js/views/trote.js', 'js/views/clase.js', 'js/views/spar.js',
  'js/views/diario.js', 'js/views/historial.js', 'js/views/novedades.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'img/logo.webp', 'img/sec-gym.webp', 'img/sec-calistenia.webp', 'img/sec-trote.webp', 'img/sec-sparring.webp',
  'img/sec-comida.webp', 'img/sec-cuerpo.webp', 'img/sec-lectura.webp', 'img/sec-dojo.webp',
  'img/mus-dorsales.webp', 'img/mus-hombros.webp', 'img/mus-deltoide.webp', 'img/mus-pecho.webp', 'img/mus-biceps.webp',
  'img/mus-core.webp', 'img/mus-cuadriceps.webp', 'img/mus-isquios.webp', 'img/mus-agarre.webp'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero la red, saltando el caché HTTP de GitHub Pages (para ver cambios al actualizar), si falla usa el caché.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => {
    const copy = r.clone(); caches.open(V).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request).then((m) => m || caches.match('index.html'))));
});
