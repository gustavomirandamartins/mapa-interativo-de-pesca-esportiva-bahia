// Service worker do modo PWA ("instalar app"). Cacheia o app shell inteiro no
// install, pra abrir instantâneo (e funcionar sem rede) depois da primeira visita.
//
// Escopo desta cache: só os arquivos do próprio site (HTML/CSS/JS, Leaflet
// vendorizado, fontes, GeoJSON de contorno, ilustrações de espécie, ícones do
// app). NÃO inclui:
//   - assets/tiles/*  — o cache de tiles do modo off-line de evento
//     (scripts/fetch-tiles.js) já é gerenciado à parte por js/app.js
//     (setupOfflineTiles); são até ~65 MB e só existem na máquina do estande.
//   - tiles ao vivo do Esri (server.arcgisonline.com) — a mesma cautela de
//     termos de uso do fetch-tiles.js se aplica aqui: o service worker não
//     cacheia esses tiles por conta própria.
// Os dois passam direto pelo fetch normal, sem interceptação.
//
// CACHE_VERSION: não há build/hash de arquivo neste projeto (site estático,
// sem etapa de build — ver README). Por isso o cache é "cache-first com update
// em segundo plano": serve do cache instantaneamente e, em paralelo, busca a
// rede pra atualizar a cache pra próxima visita. Ainda assim, se mudar algo em
// index.html/css/js ou trocar/adicionar um arquivo em assets/, incremente este
// número — isso cria um cache novo e descarta o antigo no próximo carregamento.
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'pesca-bahia-' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './css/styles.css',
  './js/species.js',
  './js/data.js',
  './js/app.js',
  './manifest.json',
  './assets/BAHIA_TURISMO.png',
  './assets/bahia.geojson',
  './vendor/leaflet/images/layers-2x.png',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './assets/fonts/baloo2-variable-latin.woff2',
  './assets/fonts/nunito-variable-latin.woff2',
  './assets/fish/_placeholder.svg',
  './assets/fish/albacora-laje.avif',
  './assets/fish/albacorinha.avif',
  './assets/fish/apaiari.avif',
  './assets/fish/arabaiana.avif',
  './assets/fish/ariaco.avif',
  './assets/fish/badejo.avif',
  './assets/fish/bicuda.avif',
  './assets/fish/biquara.avif',
  './assets/fish/bonito-listrado.avif',
  './assets/fish/camurim-pena.avif',
  './assets/fish/camurim.avif',
  './assets/fish/camurupim.avif',
  './assets/fish/carapeba.avif',
  './assets/fish/cavala.avif',
  './assets/fish/cherne.avif',
  './assets/fish/cioba.avif',
  './assets/fish/corvina-de-agua-doce.avif',
  './assets/fish/corvina.avif',
  './assets/fish/curima.avif',
  './assets/fish/dentao.avif',
  './assets/fish/dourado-do-mar.avif',
  './assets/fish/dourado-do-rio.avif',
  './assets/fish/garoupa.avif',
  './assets/fish/guaiuba.avif',
  './assets/fish/guarajuba.avif',
  './assets/fish/marlin-azul.avif',
  './assets/fish/marlin-branco.avif',
  './assets/fish/meca.avif',
  './assets/fish/mero.avif',
  './assets/fish/pacu.avif',
  './assets/fish/parati.avif',
  './assets/fish/pargo.avif',
  './assets/fish/peixe-vela.avif',
  './assets/fish/pescada-amarela.avif',
  './assets/fish/piau.avif',
  './assets/fish/sororoca.avif',
  './assets/fish/surubim.avif',
  './assets/fish/tambaqui.avif',
  './assets/fish/tilapia.avif',
  './assets/fish/traira.avif',
  './assets/fish/tucunare.avif',
  './assets/fish/vermelho-caranha.avif',
  './assets/fish/wahoo.avif',
  './assets/fish/xareu-branco.avif',
  './assets/fish/xareu.avif',
  './assets/br_states/br_ac.json',
  './assets/br_states/br_al.json',
  './assets/br_states/br_am.json',
  './assets/br_states/br_ap.json',
  './assets/br_states/br_ce.json',
  './assets/br_states/br_df.json',
  './assets/br_states/br_es.json',
  './assets/br_states/br_go.json',
  './assets/br_states/br_ma.json',
  './assets/br_states/br_mg.json',
  './assets/br_states/br_ms.json',
  './assets/br_states/br_mt.json',
  './assets/br_states/br_pa.json',
  './assets/br_states/br_pb.json',
  './assets/br_states/br_pe.json',
  './assets/br_states/br_pi.json',
  './assets/br_states/br_pr.json',
  './assets/br_states/br_rj.json',
  './assets/br_states/br_rn.json',
  './assets/br_states/br_ro.json',
  './assets/br_states/br_rr.json',
  './assets/br_states/br_sc.json',
  './assets/br_states/br_se.json',
  './assets/br_states/br_sp.json',
  './assets/br_states/br_to.json',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-16.png',
  './assets/icons/favicon-32.png',
  './assets/icons/icon-128.png',
  './assets/icons/icon-144.png',
  './assets/icons/icon-152.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-384.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-72.png',
  './assets/icons/icon-96.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Nunca intercepta assets/tiles/ (cache off-line de evento, já gerenciado por
// js/app.js) nem o basemap ao vivo do Esri — ver nota no topo do arquivo.
function isOutOfScope(url) {
  return url.pathname.indexOf('/assets/tiles/') !== -1
    || url.hostname.indexOf('arcgisonline.com') !== -1;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !isOutOfScope(url)) {
    // outra origem que não seja explicitamente fora de escopo (ex.: CDN futuro):
    // deixa passar direto, sem cachear — mais seguro por padrão.
    return;
  }
  if (isOutOfScope(url)) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      // cache-first: responde na hora se já tem; atualiza a cache em segundo
      // plano quando há rede. Sem cache e sem rede, a promise de `network`
      // ainda tenta e cai no catch acima (undefined) — nesse caso o próprio
      // navegador mostra a falha de rede, comportamento padrão esperado.
      return cached || network;
    })
  );
});
