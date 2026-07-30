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

## Auditoria de conformidade institucional (Blocos A–E)

Rodada de correções conduzida a partir de um megaprompt de auditoria, executada bloco a bloco com commit, push e validação entre cada um. Nenhuma alteração em `css/styles.css` em nenhum dos blocos — o visual online permanece exatamente igual.

**Bloco A — correções de dado.**
- **Mero deixa de ser espécie-alvo.** Estava em `trophyKeys`/`secondary` do POI `p3` (Estuário do Rio Jaguaripe) — espécie com captura proibida por moratória federal (CR na lista nacional) não pode aparecer como troféu ou secundária numa peça do Governo da Bahia. Novo campo `ocorrenciaProtegida` (mesmo vocabulário de `trophyKeys`) para espécies que ocorrem na área mas não são pescáveis; renderizado em bloco próprio no card do destino, nunca misturado às secundárias, reaproveitando classes CSS já existentes (`.detail-fish-chip` + `.species-badge-proibida`) — zero CSS novo.
- **Hospedagem fora da Bahia corrigida.** `p6` (Represa de Sobradinho) citava Petrolina/PE em `lodging`, `operators` e `MUNICIPIOS`; trocado por Juazeiro/BA. `s10` (Represa de Itaparica) citava Petrolândia/PE em `loc`; trocado por Rodelas/BA, com `VALIDAR` registrando que o reservatório é divisa BA/PE.
- **"Caminhos do Jiquiriça" corrigido para "Caminhos do Jiquiriçá"** (acento agudo no "a" final), em `REGIONS` e `REGION_LABELS`.
- **Grafia "Baía de Todos-os-Santos".** Confirmada como a correta e adotada em todo o projeto. A única ocorrência sem hífen mantida de propósito é a denominação oficial da APA junto ao INEMA (`apa-btsantos.nome`, "APA Baía de Todos os Santos") — distinta do nome da Zona Turística. O nome de exibição do POI `s1` ("Salvador — Baía de Todos os Santos"), que não correspondia a denominação de nenhuma outra entidade, foi corrigido para a forma hifenizada.
- **s1 (Salvador — Baía de Todos-os-Santos):** blurb ganhou a área da baía (1.233 km²). Deliberadamente **sem** o superlativo "segunda maior baía do mundo" — a alegação circula amplamente mas não se sustenta em comparação de área e não deveria estar em peça institucional.
- **Remoção do POI `p8` (Alto Rio Paraguaçu) e da espécie `matrinxa`.** Levantamento da ictiofauna da APA Marimbus-Iraquara, no alto Paraguaçu (UEFS, 2025), registrou 23 espécies em dez famílias, nenhuma delas Bryconidae (a família do dourado e da matrinxã) — a assembleia é dominada por characídeos de pequeno porte, e o gênero *Salminus* não é nativo das bacias costeiras do Leste. O POI não descrevia uma pescaria existente, e o trecho está numa APA de ictiofauna endêmica e mal conhecida. Objeto preservado em bloco comentado ao final de `js/data.js`, com a fundamentação; `matrinxa` removida de `species.js` e `assets/fish/matrinxa.avif` removida do repositório, registrada no histórico de `FALTANTES.md`. **A Chapada Diamantina passa a não ter nenhum ponto de pesca no mapa** — ela continua existindo como Zona Turística (o rótulo no mapa é renderizado independente de POI), só deixou de ser apresentada como destino de pesca esportiva, por não ser.
- `sig` dos POIs principais renumerado sem lacuna (`SIG 001`–`SIG 009`, 9 destinos). `jumpToMain()` (atalhos `1`–`9`/`0`) deixou de mapear pelo `id` fixo (`'p' + n`) e passou a derivar da posição na lista ordenada de POIs principais — do contrário a tecla `9` quebraria depois da remoção do `p8`.

