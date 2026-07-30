// Baixa os tiles do Esri Ocean Basemap para a área alcançável pelo mapa (zooms 5–10,
// mesmo bbox de PROTECTED_AREAS/maxBounds em js/app.js: BAHIA_BOUNDS com pad(0.28)) e
// grava em assets/tiles/{z}/{x}/{y}.jpg, para o modo off-line de evento — ver a seção
// "Modo off-line (evento)" no README.
//
// Uso: node scripts/fetch-tiles.js
//
// NÃO COMMITAR o resultado: assets/tiles/ está no .gitignore de propósito. Isto já foi
// tentado uma vez (ver CHANGELOG.md, "Bloco C") e revertido — cache de tiles do Esri no
// repositório levanta questão de termos de uso quanto a redistribuição em massa. Rodar
// este script APENAS na máquina que vai usar o modo off-line, nunca no repositório
// público/institucional.
//
// VALIDAR: confirmar com a SETUR os termos de uso do Esri Ocean Basemap quanto a cache
// local para uma máquina de estande (uso interno, sem redistribuição pública) antes do
// evento. Isto é uma decisão institucional, não técnica.
//
// O serviço serve os tiles como JPEG (Content-Type: image/jpeg), não PNG — por isso a
// extensão gravada é .jpg. js/app.js usa o mesmo padrão de nome de arquivo.
//
// Node puro, sem dependências: usa apenas https/fs/path do runtime.

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// BAHIA_BOUNDS = [[-18.9,-47.0],[-8.2,-36.9]] (js/app.js) com .pad(0.28), a mesma
// margem usada no maxBounds do mapa — cobre até onde dá pra arrastar o mapa, não só o
// contorno do estado. Se BAHIA_BOUNDS mudar em js/app.js, recalcule aqui também.
const BBOX = { latMin: -21.896, latMax: -5.204, lonMin: -49.828, lonMax: -34.072 };
const ZOOM_MIN = 5;
const ZOOM_MAX = 10; // acima disso o próprio Esri não tem imagem real nesta região — ver maxNativeZoom em js/app.js
// MARGIN: o Leaflet pré-carrega um anel de tiles além do viewport visível
// (keepBuffer, padrão 2) para paneamento suave, e zoomSnap:0.25 (zoom fracionário)
// também pode pedir uma coluna/linha extra na borda do tile de zoom inteiro mais
// próximo. Sem essa margem, esses tiles de borda dão 404 mesmo dentro do maxBounds —
// foi exatamente o que aconteceu na primeira versão deste script (sem margem
// nenhuma). Cobre isso com folga, independente do zoom.
const MARGIN = 3;
const TILE_URL = (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/${z}/${y}/${x}`;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'tiles');
const CONCURRENCY = 8;
const RETRIES = 3;

function lon2x(lon, z) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, z));
}
function lat2y(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, z));
}

function tileList() {
  const tiles = [];
  for (let z = ZOOM_MIN; z <= ZOOM_MAX; z++) {
    const maxIndex = Math.pow(2, z) - 1;
    const clamp = (v) => Math.max(0, Math.min(maxIndex, v));
    const xMin = clamp(lon2x(BBOX.lonMin, z) - MARGIN);
    const xMax = clamp(lon2x(BBOX.lonMax, z) + MARGIN);
    const yMin = clamp(lat2y(BBOX.latMax, z) - MARGIN);
    const yMax = clamp(lat2y(BBOX.latMin, z) + MARGIN);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

function downloadTile(tile, attempt = 1) {
  return new Promise((resolve) => {
    const destDir = path.join(OUT_DIR, String(tile.z), String(tile.x));
    const destFile = path.join(destDir, `${tile.y}.jpg`);
    if (fs.existsSync(destFile) && fs.statSync(destFile).size > 0) {
      resolve({ tile, skipped: true });
      return;
    }
    fs.mkdirSync(destDir, { recursive: true });
    const url = TILE_URL(tile.z, tile.x, tile.y);
    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        if (attempt < RETRIES) resolve(downloadTile(tile, attempt + 1));
        else resolve({ tile, error: `HTTP ${res.statusCode}` });
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(destFile, Buffer.concat(chunks));
        resolve({ tile, ok: true });
      });
    });
    req.on('error', (err) => {
      if (attempt < RETRIES) resolve(downloadTile(tile, attempt + 1));
      else resolve({ tile, error: err.message });
    });
    req.on('timeout', () => req.destroy());
  });
}

async function runPool(items, worker, concurrency) {
  let i = 0;
  let done = 0;
  const errors = [];
  let skipped = 0;
  const total = items.length;

  async function next() {
    while (i < items.length) {
      const item = items[i++];
      const result = await worker(item);
      done++;
      if (result.skipped) skipped++;
      if (result.error) errors.push(`${result.tile.z}/${result.tile.x}/${result.tile.y}: ${result.error}`);
      if (done % 50 === 0 || done === total) {
        process.stdout.write(`\r${done}/${total} tiles (${skipped} já existentes, ${errors.length} erros)`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, next);
  await Promise.all(workers);
  return { skipped, errors, total };
}

async function main() {
  const tiles = tileList();
  console.log(`Bbox off-line (BAHIA_BOUNDS + pad 0.28), zooms ${ZOOM_MIN}–${ZOOM_MAX}: ${tiles.length} tiles.`);
  console.log(`Salvando em ${OUT_DIR}`);
  const { skipped, errors, total } = await runPool(tiles, downloadTile, CONCURRENCY);
  console.log('');
  const ok = total - errors.length;
  console.log(`Concluído: ${ok}/${total} tiles disponíveis localmente (${skipped} já existentes antes desta execução).`);

  // manifest.json é o sinal que js/app.js usa para saber que este disco tem cache
  // local — sem ele (situação normal, online) o app nunca tenta os tiles locais.
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      zoomMin: ZOOM_MIN, zoomMax: ZOOM_MAX,
      bbox: BBOX,
      tileCount: total, tilesOk: ok, tilesError: errors.length
    }, null, 2)
  );

  if (errors.length) {
    console.log(`${errors.length} tiles falharam:`);
    errors.slice(0, 20).forEach((e) => console.log('  ' + e));
    if (errors.length > 20) console.log(`  ... e mais ${errors.length - 20}.`);
    console.log('Rode o script de novo para tentar só os que faltam (os já baixados são pulados).');
    process.exitCode = 1;
  }
}

main();
