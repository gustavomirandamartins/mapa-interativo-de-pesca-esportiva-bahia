# Mapa Interativo de Pesca Esportiva na Bahia

Mapa interativo dos destinos de pesca esportiva do Estado da Bahia, com catálogo
de espécies-troféu. Feito para apresentação em tela cheia na **Fishing Show
Brazil 2026** (Governo da Bahia · SETUR) e para uso público em desktop e celular.

Site estático: HTML, CSS e JavaScript puro, sem framework, sem build, sem
dependências de runtime além do Leaflet — que é servido do próprio repositório.

> **Repositório privado.** Contém identidade visual do Governo do Estado da
> Bahia (logo, brasão, paleta institucional). Uso restrito à SETUR-BA e a quem
> ela autorizar — não há licença de código aberto e não deve ser publicado nem
> distribuído sem autorização.

> **Estado dos dados: levantamento documental, não validado em campo.**
> Destinos, operadoras e sazonalidade vêm de pesquisa em fontes abertas (sites
> de operadoras, prefeituras, literatura científica), não de vistoria com as
> instâncias regionais de governança. Pendências ficam marcadas com
> `// VALIDAR:` no código (ver [Convenção VALIDAR](#convenção-validar)) —
> **nenhum item marcado como pendência ou bloqueante deve ir a público antes de
> confirmação com o INEMA e a SETUR.**

---

## Rodando

Não há passo de build. Qualquer servidor estático serve, mas é preciso servir por
HTTP: a aplicação faz `fetch` dos GeoJSON de contorno, o que não funciona abrindo
o `index.html` direto do sistema de arquivos (`file://`).

```bash
python3 -m http.server 5511
```

Depois, abra <http://localhost:5511>.

O repositório já traz `.claude/launch.json` com essa configuração sob o nome
`static`, para quem usa o preview integrado do Claude Code.

**Windows sem Python e sem poder instalar nada (ex.: máquina do estande):** dê
duplo-clique em `scripts/serve-windows.bat`. Ele roda um servidor HTTP local
escrito em PowerShell puro (`scripts/serve-windows.ps1`) — nada para instalar,
usa só o que já vem com o Windows — e já abre o navegador sozinho em
`http://localhost:5511`. Deixe a janela preta aberta enquanto usar o mapa; para
encerrar, feche a janela. Testado (com PowerShell 7, compatível com o Windows
PowerShell 5.1 que já vem em qualquer Windows 10/11): serve HTML/JS/CSS/JSON/
imagens com o `Content-Type` correto, bloqueia tentativa de sair da pasta do
projeto, e o app carrega normalmente por ele, tiles locais incluídos.

---

## Estrutura

```
index.html              Marcação da página inteira (cabeçalho, mapa, painéis, aba Espécies)
css/styles.css          Todo o estilo, incluindo @font-face local e breakpoints responsivos
js/species.js           Catálogo de 45 espécies — carregado ANTES de data.js
js/data.js              Zonas turísticas, destinos (POIs), áreas protegidas, municípios
js/app.js               Toda a lógica: mapa, filtros, cards, atalhos, modo apresentação, PWA
manifest.json           Manifesto da PWA (nome, ícones, display standalone) — ver "PWA" abaixo
sw.js                   Service worker: cache do app shell para instalar como app
scripts/check-data.js   Verificação de integridade dos dados (Node puro)
scripts/fetch-tiles.js  Baixa o cache de tiles do modo off-line de evento — ver "Modo off-line"
scripts/serve-windows.* Servidor HTTP local em PowerShell puro, sem instalação (Windows)
vendor/leaflet/         Leaflet vendorizado (js, css, images)
assets/fonts/           Baloo 2 e Nunito em woff2, servidas localmente
assets/fish/            Ilustrações das espécies (.avif), nomeadas pela chave da espécie
assets/icons/           Ícones da PWA, derivados do logo oficial (ver "PWA" abaixo)
assets/bahia.geojson    Contorno do estado
assets/br_states/       Contornos dos demais estados (máscara cinza sobre terra)
```

A ordem dos `<script>` no `index.html` importa: `species.js` → `data.js` →
`app.js`. Os arquivos de dados declaram `const` no escopo global e `data.js`
referencia `SPECIES`.

---

## Modelo de dados

Três arquivos concentram tudo que um editor de conteúdo precisa mexer. Nenhum
deles tem lógica — só dados.

### `js/species.js` — catálogo de espécies

43 espécies, cada uma com:

| Campo | Descrição |
|---|---|
| `key` | Identificador estável. **É também o nome do arquivo da imagem** (`assets/fish/<key>.avif`) |
| `nome` | Nome de exibição. É por ele que os POIs referenciam a espécie nos campos `trophy`/`secondary` |
| `nomeNacional` | Nome adotado nacionalmente, quando difere do baiano |
| `cientifico` | Nome científico |
| `aliases[]` | Nomes regionais — alimentam a busca da aba Espécies |
| `habitat` | `oceanico` · `recifal` · `estuarino` · `dulcicola` |
| `porte`, `tecnica` | Texto livre exibido no card |
| `status` | `nativo` · `ameacada` · `introduzida` · `proibida` (gera o selo colorido) |
| `meses[]` | 1–12, alimenta a barra de sazonalidade |
| `nota` | **Renderizado no card público.** Só curiosidade ou informação de interesse do visitante — pendências de revisão ficam em comentário, nunca no dado |

`status: 'ameacada'` e `status: 'proibida'` seguem a **Portaria GM/MMA nº
1.667/2026** (Lista Nacional Oficial de Espécies da Fauna Ameaçadas de
Extinção — Peixes e Invertebrados Aquáticos, que revogou a Portaria MMA nº
445/2014) para a classificação, e a **Portaria GM/MMA nº 1.666/2026** para as
regras e restrições de captura aplicáveis. Ambas publicadas em 27/04/2026.

### `js/data.js` — destinos e geografia

- **`REGIONS`** — as 13 Zonas Turísticas oficiais da Bahia (SETUR). As coordenadas
  são centróides aproximados só para posicionar o rótulo, não os polígonos
  oficiais. Dois campos controlam a diagramação do rótulo no mapa:
  - `labelOffset: [dx, dy]` — desloca o texto em pixels e desenha uma linha de
    chamada tracejada até o ponto real. Usado onde a vizinhança é densa (corredor
    Salvador/Recôncavo) e nas zonas costeiras, cujo rótulo é jogado para o lado
    do mar em vez do interior.
  - `mapLabel` — abrevia **apenas** o rótulo do mapa; `name` continua sendo o nome
    oficial completo usado em todo o resto da interface.

- **`POIS`** — 20 destinos: 9 principais (`main: true`, pino numerado com `sig`,
  sequencial de `SIG 001` a `SIG 009` sem lacuna) e 11 cidades e bases
  (`main: false`). Campos relevantes:
  - `trophyKeys[]` — **chaves** de espécie. É o que o filtro e o anel de peixes do
    mapa consomem.
  - `trophy` e `secondary[]` — **nomes de exibição** (não chaves). São casados de
    volta com o catálogo por nome normalizado, o que transforma cada peixe citado
    no card do destino em link para o card da espécie.
  - `ocorrenciaProtegida[]` — **chaves** (mesmo vocabulário de `trophyKeys`) de
    espécies que ocorrem na área mas têm captura proibida (ex.: Mero em `p3`).
    Nunca é espécie-alvo nem secundária; renderiza num bloco à parte no card do
    destino, "Ocorre na área, captura proibida".
  - `months[]` / `season` — filtro de mês e texto exibido.
  - `lodging[]` — nomes de municípios; cada um vira link que leva o mapa até a
    sede correspondente em `MUNICIPIOS`.
  - `dificuldade`, `acesso`, `operators[]`, `rules`, `blurb`.

- **`PROTECTED_AREAS`** — 5 áreas: 2 de pesca `proibida` (PARNA Abrolhos e Recife
  das Timbebas) e 3 `restrita` (APA Baía de Todos os Santos, APA Litoral Norte,
  RESEX Canavieiras). A distinção é deliberada: APA **não** é área de pesca
  proibida. As geometrias são círculos aproximados, não os polígonos oficiais.

- **`MUNICIPIOS`** — sedes municipais citadas em `lodging`.

### Invariantes

Duas relações precisam ser mantidas ao editar conteúdo:

1. Toda `key` de `trophyKeys` existe em `SPECIES`.
2. Todo nome em `trophy` / `secondary` casa (normalizado) com o `nome` de alguma
   espécie — senão o peixe aparece como texto simples, sem link nem foto.

O `scripts/check-data.js` cobre a primeira; a segunda é silenciosa por design
(degrada para pílula de texto).

---

## Scripts

Node puro, sem dependências, sem `package.json`.

### Verificação de dados

```bash
node scripts/check-data.js
```

**Rode depois de qualquer edição em `species.js` ou `data.js`.** Carrega os dois
arquivos e relata 6 itens:

1. **Espécies sem nenhum POI (chip morto)** — espécie declarada no catálogo mas
   que não aparece em `trophyKeys` nem em `ocorrenciaProtegida` de nenhum POI.
   Apareceria no filtro do mapa como uma opção que nunca retorna resultado.
2. **`trophyKeys` usadas em POI que não existem no catálogo** — erro de digitação
   ou espécie removida de `species.js` sem atualizar os POIs que a referenciavam.
3. **Espécies sem imagem correspondente em `assets/fish/`** — cai no fallback
   `_placeholder.svg` em vez de quebrar a página; o relatório avisa antes disso
   acontecer em produção.
4. **Imagens em `assets/fish/` sem espécie correspondente** — arquivo órfão,
   geralmente sobrando de uma renomeação ou remoção de espécie.
5. **POIs sem o campo `months`** — quebraria o filtro de mês para aquele destino.
6. **Contagem de POIs por espécie** — quantos destinos citam cada espécie em
   `trophyKeys` (não conta `ocorrenciaProtegida`); útil para achar espécies
   raramente representadas.

Estado atual: 43 espécies, 20 POIs, 43 imagens, zero pendências nos itens 1–5.

---

## Dependência de rede

**Por padrão não há modo offline.** O mapa consome os tiles do Esri Ocean Basemap
ao vivo, diretamente do serviço remoto (`server.arcgisonline.com`) — a instalação
normal do site não tem cache local de tiles no repositório. A operação depende de
conexão de internet dedicada e estável; sem rede, o mapa carrega sem o basemap
náutico (marcadores, filtros e fichas de espécie continuam funcionando).

Recursos que **já são** vendorizados e funcionam sem rede, mesmo sem o modo
off-line abaixo:

- **Leaflet** (js, css, images) em `vendor/leaflet/`.
- **Fontes** (Baloo 2, Nunito) em `assets/fonts/`, declaradas com `@font-face`
  local. Uma única woff2 variável por família cobre toda a faixa de peso.
- Os GeoJSON de contorno (`assets/bahia.geojson`, `assets/br_states/`) e as
  ilustrações de espécie (`assets/fish/`) são servidos do próprio repositório.

A atribuição **`© Esri — Ocean Basemap`** é exigência do serviço e permanece
sempre visível no canto do mapa, com ou sem cache local.

### Modo off-line (estande do Fishing Show Brazil 2026)

Um cache local de tiles já existiu numa versão anterior do projeto e foi
removido por decisão de projeto (ver `CHANGELOG.md`, "Bloco C") — cache/
redistribuição local dos tiles do Esri levanta questão de termos de uso que não
tinha sido confirmada com a SETUR. Ele **voltou como recurso opt-in**, só para a
máquina física do estande, com esse risco assumido conscientemente para esse uso
pontual — não é o comportamento do site publicado normalmente.

**Como preparar a máquina do estande, com internet disponível:**

```bash
node scripts/fetch-tiles.js
```

Isso baixa ~4.460 tiles (zooms 5–10, a área alcançável pelo `maxBounds` do mapa
mais uma margem de 3 tiles em cada zoom — o Leaflet pré-carrega um anel de tiles
além do que está visível, para paneamento suave, e sem essa margem esse anel dá
404) para `assets/tiles/` — uns 65 MB — e grava `assets/tiles/manifest.json` ao
final. Repita o comando se ele terminar com erros: tiles já baixados são pulados.

**Como isso liga sozinho:** `assets/tiles/` está no `.gitignore` — a instalação
online nunca tem esse diretório, então nunca entra em modo off-line. Só quando o
`manifest.json` existe em disco (ou seja, só depois de rodar o script acima nessa
máquina) o mapa troca o tile ao vivo pelo cache local, silenciosamente, ao
carregar. Depois disso a máquina pode ficar sem internet — o resto do site já
era local (ver lista acima).

**Como isso desliga sozinho:** a partir de **segunda-feira, 03/08/2026, 00h
(horário da Bahia)** — ou seja, depois de domingo 02/08/2026 — o mapa para de
usar o cache local mesmo que os arquivos continuem no disco, e volta a exigir o
tile ao vivo (`OFFLINE_CACHE_EXPIRES` em `js/app.js`). Não apaga nada nem bloqueia
o resto do app: só o basemap volta a depender de internet, como na instalação
normal. Para estender o prazo num próximo evento, mude essa data.

---

## PWA (instalar como app)

O site é uma PWA (`manifest.json` + `sw.js`): dá pra instalar como app, abrindo
numa janela própria (sem barra de endereço), com ícone no Dock/Launchpad
(Mac), no menu Iniciar (Windows) ou na tela inicial (Android). Continua sem
nenhuma etapa de build — os dois arquivos são só mais estático servido junto
com o resto.

**Como instalar (Mac, Chrome ou Edge):** com o site aberto localmente
(`python3 -m http.server`, ver "Rodando" acima), no menu do navegador →
"Instalar Pesca Esportiva na Bahia..." (ou o ícone de instalação na barra de
endereço, ⊕/monitor com seta). No Safari do macOS Sonoma ou mais recente:
menu Arquivo → "Adicionar ao Dock".

**O que o service worker faz:** no primeiro carregamento, guarda em cache todo
o "app shell" — HTML/CSS/JS, Leaflet vendorizado, fontes, GeoJSON de contorno
(Bahia + demais estados) e as ilustrações de espécie (~5 MB no total). Da
segunda vez em diante, tudo isso carrega instantâneo do cache, e atualiza em
segundo plano quando há rede. **Não inclui** `assets/tiles/` (o cache de tiles
do modo off-line de evento, gerenciado à parte por `setupOfflineTiles()` em
`js/app.js`) nem os tiles ao vivo do Esri — os dois passam direto pela rede,
sem o service worker interceptar, pela mesma cautela institucional já
registrada para `scripts/fetch-tiles.js`.

**Cache versionada manualmente.** Sem build/hash de arquivo neste projeto,
`CACHE_VERSION` em `sw.js` precisa ser incrementada à mão sempre que
`index.html`, `css/`, `js/` ou algum arquivo em `assets/` mudar — assim o
navegador descarta o cache antigo e baixa a versão nova. Esquecer de
incrementar não quebra nada, só atrasa quando a mudança chega pra quem já
instalou o app.

---

## Modo apresentação

Pensado para operação em tela cheia, por teclado, sem mouse.

| Tecla | Ação |
|---|---|
| `1`–`9` | Salta ao destino principal na posição correspondente da lista (não pelo `id`) — hoje há 9 |
| `0` | Sem destino correspondente nesta versão; não faz nada |
| `→` / `←` | Próximo / anterior na lista de POIs visíveis |
| `Esc` | Fecha o card de espécie; se não houver, volta ao mapa geral |
| `F` | Abre/fecha o painel de Filtros |
| `E` | Alterna Mapa ↔ Espécies |
| `A` | Liga/desliga o modo automático |

Os atalhos são ignorados quando o foco está num campo de texto. Qualquer tecla
reinicia o timer de inatividade.

**Modo automático (attract mode):** desligado por padrão — é para
apresentação/estande, não para o uso público do mapa. Quem quiser liga pelo
botão ao lado de "Ver toda a Bahia" no cabeçalho (ícone de play) ou pela tecla
`A`; os dois ficam em sincronia. Uma vez ligado, depois de 180 s sem interação
o mapa passa a percorrer os destinos principais sozinho, abrindo o card de
cada um. Qualquer interação interrompe (mas não desliga — volta a percorrer
depois de outros 180 s parado). `A` ou o botão desligam de vez, na sessão.

**Tela de abertura:** card sobre o mapa na carga inicial; fecha com clique, `Esc`
ou qualquer tecla, e não reaparece na sessão.

---

## Notas de implementação

Coisas não óbvias que já custaram depuração:

- **Espaço reservado no topo do mapa.** O cabeçalho e a pílula de Filtros flutuam
  por cima do mapa. `headerPad()` mede os dois em runtime e reserva essa faixa
  tanto no `fitBounds` quanto no cálculo do **zoom mínimo** — sem isso, parte do
  norte do estado fica escondida atrás deles e o `maxBounds` impede revelá-la
  arrastando.
- **`--header-h`.** A altura real do cabeçalho é publicada nessa variável CSS
  (`syncHeaderHeight()`), recalculada no `resize` e após `document.fonts.ready` —
  a troca da fonte de sistema para Baloo 2 muda a altura depois do primeiro
  layout. Os painéis do mapa se posicionam por `calc(var(--header-h) + …)` em vez
  de valores fixos por breakpoint.
- **Cliques nos marcadores.** A caixa do ícone de POI é grande (400×300) para
  caber o anel de peixes. Ela tem `pointer-events: none` e só os filhos `.poi-hit`
  capturam clique — senão a área transparente engoliria cliques do mapa e dos
  marcadores vizinhos. A regra precisa casar a especificidade (0,2,0) de
  `.leaflet-marker-icon.leaflet-interactive` do `leaflet.css`.
- **Imagens dentro do marker pane.** O `leaflet.css` zera `max-width`/`max-height`
  de qualquer `<img>` ali com `!important`; por isso as ilustrações do mapa levam
  `width`/`height` explícitos.
- **`getBoundsZoom()` exige container medido.** Num contexto sem layout ele
  devolve o `maxZoom`, e o `setMinZoom` seguinte travaria o mapa no zoom máximo.
  Há um `ResizeObserver` de segurança para reenquadrar quando o container medir.
- **Cabeçalho de uma linha no desktop.** `.header-row` e `.header-actions` usam
  `display: contents` por padrão; só abaixo de 860px viram caixas reais, para
  empilhar em duas linhas com o botão de "ver toda a Bahia" no canto.
- **Máscara cinza dos demais estados** (`assets/br_states/`, um arquivo por UF,
  origem [geodata-br-states](https://github.com/giuliano-oliveira/geodata-br-states)).
  São 25 arquivos: todos os estados menos a Bahia e menos o Rio Grande do Sul, que
  fica inteiro ao sul de -27° e nunca entra em quadro — o zoom mínimo é calculado
  para enquadrar a Bahia, então a faixa de **latitude** visível é sempre ~a altura
  do estado; só a **longitude** cresce com a largura da tela (numa tela 4K o mapa
  chega a alcançar ~-72° de longitude, quase o Acre).
  Os 8 que fazem divisa com a Bahia estão em precisão total, para casar exatamente
  com o contorno de `assets/bahia.geojson`. Os 17 demais foram recortados num
  envelope (O -75, L -28, N 0, S -26) e arredondados para 4 casas decimais (~11 m,
  0,15 px no zoom máximo). **Não simplifique a geometria** desses polígonos: cada
  estado é um arquivo separado, então mover vértices de uma divisa abre uma fenda
  de 1px entre duas máscaras vizinhas, que aparece como um risco do basemap. O
  arredondamento é seguro justamente por ser aplicado igual dos dois lados da
  divisa. As features só existem sobre terra, então o mar continua descoberto.

---

## Convenção `VALIDAR`

Comentários iniciados por `VALIDAR:` marcam dados que precisam de confirmação
oficial antes da publicação institucional — **nenhum deles deve ir a público
sem essa confirmação junto ao INEMA e/ou à SETUR.** Há 20 no momento
(16 em `data.js`, 4 em `species.js`).

```bash
grep -rn "VALIDAR" js/
```

Os principais: geometrias das áreas protegidas (círculos, não polígonos oficiais),
zona turística de Canavieiras e da Barragem Pedra do Cavalo, sazonalidade dos
POIs secundários (proposta por analogia regional), distribuição
camurim/camurim-pena por ponto, e as espécies acrescentadas a POIs por
afinidade de habitat.

Nada disso aparece na interface — a convenção existe justamente para separar
pendência de revisão do dado publicado.

---

## Histórico

O `CHANGELOG.md` descreve etapa por etapa o refactor que trouxe o projeto do
protótipo original até aqui: extração do catálogo de espécies, remapeamento de
chaves, zonas de proteção, aba Espécies, modo apresentação e resiliência offline.
