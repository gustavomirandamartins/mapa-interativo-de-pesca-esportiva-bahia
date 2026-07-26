// Dados do mapa: meses, macrorregiões e pontos de interesse (SIG).
// Portado de "Mapa Pesca Bahia.dc.html" (protótipo Claude Design).
// Catálogo de espécies (SPECIES/TROPHIES) vive em js/species.js, carregado antes deste arquivo.

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// VALIDAR: nomes e limites oficiais das 13 Zonas Turísticas da Bahia (SETUR) —
// ver https://www.ba.gov.br/turismo/112/zonas-turisticas. As coordenadas abaixo
// são centróides aproximados para posicionar o rótulo de cada zona no mapa,
// não os polígonos oficiais.
const REGIONS = [
  { name: 'Chapada Diamantina', lat: -12.55, lng: -41.35, labelOffset: [-8, -62] },
  // mapLabel abrevia só o rótulo no mapa (nome oficial completo é usado em toda
  // parte); labelOffset joga o texto para longe do pino "7 · Canal de Paulo Afonso",
  // que fica bem próximo do centróide da zona.
  { name: 'Lagos e Cânions do São Francisco', mapLabel: 'Lagos e Cânions', lat: -9.30, lng: -38.35, labelOffset: [-90, -10] },
  { name: 'Vale do São Francisco', lat: -9.55, lng: -40.60, labelOffset: [-40, -45] },
  // labelOffset joga o rótulo para o lado do mar (leste), não para o interior —
  // evita colidir com os rótulos de zonas/POIs vizinhos em terra.
  { name: 'Costa dos Coqueiros', lat: -12.15, lng: -37.85, labelOffset: [95, -21] },
  { name: 'Baía de Todos-os-Santos', lat: -12.75, lng: -38.62, labelOffset: [140, 70] },
  { name: 'Costa do Dendê', lat: -13.75, lng: -39.05, labelOffset: [95, 73] },
  { name: 'Costa das Baleias', lat: -17.55, lng: -39.35, labelOffset: [100, -45] },
  { name: 'Caminhos do Oeste', lat: -12.20, lng: -45.30 },
  { name: 'Caminhos do Sertão', lat: -10.90, lng: -39.90 },
  { name: 'Costa do Cacau', lat: -14.95, lng: -39.10 },
  { name: 'Caminhos do Jiquiriça', lat: -13.45, lng: -40.05 },
  { name: 'Costa do Descobrimento', lat: -16.55, lng: -39.15 },
  { name: 'Caminhos do Sudoeste', lat: -14.55, lng: -40.90 }
];

const PROTECTED_AREAS = [
  { id: 'parna-abrolhos', nome: 'PARNA Marinho dos Abrolhos',
    tipo: 'proibida', lat: -17.96, lng: -38.70, raio: 25000,
    orgao: 'ICMBio', nota: 'Pesca proibida em toda a área do parque.' },
  { id: 'parna-timbebas', nome: 'PARNA Abrolhos — Recife das Timbebas',
    tipo: 'proibida', lat: -17.49, lng: -38.98, raio: 9000,
    orgao: 'ICMBio', nota: 'Segundo polígono do parque. Pesca proibida.' },
  { id: 'apa-btsantos', nome: 'APA Baía de Todos os Santos',
    tipo: 'restrita', lat: -12.85, lng: -38.65, raio: 35000,
    orgao: 'INEMA', nota: 'Uso sustentável. Pesca permitida com restrições.' },
  { id: 'apa-litoral-norte', nome: 'APA Litoral Norte',
    tipo: 'restrita', lat: -12.30, lng: -37.70, raio: 30000,
    orgao: 'INEMA', nota: 'Uso sustentável. Pesca permitida com restrições.' },
  { id: 'resex-canavieiras', nome: 'RESEX Marinha de Canavieiras',
    tipo: 'restrita', lat: -15.75, lng: -38.95, raio: 20000,
    orgao: 'ICMBio', nota: 'Reserva extrativista. Pesca artesanal regulada.' }
];
// VALIDAR: geometrias circulares são aproximações. Substituir por polígonos
// oficiais (shapefiles ICMBio/INEMA) antes da publicação institucional.

