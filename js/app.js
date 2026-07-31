// Mapa Interativo de Pesca Esportiva na Bahia
// Porte em JS puro (Leaflet) do protótipo "Mapa Pesca Bahia.dc.html".

(function () {
  'use strict';

  const IDLE_SECONDS = 180;
  const SHOW_PROTECTED = true;
  const PROTECTED_STYLE = {
    proibida: { color: '#e06a5f', weight: 1.5, dashArray: '6 5', fillColor: '#e06a5f', fillOpacity: 0.18, textColor: '#c0554a' },
    restrita: { color: '#d9962c', weight: 1.2, fillColor: '#d9962c', fillOpacity: 0.10, textColor: '#a8721f' }
  };
  // Destinos principais e cidades/bases aparecem juntos a partir do mesmo zoom.
  const Z_MAIN = 7;
  const BAHIA_BOUNDS = [[-18.9, -47.0], [-8.2, -36.9]];

  const HABITAT_GROUPS = [
    ['oceanico', 'Oceânicas'],
    ['recifal', 'Recifais'],
    ['estuarino', 'Estuarinas e costeiras'],
    ['dulcicola', 'Água doce']
  ];
  const HABITAT_LABELS = { oceanico: 'Oceânica', recifal: 'Recifal', estuarino: 'Estuarina / costeira', dulcicola: 'Água doce' };
  const STATUS_BADGE = {
    proibida: { label: 'Pesca proibida', cls: 'species-badge-proibida' },
    ameacada: { label: 'Ameaçada', cls: 'species-badge-ameacada' },
    introduzida: { label: 'Introduzida', cls: 'species-badge-introduzida' }
  };

  // key -> [POI, ...] que citam essa espécie em trophyKeys.
  const SPECIES_POIS = {};
  POIS.forEach((p) => (p.trophyKeys || []).forEach((k) => {
    (SPECIES_POIS[k] = SPECIES_POIS[k] || []).push(p);
  }));

  // id do POI -> texto normalizado de busca (espécie, localidade, técnica,
  // profundidade). Só os POIs principais (p1-p10) têm technique/depth — os
  // secundários entram na busca só por nome, zona, local e espécies.
  const POI_SEARCH_TEXT = {};
  POIS.forEach((p) => {
    const parts = [
      p.name, REGION_LABELS[p.region] || p.region, p.loc, p.technique, p.depth,
      p.trophy, (p.secondary || []).join(' ')
    ];
    POI_SEARCH_TEXT[p.id] = normalize(parts.filter(Boolean).join(' '));
  });

  // Nome de exibição normalizado -> espécie. Os campos `trophy` e `secondary` dos
  // POIs guardam rótulos legíveis, não chaves; este índice é o que permite
  // transformar cada nome de peixe do card de destino em link para o card da espécie.
  const SPECIES_BY_NAME = {};
  SPECIES.forEach((s) => { SPECIES_BY_NAME[normalize(s.nome)] = s; });
  // `nomeNacional` também linka (ex.: "Tarpon" em vez de "Camurupim", mais
  // reconhecido internacionalmente — texto promocional às vezes prefere o nome
  // popular ao `nome` do catálogo), mas só quando é inequívoco: se o mesmo
  // nomeNacional aparecer em mais de uma espécie (ex.: "Dourado", de
  // dourado-do-mar e dourado-do-rio), nenhuma das duas fica indexada por ele —
  // sem isso, dependendo da ordem, uma "roubaria" o link/imagem da outra.
  const nomeNacionalCount = {};
  SPECIES.forEach((s) => {
    if (!s.nomeNacional) return;
    const key = normalize(s.nomeNacional);
    if (key) nomeNacionalCount[key] = (nomeNacionalCount[key] || 0) + 1;
  });
  SPECIES.forEach((s) => {
    if (!s.nomeNacional) return;
    const key = normalize(s.nomeNacional);
    if (!key || SPECIES_BY_NAME[key] || nomeNacionalCount[key] > 1) return;
    SPECIES_BY_NAME[key] = s;
  });

  const el = {
    header: document.getElementById('header'),
    mapWrap: document.getElementById('map-wrap'),
    tabMapa: document.getElementById('tab-mapa'),
    tabEspecies: document.getElementById('tab-especies'),
    speciesView: document.getElementById('species-view'),
    speciesSearch: document.getElementById('species-search'),
    speciesGroups: document.getElementById('species-groups'),
    speciesDetailPanel: document.getElementById('species-detail-panel'),
    speciesBackdrop: document.getElementById('species-modal-backdrop'),
    resetBtn: document.getElementById('btn-reset'),
    filterTrigger: document.getElementById('filter-trigger'),
    filterChevron: document.getElementById('filter-chevron'),
    filterCount: document.getElementById('filter-count'),
    filterBody: document.getElementById('filter-body'),
    trophyChips: document.getElementById('trophy-chips'),
    techniqueChips: document.getElementById('technique-chips'),
    monthChips: document.getElementById('month-chips'),
    searchInput: document.getElementById('poi-search'),
    matchLabel: document.getElementById('match-label'),
    clearFiltersBtn: document.getElementById('btn-clear-filters'),
    legendToggle: document.getElementById('legend-toggle'),
    legendChevron: document.getElementById('legend-chevron'),
    legendBody: document.getElementById('legend-body'),
    legendRegion: document.getElementById('legend-region'),
    legendMain: document.getElementById('legend-main'),
    legendSecondary: document.getElementById('legend-secondary'),
    legendProibida: document.getElementById('legend-proibida'),
    legendRestrita: document.getElementById('legend-restrita'),
    detailPanel: document.getElementById('detail-panel'),
    introScreen: document.getElementById('intro-screen'),
    introBtn: document.getElementById('intro-btn'),
    attractIndicator: document.getElementById('attract-off-indicator'),
    attractBtn: document.getElementById('btn-attract')
  };

  const state = {
    view: 'mapa',
    activeTrophy: null,
    activeMonth: null,
    activeTechnique: null,
    searchQuery: '',
    visible: { region: true, main: true, secondary: true, proibida: true, restrita: true },
    selectedId: null,
    filtersOpen: false,
    legendOpen: false,
    matchCount: 21,
    // Desligado por padrão — precisa ser ligado pelo botão ao lado de "Ver toda a
    // Bahia" (ou pela tecla A). Antes ligava sozinho depois de 180 s parado, o que
    // não é o comportamento certo para o uso público do mapa (só para
    // apresentação/estande).
    attractEnabled: false
  };

  let map, regionLayer, poiLayer, markers = {}, protectedLayer, bahiaBounds;
  let halo, outline, mask;
  let activeId = null;
  let idleTimer, attractInterval, attractSelectTimer;
  let attracting = false, attractOut = true, attractIndex = 0;

  // ---------- Helpers ----------

  // `exclude` deixa de fora um dos filtros de chip na checagem — é o que permite
  // calcular quais chips de espécie/técnica/mês ainda são alcançáveis sem que o
  // próprio chip já ativo desapareça da lista (ver renderChips). A busca nunca é
  // excluída: é ela quem dirige a omissão em tempo real enquanto o usuário digita.
  function matchesFilters(p, exclude) {
    if (exclude !== 'trophy' && state.activeTrophy && !(p.trophyKeys || []).includes(state.activeTrophy)) return false;
    if (exclude !== 'month' && state.activeMonth && !(p.months || []).includes(state.activeMonth)) return false;
    if (exclude !== 'technique' && state.activeTechnique && !(p.techniqueKeys || []).includes(state.activeTechnique)) return false;
    if (state.searchQuery && !(POI_SEARCH_TEXT[p.id] || '').includes(state.searchQuery)) return false;
    return true;
  }

  function hasActiveFilters() {
    return !!(state.activeTrophy || state.activeMonth || state.activeTechnique || state.searchQuery);
  }

  function enrich(p) {
    return Object.assign({}, p, {
      regionLabel: REGION_LABELS[p.region] || p.region,
      sig: p.sig || '',
      isMain: !!p.main,
      hasSecondary: (p.secondary || []).length > 0,
      hasOcorrenciaProtegida: (p.ocorrenciaProtegida || []).length > 0,
      hasOperators: (p.operators || []).length > 0,
      hasLodging: (p.lodging || []).length > 0,
      hasRules: !!p.rules
    });
  }

  const LABEL_HALO = '0 0 4px #fff,0 0 8px #fff,0 0 11px #fff';

  // Espécies do ponto em ordem de destaque: as citadas em `trophy` primeiro (maiores
  // no mapa), depois as demais de `trophyKeys` (menores). `trophyKeys` reúne as duas
  // categorias sem distinguir qual é a chamariz do destino.
  function poiSpeciesRanked(p) {
    const keys = p.trophyKeys || [];
    const primary = (p.trophy || '').split('/').map((t) => t.trim()).filter(Boolean)
      .map((t) => SPECIES_BY_NAME[normalize(t)])
      .filter((s) => s && keys.indexOf(s.key) !== -1)
      .map((s) => s.key);
    return primary.map((k) => ({ key: k, primary: true }))
      .concat(keys.filter((k) => primary.indexOf(k) === -1).map((k) => ({ key: k, primary: false })));
  }

  // Anel de ilustrações em volta do pino — sem moldura, só a silhueta com halo
  // branco, para o peixe ser o elemento mais visível do marcador. O setor de baixo
  // fica livre (arco de 300°, de 120° a 420°): é onde entra o nome do ponto.
  function pinFishRingHtml(list, cx, cy, radius, big, small) {
    if (!list.length) return '';
    const n = list.length;
    return list.map((item, i) => {
      const deg = n === 1 ? 270 : 120 + (300 / (n - 1)) * i;
      const rad = deg * Math.PI / 180;
      const size = item.primary ? big : small;
      const x = Math.round(cx + Math.cos(rad) * radius);
      const y = Math.round(cy + Math.sin(rad) * radius);
      return '<img class="poi-hit poi-fish" src="assets/fish/' + item.key + '.avif" alt=""'
        + ' style="left:' + x + 'px;top:' + y + 'px;width:' + size[0] + 'px;height:' + size[1] + 'px"'
        + ' onerror="this.style.display=\'none\'">';
    }).join('');
  }

  // Caixa do ícone bem maior que o pino para caber o anel. O container tem
  // pointer-events:none (via .poi-icon) e só os filhos .poi-hit capturam clique,
  // senão essa área transparente engoliria cliques do mapa e dos vizinhos.
  const MAIN_GEO = { w: 400, h: 300, cx: 200, cy: 140, big: [62, 38], small: [44, 27] };
  const SEC_GEO = { w: 340, h: 250, cx: 170, cy: 115, big: [46, 29], small: [34, 21] };

  function mainIconHtml(p, active) {
    const num = p.sig.replace('SIG ', '').replace(/^0+/, '');
    const pulse = active ? ';animation:pinPulse 1.5s ease-out infinite' : '';
    const g = MAIN_GEO;
    const list = poiSpeciesRanked(p);
    const radius = 46 + list.length * 5;
    return '<div style="position:relative;width:' + g.w + 'px;height:' + g.h + 'px">'
      + pinFishRingHtml(list, g.cx, g.cy, radius, g.big, g.small)
      + '<div class="poi-hit" style="position:absolute;left:' + g.cx + 'px;top:' + g.cy + 'px;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:12px;background:linear-gradient(145deg,#22a7d8,#0f7fb0);border:2px solid rgba(255,255,255,.9);box-shadow:0 3px 10px rgba(10,90,128,.45),0 0 0 4px rgba(34,167,216,.18)' + pulse + ';display:grid;place-items:center;color:#fff;font-family:var(--font-heading);font-weight:700;font-size:16px">' + num + '</div>'
      + '<div class="poi-hit" style="position:absolute;left:' + g.cx + 'px;top:' + (g.cy + radius + 20) + 'px;transform:translateX(-50%);white-space:nowrap;font-family:var(--font-heading);font-weight:700;font-size:13px;color:#0a5a80;text-shadow:' + LABEL_HALO + '">' + p.name + '</div>'
      + '</div>';
  }
  function secIconHtml(p) {
    const g = SEC_GEO;
    const list = poiSpeciesRanked(p);
    const radius = 34 + list.length * 4.5;
    return '<div style="position:relative;width:' + g.w + 'px;height:' + g.h + 'px">'
      + pinFishRingHtml(list, g.cx, g.cy, radius, g.big, g.small)
      + '<div class="poi-hit" style="position:absolute;left:' + g.cx + 'px;top:' + g.cy + 'px;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:50%;border:3px solid #0f7fb0;background:rgba(255,255,255,.94);box-shadow:0 0 0 3px rgba(34,167,216,.18),0 1px 4px rgba(10,90,128,.4)"></div>'
      + '<div class="poi-hit" style="position:absolute;left:' + g.cx + 'px;top:' + (g.cy + radius + 16) + 'px;transform:translateX(-50%);white-space:nowrap;font-family:var(--font-body);font-weight:700;font-size:12.5px;color:#0a5a80;text-shadow:' + LABEL_HALO + '">' + p.name + '</div>'
      + '</div>';
  }
  function mainIcon(p, active) {
    return L.divIcon({ className: 'poi-icon', iconSize: [MAIN_GEO.w, MAIN_GEO.h], iconAnchor: [MAIN_GEO.cx, MAIN_GEO.cy], html: mainIconHtml(p, active) });
  }
  function secIcon(p) {
    return L.divIcon({ className: 'poi-icon', iconSize: [SEC_GEO.w, SEC_GEO.h], iconAnchor: [SEC_GEO.cx, SEC_GEO.cy], html: secIconHtml(p) });
  }

  // Troca o ícone só quando o estado visual muda de fato — antes cada zoomend
  // recriava as 21 imagens dos pinos, com risco de piscada a cada animação.
  function setPoiIcon(m, p) {
    const isActive = p.main && activeId === p.id;
    const sig = (p.main ? 'm' : 's') + (isActive ? '1' : '0');
    if (m._iconSig === sig) return;
    m._iconSig = sig;
    m.setIcon(p.main ? mainIcon(p, isActive) : secIcon(p));
  }

  // ---------- Map init ----------

  function initMap() {
    const bounds = L.latLngBounds(BAHIA_BOUNDS);
    map = L.map('pescamap', {
      zoomControl: true, attributionControl: true,
      minZoom: 5, maxZoom: 12, maxBounds: bounds.pad(0.28), maxBoundsViscosity: 0.6,
      zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 150, wheelDebounceTime: 60,
      zoomAnimation: true, fadeAnimation: false
    });
    map.zoomControl.setPosition('bottomright');
    map.fitBounds(bounds, { padding: [20, 20] });

    // Estilo náutico (Esri Ocean Basemap) — padrão do protótipo original. Consumido
    // ao vivo, com atribuição visível, conforme exigência do serviço.
    //
    // maxNativeZoom: 10 — o World_Ocean_Base só tem imagem real até o zoom 10 nesta
    // região (testado em toda a Bahia, litoral e interior: zoom 11+ devolve sempre o
    // mesmo tile-placeholder "Map data not yet available", com HTTP 200, então o
    // Leaflet não detecta erro nenhum — ele só troca de aparência quando o app pede
    // zoom além do que existe). Com maxNativeZoom, o Leaflet passa a reusar e
    // ampliar o tile de zoom 10 para qualquer zoom maior (`maxZoom` do mapa continua
    // 12, para rótulos/marcadores), em vez de pedir um tile que não existe.
    // keepBuffer maior + updateWhenZooming:false — sem isso, cada nível de zoom
    // inteiro cruzado durante a animação (flyTo ou scroll) dispara uma nova busca
    // de tile pela rede; se ela não chega a tempo, o tile atual fica esticado
    // (pixelizado) até a resposta, dando a impressão de travadinha a cada nível.
    // Com updateWhenZooming:false o Leaflet só busca o tile do zoom final, uma
    // vez, ao terminar a animação — troca única e mais suave, em vez de várias.
    const liveTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 13, maxNativeZoom: 10, attribution: '© Esri — Ocean Basemap',
      keepBuffer: 4, updateWhenZooming: false
    }).addTo(map);
    setTimeout(() => map.invalidateSize(), 120);
    setupOfflineTiles(map, liveTiles);

    regionLayer = L.layerGroup().addTo(map);
    REGIONS.forEach((r) => {
      // Rótulo posicionado por transform em torno do ponto (0,0) do ícone, não por
      // fluxo normal. Por padrão fica logo abaixo do ponto; quando `labelOffset` é
      // informado (zonas com vizinhança muito densa perto de Salvador), o texto é
      // deslocado para um espaço livre e uma linha de chamada tracejada liga o ponto
      // real ao rótulo, para não sobrepor outros rótulos próximos.
      const [dx, dy] = r.labelOffset || [0, 11];
      const hasOffset = !!r.labelOffset;
      const labelTransform = hasOffset ? 'translate(-50%,-50%)' : 'translate(-50%,0)';
      const leaderLine = hasOffset
        ? '<svg style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" width="1" height="1">'
          + '<line x1="0" y1="0" x2="' + dx + '" y2="' + dy + '" stroke="#0f7fb0" stroke-width="1.5" stroke-dasharray="3 4" opacity="0.6"/></svg>'
        : '';
      const icon = L.divIcon({
        className: 'region-icon', iconSize: [0, 0], iconAnchor: [0, 0],
        html: '<div style="position:relative;cursor:pointer">'
          + leaderLine
          + '<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;background:#0f7fb0;box-shadow:0 0 0 4px rgba(34,167,216,.28),0 1px 4px rgba(10,90,128,.4)"></div>'
          + '<div style="position:absolute;left:' + dx + 'px;top:' + dy + 'px;transform:' + labelTransform + ';white-space:nowrap;text-align:center;font-family:var(--font-heading);font-weight:700;font-size:13px;letter-spacing:.03em;text-transform:uppercase;color:#0a5a80;text-shadow:0 0 5px #fff,0 0 9px #fff,0 0 12px #fff">' + (r.mapLabel || r.name) + '</div></div>'
      });
      const m = L.marker([r.lat, r.lng], { icon, interactive: true, keyboard: false });
      // Zonas turísticas não têm card próprio: aproxima a área e fecha o card que
      // estivesse aberto, para o painel não continuar descrevendo outro lugar.
      m.on('click', () => { closeDetail(); map.flyTo([r.lat, r.lng], 8, { duration: 1.6 }); });
      m.addTo(regionLayer);
    });

    poiLayer = L.layerGroup().addTo(map);
    POIS.forEach((p) => {
      const icon = p.main ? mainIcon(p) : secIcon(p);
      const m = L.marker([p.lat, p.lng], { icon, riseOnHover: true, zIndexOffset: p.main ? 500 : 0 });
      m._poi = p;
      m.on('click', () => selectPoi(p.id));
      m.addTo(poiLayer);
      markers[p.id] = m;
    });

    protectedLayer = L.layerGroup();
    PROTECTED_AREAS.forEach((area) => {
      const style = PROTECTED_STYLE[area.tipo];
      const circle = L.circle([area.lat, area.lng], {
        radius: area.raio, color: style.color, weight: style.weight,
        dashArray: style.dashArray, fillColor: style.fillColor, fillOpacity: style.fillOpacity
      });
      circle._areaType = area.tipo;
      // Mesma regra das zonas turísticas: sem card próprio, o clique só enquadra a
      // área protegida e fecha o card aberto. O mesmo handler vai no rótulo de texto
      // logo abaixo — sem ele, o rótulo (que fica por cima do círculo, sobretudo no
      // zoom do mapa geral, onde o círculo é minúsculo) intercepta o clique e não
      // faz nada, já que updateDisclosure() aplica pointer-events:auto em todo
      // elemento de protectedLayer só para controlar a visibilidade pela legenda.
      const onAreaClick = () => { closeDetail(); map.flyToBounds(circle.getBounds(), { padding: [60, 60], duration: 1.6 }); };
      circle.on('click', onAreaClick);
      const label = L.marker([area.lat, area.lng], {
        icon: L.divIcon({
          className: 'poi-icon', iconSize: [210, 20], iconAnchor: [105, 10],
          html: '<div style="text-align:center;white-space:nowrap;cursor:pointer;font-family:var(--font-heading);font-weight:700;font-size:12px;letter-spacing:.03em;text-transform:uppercase;color:' + style.textColor + ';text-shadow:' + LABEL_HALO + '">' + area.nome + '</div>'
        }),
        interactive: true, keyboard: false
      });
      label._areaType = area.tipo;
      label.on('click', onAreaClick);
      circle.addTo(protectedLayer);
      label.addTo(protectedLayer);
    });
    if (SHOW_PROTECTED) protectedLayer.addTo(map);

    map.on('zoomend', updateDisclosure);
    // Clique em área vazia do mapa (não num pino, zona ou área protegida — esses
    // têm handler próprio e o Leaflet não propaga o clique deles até aqui) fecha
    // o card de destino aberto.
    map.on('click', () => { if (state.selectedId) closeDetail(); });
    updateDisclosure();
    loadBahia();
    resetIdle();
  }

  // ---------- Cache local de tiles (modo off-line de evento) ----------
  //
  // Fora do período de uso off-line combinado (estande do Fishing Show Brazil 2026),
  // isto nunca faz nada: a instalação normal, online, não tem assets/tiles/manifest.json
  // no disco (o diretório está no .gitignore, gerado só pela máquina que vai ficar
  // off-line — ver scripts/fetch-tiles.js e a seção "Modo off-line" do README), então o
  // fetch abaixo sempre falha e o app segue com o tile ao vivo já carregado.
  //
  // Quando o cache existe: troca silenciosamente o tile ao vivo pelo local (mesmo
  // arranjo de zoom, mesma atribuição — ainda é o Esri Ocean Basemap, só servido do
  // disco). Depois de OFFLINE_CACHE_EXPIRES, some a checagem de propósito: mesmo que os
  // arquivos ainda estejam no disco depois do evento, o app volta a exigir o tile ao
  // vivo, exatamente como a instalação normal.
  const OFFLINE_CACHE_EXPIRES = new Date('2026-08-03T00:00:00-03:00'); // meia-noite de domingo (02/08) para segunda, horário da Bahia

  async function setupOfflineTiles(map, liveLayer) {
    if (new Date() >= OFFLINE_CACHE_EXPIRES) return;
    let manifest;
    try {
      const res = await fetch('assets/tiles/manifest.json', { cache: 'no-store' });
      if (!res.ok) return;
      manifest = await res.json();
    } catch (e) {
      return; // sem cache local nesta máquina — segue no tile ao vivo, normal
    }
    const localTiles = L.tileLayer('assets/tiles/{z}/{x}/{y}.jpg', {
      maxZoom: 13, maxNativeZoom: manifest.zoomMax || 10, minZoom: manifest.zoomMin || 5,
      keepBuffer: 4, updateWhenZooming: false,
      attribution: '© Esri — Ocean Basemap'
    }).addTo(map);
    localTiles.bringToFront();
    map.removeLayer(liveLayer);
  }

  // Altura do cabeçalho + do gatilho de Filtros (a pílula fechada, sempre visível,
  // flutuando por cima do mapa logo abaixo do cabeçalho — ver .filter-panel no CSS,
  // top: calc(var(--header-h) + 20px)), medidas em runtime. Sem somar as duas, o
  // enquadramento do "mapa geral" tratava essa faixa do topo como se não ocupasse
  // espaço algum: o zoom mínimo e o fitBounds usavam toda a altura do container,
  // deixando a porção norte da Bahia atrás do cabeçalho e/ou da pílula de Filtros —
  // e como o zoom mínimo já vinha calculado "justo" demais, não dava pra afastar
  // (nem arrastar) o suficiente pra revelá-la, sobretudo no celular.
  function headerPad(extra) {
    const h = el.header ? el.header.getBoundingClientRect().height : 112;
    const filterH = el.filterTrigger ? el.filterTrigger.getBoundingClientRect().height : 0;
    return h + 20 + filterH + extra;
  }

  // Publica a altura do cabeçalho em --header-h, para os painéis do mapa (filtro,
  // espécies, indicador de attract mode) se encaixarem abaixo dele em qualquer
  // largura, sem um valor fixo por breakpoint.
  function syncHeaderHeight() {
    if (!el.header) return;
    const h = el.header.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--header-h', h + 'px');
  }

  // getBoundsZoom() só é confiável com o container já medido: num contexto sem
  // layout (aba oculta, painel ainda fechado) ele devolve o maxZoom, e o
  // setMinZoom seguinte deixaria o mapa travado no zoom máximo para sempre.
  function frameBahia(b) {
    map.invalidateSize();
    const paddingTL = L.point(18, headerPad(14));
    const paddingBR = L.point(18, 18);
    if (map.getSize().x > 0) map.setMinZoom(map.getBoundsZoom(b, false, paddingTL.add(paddingBR)));
    map.fitBounds(b, { paddingTopLeft: paddingTL, paddingBottomRight: paddingBR });
  }

  async function loadBahia() {
    try {
      const geom = await (await fetch('assets/bahia.geojson')).json();
      const gj = L.geoJSON(geom);
      const b = gj.getBounds();
      bahiaBounds = b;
      map.setMaxBounds(b.pad(0.14));
      frameBahia(b);
      // Carregou sem tamanho: refaz o enquadramento assim que o container medir.
      if (map.getSize().x === 0 && window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          if (map.getSize().x > 0) { ro.disconnect(); frameBahia(b); }
        });
        ro.observe(map.getContainer());
      }

      halo = L.geoJSON(geom, { interactive: false, style: { color: '#22a7d8', weight: 9, opacity: 0.16, fill: false } }).addTo(map);
      outline = L.geoJSON(geom, { interactive: false, style: { color: '#0f7fb0', weight: 2.5, opacity: 0.95, fill: false } }).addTo(map);

      await loadNeighborMask();

      halo.bringToFront();
      outline.bringToFront();
      if (protectedLayer && SHOW_PROTECTED) {
        protectedLayer.eachLayer((l) => { if (l.bringToFront) l.bringToFront(); });
      }
      updateDisclosure();
    } catch (e) { /* mantém limites estáticos como fallback */ }
  }

  // Cobre apenas a porção terrestre dos demais estados (dados oficiais por
  // estado, não o blob unificado que tinha auto-interseções). O mar permanece
  // sempre descoberto, já que essas features só existem sobre terra.
  //
  // São todos os estados do Brasil menos a Bahia, exceto o Rio Grande do Sul: ele
  // fica inteiro ao sul de -27°, e o mapa não alcança além de ~-24° de latitude
  // nem no pior caso (o zoom mínimo é calculado para enquadrar a Bahia, então a
  // faixa de latitude visível é sempre ~a altura do estado; só a longitude cresce
  // com a largura da tela). Carregá-lo seria peso morto.
  //
  // Os 8 primeiros são os que fazem divisa com a Bahia e estão em precisão total,
  // para casar exatamente com o contorno de assets/bahia.geojson. Os 17 restantes
  // foram recortados num envelope (O -75, L -28, N 0, S -26) e arredondados para
  // 4 casas decimais (~11 m, 0,3 px no zoom máximo) — sem simplificação de
  // geometria, que abriria fendas de 1 px entre máscaras vizinhas.
  const NEIGHBOR_STATE_FILES = [
    'br_al', 'br_es', 'br_go', 'br_mg', 'br_pe', 'br_pi', 'br_se', 'br_to',
    'br_ac', 'br_am', 'br_ap', 'br_ce', 'br_df', 'br_ma', 'br_ms', 'br_mt',
    'br_pa', 'br_pb', 'br_pr', 'br_rj', 'br_rn', 'br_ro', 'br_rr', 'br_sc', 'br_sp'
  ];
  async function loadNeighborMask() {
    try {
      const collections = await Promise.all(
        NEIGHBOR_STATE_FILES.map((f) => fetch(`assets/br_states/${f}.json`).then((r) => r.json()))
      );
      const features = collections.flatMap((fc) => fc.features || []);
      mask = L.geoJSON({ type: 'FeatureCollection', features }, {
        interactive: false, style: { stroke: false, fillColor: '#dbe2e6', fillOpacity: 0.92 }
      }).addTo(map);
      mask.bringToFront();
    } catch (e) { /* máscara é apenas cosmética */ }
  }

  // ---------- Disclosure / visibility ----------

  function updateDisclosure() {
    if (!map) return;
    const z = map.getZoom();
    const zoomOk = z >= Z_MAIN;
    // Com um filtro de espécie/mês ativo, os pontos correspondentes aparecem mesmo
    // se o zoom ainda não chegou no nível normal de detalhe (ex.: enquanto o mapa
    // está voando para enquadrar pontos espalhados por regiões distantes).
    const hasFilter = hasActiveFilters();
    let count = 0;

    Object.values(markers).forEach((m) => {
      const p = m._poi;
      const categoryVisible = p.main ? state.visible.main : state.visible.secondary;
      const match = matchesFilters(p);
      const on = categoryVisible && match && (hasFilter || zoomOk);
      const elm = m.getElement();
      // Classe em vez de style inline: o clique é capturado pelos filhos .poi-hit,
      // e um pointer-events:auto inline aqui reativaria a caixa inteira do ícone.
      if (elm) { elm.style.opacity = on ? '1' : '0'; elm.classList.toggle('is-hidden', !on); elm.style.transition = 'opacity .3s'; }
      if (match && categoryVisible) count++;
      setPoiIcon(m, p);
    });

    // Macrorregiões agora persistem em qualquer zoom — só a legenda as esconde.
    if (regionLayer) {
      regionLayer.eachLayer((l) => {
        const e = l.getElement();
        if (e) { e.style.opacity = state.visible.region ? '1' : '0'; e.style.transition = 'opacity .3s'; e.style.pointerEvents = state.visible.region ? 'auto' : 'none'; }
      });
    }

    if (protectedLayer) {
      protectedLayer.eachLayer((l) => {
        const visible = state.visible[l._areaType];
        const e = l.getElement();
        if (e) { e.style.opacity = visible ? '1' : '0'; e.style.transition = 'opacity .3s'; e.style.pointerEvents = visible ? 'auto' : 'none'; }
      });
    }

    state.matchCount = count;
    renderMatchLabel();
  }

  // ---------- Selection / detail panel ----------

  function selectPoi(id) {
    const p = POIS.find((x) => x.id === id);
    if (!p) return;
    const prev = activeId && markers[activeId];
    activeId = id;
    if (prev) setPoiIcon(prev, prev._poi);
    setPoiIcon(markers[id], p);
    markers[id].setZIndexOffset(1000);
    state.selectedId = id;
    renderDetailPanel(enrich(p));
  }

  function closeDetail() {
    const prev = activeId && markers[activeId];
    activeId = null;
    if (prev) setPoiIcon(prev, prev._poi);
    state.selectedId = null;
    el.detailPanel.hidden = true;
    el.detailPanel.innerHTML = '';
  }

  function fishImg(key, alt) {
    return `<img src="assets/fish/${key}.avif" alt="${alt}" loading="lazy"
      onerror="this.onerror=null;this.src='assets/fish/_placeholder.svg';this.classList.add('img-fallback')">`;
  }

  // Espécies citadas no card de destino, com foto e clicáveis — card grande para
  // as espécies-troféu, chip menor para as secundárias. Cai para a pílula de texto
  // se o rótulo não casar com o catálogo.
  function speciesFishCardHtml(name) {
    const s = SPECIES_BY_NAME[normalize(name)];
    if (!s) return `<span class="tag-trophy">${name}</span>`;
    return `
      <div class="detail-fish-card" data-species-key="${s.key}" role="button" tabindex="0">
        <div class="detail-fish-card-img">${fishImg(s.key, name)}</div>
        <div class="detail-fish-card-name">${name}</div>
      </div>`;
  }
  function speciesFishChipHtml(name) {
    const s = SPECIES_BY_NAME[normalize(name)];
    if (!s) return `<span class="tag-secondary">${name}</span>`;
    return `<span class="detail-fish-chip" data-species-key="${s.key}" role="button" tabindex="0">${fishImg(s.key, name)}<span>${name}</span></span>`;
  }

  // Espécie que ocorre na área mas tem captura proibida (ex.: Mero em p3) — não é
  // espécie-alvo nem secundária. `ocorrenciaProtegida` guarda chaves (mesmo
  // vocabulário de trophyKeys), não nomes de exibição, então busca direto por key.
  // Reaproveita o chip de espécie com foto (.detail-fish-chip) combinado com o selo
  // vermelho de proibição já usado no card da espécie (.species-badge-proibida) —
  // nenhuma classe nova, só uma combinação diferente de classes existentes.
  function protectedFishChipHtml(key) {
    const s = SPECIES.find((x) => x.key === key);
    if (!s) return '';
    return `<span class="detail-fish-chip species-badge species-badge-proibida" data-species-key="${s.key}" role="button" tabindex="0">${fishImg(s.key, s.nome)}<span>${s.nome}</span></span>`;
  }

  function openSpeciesByKey(key) {
    const s = SPECIES.find((x) => x.key === key);
    if (!s) return;
    // O card de espécie é um modal fixo: abre por cima do mapa, sem trocar de aba —
    // ao fechar, o visitante volta exatamente onde estava.
    renderSpeciesDetail(s);
  }

  // Município da Hospedagem: se existe um POI com o mesmo nome, abre o card dele;
  // caso contrário apenas aproxima o mapa da sede municipal.
  function goToMunicipio(nome) {
    const c = MUNICIPIOS[nome];
    if (!c || !map) return;
    switchView('mapa');
    const poi = POIS.find((x) => normalize(x.name) === normalize(nome));
    if (poi) {
      map.flyTo([poi.lat, poi.lng], 9, { duration: 1.4 });
      selectPoi(poi.id);
    } else {
      closeDetail();
      map.flyTo([c.lat, c.lng], 10, { duration: 1.4 });
    }
  }

  function renderDetailPanel(p) {
    const sigBadge = p.sig ? `<span class="detail-sig-badge">${p.sig}</span>` : '';
    const grid = p.isMain ? `
      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-card-label">Profundidade</div>
          <div class="detail-card-value">${p.depth || ''}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card-label">Melhor época</div>
          <div class="detail-card-value">${p.season || ''}</div>
        </div>
        <div class="detail-card span-2">
          <div class="detail-card-label">Técnica de captura</div>
          <div class="detail-card-value">${p.technique || ''}</div>
        </div>
      </div>` : '';
    const trophyNames = (p.trophy || '').split('/').map((t) => t.trim()).filter(Boolean);
    const trophySection = trophyNames.length ? `
      <div class="detail-section">
        <div class="detail-section-label">Espécies-troféu</div>
        <div class="detail-fish-grid">${trophyNames.map(speciesFishCardHtml).join('')}</div>
      </div>` : '';
    const secondary = p.hasSecondary ? `
      <div class="detail-section">
        <div class="detail-section-label">Espécies secundárias</div>
        <div class="detail-pill-row">${p.secondary.map(speciesFishChipHtml).join('')}</div>
      </div>` : '';
    // Nunca misturado com as espécies secundárias: bloco próprio, só para espécies
    // de captura proibida que ocorrem na área (ex.: Mero).
    const ocorrenciaProtegida = p.hasOcorrenciaProtegida ? `
      <div class="detail-section">
        <div class="detail-section-label">Ocorre na área, captura proibida</div>
        <div class="detail-pill-row">${p.ocorrenciaProtegida.map(protectedFishChipHtml).join('')}</div>
      </div>` : '';
    const operators = p.hasOperators ? `
      <div class="detail-section">
        <div class="detail-section-label">Operadoras / charters</div>
        <ul class="detail-list">${p.operators.map((op) => `<li class="detail-list-item"><span>${op}</span></li>`).join('')}</ul>
      </div>` : '';
    const lodging = p.hasLodging ? `
      <div class="detail-section">
        <div class="detail-section-label">Hospedagem</div>
        <div class="detail-pill-row">${p.lodging.map((h) => (MUNICIPIOS[h]
          ? `<span class="tag-lodging is-link" data-municipio="${h}" role="button" tabindex="0">${h}</span>`
          : `<span class="tag-lodging">${h}</span>`)).join('')}</div>
      </div>` : '';
    const rules = p.hasRules ? `
      <div class="detail-rules-box">
        <div class="detail-rules-label">⚠ Regras &amp; defeso</div>
        <div class="detail-rules-text">${p.rules}</div>
      </div>` : '';

    el.detailPanel.innerHTML = `
      <div class="detail-head">
        <div class="detail-head-main">
          <div class="detail-region-row">
            <span class="detail-region-label">${p.regionLabel}</span>
            ${sigBadge}
          </div>
          <h2 class="detail-title">${p.name}</h2>
          <div class="detail-loc">${p.loc || ''}</div>
        </div>
        <button class="detail-close" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="detail-body">
        <div class="detail-tags">
          <span class="tag-level">${p.dificuldade || ''}</span>
          <span class="tag-access">${p.acesso || ''}</span>
        </div>
        ${trophySection}
        <p class="detail-blurb">${p.blurb || ''}</p>
        ${grid}
        ${secondary}
        ${ocorrenciaProtegida}
        ${operators}
        ${lodging}
        ${rules}
      </div>`;

    el.detailPanel.hidden = false;
    el.detailPanel.querySelector('.detail-close').addEventListener('click', closeDetail);
    el.detailPanel.querySelectorAll('[data-species-key]').forEach((node) => {
      node.addEventListener('click', () => openSpeciesByKey(node.dataset.speciesKey));
    });
    el.detailPanel.querySelectorAll('[data-municipio]').forEach((node) => {
      node.addEventListener('click', () => goToMunicipio(node.dataset.municipio));
    });
  }

  // ---------- Legend visibility toggles ----------

  function toggleVisibility(kind) {
    state.visible[kind] = !state.visible[kind];
    renderLegendState();
    updateDisclosure();
  }

  // A legenda começa recolhida para liberar o canto do mapa; o cabeçalho abre e fecha.
  function toggleLegend() {
    state.legendOpen = !state.legendOpen;
    renderLegendOpenState();
  }

  function renderLegendOpenState() {
    el.legendBody.hidden = !state.legendOpen;
    el.legendChevron.classList.toggle('is-open', state.legendOpen);
    el.legendToggle.classList.toggle('is-open', state.legendOpen);
    el.legendToggle.setAttribute('aria-expanded', String(state.legendOpen));
  }

  function renderLegendState() {
    el.legendRegion.classList.toggle('off', !state.visible.region);
    el.legendMain.classList.toggle('off', !state.visible.main);
    el.legendSecondary.classList.toggle('off', !state.visible.secondary);
    el.legendProibida.classList.toggle('off', !state.visible.proibida);
    el.legendRestrita.classList.toggle('off', !state.visible.restrita);
  }

  // ---------- Reset view ----------

  function resetView() {
    if (!map) return;
    closeDetail();
    map.flyToBounds(bahiaBounds || L.latLngBounds(BAHIA_BOUNDS), { paddingTopLeft: [18, headerPad(14)], paddingBottomRight: [18, 18], duration: 1.6 });
  }

  // Ao selecionar uma espécie ou mês, enquadra todos os pontos que correspondem
  // ao(s) filtro(s) ativo(s) — em vez de só alterar a visibilidade dos pinos.
  function focusOnMatches() {
    if (!map) return;
    if (!hasActiveFilters()) return;
    const matches = POIS.filter((p) => matchesFilters(p));
    if (matches.length === 0) return;
    if (matches.length === 1) {
      map.flyTo([matches[0].lat, matches[0].lng], 8, { duration: 1.4 });
    } else {
      const bounds = L.latLngBounds(matches.map((p) => [p.lat, p.lng]));
      map.flyToBounds(bounds, { paddingTopLeft: [40, headerPad(34)], paddingBottomRight: [40, 40], duration: 1.4 });
    }
  }

  // ---------- Idle / attract mode ----------

  function onActivity() {
    if (attracting) stopAttract();
    resetIdle();
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    if (state.attractEnabled) idleTimer = setTimeout(startAttract, IDLE_SECONDS * 1000);
  }
  function startAttract() {
    if (attracting || !map || !state.attractEnabled) return;
    attracting = true; attractIndex = 0; attractOut = true;
    attractStep();
    attractInterval = setInterval(attractStep, 5400);
  }
  function attractStep() {
    if (!attracting) return;
    const mains = POIS.filter((x) => x.main);
    if (attractOut) {
      const p = mains[attractIndex % mains.length];
      attractIndex++;
      map.flyTo([p.lat, p.lng], 8, { duration: 3.0 });
      clearTimeout(attractSelectTimer);
      attractSelectTimer = setTimeout(() => { if (attracting) selectPoi(p.id); }, 1900);
      attractOut = false;
    } else {
      closeDetail();
      map.flyToBounds(bahiaBounds || L.latLngBounds(BAHIA_BOUNDS), { padding: [18, 18], duration: 3.0 });
      attractOut = true;
    }
  }
  function stopAttract() {
    clearInterval(attractInterval);
    clearTimeout(attractSelectTimer);
    attracting = false;
  }
  // Botão ao lado de "Ver toda a Bahia" e tecla A: liga/desliga o modo automático
  // manualmente (independente do idle timer).
  function toggleAttract() {
    state.attractEnabled = !state.attractEnabled;
    if (!state.attractEnabled) {
      stopAttract();
      clearTimeout(idleTimer);
    } else {
      resetIdle();
    }
    el.attractIndicator.hidden = state.attractEnabled;
    syncAttractBtn();
  }
  function syncAttractBtn() {
    const on = state.attractEnabled;
    el.attractBtn.classList.toggle('is-active', on);
    el.attractBtn.setAttribute('aria-pressed', String(on));
    const label = on ? 'Desativar modo automático' : 'Ativar modo automático';
    el.attractBtn.title = label;
    el.attractBtn.setAttribute('aria-label', label);
  }

  // ---------- Atalhos de teclado ----------

  // POIs atualmente mostrados no mapa (respeita filtro ativo, zoom e toggles da legenda).
  function visiblePois() {
    if (!map) return [];
    const z = map.getZoom();
    const zoomOk = z >= Z_MAIN;
    const hasFilter = hasActiveFilters();
    return POIS.filter((p) => {
      const categoryVisible = p.main ? state.visible.main : state.visible.secondary;
      return categoryVisible && matchesFilters(p) && (hasFilter || zoomOk);
    });
  }

  function navigatePoi(dir) {
    const list = visiblePois();
    if (!list.length || !map) return;
    const idx = list.findIndex((p) => p.id === activeId);
    const nextIdx = idx === -1 ? (dir > 0 ? 0 : list.length - 1) : (idx + dir + list.length) % list.length;
    const p = list[nextIdx];
    switchView('mapa');
    map.flyTo([p.lat, p.lng], p.main ? 8 : 9, { duration: 1.2 });
    selectPoi(p.id);
  }

  // Deriva da posição na lista de POIs principais, não do id fixo ('p1'...'p10') —
  // assim as teclas 1–9/0 continuam cobrindo exatamente os destinos principais
  // existentes, mesmo que algum seja removido e a numeração de sig seja refeita.
  function jumpToMain(n) {
    const mains = POIS.filter((x) => x.main);
    const p = mains[n - 1];
    if (!p || !map) return;
    switchView('mapa');
    map.flyTo([p.lat, p.lng], 8, { duration: 1.2 });
    selectPoi(p.id);
  }

  function handleKeydown(e) {
    if (!el.introScreen.hidden) { closeIntro(); return; }

    const target = e.target;
    const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
    if (inField) return;

    const key = e.key;
    if (key >= '0' && key <= '9') { jumpToMain(key === '0' ? 10 : Number(key)); return; }
    if (key === 'ArrowRight') { navigatePoi(1); return; }
    if (key === 'ArrowLeft') { navigatePoi(-1); return; }
    // Esc fecha primeiro o card de espécie aberto; só depois reseta para o mapa geral.
    if (key === 'Escape') {
      if (!el.speciesDetailPanel.hidden) { closeSpeciesDetail(); return; }
      switchView('mapa'); resetView(); return;
    }
    if (key === 'f' || key === 'F') { toggleFilters(); return; }
    if (key === 'e' || key === 'E') { switchView(state.view === 'mapa' ? 'especies' : 'mapa'); return; }
    if (key === 'a' || key === 'A') { toggleAttract(); return; }
  }

  // ---------- Tela de abertura ----------

  function closeIntro() {
    el.introScreen.hidden = true;
    resetIdle();
  }

  // ---------- Filters UI ----------

  function toggleFilters() {
    state.filtersOpen = !state.filtersOpen;
    renderFilterTrigger();
  }
  function toggleTrophy(k) {
    state.activeTrophy = state.activeTrophy === k ? null : k;
    renderChips();
    renderFilterTrigger();
    updateDisclosure();
    focusOnMatches();
  }
  function toggleMonth(n) {
    state.activeMonth = state.activeMonth === n ? null : n;
    renderChips();
    renderFilterTrigger();
    updateDisclosure();
    focusOnMatches();
  }
  function toggleTechnique(k) {
    state.activeTechnique = state.activeTechnique === k ? null : k;
    renderChips();
    renderFilterTrigger();
    updateDisclosure();
    focusOnMatches();
  }
  // Busca dispara a cada tecla (marcadores/contagem), mas o voo da câmera até os
  // resultados só depois de uma pausa na digitação — senão o mapa ficaria voando
  // a cada letra digitada.
  let searchFocusTimer;
  function onSearchInput() {
    state.searchQuery = normalize(el.searchInput.value);
    renderChips();
    renderFilterTrigger();
    updateDisclosure();
    clearTimeout(searchFocusTimer);
    searchFocusTimer = setTimeout(focusOnMatches, 500);
  }
  function clearFilters() {
    state.activeTrophy = null;
    state.activeMonth = null;
    state.activeTechnique = null;
    state.searchQuery = '';
    el.searchInput.value = '';
    renderChips();
    renderFilterTrigger();
    updateDisclosure();
  }

  // Conjunto de chaves (espécie/técnica/mês) que ainda aparecem em algum POI
  // compatível com os DEMAIS filtros ativos + a busca — excluindo o próprio filtro
  // que o chip representa, senão o chip já selecionado sumiria da lista assim que
  // deixasse de bater com ele mesmo. A busca nunca é excluída: como pedido, ela
  // omite ao vivo (mesmo incompleta) tudo o que não corresponder, no filtro e no mapa.
  function reachableKeys(exclude, getKeys) {
    const set = new Set();
    POIS.forEach((p) => {
      if (!matchesFilters(p, exclude)) return;
      (getKeys(p) || []).forEach((k) => set.add(k));
    });
    return set;
  }

  function renderChips() {
    const reachableTrophy = reachableKeys('trophy', (p) => p.trophyKeys);
    el.trophyChips.innerHTML = '';
    HABITAT_GROUPS.forEach(([habitatKey, label]) => {
      const items = SPECIES
        .filter((s) => s.habitat === habitatKey && (reachableTrophy.has(s.key) || state.activeTrophy === s.key))
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      if (!items.length) return;

      const group = document.createElement('div');
      group.className = 'chip-group';
      const heading = document.createElement('div');
      heading.className = 'chip-group-label';
      heading.textContent = label;
      group.appendChild(heading);

      const row = document.createElement('div');
      row.className = 'chip-row';
      items.forEach((s) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pill' + (state.activeTrophy === s.key ? ' is-on' : '');
        btn.innerHTML = `<span class="pill-img">${fishImg(s.key, '')}</span><span>${s.nome}</span>`;
        btn.addEventListener('click', () => toggleTrophy(s.key));
        row.appendChild(btn);
      });
      group.appendChild(row);
      el.trophyChips.appendChild(group);
    });

    const reachableMonths = reachableKeys('month', (p) => p.months);
    el.monthChips.innerHTML = '';
    MONTHS.forEach((label, i) => {
      const n = i + 1;
      if (!reachableMonths.has(n) && state.activeMonth !== n) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill-month' + (state.activeMonth === n ? ' is-on' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => toggleMonth(n));
      el.monthChips.appendChild(btn);
    });

    const reachableTechnique = reachableKeys('technique', (p) => p.techniqueKeys);
    el.techniqueChips.innerHTML = '';
    TECHNIQUES.filter((t) => reachableTechnique.has(t.key) || state.activeTechnique === t.key).forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill' + (state.activeTechnique === t.key ? ' is-on' : '');
      btn.textContent = t.label;
      btn.addEventListener('click', () => toggleTechnique(t.key));
      el.techniqueChips.appendChild(btn);
    });
  }

  function renderMatchLabel() {
    const hasFilters = hasActiveFilters();
    el.matchLabel.textContent = hasFilters
      ? state.matchCount + (state.matchCount === 1 ? ' ponto corresponde' : ' pontos correspondem')
      : '21 pontos mapeados';
    el.clearFiltersBtn.hidden = !hasFilters;
  }

  function renderFilterTrigger() {
    const hasFilters = hasActiveFilters();
    const count = (state.activeTrophy ? 1 : 0) + (state.activeMonth ? 1 : 0) + (state.activeTechnique ? 1 : 0) + (state.searchQuery ? 1 : 0);
    el.filterTrigger.classList.toggle('is-open', state.filtersOpen);
    el.filterTrigger.classList.toggle('has-filters', hasFilters);
    el.filterTrigger.setAttribute('aria-expanded', String(state.filtersOpen));
    el.filterChevron.classList.toggle('is-open', state.filtersOpen);
    el.filterBody.hidden = !state.filtersOpen;
    el.filterCount.hidden = !hasFilters;
    el.filterCount.textContent = String(count);
    renderMatchLabel();
  }

  // ---------- Espécies ----------

  function normalize(str) {
    return (str || '').toString()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function switchView(view) {
    state.view = view;
    const isMap = view === 'mapa';
    // O card de espécie é um modal fixo na viewport: sem isso ele continuaria
    // flutuando sobre o mapa depois de sair da aba Espécies.
    if (isMap) closeSpeciesDetail();
    el.mapWrap.hidden = !isMap;
    el.speciesView.hidden = isMap;
    el.resetBtn.hidden = !isMap;
    el.tabMapa.classList.toggle('is-active', isMap);
    el.tabEspecies.classList.toggle('is-active', !isMap);
    el.tabMapa.setAttribute('aria-selected', String(isMap));
    el.tabEspecies.setAttribute('aria-selected', String(!isMap));
    if (isMap && map) map.invalidateSize();
  }

  function speciesMatchesQuery(s, q) {
    if (!q) return true;
    const hay = normalize([s.nome, s.nomeNacional, s.cientifico].concat(s.aliases || []).join(' '));
    return hay.includes(q);
  }

  function speciesCardHtml(s) {
    const count = (SPECIES_POIS[s.key] || []).length;
    const badge = STATUS_BADGE[s.status];
    const nationalLine = (s.nomeNacional && s.nomeNacional !== s.nome)
      ? `<div class="species-card-national">${s.nomeNacional}</div>` : '';
    return `
      <div class="species-card" data-key="${s.key}">
        <div class="species-card-img-wrap">${fishImg(s.key, s.nome)}</div>
        <div class="species-card-body">
          <div class="species-card-name">${s.nome}</div>
          ${nationalLine}
          <div class="species-card-meta">
            <span class="species-card-count">${count} destinos na Bahia</span>
            ${badge ? `<span class="species-badge ${badge.cls}">${badge.label}</span>` : ''}
          </div>
        </div>
      </div>`;
  }

  function renderSpeciesGroups(q) {
    const html = HABITAT_GROUPS.map(([habitatKey, label]) => {
      const items = SPECIES.filter((s) => s.habitat === habitatKey && speciesMatchesQuery(s, q));
      if (!items.length) return '';
      return `
        <div class="species-group">
          <div class="species-group-title">${label}</div>
          <div class="species-grid">${items.map(speciesCardHtml).join('')}</div>
        </div>`;
    }).join('');
    el.speciesGroups.innerHTML = html || '<div class="species-empty">Nenhuma espécie encontrada.</div>';
    el.speciesGroups.querySelectorAll('.species-card').forEach((card) => {
      card.addEventListener('click', () => renderSpeciesDetail(SPECIES.find((s) => s.key === card.dataset.key)));
    });
  }

  function monthsBarHtml(meses) {
    const empty = !meses || meses.length === 0;
    const cells = MONTHS.map((label, i) => {
      const on = !empty && meses.includes(i + 1);
      return `<span class="species-month-cell${on ? ' is-on' : ''}">${label}</span>`;
    }).join('');
    const note = empty ? '<div class="species-months-empty-note">Captura proibida o ano todo</div>' : '';
    return `<div class="species-months">${cells}</div>${note}`;
  }

  function wherePescarHtml(s) {
    const pois = SPECIES_POIS[s.key] || [];
    if (!pois.length) {
      return `
        <div class="detail-section">
          <div class="detail-section-label">Onde pescar na Bahia</div>
          <div class="species-poi-empty">Ocorre na Bahia — sem destino mapeado</div>
        </div>`;
    }
    const byRegion = {};
    pois.forEach((p) => { (byRegion[p.region] = byRegion[p.region] || []).push(p); });
    const regionsHtml = Object.keys(REGION_LABELS).filter((k) => byRegion[k]).map((regionKey) => {
      const items = byRegion[regionKey].map((p) => `
        <div class="species-poi-item" data-poi-id="${p.id}">
          <span class="species-poi-item-name">${p.name}</span>
          <span class="species-poi-item-arrow">→</span>
        </div>`).join('');
      return `
        <div class="species-poi-region">
          <div class="species-poi-region-title">${REGION_LABELS[regionKey]}</div>
          ${items}
        </div>`;
    }).join('');
    return `
      <div class="detail-section">
        <div class="detail-section-label">Onde pescar na Bahia</div>
        ${regionsHtml}
      </div>`;
  }

  function renderSpeciesDetail(s) {
    if (!s) return;
    const badge = STATUS_BADGE[s.status];
    const subtitleParts = [];
    if (s.nomeNacional && s.nomeNacional !== s.nome) subtitleParts.push(s.nomeNacional);
    if (s.cientifico) subtitleParts.push(`<em>${s.cientifico}</em>`);
    const aliasesLine = (s.aliases && s.aliases.length)
      ? `<div class="species-detail-aliases">Também conhecido como: ${s.aliases.join(', ')}</div>` : '';
    const notaBox = s.nota
      ? `<div class="detail-rules-box"><div class="detail-rules-label">Nota</div><div class="detail-rules-text">${s.nota}</div></div>` : '';

    el.speciesDetailPanel.innerHTML = `
      <div class="species-detail-img">
        ${fishImg(s.key, s.nome)}
        <button class="detail-close species-detail-close" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="detail-head">
        <div class="detail-head-main">
          <h2 class="detail-title">${s.nome}</h2>
          <div class="detail-loc">${subtitleParts.join(' · ')}</div>
        </div>
      </div>
      <div class="detail-body">
        ${badge ? `<div class="detail-tags"><span class="species-badge ${badge.cls}">${badge.label}</span></div>` : ''}
        ${aliasesLine}
        <div class="detail-grid">
          <div class="detail-card"><div class="detail-card-label">Habitat</div><div class="detail-card-value">${HABITAT_LABELS[s.habitat] || s.habitat}</div></div>
          <div class="detail-card"><div class="detail-card-label">Porte</div><div class="detail-card-value">${s.porte || ''}</div></div>
          <div class="detail-card span-2"><div class="detail-card-label">Técnica</div><div class="detail-card-value">${s.tecnica || ''}</div></div>
        </div>
        <div class="detail-section">
          <div class="detail-section-label">Melhor época</div>
          ${monthsBarHtml(s.meses)}
        </div>
        ${notaBox}
        ${wherePescarHtml(s)}
      </div>`;

    el.speciesDetailPanel.hidden = false;
    el.speciesBackdrop.hidden = false;
    el.speciesDetailPanel.scrollTop = 0;
    el.speciesDetailPanel.querySelector('.detail-close').addEventListener('click', closeSpeciesDetail);
    el.speciesDetailPanel.querySelectorAll('.species-poi-item').forEach((item) => {
      item.addEventListener('click', () => {
        const poi = POIS.find((x) => x.id === item.dataset.poiId);
        if (!poi) return;
        closeSpeciesDetail();
        switchView('mapa');
        map.flyTo([poi.lat, poi.lng], 8, { duration: 1.2 });
        selectPoi(poi.id);
      });
    });
  }

  function closeSpeciesDetail() {
    el.speciesDetailPanel.hidden = true;
    el.speciesBackdrop.hidden = true;
    el.speciesDetailPanel.innerHTML = '';
  }

  // ---------- Wire up static UI ----------

  function bindUi() {
    el.resetBtn.addEventListener('click', resetView);
    el.attractBtn.addEventListener('click', toggleAttract);
    syncAttractBtn();
    el.filterTrigger.addEventListener('click', toggleFilters);
    el.clearFiltersBtn.addEventListener('click', clearFilters);
    el.searchInput.addEventListener('input', onSearchInput);
    el.legendToggle.addEventListener('click', toggleLegend);
    el.legendRegion.addEventListener('click', () => toggleVisibility('region'));
    el.legendMain.addEventListener('click', () => toggleVisibility('main'));
    el.legendSecondary.addEventListener('click', () => toggleVisibility('secondary'));
    el.legendProibida.addEventListener('click', () => toggleVisibility('proibida'));
    el.legendRestrita.addEventListener('click', () => toggleVisibility('restrita'));
    el.tabMapa.addEventListener('click', () => switchView('mapa'));
    el.tabEspecies.addEventListener('click', () => switchView('especies'));
    el.speciesSearch.addEventListener('input', () => renderSpeciesGroups(normalize(el.speciesSearch.value)));
    el.introScreen.addEventListener('click', closeIntro);
    el.speciesBackdrop.addEventListener('click', closeSpeciesDetail);
    document.addEventListener('keydown', handleKeydown);

    ['pointerdown', 'wheel', 'keydown'].forEach((evt) => document.addEventListener(evt, onActivity, { passive: true }));

    renderChips();
    renderFilterTrigger();
    renderLegendState();
    renderLegendOpenState();
    renderSpeciesGroups('');

    syncHeaderHeight();
    // A troca da fonte de sistema para Baloo 2/Nunito depois do primeiro layout
    // muda a altura do cabeçalho (line-height diferente) — sem isso, --header-h
    // fica com o valor medido antes da fonte carregar até o próximo resize.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeaderHeight);
    // O cabeçalho quebra para o layout de largura estreita em ~860/1060px — ao
    // cruzar essas faixas (ou girar o celular) --header-h precisa ser reavaliado.
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncHeaderHeight, 150);
    });
  }

  function waitForLeaflet(tries) {
    if (window.L) { initMap(); return; }
    if (tries > 80) return;
    setTimeout(() => waitForLeaflet(tries + 1), 60);
  }

  // ---------- PWA ----------
  //
  // Service worker exige contexto seguro (https:, ou http://localhost/127.0.0.1
  // — os dois jeitos já usados neste projeto para rodar localmente, ver README).
  // Sem isso (ex.: aberto via file://, ou http:// puro num IP de rede local),
  // simplesmente não registra — o site continua funcionando normal, só sem a
  // opção de instalar como app.
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').catch(() => {
      // best-effort: falha de registro (ex.: contexto não seguro) não deve
      // quebrar o app, só deixa de oferecer o modo instalável.
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindUi();
    waitForLeaflet(0);
    registerServiceWorker();
  });
})();
