# Changelog — Mapa Interativo de Pesca Esportiva na Bahia

Resumo das alterações do refactor de espécies e das etapas seguintes, na ordem em que foram feitas.

## Etapa 0 — Baseline

- Criado `scripts/check-data.js` (Node puro, sem dependências): reporta espécies sem POI, `trophyKeys` órfãs, espécies sem imagem, imagens órfãs, POIs sem `months` e contagem de POIs por espécie. Verificação padrão do projeto a partir daqui.
- Branch `refactor/especies-v2` criada.

## Etapa 1 — `js/species.js`

- Novo arquivo `js/species.js`, carregado antes de `js/data.js`: catálogo de 44 espécies (`key`, `nome`, `nomeNacional`, `cientifico`, `aliases[]`, `habitat`, `porte`, `status`, `meses[]`, `tecnica`, `nota`).
- `const TROPHIES = SPECIES.map(s => [s.key, s.nome])` no final, para não quebrar o filtro existente.
- `TROPHIES` removida de `js/data.js`.

## Etapa 2 — Migração de `js/data.js`

- Remapeamento de `trophyKeys` de todos os POIs para as novas chaves de `species.js` (ex.: `dourado-mar` → `dourado-do-mar`, `robalo-flecha` → `camurim`, `olhodeboi` → `arabaiana`), incluindo fusão de chaves duplicadas (`caranha`→`vermelho-caranha`, `pintado`→`surubim`).
- Chave genérica `robalo` redistribuída em `camurim`/`camurim-pena` nos 8 POIs que a usavam.
- `months`/`season` preenchidos nos 11 POIs secundários (antes só os principais tinham).
- Coordenada de `p2` (Abrolhos) corrigida — caía dentro do parque onde a pesca é proibida.
- Campo único `level` (misturava dificuldade/acesso/habitat) separado em `dificuldade` + `acesso`.
- `region` normalizada (`Recôncavo` → `Reconcavo`, depois substituída pelas Zonas Turísticas oficiais na rodada seguinte).

## Etapa 3 — Assets de imagem

- Arquivos em `assets/fish/` renomeados via `git mv` para bater com as chaves de `species.js`; duplicatas (`caranha.avif`, `pintado.avif`) removidas.
- `assets/fish/_placeholder.svg` (silhueta neutra) + helper `fishImg(key, alt)` em `js/app.js`, com fallback automático via `onerror`.
- `assets/fish/FALTANTES.md`: lista as espécies sem foto ainda, com nome científico.

## Etapa 4 — Zonas de proteção

- `PROTECTED_AREAS` em `js/data.js`: 2 áreas `proibida` (PARNA Abrolhos, PARNA Timbebas) + 3 `restrita` (APA Baía de Todos os Santos, APA Litoral Norte, RESEX Canavieiras) — corrige o erro conceitual de tratar APA como pesca proibida.
- Renderização por tipo (vermelho tracejado / âmbar sólido), com toggle independente na legenda para cada categoria.

## Etapa 5 — Seção Espécies

- Nova aba **Espécies** (`#species-view`), alternável com o Mapa via botão no header.
- Grade de species-cards agrupada por habitat (Oceânicas/Recifais/Estuarinas e costeiras/Água doce), com imagem, nome nacional, badge de status e contador de destinos.
- Painel de detalhe da espécie: imagem, aliases, cards de habitat/porte/técnica, barra de 12 meses (com caso especial do Mero: barra apagada + aviso de captura proibida), nota, e seção **"Onde pescar na Bahia"** agrupada por zona, com POIs clicáveis que levam de volta ao mapa com o ponto já aberto.
- Busca por nome/nome nacional/científico/apelidos, normalizando acento e pontuação (`\p{Diacritic}`).
- Ajuste posterior: imagens dos cards trocaram `object-fit: cover` por `contain` + padding, para não cortar os peixes.

## Zonas Turísticas e legibilidade do mapa (entre a Etapa 5 e a 6)