**Bloco B — status de conservação**, base normativa Portaria GM/MMA nº 1.667/2026 (Lista Nacional Oficial de Espécies Ameaçadas — Peixes e Invertebrados Aquáticos) e nº 1.666/2026 (regras e restrições), ambas de 27/04/2026.
- Mero: nota reescrita citando a moratória (Portaria IBAMA nº 121/2002, mantida pela Portaria MMA nº 148/2022) e a categoria Criticamente em Perigo.
- Garoupa (VU), Badejo (EN) e Cherne (VU): status confirmado, `VALIDAR` genérico substituído por nota com a categoria e a remissão às portarias.
- Pargo (EN), Vermelho-Caranha (VU) e Surubim (VU): `status` mudou de `nativo` para `ameacada` — constam do Anexo I e eram anunciados sem ressalva. Catálogo foi de 6 para 9 espécies com `status: 'ameacada'`; o selo é genérico por status, então as três passaram a exibi-lo sem qualquer alteração de CSS.

**Bloco C — remoção do cache offline de tiles.** Decisão de projeto: preservar o visual online exatamente igual, removendo só o mecanismo de download/redistribuição em massa dos tiles do Esri, que era o ponto de risco quanto aos termos de uso do serviço. `scripts/fetch-tiles.js` removido; `js/app.js` volta a um único `L.tileLayer` direto para a URL remota, com o mesmo `maxZoom` e a mesma atribuição de antes; `assets/tiles/` (20 MB) apagado do disco e removido do `.gitignore`. O mapa continua consumindo o Esri Ocean Basemap — ao vivo, não mais em cache — e a atribuição `© Esri — Ocean Basemap` continua visível. `vendor/leaflet/` e `assets/fonts/` não foram tocados: continuam vendorizados, por serem recursos de licença compatível sem relação com o problema dos tiles.

**Bloco D — `README.md`.** Documentação geral do projeto: modelo de dados, scripts, dependência de rede (sem modo offline, após o Bloco C), modo apresentação, notas de implementação, convenção `VALIDAR` e aviso de que o repositório é privado, com identidade visual do Governo do Estado da Bahia de uso restrito.

**Bloco E — faxina.** `assets/brasao-bahia.png` removido — não era referenciado em nenhum HTML, JS ou CSS (confirmado por grep antes da remoção).

## Auditoria de veracidade — rodada 1 (Bloco F)

Verificação em fontes primárias (sites das próprias operadoras e literatura científica) sobre operadoras citadas em `operators` e sobre a viabilidade de reincluir um ponto de pesca na Chapada Diamantina.