// VALIDAR: distribuição camurim/camurim-pena por ponto a confirmar — a chave genérica
// "robalo" foi substituída pelas duas espécies específicas em todos os POIs que a usavam,
// mas a proporção real de cada uma por localidade ainda não foi validada com operadores.
const POIS = [
  // VALIDAR: Canavieiras costuma ser classificada em Costa do Cacau, mas é limítrofe
  // com Costa das Baleias — confirmar zona oficial do banco offshore.
  { id: 'p1', main: true, sig: 'SIG 001', name: 'Banco Royal Charlotte', region: 'Costa do Cacau', lat: -15.55, lng: -38.45,
    loc: '17 a 45 milhas offshore de Canavieiras', depth: 'Drop-off: 70 m a 300 m',
    technique: 'Corrico pesado (Trolling 80–130 lb)', trophy: 'Marlin Azul', trophyKeys: ['marlin-azul', 'marlin-branco', 'peixe-vela', 'dourado-do-mar', 'cherne'],
    dificuldade: 'Extrema', acesso: 'Charter obrigatório', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    // VALIDAR: Cherne adicionado por compatibilidade de profundidade (habita quebra de
    // plataforma abaixo de 100 m, dentro da faixa de 70–300 m do drop-off) — confirmar
    // ocorrência real com operadores locais.
    secondary: ['Marlin Branco', 'Peixe-Vela', 'Dourado-do-mar', 'Cherne'],
    operators: ['Charlote Fishing — píeres e escritório próprios; barcos Candela e Bazooka (até 4 pessoas), equipamento Accurate/Shimano/Penn.'],
    lodging: ['Canavieiras'],
    rules: 'Catch & Release obrigatório para todas as espécies de bico.',
    blurb: 'Planalto submarino cuja ressurgência concentra os maiores peixes de bico da América do Sul. O recorde mundial IGFA de Marlin Azul (636 kg) foi capturado ao largo de Vitória/ES em 1992 — não neste banco, que mantém reputação própria pela consistência de exemplares.' },

  // VALIDAR: coordenada aproximada do Parcel das Paredes. Conferir limites oficiais do
  // PARNA Marinho dos Abrolhos (ICMBio) antes da publicação. O ponto original (-17.96,
  // -38.70) caía dentro do parque, onde a pesca é proibida — contradizendo o campo `rules`.
  { id: 'p2', main: true, sig: 'SIG 002', name: 'Parcéis periféricos de Abrolhos', region: 'Costa das Baleias', lat: -17.78, lng: -39.00,
    loc: 'Parcéis externos ao Parque Nacional — base em Caravelas', depth: 'Estruturas: 15 m a 60 m',
    technique: 'Vertical Jigging ultrapesado (jigs até 300 g, PE 4–6)', trophy: 'Garoupa / Vermelho-Caranha', trophyKeys: ['garoupa', 'vermelho-caranha', 'pargo', 'badejo'],
    dificuldade: 'Alta', acesso: 'Base liveaboard', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    // VALIDAR: Badejo adicionado por afinidade de habitat com a Garoupa nas mesmas
    // estruturas recifais — confirmar ocorrência real com operadores locais.
    secondary: ['Pargo', 'Vermelho-Caranha', 'Badejo'],
    operators: ['Abrolhos Viagens / Mergulho', 'Abrolhos Adventure', 'Horizonte Aberto — catamarãs até 81 pés, Liveaboard 3–4 noites.'],
    lodging: ['Caravelas'],
    rules: 'Pesca PROIBIDA dentro do Parque Nacional Marinho (ICMBio); permitida apenas nos parcéis periféricos.',
    blurb: 'Formações coralíneas em cogumelo ("chapeirões"), as mais complexas do Atlântico Sul. À mínima hesitação após o toque, o peixe refugia-se no coral e corta a linha.' },

  { id: 'p3', main: true, sig: 'SIG 003', name: 'Estuário do Rio Jaguaripe', region: 'Baía de Todos-os-Santos', lat: -13.10, lng: -38.86,
    loc: 'Manguezais de Nazaré e Jaguaripe', depth: 'Calhas estuarinas: 2 m a 10 m',
    technique: 'Isco vivo (derivação) / Baitcasting', trophy: 'Camurim / Camurim-pena', trophyKeys: ['camurim', 'camurim-pena', 'carapeba', 'mero', 'vermelho-caranha', 'traira'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [11, 12, 1, 2, 3], season: 'Novembro a Março',
    secondary: ['Carapeba', 'Mero', 'Vermelho-Caranha', 'Traíra'],
    operators: ['Charter Náutico — veleiros e lanchas 30–44 pés a partir de marinas de Salvador.'],
    lodging: ['Nazaré', 'Jaguaripe'],
    rules: 'Defeso do Robalo na desova (jun–ago). Restrições à apanha de isco vivo (caranguejo-uçá, camarão).',
    blurb: 'Santuário do Robalo-Flecha. Incursões matinais (06–10h) na maré enchente, com boia suspensa e camarão vivo graúdo ou caranguejo.' },

  { id: 'p4', main: true, sig: 'SIG 004', name: 'Foz do Rio Real / Mangue Seco', region: 'Costa dos Coqueiros', lat: -11.47, lng: -37.36,
    loc: 'Mangue Seco — divisa BA/SE', depth: 'Canais de mangue: 2 m a 8 m',
    technique: 'Baitcasting de precisão / Surfcasting', trophy: 'Camurupim / Camurim', trophyKeys: ['camurupim', 'camurim', 'camurim-pena', 'xareu', 'pescada-amarela'],
    dificuldade: 'Moderada', acesso: 'Travessia de lancha', months: [12, 1, 2, 3], season: 'Dezembro a Março',
    secondary: ['Camurim-pena', 'Xaréu', 'Pescada-amarela'],
    operators: ['Travessia de lancha a partir de Indiaroba (SE) ou acesso via Jandaíra.'],
    lodging: ['Jandaíra'],
    rules: 'Defeso do Robalo (jun–ago).',
    blurb: 'Posicionar a embarcação a 45° da corrente para arremessar às margens sem enleios nas raízes. Canas 5,8–7 pés, multifilamento e líder de fluorocarbono 30 lb.' },

  { id: 'p5', main: true, sig: 'SIG 005', name: 'Baía de Camamu', region: 'Costa do Dendê', lat: -13.92, lng: -38.90,
    loc: 'Mangue de Camamu e Barra Grande', depth: '3 m a 18 m',
    technique: 'Isco vivo / Jig head / Plugs', trophy: 'Camurim / Carapeba', trophyKeys: ['camurim', 'camurim-pena', 'carapeba', 'garoupa', 'curima', 'corvina', 'parati'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [12, 1, 2, 3], season: 'Dezembro a Março',
    secondary: ['Camurim-pena', 'Garoupa', 'Curimã', 'Corvina', 'Parati'],
    operators: ['Tuna Pesca Maraú', 'Camamu Adventure', 'Princesinha Turismo'],
    lodging: ['Camamu', 'Maraú'],
    rules: '',
    blurb: 'Terceira maior baía do Brasil (segunda maior dentro da Bahia). Garoupas nas rochas da Ilha de Campinho; recifes virgens em Taipu de Fora e Algodões para surfcasting.' },

  { id: 'p6', main: true, sig: 'SIG 006', name: 'Represa de Sobradinho', region: 'Vale do São Francisco', lat: -9.65, lng: -41.40,
    loc: 'Ilhas de Remanso e Canal do Salitre', depth: 'Variável: 10 m a 45 m',
    technique: 'Baitcasting (hélice) / Espera de fundo', trophy: 'Tucunaré / Corvina', trophyKeys: ['tucunare', 'corvina-de-agua-doce'],
    dificuldade: 'Moderada', acesso: 'Exige sonda e GPS', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: ['Corvina de água doce'],
    operators: ['Bases náuticas em Petrolina e Sobradinho.'],
    lodging: ['Sobradinho', 'Petrolina'],
    rules: '',
    blurb: 'Mar interior de água doce (milhares de km²). Tucunaré (espécie introduzida, originária da Amazônia) nas margens da Ilha de Remanso na seca (mai–out), com poppers e sticks de superfície; Corvinas de fundo nas calhas profundas.' },

  { id: 'p7', main: true, sig: 'SIG 007', name: 'Canal de Paulo Afonso', region: 'Lagos e Cânions do São Francisco', lat: -9.40, lng: -38.21,
    loc: 'Base da hidroelétrica (PA-IV)', depth: 'Corredeiras hiper-oxigenadas (~10 m)',
    technique: 'Fundo noturno / Plugs sub-superfície', trophy: 'Surubim / Dourado-do-rio', trophyKeys: ['surubim', 'dourado-do-rio'],
    dificuldade: 'Alta', acesso: 'Acesso rodoviário', months: [6, 7, 8, 9, 10, 11, 12], season: 'Junho a Dezembro',
    secondary: ['Dourado-do-rio'],
    operators: ['Pousada Ilha Bela — base de estadia e apoio.'],
    lodging: ['Paulo Afonso'],
    rules: 'Cânions basálticos afiados cortam a linha; a fricção do carreto é crítica no ataque do Surubim.',
    blurb: 'Água hiper-oxigenada abaixo das turbinas concentra Dourados e Surubins. Na pesca noturna, o Surubim engole o engodo letárgico e arranca de repente — travagem rígida rompe a linha.' },

  { id: 'p8', main: true, sig: 'SIG 008', name: 'Alto Rio Paraguaçu', region: 'Chapada Diamantina', lat: -12.80, lng: -41.33,
    loc: 'Andaraí / Poço do Gavião', depth: 'Cristalinidade extrema: 1 m a 15 m',
    technique: 'Fly Fishing (classes #7 a #9)', trophy: 'Dourado-do-rio / Matrinxã', trophyKeys: ['dourado-do-rio', 'matrinxa'],
    dificuldade: 'Alta', acesso: 'Guia local obrigatório', months: [5, 6, 7, 8, 9], season: 'Maio a Setembro',
    secondary: ['Matrinxã'],
    operators: ['Guias de fly fishing locais (região do Marimbus).'],
    lodging: ['Andaraí', 'Lençóis'],
    rules: 'Catch & Release rigoroso. Proibido filtro solar poluente — bioma de montanha frágil.',
    blurb: 'Águas vítreas incolores permitem sight fishing: o pescador avista o alvo à distância antes do arremesso. Streamers rio acima em derivação natural; saltos acrobáticos do Dourado.' },

  { id: 'p9', main: true, sig: 'SIG 009', name: 'Drop-off da Praia do Forte', region: 'Costa dos Coqueiros', lat: -12.52, lng: -37.85,
    loc: '7 a 10 milhas da linha de costa', depth: 'Depressão batimétrica: 45 m a 350 m',
    technique: 'Trolling em velocidade de cruzeiro (6–8 nós)', trophy: 'Dourado-do-mar / Wahoo / Albacora-laje', trophyKeys: ['dourado-do-mar', 'wahoo', 'albacora-laje', 'cavala', 'bonito-listrado', 'bicuda', 'albacorinha'],
    dificuldade: 'Baixa', acesso: 'Charter obrigatório', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], season: 'Ano inteiro',
    // VALIDAR: Albacorinha adicionada — é o atum mais frequente na plataforma baiana
    // (ver nota da espécie), plausível junto com Albacora-laje no mesmo trolling.
    secondary: ['Cavala', 'Bonito-listrado', 'Bicuda', 'Albacorinha'],
    operators: ['Base Náutica Praia do Forte — lanchas 24 pés (Yamaha 200hp), fishfinder + GPS. Pacotes de 4h (08h ou 13h).'],
    lodging: ['Mata de São João'],
    rules: '',
    blurb: 'Declives batimétricos dramáticos a poucas milhas da costa. Iscas arrastadas provocam pelágicos de topo; pacotes incluem material, alimentação e capitão.' },

  { id: 'p10', main: true, sig: 'SIG 010', name: 'Rio Grande (Oeste)', region: 'Caminhos do Oeste', lat: -12.10, lng: -45.10,
    loc: 'Poço do Cedro — Barreiras', depth: 'Remansos fluviais: 4 m a 12 m',
    technique: 'Espera com ceva prévia (fruta / milho)', trophy: 'Pacu / Piau / Tucunaré', trophyKeys: ['pacu', 'piau', 'tucunare'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: ['Piau', 'Tucunaré'],
    operators: ['Campanhas INEMA / Codevasf de repovoamento alevínico.'],
    lodging: ['Barreiras'],
    rules: 'Defeso / piracema de novembro a março.',
    blurb: 'Rios do Cerrado com fundo de areia. Cevar o pesqueiro com fruta local e milho fermentado; o Pacu dá embates fortíssimos em equipamento de classe média.' },

  // Secundários
  // VALIDAR: months/season abaixo são propostos por analogia com a sazonalidade regional
  // e com os POIs principais próximos — confirmar com operadores locais antes de publicar.
  { id: 's1', main: false, name: 'Salvador — Baía de Todos os Santos', region: 'Baía de Todos-os-Santos', lat: -12.97, lng: -38.51,
    loc: 'Maior baía navegável do Brasil', trophy: 'Camurim-pena / Xaréu', trophyKeys: ['camurim-pena', 'xareu', 'carapeba', 'curima'],
    dificuldade: 'Baixa', acesso: 'Acesso urbano', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Carapeba', 'Curimã'], operators: ['Charter Náutico (Bahia Marina, Porto de Salvador)'], lodging: [], rules: '',
    blurb: 'Manguezais e canais de águas quentes o ano todo. Camarão vivo lançado nas raízes na maré enchente; rotas pela Ilha de Maré, Ilha dos Frades e Forte de São Marcelo.' },
  { id: 's2', main: false, name: 'Baía de Aratu', region: 'Baía de Todos-os-Santos', lat: -12.80, lng: -38.42,
    loc: 'Ecossistema labiríntico ligado à BTS', trophy: 'Camurim / Xaréu', trophyKeys: ['camurim', 'camurim-pena', 'xareu'],
    dificuldade: 'Baixa', acesso: 'Acesso urbano', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Camurim-pena'], operators: [], lodging: [], rules: '',
    blurb: 'Canais mais profundos ideais para jig heads armados com shads macios. Substratos lodosos e manguezais servem de berçário.' },
  // VALIDAR: Cachoeira/São Félix são classificadas em Baía de Todos-os-Santos, mas
  // a represa também é próxima de Caminhos do Jiquiriça — confirmar zona oficial.
  { id: 's3', main: false, name: 'Barragem Pedra do Cavalo', region: 'Baía de Todos-os-Santos', lat: -12.57, lng: -38.98,
    loc: 'Cachoeira / São Félix', trophy: 'Tucunaré / Traíra', trophyKeys: ['tucunare', 'traira', 'tambaqui', 'tilapia', 'corvina-de-agua-doce'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [4, 5, 6, 7, 8, 9, 10], season: 'Abril a Outubro',
    secondary: ['Tambaqui', 'Tilápia', 'Corvina de água doce'], operators: [], lodging: [], rules: '',
    blurb: 'Represa alternativa à oscilação das marés, com populações robustas de Tucunarés, Traíras e Tambaquis.' },
  { id: 's4', main: false, name: 'Ilhéus', region: 'Costa do Cacau', lat: -14.79, lng: -39.03,
    loc: 'Rio Cachoeira e mar recifal (8 milhas)', trophy: 'Arabaiana / Garoupa', trophyKeys: ['arabaiana', 'garoupa', 'xareu-branco', 'guarajuba', 'camurim', 'dentao'],
    dificuldade: 'Alta', acesso: 'Charter obrigatório', months: [9, 10, 11, 12, 1, 2, 3], season: 'Setembro a Março',
    // VALIDAR: Dentão adicionado por afinidade recifal com Garoupa/Arabaiana na mesma
    // jigada — confirmar ocorrência real com operadores locais.
    secondary: ['Xaréu-branco', 'Guarajuba', 'Camurim', 'Dentão'], operators: ['Ilhéus Pesca Oceânica', 'FF Pesca — barcos ZETA 28 pés, carretos elétricos'], lodging: [], rules: '',
    blurb: 'A 8 milhas começa o reino do gigantesco Olho-de-boi e das Garoupas. Vertical/Speed Jigging arranca os peixes do leito marinho.' },
  // VALIDAR: ver nota de p1 sobre a zona de Canavieiras (Costa do Cacau x Costa das Baleias).
  { id: 's5', main: false, name: 'Canavieiras', region: 'Costa do Cacau', lat: -15.68, lng: -38.95,
    loc: 'Rios Pardo, Patipe, Una e Jequitinhonha', trophy: 'Camurim / Xaréu', trophyKeys: ['camurim', 'camurim-pena', 'xareu'],
    dificuldade: 'Moderada', acesso: 'Base costeira', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Camurim-pena', 'Xaréu'], operators: ['Charlote Fishing (base do Banco Royal Charlotte)'], lodging: [], rules: '',
    blurb: 'Porta de entrada para o Banco Royal Charlotte. O interior estuarino sustenta pesca costeira ao Robalo e Xaréu.' },
  { id: 's6', main: false, name: "Porto Seguro / Arraial d'Ajuda", region: 'Costa do Descobrimento', lat: -16.45, lng: -39.07,
    loc: 'Recifes de Coroa Alta (5–15 km)', trophy: 'Camurim / Sororoca', trophyKeys: ['camurim', 'sororoca', 'biquara', 'ariaco', 'bicuda', 'bonito-listrado'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Biquara', 'Ariacó', 'Bicuda', 'Bonito-listrado'], operators: ["Arraial d'Ajuda Passeios", 'Porto Pesca (Cap. Robson)', 'Porto Seguro Passeios'], lodging: [], rules: '',
    blurb: 'Microjigging (30–60 g) e fly marinho nos recifes calcários. Saídas às 04h para a atividade máxima; pacotes privativos para até dez pessoas.' },
  { id: 's7', main: false, name: 'Caravelas', region: 'Costa das Baleias', lat: -17.73, lng: -39.26,
    loc: 'Rampa de lançamento para Abrolhos', trophy: 'Garoupa / Pargo', trophyKeys: ['garoupa', 'pargo', 'vermelho-caranha', 'cioba'],
    dificuldade: 'Alta', acesso: 'Base liveaboard', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    // VALIDAR: Cioba adicionada por afinidade recifal com Pargo/Vermelho-Caranha na
    // mesma base de saída para Abrolhos — confirmar ocorrência real com operadores.
    secondary: ['Vermelho-Caranha', 'Cioba'], operators: ['Abrolhos Adventure', 'Horizonte Aberto'], lodging: [], rules: '',
    blurb: 'A 870 km de Salvador, é a base das expedições Liveaboard de 3–4 noites rumo aos parcéis de Abrolhos.' },
  { id: 's8', main: false, name: 'Itacaré', region: 'Costa do Cacau', lat: -14.28, lng: -38.99,
    loc: 'Costão rochoso e cultura do surf', trophy: 'Camurim / Xaréu', trophyKeys: ['camurim', 'xareu'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Xaréu'], operators: [], lodging: [], rules: '',
    blurb: 'Junta o apelo do surf à pesca nas proximidades rochosas do litoral sul.' },
  { id: 's9', main: false, name: 'Península de Maraú / Barra Grande', region: 'Costa do Dendê', lat: -13.80, lng: -38.94,
    loc: 'Taipu de Fora e Algodões', trophy: 'Camurim / Xaréu', trophyKeys: ['camurim', 'camurim-pena', 'xareu', 'garoupa', 'albacora-laje', 'guaiuba'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [11, 12, 1, 2, 3], season: 'Novembro a Março',
    // VALIDAR: Guaiúba adicionada — recife virgem propício a pargos/vieiras pequenas
    // junto com a Garoupa nos mesmos recifes — confirmar ocorrência real.
    secondary: ['Camurim-pena', 'Garoupa', 'Albacora-laje', 'Guaiúba'], operators: ['Tuna Pesca Maraú', 'Maraú Turismo'], lodging: [], rules: '',
    blurb: 'Recifes virgens perfeitos para surfcasting e spinning de praia direcionados ao Xaréu; ecoturismo integrado (escuna, mergulho, cachoeiras).' },
  { id: 's10', main: false, name: 'Represa de Itaparica', region: 'Lagos e Cânions do São Francisco', lat: -9.15, lng: -38.31,
    loc: 'Glória / Petrolândia', trophy: 'Tucunaré', trophyKeys: ['tucunare'],
    dificuldade: 'Moderada', acesso: 'Exige sonda e GPS', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: [], operators: [], lodging: [], rules: '',
    blurb: 'Lago que oculta florestas submersas. Isca artificial de hélice (surface prop) provoca boa resposta de ataque do Tucunaré, espécie introduzida na bacia.' },
  { id: 's11', main: false, name: 'Luís Eduardo Magalhães', region: 'Caminhos do Oeste', lat: -12.09, lng: -45.80,
    loc: 'Rio de Ondas e Ribeirão Boa Sorte', trophy: 'Pacu / Tucunaré', trophyKeys: ['pacu', 'tucunare', 'piau'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: ['Piau'], operators: [], lodging: [], rules: '',
    blurb: 'Polo agrícola do Cerrado, irrigado pelas artérias hídricas do oeste baiano. Alvo de campanhas de repovoamento do INEMA/Codevasf.' }
];

const REGION_LABELS = {
  'Chapada Diamantina': 'Chapada Diamantina',
  'Lagos e Cânions do São Francisco': 'Lagos e Cânions do São Francisco',
  'Vale do São Francisco': 'Vale do São Francisco',
  'Costa dos Coqueiros': 'Costa dos Coqueiros',
  'Baía de Todos-os-Santos': 'Baía de Todos-os-Santos',
  'Costa do Dendê': 'Costa do Dendê',
  'Costa das Baleias': 'Costa das Baleias',
  'Caminhos do Oeste': 'Caminhos do Oeste',
  'Caminhos do Sertão': 'Caminhos do Sertão',
  'Costa do Cacau': 'Costa do Cacau',
  'Caminhos do Jiquiriça': 'Caminhos do Jiquiriça',
  'Costa do Descobrimento': 'Costa do Descobrimento',
  'Caminhos do Sudoeste': 'Caminhos do Sudoeste'
};
