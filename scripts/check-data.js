// Verificação padrão de integridade dos dados do mapa.
// Uso: node scripts/check-data.js
//
// Carrega js/species.js (catálogo de espécies) e js/data.js (POIs) sem
// depender de módulos externos — os arquivos são scripts de navegador
// (sem module.exports), então são avaliados com vm e as consts de topo
// são capturadas ao final da mesma execução.
//
// Catálogo de espécies vem de js/species.js (const SPECIES).

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FISH_DIR = path.join(ROOT, 'assets', 'fish');

function loadExports(relPath, names) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  const source = fs.readFileSync(abs, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  const script = `${source}\nvar __EXPORTS__ = { ${names.join(', ')} };`;
  vm.runInContext(script, sandbox, { filename: abs });
  return sandbox.__EXPORTS__;
}

const dataExports = loadExports('js/data.js', ['MONTHS', 'REGIONS', 'POIS', 'REGION_LABELS']);
if (!dataExports) {
  console.error('Erro: js/data.js não encontrado.');
  process.exit(1);
}

const speciesExports = loadExports('js/species.js', ['SPECIES']);
if (!speciesExports) {
  console.error('Erro: js/species.js não encontrado.');
  process.exit(1);
}

const SPECIES = speciesExports.SPECIES;
const POIS = dataExports.POIS;

const speciesKeys = SPECIES.map((s) => s.key);
const speciesLabel = new Map(SPECIES.map((s) => [s.key, s.nome]));

function line() {
  console.log('-'.repeat(60));
}

console.log('Verificação de dados — Mapa Pesca Esportiva Bahia');
line();

// 1. Espécies declaradas sem nenhum POI (chip morto)
const usedKeys = new Set();
POIS.forEach((p) => (p.trophyKeys || []).forEach((k) => usedKeys.add(k)));
const deadChips = speciesKeys.filter((k) => !usedKeys.has(k));

console.log(`\n1) Espécies sem nenhum POI (chip morto): ${deadChips.length}`);
deadChips.forEach((k) => console.log(`   - ${k} (${speciesLabel.get(k)})`));

// 2. trophyKeys usadas em POI que não existem no catálogo de espécies
const unknownUsage = [];
POIS.forEach((p) => {
  (p.trophyKeys || []).forEach((k) => {
    if (!speciesKeys.includes(k)) unknownUsage.push({ poi: p.id, key: k });
  });
});

console.log(`\n2) trophyKeys usadas em POI que não existem no catálogo: ${unknownUsage.length}`);
unknownUsage.forEach(({ poi, key }) => console.log(`   - ${key} (usada em ${poi})`));

// 3. Espécies sem arquivo de imagem correspondente em assets/fish/
const fishFiles = fs.existsSync(FISH_DIR)
  ? fs.readdirSync(FISH_DIR).filter((f) => f.toLowerCase().endsWith('.avif'))
  : [];
const fishBaseNames = new Set(fishFiles.map((f) => f.replace(/\.avif$/i, '')));

const speciesWithoutImage = speciesKeys.filter((k) => !fishBaseNames.has(k));
console.log(`\n3) Espécies sem imagem correspondente em assets/fish/: ${speciesWithoutImage.length}`);
speciesWithoutImage.forEach((k) => console.log(`   - ${k}.avif (${speciesLabel.get(k)})`));

// 4. Imagens em assets/fish/ sem espécie correspondente
const imagesWithoutSpecies = fishFiles.filter((f) => !speciesKeys.includes(f.replace(/\.avif$/i, '')));
console.log(`\n4) Imagens em assets/fish/ sem espécie correspondente: ${imagesWithoutSpecies.length}`);
imagesWithoutSpecies.forEach((f) => console.log(`   - ${f}`));

// 5. POIs sem o campo months
const poisWithoutMonths = POIS.filter((p) => !Array.isArray(p.months) || p.months.length === 0);
console.log(`\n5) POIs sem o campo months: ${poisWithoutMonths.length}`);
poisWithoutMonths.forEach((p) => console.log(`   - ${p.id} (${p.name})`));

// 6. Contagem de POIs por espécie
console.log(`\n6) Contagem de POIs por espécie:`);
speciesKeys.forEach((k) => {
  const count = POIS.filter((p) => (p.trophyKeys || []).includes(k)).length;
  console.log(`   - ${k.padEnd(20)} ${count}`);
});

line();
console.log(`Total de espécies no catálogo: ${speciesKeys.length}`);
console.log(`Total de POIs: ${POIS.length}`);
console.log(`Total de imagens em assets/fish/: ${fishFiles.length}`);
