// Baixa os tiles do Esri Ocean Basemap para o bbox da Bahia (zooms 5–10) e grava em
// assets/tiles/{z}/{x}/{y}.jpg, para a apresentação funcionar sem rede na feira.
//
// Uso: node scripts/fetch-tiles.js
//
// NOTA: o serviço do Esri Ocean Basemap serve os tiles como JPEG (Content-Type:
// image/jpeg), não PNG — confirmado por request real ao endpoint. Por isso a extensão
// gravada é .jpg (o enunciado original previa .png). O tileLayer em js/app.js usa o
// mesmo padrão de nome de arquivo.
//
// VALIDAR: conferir os termos de uso do Esri Ocean Basemap quanto a cache/redistribuição
// local antes do uso institucional. Alternativa de licença aberta caso haja restrição:
// OpenSeaMap sobre OSM (muda o estilo visual — precisa de aprovação).
//
// Node puro, sem dependências: usa apenas https/fs/path do runtime.

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const BBOX = { latMin: -18.9, latMax: -8.2, lonMin: -47.0, lonMax: -36.9 };
const ZOOM_MIN = 5;
const ZOOM_MAX = 10;
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
    const xMin = lon2x(BBOX.lonMin, z);
    const xMax = lon2x(BBOX.lonMax, z);
    const yMin = lat2y(BBOX.latMax, z);
    const yMax = lat2y(BBOX.latMin, z);
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
  console.log(`Bahia bbox, zooms ${ZOOM_MIN}–${ZOOM_MAX}: ${tiles.length} tiles.`);
  console.log(`Salvando em ${OUT_DIR}`);
  const { skipped, errors, total } = await runPool(tiles, downloadTile, CONCURRENCY);
  console.log('');
  console.log(`Concluído: ${total - errors.length}/${total} tiles disponíveis localmente (${skipped} já existentes antes desta execução).`);
  if (errors.length) {
    console.log(`${errors.length} tiles falharam:`);
    errors.slice(0, 20).forEach((e) => console.log('  ' + e));
    if (errors.length > 20) console.log(`  ... e mais ${errors.length - 20}.`);
    process.exitCode = 1;
  }
}

main();
