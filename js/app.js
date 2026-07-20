// Mapa Interativo de Pesca Esportiva na Bahia
// Porte em JS puro (Leaflet) do protótipo "Mapa Pesca Bahia.dc.html".

(function () {
  'use strict';

  const IDLE_SECONDS = 60;
  const SHOW_PROTECTED = true;
  const Z_MAIN = 7;
  const Z_SECONDARY = 8.4;
  const BAHIA_BOUNDS = [[-18.9, -47.0], [-8.2, -36.9]];

  const el = {
    resetBtn: document.getElementById('btn-reset'),
    filterTrigger: document.getElementById('filter-trigger'),
    filterChevron: document.getElementById('filter-chevron'),
    filterCount: document.getElementById('filter-count'),
    filterBody: document.getElementById('filter-body'),
    trophyChips: document.getElementById('trophy-chips'),
    monthChips: document.getElementById('month-chips'),
    matchLabel: document.getElementById('match-label'),
    clearFiltersBtn: document.getElementById('btn-clear-filters'),
    legendMain: document.getElementById('legend-main'),
    legendSecondary: document.getElementById('legend-secondary'),
    legendZone: document.getElementById('legend-zone'),
    zoomHint: document.getElementById('zoom-hint'),
    zoomHintText: document.getElementById('zoom-hint-text'),
    detailPanel: document.getElementById('detail-panel')
  };

  const state = {
    activeTrophy: null,
    activeMonth: null,
    legendHighlight: null,
    selectedId: null,
    filtersOpen: false,
    matchCount: 21
  };

  let map, regionLayer, poiLayer, markers = {}, protectedZone, bahiaBounds;
  let halo, outline, mask;
  let activeId = null;
  let idleTimer, attractInterval, attractSelectTimer;
  let attracting = false, attractOut = true, attractIndex = 0;

  // ---------- Helpers ----------

  function matchesFilters(p) {
    if (state.activeTrophy && !(p.trophyKeys || []).includes(state.activeTrophy)) return false;
    if (state.activeMonth && !(p.months || []).includes(state.activeMonth)) return false;
    return true;
  }

  function enrich(p) {
    return Object.assign({}, p, {
      regionLabel: REGION_LABELS[p.region] || p.region,
      sig: p.sig || '',
      isMain: !!p.main,
      hasSecondary: (p.secondary || []).length > 0,
      hasOperators: (p.operators || []).length > 0,
      hasLodging: (p.lodging || []).length > 0,
      hasRules: !!p.rules
    });
  }

  function mainIconHtml(p, active, highlighted) {
    const num = p.sig.replace('SIG ', '').replace(/^0+/, '');
    const pulse = highlighted ? ';animation:legendPinPulse 1.2s ease-in-out infinite'
      : (active ? ';animation:pinPulse 1.5s ease-out infinite' : '');
    return '<div style="width:38px;height:38px;border-radius:12px;background:linear-gradient(145deg,#22a7d8,#0f7fb0);border:2px solid rgba(255,255,255,.9);box-shadow:0 3px 10px rgba(10,90,128,.45),0 0 0 4px rgba(34,167,216,.18)' + pulse + ';display:grid;place-items:center;color:#fff;font-family:var(--font-heading);font-weight:700;font-size:16px">' + num + '</div>';
  }
  function secIconHtml(highlighted) {
    const pulse = highlighted ? ';animation:legendSecPulse 1.2s ease-in-out infinite' : '';
    return '<div style="width:18px;height:18px;border-radius:50%;border:3px solid #0f7fb0;background:rgba(255,255,255,.94);box-shadow:0 0 0 3px rgba(34,167,216,.18),0 1px 4px rgba(10,90,128,.4)' + pulse + '"></div>';
  }
  function mainIcon(p, active, highlighted) {
    return L.divIcon({ className: 'poi-icon', iconSize: [38, 38], iconAnchor: [19, 19], html: mainIconHtml(p, active, highlighted) });
  }
  function secIcon(highlighted) {
    return L.divIcon({ className: 'poi-icon', iconSize: [18, 18], iconAnchor: [9, 9], html: secIconHtml(highlighted) });
  }

  function tileConfig() {
    // Estilo náutico (Esri Ocean Basemap) — padrão do protótipo original.
    return { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', opts: { maxZoom: 13, attribution: '© Esri — Ocean Basemap' } };
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

    const t = tileConfig();
    L.tileLayer(t.url, t.opts).addTo(map);
    setTimeout(() => map.invalidateSize(), 120);

    regionLayer = L.layerGroup().addTo(map);
    REGIONS.forEach((r) => {
      const icon = L.divIcon({
        className: 'region-icon', iconSize: [210, 46], iconAnchor: [105, 23],
        html: '<div style="text-align:center;pointer-events:auto;cursor:pointer">'
          + '<div style="width:13px;height:13px;margin:0 auto 5px;border-radius:50%;background:#0f7fb0;box-shadow:0 0 0 4px rgba(34,167,216,.28),0 1px 4px rgba(10,90,128,.4)"></div>'
          + '<div style="font-family:var(--font-heading);font-weight:700;font-size:15px;letter-spacing:.03em;text-transform:uppercase;color:#0a5a80;text-shadow:0 0 5px #fff,0 0 9px #fff,0 0 12px #fff">' + r.name + '</div></div>'
      });
      const m = L.marker([r.lat, r.lng], { icon, interactive: true, keyboard: false });
      m.on('click', () => map.flyTo([r.lat, r.lng], 8, { duration: 1.6 }));
      m.addTo(regionLayer);
    });

    poiLayer = L.layerGroup().addTo(map);
    POIS.forEach((p) => {
      const icon = p.main ? mainIcon(p) : secIcon();
      const m = L.marker([p.lat, p.lng], { icon, riseOnHover: true });
      m._poi = p;
      m.on('click', () => selectPoi(p.id));
      m.addTo(poiLayer);
      markers[p.id] = m;
    });

    protectedZone = L.circle([-17.96, -38.70], {
      radius: 26000, color: '#e06a5f', weight: 1.5, dashArray: '6 5', fillColor: '#e06a5f', fillOpacity: 0.14
    });
    if (SHOW_PROTECTED) protectedZone.addTo(map);

    map.on('zoomend', updateDisclosure);
    updateDisclosure();
    loadBahia();
    resetIdle();
  }

  async function loadBahia() {
    try {
      const geom = await (await fetch('assets/bahia.geojson')).json();
      const gj = L.geoJSON(geom);
      const b = gj.getBounds();
      bahiaBounds = b;
      map.setMaxBounds(b.pad(0.14));
      map.setMinZoom(map.getBoundsZoom(b));
      map.fitBounds(b, { padding: [18, 18] });

      halo = L.geoJSON(geom, { interactive: false, style: { color: '#22a7d8', weight: 9, opacity: 0.16, fill: false } }).addTo(map);
      outline = L.geoJSON(geom, { interactive: false, style: { color: '#0f7fb0', weight: 2.5, opacity: 0.95, fill: false } }).addTo(map);

      await loadNeighborMask();

      halo.bringToFront();
      outline.bringToFront();
      if (protectedZone && SHOW_PROTECTED) protectedZone.bringToFront();
      updateDisclosure();
    } catch (e) { /* mantém limites estáticos como fallback */ }
  }

  // Cobre apenas a porção terrestre dos estados vizinhos (dados oficiais por
  // estado, não o blob unificado que tinha auto-interseções). O mar permanece
  // sempre descoberto, já que essas features só existem sobre terra.
  const NEIGHBOR_STATE_FILES = ['br_al', 'br_es', 'br_go', 'br_mg', 'br_pe', 'br_pi', 'br_se', 'br_to'];
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
    const showMain = z >= Z_MAIN;
    const showSec = z >= Z_SECONDARY;
    const hl = state.legendHighlight;
    let count = 0;

    Object.values(markers).forEach((m) => {
      const p = m._poi;
      const visByZoom = p.main ? showMain : showSec;
      const match = matchesFilters(p);
      const forced = (hl === 'main' && p.main) || (hl === 'secondary' && !p.main);
      const on = (visByZoom || forced) && match;
      const elm = m.getElement();
      if (elm) { elm.style.opacity = on ? '1' : '0'; elm.style.pointerEvents = on ? 'auto' : 'none'; elm.style.transition = 'opacity .3s'; }
      if (match) count++;
      const wantsHl = (hl === 'main' && p.main) || (hl === 'secondary' && !p.main);
      if (p.main) m.setIcon(mainIcon(p, activeId === p.id, wantsHl));
      else m.setIcon(secIcon(wantsHl));
    });

    if (regionLayer) {
      regionLayer.eachLayer((l) => {
        const e = l.getElement();
        if (e) { e.style.opacity = z < Z_MAIN ? '1' : '0'; e.style.transition = 'opacity .3s'; e.style.pointerEvents = z < Z_MAIN ? 'auto' : 'none'; }
      });
    }

    const level = z < Z_MAIN ? 'region' : (z < Z_SECONDARY ? 'main' : 'detail');
    state.matchCount = count;
    renderMatchLabel();
    renderZoomHint(level);
  }

  // ---------- Selection / detail panel ----------

  function selectPoi(id) {
    const p = POIS.find((x) => x.id === id);
    if (!p) return;
    if (activeId && markers[activeId] && POIS.find((x) => x.id === activeId).main) {
      markers[activeId].setIcon(mainIcon(POIS.find((x) => x.id === activeId), false));
    }
    activeId = id;
    if (p.main) markers[id].setIcon(mainIcon(p, true));
    markers[id].setZIndexOffset(1000);
    state.selectedId = id;
    renderDetailPanel(enrich(p));
  }

  function closeDetail() {
    if (activeId && markers[activeId] && POIS.find((x) => x.id === activeId).main) {
      markers[activeId].setIcon(mainIcon(POIS.find((x) => x.id === activeId), false));
    }
    activeId = null;
    state.selectedId = null;
    el.detailPanel.hidden = true;
    el.detailPanel.innerHTML = '';
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
    const secondary = p.hasSecondary ? `
      <div class="detail-section">
        <div class="detail-section-label">Espécies secundárias</div>
        <div class="detail-pill-row">${p.secondary.map((sp) => `<span class="tag-secondary">${sp}</span>`).join('')}</div>
      </div>` : '';
    const operators = p.hasOperators ? `
      <div class="detail-section">
        <div class="detail-section-label">Operadoras / charters</div>
        <ul class="detail-list">${p.operators.map((op) => `<li class="detail-list-item"><span>${op}</span></li>`).join('')}</ul>
      </div>` : '';
    const lodging = p.hasLodging ? `
      <div class="detail-section">
        <div class="detail-section-label">Hospedagem</div>
        <div class="detail-pill-row">${p.lodging.map((h) => `<span class="tag-lodging">${h}</span>`).join('')}</div>
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
          <span class="tag-trophy">${p.trophy || ''}</span>
          <span class="tag-level">${p.level || ''}</span>
        </div>
        <p class="detail-blurb">${p.blurb || ''}</p>
        ${grid}
        ${secondary}
        ${operators}
        ${lodging}
        ${rules}
      </div>`;

    el.detailPanel.hidden = false;
    el.detailPanel.querySelector('.detail-close').addEventListener('click', closeDetail);
  }

  // ---------- Legend highlight ----------

  function toggleLegendHighlight(kind) {
    state.legendHighlight = state.legendHighlight === kind ? null : kind;
    renderLegendActive();
    updateDisclosure();
    updateProtectedHighlight();
  }

  function updateProtectedHighlight() {
    if (!protectedZone) return;
    const on = state.legendHighlight === 'protected';
    protectedZone.setStyle({ weight: on ? 3 : 1.5, fillOpacity: on ? 0.32 : 0.14 });
    const elm = protectedZone.getElement();
    if (elm) elm.classList.toggle('protected-highlight', on);
    if (on) protectedZone.bringToFront();
  }

  function renderLegendActive() {
    el.legendMain.classList.toggle('active', state.legendHighlight === 'main');
    el.legendSecondary.classList.toggle('active', state.legendHighlight === 'secondary');
    el.legendZone.classList.toggle('active', state.legendHighlight === 'protected');
  }

  // ---------- Reset view ----------

  function resetView() {
    if (!map) return;
    closeDetail();
    map.flyToBounds(bahiaBounds || L.latLngBounds(BAHIA_BOUNDS), { paddingTopLeft: [18, 112], paddingBottomRight: [18, 18], duration: 1.6 });
  }

  // ---------- Idle / attract mode ----------

  function onActivity() {
    if (attracting) stopAttract();
    resetIdle();
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startAttract, IDLE_SECONDS * 1000);
  }
  function startAttract() {
    if (attracting || !map) return;
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
  }
  function toggleMonth(n) {
    state.activeMonth = state.activeMonth === n ? null : n;
    renderChips();
    renderFilterTrigger();
    updateDisclosure();
  }
  function clearFilters() {
    state.activeTrophy = null;
    state.activeMonth = null;
    renderChips();
    renderFilterTrigger();
    updateDisclosure();
  }

  function renderChips() {
    el.trophyChips.innerHTML = '';
    TROPHIES.forEach(([k, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill' + (state.activeTrophy === k ? ' is-on' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => toggleTrophy(k));
      el.trophyChips.appendChild(btn);
    });

    el.monthChips.innerHTML = '';
    MONTHS.forEach((label, i) => {
      const n = i + 1;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill-month' + (state.activeMonth === n ? ' is-on' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => toggleMonth(n));
      el.monthChips.appendChild(btn);
    });
  }

  function renderMatchLabel() {
    const hasFilters = !!(state.activeTrophy || state.activeMonth);
    el.matchLabel.textContent = hasFilters
      ? state.matchCount + (state.matchCount === 1 ? ' ponto corresponde' : ' pontos correspondem')
      : '21 pontos mapeados';
    el.clearFiltersBtn.hidden = !hasFilters;
  }

  function renderFilterTrigger() {
    const hasFilters = !!(state.activeTrophy || state.activeMonth);
    const count = (state.activeTrophy ? 1 : 0) + (state.activeMonth ? 1 : 0);
    el.filterTrigger.classList.toggle('is-open', state.filtersOpen);
    el.filterTrigger.classList.toggle('has-filters', hasFilters);
    el.filterTrigger.setAttribute('aria-expanded', String(state.filtersOpen));
    el.filterChevron.classList.toggle('is-open', state.filtersOpen);
    el.filterBody.hidden = !state.filtersOpen;
    el.filterCount.hidden = !hasFilters;
    el.filterCount.textContent = String(count);
    renderMatchLabel();
  }

  function renderZoomHint(level) {
    const hints = { region: '', main: '', detail: 'Todos os pontos visíveis · toque num pino para detalhes' };
    const text = hints[level] || '';
    if (text) {
      el.zoomHintText.textContent = text;
      el.zoomHint.hidden = false;
    } else {
      el.zoomHint.hidden = true;
    }
  }

  // ---------- Wire up static UI ----------

  function bindUi() {
    el.resetBtn.addEventListener('click', resetView);
    el.filterTrigger.addEventListener('click', toggleFilters);
    el.clearFiltersBtn.addEventListener('click', clearFilters);
    el.legendMain.addEventListener('click', () => toggleLegendHighlight('main'));
    el.legendSecondary.addEventListener('click', () => toggleLegendHighlight('secondary'));
    el.legendZone.addEventListener('click', () => toggleLegendHighlight('protected'));

    ['pointerdown', 'wheel', 'keydown'].forEach((evt) => document.addEventListener(evt, onActivity, { passive: true }));

    renderChips();
    renderFilterTrigger();
    renderLegendActive();
  }

  function waitForLeaflet(tries) {
    if (window.L) { initMap(); return; }
    if (tries > 80) return;
    setTimeout(() => waitForLeaflet(tries + 1), 60);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindUi();
    waitForLeaflet(0);
  });
})();
