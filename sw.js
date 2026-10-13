/*
 * Service Worker — Finanças do Gabriel
 * Habilita funcionamento offline e carregamento mais rápido
 */

const CACHE = 'financas-v2';
const ASSETS = [
  '/minhas-financas/',
  '/minhas-financas/index.html',
  '/minhas-financas/manifest.json',
  '/minhas-financas/icon-192.png',
  '/minhas-financas/icon-512.png'
];

// Instala e faz cache dos arquivos principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: tenta rede primeiro, cai no cache se offline
self.addEventListener('fetch', e => {
  // Não intercepta chamadas ao Google Apps Script (sincronização)
  if (e.request.url.includes('script.google.com')) return;
  // Não intercepta fontes do Google
  if (e.request.url.includes('fonts.googleapis.com') || e.request.url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza o cache com a resposta mais recente
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