- Removido o aviso fixo "Todos os pontos visíveis · toque num pino para detalhes" (texto único do recurso de zoom-hint — o recurso inteiro foi removido, não só o texto).
- As 6 macrorregiões antigas foram substituídas pelas **13 Zonas Turísticas oficiais da SETUR**, com os 21 POIs remapeados por geografia real (`REGIONS`/`REGION_LABELS` em `js/data.js`), com centróides aproximados marcados `VALIDAR`.
- Rótulo da legenda "Macrorregiões" → "Zonas Turísticas".
- Sobreposição de rótulos no mapa geral: mecanismo de linha de chamada (`labelOffset` + SVG tracejado) aplicado às zonas mais densas (Salvador/Recôncavo, Chapada, Vale do São Francisco, Costa das Baleias etc.), com verificação por medição de bounding box via script no console — não só inspeção visual.
- Filtro de espécie-troféu (painel "Filtros") reorganizado: agrupado por habitat e ordenado alfabeticamente dentro de cada grupo (mesma convenção da aba Espécies).

## Etapa 6 — Modo apresentação

- `IDLE_SECONDS`: 60 → 180. Tecla `A` liga/desliga o attract mode manualmente, com indicador discreto quando desativado.
- Atalhos de teclado: `1`–`9`/`0` (destino principal p1–p10), `←`/`→` (navega POIs visíveis), `Esc` (fecha painel e volta ao mapa geral), `F` (filtros), `E` (Mapa ↔ Espécies), `A` (attract mode). Ignorados com foco em campo de busca; qualquer tecla reseta o idle timer.
- Tela de abertura (`#intro-screen`): card com contadores **calculados** de `SPECIES.length`/`POIS.length`/`REGIONS.length` (nunca hardcoded); fecha com clique, `Esc` ou qualquer tecla; não reaparece até recarregar a página. Extensão do litoral (`KM_LITORAL_BAHIA`) marcada `VALIDAR`.

## Etapa 7 — Resiliência offline

- Leaflet (`leaflet.js`, `leaflet.css`, `images/`) vendorizado em `vendor/leaflet/`; tags de CDN removidas do `index.html`.
- Fontes Baloo 2 e Nunito baixadas para `assets/fonts/` (fonte variável — 1 arquivo por família cobre todos os pesos) e declaradas via `@font-face` local.
- `scripts/fetch-tiles.js` (Node puro): baixa os tiles do Esri Ocean Basemap para o bbox da Bahia, zooms 5–10 (1.320 tiles, ~20 MB). **Nota:** o serviço serve os tiles como JPEG, não PNG como o enunciado original previa — ajustado para `assets/tiles/{z}/{x}/{y}.jpg`.
- `tileLayer` tenta o cache local primeiro e cai para a URL remota do Esri tile a tile, via `tileerror`. Atribuição `© Esri — Ocean Basemap` mantida visível em qualquer um dos dois casos.
- `assets/tiles/` adicionado ao `.gitignore` (artefato de build, não código).
- Download completo executado e verificado: 1.320/1.320 tiles, 0 erros.

## Etapa 8 — Verificação final

- 6 espécies (`albacorinha`, `badejo`, `cherne`, `cioba`, `dentao`, `guaiuba`) estavam sem nenhum POI associado (chip morto) — corrigido adicionando cada uma a um POI de habitat/perfil compatível (ex.: Cherne no drop-off profundo de Banco Royal Charlotte, Badejo em Abrolhos), todas marcadas `VALIDAR` para confirmação com operadores locais.
- `node scripts/check-data.js`: 0 chips mortos, 0 `trophyKeys` órfãs, 0 POIs sem `months`, 0 imagens órfãs, 13 espécies sem imagem (exatamente as de `FALTANTES.md`).
- Confirmado que nenhuma das chaves antigas (`robalo-flecha`, `robalo-peva`, `olhodeboi`, `bicuara`, `dourado-mar`, `dourado-rio`, `corvina-doce`, `xareu-amarelo`) aparece fora de `aliases` — só `robalo-peva` ocorre, dentro do array de aliases do Camurim-pena, como esperado.
- Testes manuais: filtro de mês mantém as duas categorias de pino visíveis; filtro por Camurim retorna **9** pontos (não 8 — ver nota abaixo); card do Mero com selo de proibição e barra de meses apagada; link espécie → mapa abre o ponto correto; busca "robalo" encontra Camurim, "olho de boi" encontra Arabaiana; todos os atalhos (`1`–`0`, setas, `Esc`, `F`, `E`, `A`) testados via disparo de evento e confirmados; zero requisições de rede externas nas ferramentas de inspeção (prova de que a página funciona sem internet).