- **`p5` (Baía de Camamu): duas operadoras removidas por não operarem pesca esportiva.** Camamu Adventure (transporte e passeios marítimos — linha regular de lanchas, escunas, barco de eventos) e Princesinha Turismo (passeios turísticos — ilhas, baleias, Moreré, Boipeba) saíram de `operators`; só ficou a Tuna Pesca Maraú, que de fato opera pesca esportiva de alto-mar.
- **`p1` (Banco Royal Charlotte): alegação comercial mantida fora do dado.** O material da própria operadora divulga que mais da metade dos marlins-azuis embarcados supera 250 kg — é alegação de marketing, não estatística verificada, e não foi reproduzida. O mesmo material também erra a data e o peso do recorde IGFA (informa 637 kg em 1978; o correto é 636 kg, Paulo Amorim, ao largo de Vitória/ES, em 29/02/1992) — o `blurb` já trazia a correção; um comentário `NOTA` registra a divergência para não ser reintroduzida por engano.
- **Chapada Diamantina reincluída, com base em literatura científica, no lugar da pescaria de dourado que não existia.** Novo POI `p8`, "Rios da Chapada Diamantina": pesca leve de Traíra (com Tucunaré, espécie introduzida, como secundária) no alto Paraguaçu, baseada em levantamento de conhecimento ictiológico tradicional e no estudo da UEFS (2025) citado na Etapa anterior — em vez da pescaria de Dourado/Matrinxã que a auditoria já havia derrubado por não corresponder à ictiofauna real do rio. `sig` sequencial restaurado a `SIG 001`–`SIG 010` (10 destinos principais); `MUNICIPIOS` recupera Andaraí e Lençóis; o rótulo "pontos mapeados" volta a 21. A espécie `matrinxa` **não** retorna ao catálogo — não ocorre no Paraguaçu e o novo POI não a usa.
- **Oito POIs seguem com operadoras ou dados não verificados nesta rodada**, marcados com `VALIDAR` para a próxima: `p2` (Abrolhos Viagens/Mergulho, Abrolhos Adventure, Horizonte Aberto), `p3` (Charter Náutico), `p4` (acesso via Indiaroba/Jandaíra), `p7` (Pousada Ilha Bela), `p9` (Base Náutica Praia do Forte e a faixa batimétrica/distância da costa), `p10` (Poço do Cedro e as campanhas INEMA/Codevasf), `s4` (Ilhéus Pesca Oceânica, FF Pesca) e `s6` (Arraial d'Ajuda Passeios, Porto Pesca, Porto Seguro Passeios).

## Auditoria de veracidade — rodadas 2 e 3 (Blocos G e I)

- **Confirmados em fonte primária, comentário `AUDITADO`, sem alteração de dado:** Charlote Fishing (`p1`), Base Náutica Praia do Forte (`p9`) e Tuna Pesca Maraú (`p5`).
- **`p2` (Parcéis periféricos de Abrolhos) e `s7` (Caravelas): nenhuma operadora de pesca confirmada.** As três antes listadas (Horizonte Aberto, Abrolhos Viagens/Mergulho, Abrolhos Adventure) operam mergulho e visitação às ilhas, não pesca esportiva, e são credenciadas para o interior do Parque Nacional, onde a pesca é proibida — o dado "catamarãs até 81 pés" também estava errado (a maior embarcação tem 16 m). `operators` esvaziado nos dois POIs; `VALIDAR (BLOQUEANTE)` registrando que, sem operadora de pesca confirmada fora do parque, `p2` deve ser removido pelo mesmo critério do antigo POI da Chapada.
- **`s4` (Ilhéus): operadoras confirmadas, dado de embarcação corrigido.** Ilhéus Pesca Oceânica e FF Pesca são reais; o dado anterior sobre a FF Pesca ("barcos ZETA 28 pés, carretos elétricos") estava incorreto e foi substituído pelos dados publicados pela própria operadora (saída do Ilhéus Iate Clube, embarcações de 40 e 27 pés). `VALIDAR` registrando que a operadora reporta marlim-azul a 18 milhas da costa — fora do escopo atual do POI ("mar recifal, 8 milhas").
- **`s6` (Porto Seguro / Arraial d'Ajuda): Porto Pesca confirmada, horário de saída corrigido.** Horário no `blurb` corrigido de "04h" para "5h", alinhado à operadora (Cap. Robson Saldanha, partida do píer do Hotel Quinta do Porto). `VALIDAR` registrando que as espécies anunciadas pela operadora (marlins, wahoo, olho-de-boi, atum) não coincidem com o perfil recifal leve hoje descrito no POI, e que Arraial d'Ajuda Passeios e Porto Seguro Passeios seguem sem confirmação como operações de pesca.
- **`p7` (Canal de Paulo Afonso): Pousada Ilha Bela removida de `operators`.** É hospedagem comum (já listada em `lodging`), sem evidência de apoio à pesca — não há operadora de pesca confirmada para este ponto.
- **Não verificados nesta rodada:** `p3`, `p4` e `p10` — `VALIDAR` do Bloco F5 mantido sem alteração.

## Auditoria de veracidade — rodada 4 e encerramento (Bloco J)

Todos os 21 POIs passaram por verificação em fontes primárias, ao longo das quatro rodadas de auditoria (Blocos F, G, I, J).

- **`p3` (Estuário do Rio Jaguaripe): "Charter Náutico" não corresponde a empresa identificável, removido.** Destino confirmado pelo site oficial de turismo de Jaguaripe (santuário do robalo-flecha, afluente Mucujó — acrescentado ao `loc` —, saída por volta das 7h, camarão vivo com boia "paulistinha"; `blurb` ajustado de "06–10h" para "a partir das 7h"). `VALIDAR` para confirmar se a Bahia Top Fishing, operação de pesca sediada em Jaguaripe especializada em robalo, segue ativa. **Pendência institucional:** o site de turismo do município lista o Mero entre os alvos de pesca de fundo — provável origem da inclusão indevida do Mero neste POI, corrigida no Bloco A1. A reportar à SETUR para tratativa com o município.
- **`p4` (Foz do Rio Real / Mangue Seco): acesso confirmado, nenhuma operadora de pesca localizada.** O texto que estava em `operators` era descrição de acesso (travessia por Pontal/Indiaroba-SE; acesso baiano por Jandaíra/Costa Azul) e foi movido para `loc`. `VALIDAR` para confirmar com a SETUR e a prefeitura de Jandaíra se existe guia de pesca ativo.
- **`p10` (Rio Grande, Oeste): executor do repovoamento corrigido.** Não é o INEMA — é a Codevasf com a Prefeitura de Barreiras (Secretaria de Meio Ambiente e Sustentabilidade), com apoio da Bahia Pesca; alevinos produzidos no Centro de Xique-Xique. Espécies soltas documentadas (piau-verdadeiro, curimatã, surubim, cari, pacu, pacamã) sustentam as espécies-alvo do POI. O pesqueiro "Poço do Cedro" não foi localizado em nenhuma fonte e foi removido do `loc` (`VALIDAR` para reinserir se for topônimo legítimo, com confirmação da Secretaria de Meio Ambiente de Barreiras). `VALIDAR` também sobre o Tucunaré, que não aparece nas campanhas de repovoamento nem como espécie nativa do rio Grande — se ocorrer, é introduzido.
- **`s11` (Luís Eduardo Magalhães): validado por consequência.** Rios de Ondas e Ribeirão Boa Sorte confirmados como alvos das mesmas campanhas de repovoamento; menção ao INEMA no `blurb` corrigida pelo mesmo critério de `p10`.

### Resumo das quatro rodadas

- **Operadoras confirmadas em fonte primária:** Charlote Fishing (`p1`), Base Náutica Praia do Forte (`p9`), Tuna Pesca Maraú (`p5`), Ilhéus Pesca Oceânica e FF Pesca (`s4`), Porto Pesca (`s6`).
- **POIs que ficaram sem operadora, por não haver operação de pesca confirmada:** `p2`, `p3`, `p4`, `p7`, `s7` (`p2` e `s7` com `VALIDAR (BLOQUEANTE)` — podem exigir remoção, mesmo critério do antigo POI da Chapada).
- **Correções de fato:** executor do repovoamento no Oeste (Codevasf e Prefeitura de Barreiras, não INEMA), dados de embarcação da FF Pesca, horário de saída da Porto Pesca, remoção do pesqueiro "Poço do Cedro" e da operadora "Charter Náutico" por não serem localizáveis em nenhuma fonte.
- **Pendência institucional reportada à SETUR:** o site oficial de turismo de Jaguaripe divulga o Mero como alvo de pesca de fundo — espécie sob moratória federal, provável origem do dado incorreto já corrigido no Bloco A1.

## Alinhamento aos folders oficiais da SETUR-BA (Blocos K e L)

Novo prompt, independente do anterior: alinhamento do catálogo aos folders oficiais de dois destinos (Paulo Afonso e Canavieiras), com princípio editorial explícito — o texto visível (`blurb`, `loc`, `trophy`, `rules`) é peça de convite, não errata; ressalvas técnicas e divergências vão em comentário `//`, nunca no texto do visitante. Onde o folder e o catálogo divergem, prevalece o folder, exceto em obrigação legal do visitante, status de conservação de espécie e existência real de operadora/local.

- **`p7` (Paulo Afonso): alinhado ao folder oficial, com parceria técnica Igarapesca Jungle Fishing.** Renomeado para "Paulo Afonso e reservatórios da CHESF"; espécies-alvo ampliadas de 2 para 6 (surubim, tucunaré, dourado-do-rio, traíra, piau, **Apaiari** — nova espécie no catálogo); `loc`, `acesso` e `blurb` alinhados ao folder; grafia "hidroelétrica" corrigida para "hidrelétrica"; rede local de aluguel de equipamentos e guias adicionada em `operators` (antes vazio). Comentários internos documentam que a Igarapesca é parceria técnica, não operadora local, e registram divergências do folder nas medidas de dourado e traíra (na verdade de outras espécies do mesmo gênero) e na taxonomia do piau, para reportar à SETUR.
- **`p1` (Banco Royal Charlotte) e `s5` (Canavieiras): alinhados ao folder oficial de Canavieiras.** `p1` ganha 24 milhas (no lugar de 17, dado da operadora), temporada ampliada para setembro–março, e passa a ter 11 espécies-alvo — Cherne removido (nunca confirmado, fora do folder). `s5` ganha `rules` preenchido (antes vazio) com as normas da RESEX, espécies-alvo ampliadas (inclui Tarpon/Camurupim e Tucunaré-pinima), temporada agosto–abril (janela legal, resolvendo contradição interna do folder) e `blurb` novo.
- **RESEX Marinha de Canavieiras: entrada já existente em `PROTECTED_AREAS` atualizada, não duplicada.** O polígono já constava do projeto desde antes destes blocos; `lat`/`lng`/`raio`/`nota` foram atualizados com o texto do folder (pesque e solte, condutor beneficiário), em vez de criar uma segunda entrada. Comentário `REGULATÓRIO` registra a Portaria ICMBio nº 313/2018 como o instrumento localizado; `VALIDAR` sobre o número de portaria e as datas de defeso divulgados pelo folder, que não conferem com essa portaria.
- **Espadarte (folder de Canavieiras) consolidado na ficha `meca` já existente (Bloco H), em vez de criar uma segunda espécie.** Mesmo peixe (*Xiphias gladius*); `porte` atualizado com o dado do folder, aliases ampliados. Sem essa consolidação, `meca` ficaria sem uso (chip morto) e o catálogo teria duas fichas para a mesma espécie.
- **Wahoo e Albacora: já existiam no catálogo (`wahoo` e `albacora-laje`), reaproveitados em vez de recriados.** O folder os descreve como espécies novas, mas ambos já estavam cadastrados e em uso em outros POIs — criar `wahoo` de novo resultaria em duas entradas com a mesma chave (bug: a segunda ficaria inacessível). `porte` de ambos atualizado com o dado do folder (mais próximo do registro documentado da espécie); `albacora-laje` ganha `nota` (antes vazia). Divergências do folder — equiparar Cavala a Wahoo, tratar Albacora/Yellowfin como espécies distintas, incluir Bluefin (improvável na Bahia), superestimar o peso do marlim-azul, usar gênero desatualizado para o marlim-branco — registradas em comentário para reportar à SETUR.
- **Dourado-do-mar: `porte` corrigido para `até 2,1 m · 40 kg`**, mais próximo do registro documentado da espécie, conforme o folder.
- **Catálogo: de 44 para 45 espécies** (Apaiari — única espécie genuinamente nova; Espadarte, Wahoo e Albacora não geraram novas fichas, por já existirem ou por consolidação). Duas espécies sem imagem: `meca` e `apaiari`.
- **`cherne` fica sem uso (chip morto) por decisão editorial do Bloco L3** — nunca foi confirmado em `p1` e não consta do folder oficial; a espécie permanece no catálogo (pode voltar a ser referenciada se houver confirmação futura).