### Nota sobre a divergência "8 vs. 9 pontos" no filtro de Camurim

O item de verificação pedia 8 pontos para o filtro `camurim`; o resultado real é **9**. A diferença é o ponto principal `p3` (Estuário do Rio Jaguaripe) — o próprio "Santuário do Robalo-Flecha" da Etapa 2, com `camurim` desde a migração original, e não parte da tabela de redistribuição de 8 pontos daquela etapa (que tratava da chave genérica `robalo`, não do Jaguaripe). Removê-lo do filtro estaria errado — ele é o destino mais relevante para essa espécie. Reportando aqui em vez de forçar o número para bater com o checklist.

## Pós-merge — ajustes de apresentação

- **Logo e banner de boas-vindas.** Logo Bahia Turismo acima do card de abertura. Depois, os contadores ("1.180 km de litoral · 44 espécies-troféu…") foram removidos e substituídos pela linha "Bem-vindo ao mapa interativo da" entre a logo e o título. `KM_LITORAL_BAHIA` e `renderIntroStats()` saíram junto.
- **Rótulos de zonas costeiras.** "Bahia de Todos os Santos" corrigido para "Baía de Todos-os-Santos" (região, POIs e legenda). Costa dos Coqueiros, Baía de Todos-os-Santos, Costa do Dendê e Costa das Baleias passaram a deslocar o rótulo para o lado do mar em vez do interior.
- **Valores em BRL** removidos de operadoras, regras e descrições de destinos.

## Pós-merge — card de espécie, navegação e legenda

- **Card de espécie flutuante.** `#species-detail-panel` saiu de dentro de `#species-view` (que rola) e virou modal fixo centrado na viewport, com backdrop. Antes herdava o posicionamento absoluto de `.detail-panel` dentro do container rolável e ficava preso no topo da grade, frequentemente fora de vista. Fecha com clique fora, no `×` ou com `Esc`; no celular vira folha inferior.
- **Botão de fechar sobre a imagem**, no canto superior direito, em vez de ao lado do nome da espécie.
- **Campo `nota` limpo.** Removido do dado tudo que era bookkeeping do refactor ("Substitui a categoria genérica *Atum*", "Fusão das chaves antigas…") e os marcadores `VALIDAR`, que estavam sendo renderizados no card público. As pendências viraram comentário em `js/species.js`; espécies sem curiosidade real ficam sem caixa de Nota. Espaço adicionado entre a Nota e "Onde pescar na Bahia".
- **Navegação a partir do card de destino.** Cada nome de peixe (troféu e secundárias) leva ao card da espécie; cada município da Hospedagem leva ao mapa — abrindo o card do POI homônimo quando existe (Canavieiras, Caravelas) ou aproximando a sede municipal quando não (novo `MUNICIPIOS` em `js/data.js`, coordenadas aproximadas marcadas `VALIDAR`). Auditado: 100% dos nomes de peixe e dos municípios resolvem.
- **Locais sem card** (Zona Turística, pesca proibida, área protegida) agora fecham o card aberto ao serem clicados, em vez de deixar o painel descrevendo outro lugar.
- **Legenda recolhível**, fechada por padrão, expandindo para cima ao clicar no cabeçalho. "Área protegida — restrições" virou "Área protegida".
- **Botão "Mapa geral"** substituído por um botão de ícone (enquadrar), com `title`/`aria-label` "Ver toda a Bahia".
- **Imagens das espécies completas.** As 12 fotos que faltavam foram integradas; a 13ª chegou nomeada `robalo.avif` mas a ilustração é um serranídeo — renomeada para `badejo.avif`, a única chave ainda sem imagem. `check-data.js` agora reporta 0 espécies sem imagem e 0 imagens órfãs (44/44).
- **Robustez do enquadramento inicial.** `getBoundsZoom()` num container ainda sem layout (aba oculta, painel fechado) devolve o `maxZoom`, e o `setMinZoom()` seguinte travava o mapa no zoom máximo permanentemente. O `minZoom` só é fixado com o container medido, e um `ResizeObserver` refaz o enquadramento quando o tamanho real aparece.
