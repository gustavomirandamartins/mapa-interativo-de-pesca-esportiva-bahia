// Dados do mapa: meses, macrorregiões e pontos de interesse (SIG).
// Portado de "Mapa Pesca Bahia.dc.html" (protótipo Claude Design).
// Catálogo de espécies (SPECIES/TROPHIES) vive em js/species.js, carregado antes deste arquivo.

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Categorias de técnica para o filtro do mapa — agrupadas a partir do texto livre
// já existente em `technique` de cada POI principal (p1-p10; os secundários não
// têm técnica cadastrada). Não introduz dado novo, só rotula o que já está descrito.
const TECHNIQUES = [
  { key: 'corrico', label: 'Corrico / Trolling' },
  { key: 'jigging', label: 'Jigging vertical' },
  { key: 'isca-viva', label: 'Isca viva' },
  { key: 'baitcasting', label: 'Baitcasting' },
  { key: 'surfcasting', label: 'Surfcasting' },
  { key: 'arremesso-leve', label: 'Arremesso leve (jig head / plugs)' },
  { key: 'espera-fundo', label: 'Espera de fundo' },
  { key: 'fly-spinning', label: 'Fly / Spinning ultraleve' },
  { key: 'ceva', label: 'Espera com isca / ceva' }
];

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
  { name: 'Caminhos do Jiquiriçá', lat: -13.45, lng: -40.05 },
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
  // REGULATÓRIO: regras confirmadas no Acordo de Gestão da Resex publicado no DOU (Portaria
  // ICMBio nº 313, de 12/04/2018): pesque e solte para não beneficiários, acompanhamento
  // obrigatório por comunitário beneficiário, pesca esportiva proibida no estuário durante
  // o defeso do robalo.
  // VALIDAR: o folder oficial de Canavieiras (bloco L1) cita "Portaria ICMBio nº 1.124 de
  // 2018" e o defeso como 15/05 a 31/07 (Portaria IBAMA nº 49-N de 1992). O instrumento
  // localizado com esse conteúdo é a Portaria nº 313/2018. Confirmar com o ICMBio a norma
  // vigente e as datas antes de imprimir número de portaria em peça.
  { id: 'resex-canavieiras', nome: 'RESEX Marinha de Canavieiras',
    tipo: 'restrita', lat: -15.68, lng: -38.95, raio: 30000,
    orgao: 'ICMBio', nota: 'Uso sustentável. Pesca por não beneficiários apenas em pesque e solte, com acompanhamento de condutor beneficiário da Resex.' }
];
// VALIDAR: geometrias circulares são aproximações. Substituir por polígonos
// oficiais (shapefiles ICMBio/INEMA) antes da publicação institucional.

// VALIDAR: distribuição camurim/camurim-pena por ponto a confirmar — a chave genérica
// "robalo" foi substituída pelas duas espécies específicas em todos os POIs que a usavam,
// mas a proporção real de cada uma por localidade ainda não foi validada com operadores.
const POIS = [
  // VALIDAR: Canavieiras costuma ser classificada em Costa do Cacau, mas é limítrofe
  // com Costa das Baleias — confirmar zona oficial do banco offshore.
  // NOTA: o material comercial da operadora informa o recorde IGFA como 637 kg em
  // 1978. O correto é 636 kg, Paulo Amorim, ao largo de Vitória/ES, em 29/02/1992.
  // O percentual de marlins acima de 250 kg divulgado pela operadora é alegação
  // comercial e não deve ser reproduzido como dado pela SETUR.
  // AUDITADO: operadora Charlote Fishing confirmada como operação de pesca esportiva
  // ativa em Canavieiras (píer e escritório próprios, capitães licenciados, três
  // embarcações).
  // FONTE: folder oficial SETUR-BA "Pesca Esportiva — Sinta a Adrenalina em Canavieiras,
  // Costa do Cacau". A distância de 24 milhas substitui o dado anterior de 17 milhas, que
  // vinha do material da operadora. Decisão de projeto: em conflito de fontes, prevalece a
  // peça institucional.
  // NOTA: o recorde mundial IGFA de marlim-azul (636 kg, Paulo Amorim, 1992) foi capturado
  // ao largo de Vitória/ES e não neste banco. Deliberadamente não mencionado no texto:
  // citá-lo exigiria uma errata que não cabe em peça promocional, e omiti-lo não afirma
  // nada falso.
  // DIVERGÊNCIA COM O FOLDER (registro interno, não replicar no texto visível): o folder
  // equipara "Cavala" a Wahoo, atribuindo a ambos Acanthocybium solandri. São peixes
  // distintos, e o catálogo já os traz em fichas separadas: cavala (Scomberomorus cavalla)
  // e wahoo (Acanthocybium solandri). O folder também lista "Albacora" e "Yellowfin" como
  // espécies distintas, sendo o mesmo peixe (Thunnus albacares) — já presente no catálogo
  // como albacora-laje. Inclui "Bluefin" (Thunnus thynnus), de Atlântico Norte temperado,
  // improvável na Bahia e deliberadamente não incluído. Atribui 900 kg ao marlim-azul,
  // acima de qualquer registro documentado no Atlântico. Usa Tetrapturus albidus para o
  // marlim-branco, gênero desatualizado. Reportar à SETUR para a próxima tiragem.
  // Cherne removido: entrou por inferência de profundidade, nunca foi confirmado e não
  // consta do folder oficial.
  // Espadarte (folder de Canavieiras) e Meca (indicação da operadora Charlote Fishing, bloco
  // H) são o mesmo peixe (Xiphias gladius). Consolidados numa única ficha, a `meca` já
  // existente em js/species.js — ver comentário ali. Não foi criada uma segunda chave
  // `espadarte` para não duplicar a espécie no catálogo. `arabaiana` é a chave já existente
  // para o Olho-de-boi (Seriola spp.), citado pelo folder por esse nome comercial.
  { id: 'p1', main: true, sig: 'SIG 001', name: 'Banco Royal Charlotte', region: 'Costa do Cacau', lat: -15.55, lng: -38.45,
    loc: 'Banco Royal Charlotte — início a 24 milhas da costa de Canavieiras', depth: 'Drop-off: 70 m a 300 m',
    technique: 'Corrico pesado (Trolling 80–130 lb)', techniqueKeys: ['corrico'], trophy: 'Marlin Azul', trophyKeys: ['marlin-azul', 'marlin-branco', 'peixe-vela', 'meca', 'dourado-do-mar', 'wahoo', 'albacora-laje', 'cavala', 'bonito-listrado', 'badejo', 'arabaiana'],
    dificuldade: 'Extrema', acesso: 'Charter obrigatório — 115 km do aeroporto de Ilhéus, 43,6 km de Comandatuba; 426 km de Salvador via ferry-boat e BA-001, ou 569 km via BR-101', months: [9, 10, 11, 12, 1, 2, 3], season: 'Setembro a Março',
    secondary: ['Marlin Branco', 'Peixe-Vela', 'Meca', 'Dourado-do-mar', 'Wahoo', 'Albacora-laje', 'Cavala', 'Bonito-listrado', 'Badejo', 'Arabaiana'],
    operators: ['Charlote Fishing — píeres e escritório próprios; barcos Candela e Bazooka (até 4 pessoas), equipamento Accurate/Shimano/Penn.'],
    lodging: ['Canavieiras'],
    rules: 'Catch & Release obrigatório para todas as espécies de bico.',
    blurb: 'Planalto submarino cuja ressurgência concentra os maiores peixes de bico da América do Sul, reconhecido internacionalmente entre os melhores pontos do mundo para a modalidade. Marlim-azul, marlim-branco e agulhão-vela no corrico pesado, e o espadarte no deep drop, pescaria recente e ainda pouco disputada nesta costa.' },

  // VALIDAR: coordenada aproximada do Parcel das Paredes. Conferir limites oficiais do
  // PARNA Marinho dos Abrolhos (ICMBio) antes da publicação. O ponto original (-17.96,
  // -38.70) caía dentro do parque, onde a pesca é proibida — contradizendo o campo `rules`.
  // VALIDAR (BLOQUEANTE): as três operadoras antes listadas (Horizonte Aberto, Abrolhos
  // Viagens/Mergulho, Abrolhos Adventure) operam mergulho e visitação, não pesca
  // esportiva, e são credenciadas para o interior do Parque Nacional, onde a pesca é
  // proibida. O dado "catamarãs até 81 pés" também estava errado (a maior embarcação
  // tem 16 m). Não há operadora de pesca confirmada para os parcéis periféricos. Antes
  // de publicar: confirmar com a SETUR se existe operação de pesca esportiva legal e
  // ativa fora do polígono do parque. Se não existir, este POI deve ser removido pelo
  // mesmo critério aplicado ao antigo POI da Chapada.
  { id: 'p2', main: true, sig: 'SIG 002', name: 'Parcéis periféricos de Abrolhos', region: 'Costa das Baleias', lat: -17.78, lng: -39.00,
    loc: 'Parcéis externos ao Parque Nacional — base em Caravelas', depth: 'Estruturas: 15 m a 60 m',
    technique: 'Vertical Jigging ultrapesado (jigs até 300 g, PE 4–6)', techniqueKeys: ['jigging'], trophy: 'Garoupa / Vermelho-Caranha', trophyKeys: ['garoupa', 'vermelho-caranha', 'pargo', 'badejo'],
    dificuldade: 'Alta', acesso: 'Base liveaboard', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    // VALIDAR: Badejo adicionado por afinidade de habitat com a Garoupa nas mesmas
    // estruturas recifais — confirmar ocorrência real com operadores locais.
    secondary: ['Pargo', 'Badejo'],
    operators: [],
    lodging: ['Caravelas'],
    rules: 'Pesca PROIBIDA dentro do Parque Nacional Marinho (ICMBio); permitida apenas nos parcéis periféricos.',
    blurb: 'Formações coralíneas em cogumelo ("chapeirões"), as mais complexas do Atlântico Sul. À mínima hesitação após o toque, o peixe refugia-se no coral e corta a linha.' },

  // AUDITADO: "Charter Náutico" não corresponde a empresa identificável e foi
  // removido. Destino confirmado pelo site oficial de turismo do município
  // (santuário do robalo-flecha, afluente Mucujó, saída por volta das 7h, camarão
  // vivo com boia "paulistinha").
  // VALIDAR: confirmar se a Bahia Top Fishing, operação de pesca sediada em
  // Jaguaripe especializada em robalo, segue ativa. Se sim, é a operadora natural
  // deste POI.
  // ATENÇÃO INSTITUCIONAL: o site oficial de turismo de Jaguaripe lista o Mero
  // entre os alvos de pesca de fundo. O Mero tem captura proibida por moratória
  // federal. Reportar à SETUR para tratativa com o município. Esta é a provável
  // origem da inclusão indevida do Mero neste POI, corrigida no bloco A1.
  { id: 'p3', main: true, sig: 'SIG 003', name: 'Estuário do Rio Jaguaripe', region: 'Baía de Todos-os-Santos', lat: -13.10, lng: -38.86,
    loc: 'Manguezais de Nazaré e Jaguaripe; afluente Mucujó', depth: 'Calhas estuarinas: 2 m a 10 m',
    technique: 'Isco vivo (derivação) / Baitcasting', techniqueKeys: ['isca-viva', 'baitcasting'], trophy: 'Camurim / Camurim-pena', trophyKeys: ['camurim', 'camurim-pena', 'carapeba', 'vermelho-caranha', 'traira'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [11, 12, 1, 2, 3], season: 'Novembro a Março',
    secondary: ['Carapeba', 'Vermelho-Caranha', 'Traíra'],
    // Mero ocorre na área mas tem captura proibida por moratória federal — não é
    // espécie-alvo nem secundária, e não pode aparecer misturado a elas.
    ocorrenciaProtegida: ['mero'],
    operators: [],
    lodging: ['Nazaré', 'Jaguaripe'],
    rules: 'Defeso do Robalo na desova (jun–ago). Restrições à apanha de isco vivo (caranguejo-uçá, camarão).',
    blurb: 'Santuário do Robalo-Flecha. Incursões matinais a partir das 7h na maré enchente, com boia suspensa e camarão vivo graúdo ou caranguejo.' },

  // AUDITADO: acesso confirmado (travessia por Pontal/Indiaroba-SE e acesso
  // baiano por Jandaíra/Costa Azul). O conteúdo que estava em operators era
  // descrição de acesso e foi movido para loc.
  // VALIDAR: não foi localizada operação de pesca esportiva em Mangue Seco. As
  // embarcações locais fazem travessia e passeio. Confirmar com a SETUR e com a
  // prefeitura de Jandaíra se existe guia de pesca ativo.
  { id: 'p4', main: true, sig: 'SIG 004', name: 'Foz do Rio Real / Mangue Seco', region: 'Costa dos Coqueiros', lat: -11.47, lng: -37.36,
    loc: 'Mangue Seco, Jandaíra — divisa BA/SE. Travessia de barco a partir de Pontal (Indiaroba/SE) ou acesso por Jandaíra pela Costa Azul.', depth: 'Canais de mangue: 2 m a 8 m',
    technique: 'Baitcasting de precisão / Surfcasting', techniqueKeys: ['baitcasting', 'surfcasting'], trophy: 'Camurupim / Camurim', trophyKeys: ['camurupim', 'camurim', 'camurim-pena', 'xareu', 'pescada-amarela'],
    dificuldade: 'Moderada', acesso: 'Travessia de lancha', months: [12, 1, 2, 3], season: 'Dezembro a Março',
    secondary: ['Camurim-pena', 'Xaréu', 'Pescada-amarela'],
    operators: [],
    lodging: ['Jandaíra'],
    rules: 'Defeso do Robalo (jun–ago).',
    blurb: 'Posicionar a embarcação a 45° da corrente para arremessar às margens sem enleios nas raízes. Canas 5,8–7 pés, multifilamento e líder de fluorocarbono 30 lb.' },

  // VALIDAR: Camamu Adventure e Princesinha Turismo foram removidas de operators por
  // não operarem pesca esportiva (são transporte e passeios marítimos). Se a SETUR
  // quiser mantê-las no mapa, criar campo próprio de apoio náutico, separado de
  // operadoras de pesca.
  // AUDITADO: Tuna Pesca Maraú confirmada como operação de pesca esportiva de alto-mar.
  { id: 'p5', main: true, sig: 'SIG 005', name: 'Baía de Camamu', region: 'Costa do Dendê', lat: -13.92, lng: -38.90,
    loc: 'Mangue de Camamu e Barra Grande', depth: '3 m a 18 m',
    technique: 'Isco vivo / Jig head / Plugs', techniqueKeys: ['isca-viva', 'arremesso-leve'], trophy: 'Camurim / Carapeba', trophyKeys: ['camurim', 'camurim-pena', 'carapeba', 'garoupa', 'curima', 'corvina', 'parati'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [12, 1, 2, 3], season: 'Dezembro a Março',
    secondary: ['Camurim-pena', 'Garoupa', 'Curimã', 'Corvina', 'Parati'],
    operators: ['Tuna Pesca Maraú — pesca esportiva de alto-mar, saída completa (7h às 16h) e meia saída (8h às 14h).'],
    lodging: ['Camamu', 'Maraú'],
    rules: '',
    blurb: 'Terceira maior baía do Brasil (segunda maior dentro da Bahia). Garoupas nas rochas da Ilha de Campinho; recifes virgens em Taipu de Fora e Algodões para surfcasting.' },

  { id: 'p6', main: true, sig: 'SIG 006', name: 'Represa de Sobradinho', region: 'Vale do São Francisco', lat: -9.65, lng: -41.40,
    loc: 'Ilhas de Remanso e Canal do Salitre', depth: 'Variável: 10 m a 45 m',
    technique: 'Baitcasting (hélice) / Espera de fundo', techniqueKeys: ['baitcasting', 'espera-fundo'], trophy: 'Tucunaré / Corvina', trophyKeys: ['tucunare', 'corvina-de-agua-doce'],
    dificuldade: 'Moderada', acesso: 'Exige sonda e GPS', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: ['Corvina de água doce'],
    operators: ['Bases náuticas em Juazeiro e Sobradinho.'],
    lodging: ['Sobradinho', 'Juazeiro'],
    rules: '',
    blurb: 'Mar interior de água doce (milhares de km²). Tucunaré (espécie introduzida, originária da Amazônia) nas margens da Ilha de Remanso na seca (mai–out), com poppers e sticks de superfície; Corvinas de fundo nas calhas profundas.' },

  // FONTE: folder oficial "Descubra a Pesca Esportiva em Paulo Afonso" (SETUR-BA, parceria técnica
  // Igarapesca Jungle Fishing). Espécies-alvo, acesso, atrativos e existência de aluguel de equipamento
  // e guias vêm do folder e prevalecem sobre o levantamento anterior.
  // VALIDAR: a Igarapesca é consultoria de turismo de pesca cujos destinos divulgados são Amazônia,
  // Patagônia argentina e flats do México. Figura no folder como parceira técnica, não como operadora
  // local. NÃO listar como operadora. Identificar com a SETUR o guia local disponível em Paulo Afonso.
  // DIVERGÊNCIA COM O FOLDER (registro interno, não replicar no texto visível): o folder atribui ao
  // dourado 1,4 m e 30 kg, medidas de Salminus brasiliensis (bacia do Prata) e não de S. franciscanus;
  // e à traíra 70 cm e 5 kg, valores de trairão (Hoplias intermedius/lacerdae) e não de H. malabaricus.
  // O catálogo mantém os valores corretos. Reportar à SETUR para a próxima tiragem.
  { id: 'p7', main: true, sig: 'SIG 007', name: 'Paulo Afonso e reservatórios da CHESF', region: 'Lagos e Cânions do São Francisco', lat: -9.40, lng: -38.21,
    loc: 'Rio São Francisco e reservatórios das usinas da CHESF', depth: 'Corredeiras hiper-oxigenadas (~10 m)',
    technique: 'Fundo noturno / Plugs sub-superfície', techniqueKeys: ['espera-fundo', 'arremesso-leve'], trophy: 'Surubim / Tucunaré', trophyKeys: ['surubim', 'tucunare', 'dourado-do-rio', 'traira', 'piau', 'apaiari'],
    dificuldade: 'Alta', acesso: 'Acesso rodoviário — 3h de Aracaju e Maceió; cerca de 500 km de Salvador e Recife', months: [6, 7, 8, 9, 10, 11, 12], season: 'Junho a Dezembro',
    secondary: ['Dourado-do-rio', 'Traíra', 'Piau', 'Apaiari'],
    operators: ['Rede local com aluguel de equipamentos e guias experientes (folder oficial SETUR-BA).'],
    lodging: ['Paulo Afonso'],
    rules: 'Cânions basálticos afiados cortam a linha; a fricção do carreto é crítica no ataque do Surubim.',
    blurb: 'Abaixo das turbinas a água hiper-oxigenada concentra peixe grande, e a pescaria se abre dos canais aos reservatórios da CHESF. O surubim ataca à noite: engole devagar e arranca de uma vez. Em volta, cânions de até 100 metros para navegar de catamarã, visita guiada ao complexo hidrelétrico e o Raso da Catarina. Sertão, água e adrenalina no mesmo roteiro.' },

  // Substitui o antigo POI de fly fishing para dourado, removido por não corresponder
  // à ictiofauna real do alto Paraguaçu. Base: estudo de conhecimento ictiológico
  // tradicional dos pescadores da APA Marimbus-Iraquara e levantamento de ictiofauna
  // da UEFS (2025), que registra assembleia dominada por characídeos de pequeno porte,
  // erythrinídeos (traíras) e heptapterídeos, sem ocorrência de Bryconidae.
  { id: 'p8', main: true, sig: 'SIG 008', name: 'Rios da Chapada Diamantina', region: 'Chapada Diamantina', lat: -12.56, lng: -41.39,
    loc: 'Alto Paraguaçu e afluentes — entorno de Lençóis e Andaraí', depth: 'Poços entre corredeiras: 1 m a 6 m',
    technique: 'Pesca leve: spinning ultraleve, fly de linha #4 a #6', techniqueKeys: ['fly-spinning'], trophy: 'Traíra', trophyKeys: ['traira', 'tucunare'],
    dificuldade: 'Moderada', acesso: 'Guia local obrigatório', months: [5, 6, 7, 8, 9], season: 'Maio a Setembro',
    secondary: ['Tucunaré'],
    operators: [],
    lodging: ['Lençóis', 'Andaraí'],
    rules: 'Catch & Release rigoroso. Trecho inserido em Área de Proteção Ambiental: confirmar regras da APA Marimbus-Iraquara com o INEMA antes da saída. Respeitar as áreas de pesca das comunidades tradicionais.',
    blurb: 'Não é destino de peixe grande, e é justamente esse o convite: água de quartzito transparente permite avistar o peixe antes do arremesso. A traíra nos poços entre cachoeiras responde bem a equipamento leve. O tucunaré presente na bacia é espécie introduzida. Pescaria que se combina com trilhas, cachoeiras e a estrutura de ecoturismo de Lençóis.' },

  // AUDITADO: Base Náutica Praia do Forte confirmada. Técnica, velocidade de corrico
  // (6 a 8 nós), faixa batimétrica (45 m a 350 m), distância da costa (7 a 10 milhas)
  // e embarcação (lancha 24 pés, motor Yamaha 200hp) conferem com a descrição
  // publicada pela própria operadora.
  { id: 'p9', main: true, sig: 'SIG 009', name: 'Drop-off da Praia do Forte', region: 'Costa dos Coqueiros', lat: -12.52, lng: -37.85,
    loc: '7 a 10 milhas da linha de costa', depth: 'Depressão batimétrica: 45 m a 350 m',
    technique: 'Trolling em velocidade de cruzeiro (6–8 nós)', techniqueKeys: ['corrico'], trophy: 'Dourado-do-mar / Wahoo / Albacora-laje', trophyKeys: ['dourado-do-mar', 'wahoo', 'albacora-laje', 'cavala', 'bonito-listrado', 'bicuda', 'albacorinha'],
    dificuldade: 'Baixa', acesso: 'Charter obrigatório', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], season: 'Ano inteiro',
    // VALIDAR: Albacorinha adicionada — é o atum mais frequente na plataforma baiana
    // (ver nota da espécie), plausível junto com Albacora-laje no mesmo trolling.
    secondary: ['Cavala', 'Bonito-listrado', 'Bicuda', 'Albacorinha'],
    operators: ['Base Náutica Praia do Forte — lanchas 24 pés (Yamaha 200hp), fishfinder + GPS. Pacotes de 4h (08h ou 13h).'],
    lodging: ['Mata de São João'],
    rules: '',
    blurb: 'Declives batimétricos dramáticos a poucas milhas da costa. Iscas arrastadas provocam pelágicos de topo; pacotes incluem material, alimentação e capitão.' },

  // AUDITADO: repovoamento confirmado, mas o executor não é o INEMA e sim a
  // Codevasf com a Prefeitura de Barreiras e apoio da Bahia Pesca. Corrigido.
  // Espécies soltas documentadas: piau-verdadeiro (nativo, abundante nesses
  // rios), curimatã, surubim, cari, pacu e pacamã, o que sustenta as
  // espécies-alvo deste POI.
  // VALIDAR: o pesqueiro "Poço do Cedro" não foi localizado em nenhuma fonte e
  // foi removido do campo loc. Se for topônimo local legítimo, reinserir com
  // confirmação da Secretaria de Meio Ambiente de Barreiras.
  // VALIDAR: o Tucunaré consta como espécie-alvo deste POI mas não aparece nas
  // campanhas de repovoamento nem como espécie nativa do rio Grande. Se
  // ocorrer, é introduzido. Confirmar antes de publicar.
  { id: 'p10', main: true, sig: 'SIG 010', name: 'Rio Grande (Oeste)', region: 'Caminhos do Oeste', lat: -12.10, lng: -45.10,
    loc: 'Rio Grande e afluentes — Barreiras', depth: 'Remansos fluviais: 4 m a 12 m',
    technique: 'Espera com ceva prévia (fruta / milho)', techniqueKeys: ['ceva'], trophy: 'Pacu / Piau / Tucunaré', trophyKeys: ['pacu', 'piau', 'tucunare'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: [],
    operators: ['Campanhas de repovoamento alevínico da Codevasf com a Prefeitura de Barreiras (Secretaria de Meio Ambiente e Sustentabilidade), com apoio da Bahia Pesca. Alevinos produzidos no Centro de Xique-Xique.'],
    lodging: ['Barreiras'],
    rules: 'Defeso / piracema de novembro a março.',
    blurb: 'Rios do Cerrado com fundo de areia. Cevar o pesqueiro com fruta local e milho fermentado; o Pacu dá embates fortíssimos em equipamento de classe média.' },

  // Secundários
  // VALIDAR: months/season abaixo são propostos por analogia com a sazonalidade regional
  // e com os POIs principais próximos — confirmar com operadores locais antes de publicar.
  { id: 's1', main: false, name: 'Salvador — Baía de Todos-os-Santos', region: 'Baía de Todos-os-Santos', lat: -12.97, lng: -38.51,
    loc: 'Maior baía navegável do Brasil', trophy: 'Camurim-pena / Xaréu', trophyKeys: ['camurim-pena', 'xareu', 'carapeba', 'curima'],
    dificuldade: 'Baixa', acesso: 'Acesso urbano', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Carapeba', 'Curimã'], operators: ['Charter Náutico (Bahia Marina, Porto de Salvador)'], lodging: [], rules: '',
    blurb: 'Manguezais e canais de águas quentes o ano todo, ao longo de 1.233 km² de espelho d\'água. Camarão vivo lançado nas raízes na maré enchente; rotas pela Ilha de Maré, Ilha dos Frades e Forte de São Marcelo.' },
  { id: 's2', main: false, name: 'Baía de Aratu', region: 'Baía de Todos-os-Santos', lat: -12.80, lng: -38.42,
    loc: 'Ecossistema labiríntico ligado à BTS', trophy: 'Camurim / Xaréu', trophyKeys: ['camurim', 'camurim-pena', 'xareu'],
    dificuldade: 'Baixa', acesso: 'Acesso urbano', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Camurim-pena'], operators: [], lodging: [], rules: '',
    blurb: 'Canais mais profundos ideais para jig heads armados com shads macios. Substratos lodosos e manguezais servem de berçário.' },
  // VALIDAR: Cachoeira/São Félix são classificadas em Baía de Todos-os-Santos, mas
  // a represa também é próxima de Caminhos do Jiquiriçá — confirmar zona oficial.
  { id: 's3', main: false, name: 'Barragem Pedra do Cavalo', region: 'Baía de Todos-os-Santos', lat: -12.57, lng: -38.98,
    loc: 'Cachoeira / São Félix', trophy: 'Tucunaré / Traíra', trophyKeys: ['tucunare', 'traira', 'tambaqui', 'tilapia', 'corvina-de-agua-doce'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [4, 5, 6, 7, 8, 9, 10], season: 'Abril a Outubro',
    secondary: ['Tambaqui', 'Tilápia', 'Corvina de água doce'], operators: [], lodging: [], rules: '',
    blurb: 'Represa alternativa à oscilação das marés, com populações robustas de Tucunarés, Traíras e Tambaquis.' },
  // AUDITADO: as duas operadoras foram confirmadas em fonte primária. O dado
  // anterior sobre embarcações ("ZETA 28 pés, carretos elétricos") estava
  // incorreto e foi substituído pelos dados publicados pela operadora.
  // VALIDAR: a operadora reporta captura de marlim-azul a 18 milhas de Ilhéus. O
  // POI hoje descreve apenas "mar recifal (8 milhas)" e não inclui peixes de
  // bico. Avaliar com a SETUR se cabe ampliar o escopo do ponto.
  { id: 's4', main: false, name: 'Ilhéus', region: 'Costa do Cacau', lat: -14.79, lng: -39.03,
    loc: 'Rio Cachoeira e mar recifal (8 milhas)', trophy: 'Arabaiana / Garoupa', trophyKeys: ['arabaiana', 'garoupa', 'xareu-branco', 'guarajuba', 'camurim', 'dentao'],
    dificuldade: 'Alta', acesso: 'Charter obrigatório', months: [9, 10, 11, 12, 1, 2, 3], season: 'Setembro a Março',
    // VALIDAR: Dentão adicionado por afinidade recifal com Garoupa/Arabaiana na mesma
    // jigada — confirmar ocorrência real com operadores locais.
    secondary: ['Xaréu-branco', 'Guarajuba', 'Camurim', 'Dentão'], operators: ['Ilhéus Pesca Oceânica — corrico, jigging vertical e pargueira.', 'FF Pesca — saída do Ilhéus Iate Clube (7h30 às 17h), embarcações de 40 e 27 pés.'], lodging: [], rules: '',
    blurb: 'A 8 milhas começa o reino do gigantesco Olho-de-boi e das Garoupas. Vertical/Speed Jigging arranca os peixes do leito marinho.' },
  // VALIDAR: ver nota de p1 sobre a zona de Canavieiras (Costa do Cacau x Costa das Baleias).
  // REGULATÓRIO: ver comentário sobre a RESEX Marinha de Canavieiras em PROTECTED_AREAS —
  // mesmas regras de pesque-e-solte e condutor beneficiário se aplicam aqui, no estuário.
  // TEMPORADA: o folder informa robalo e tarpon de janeiro a dezembro, mas o mesmo folder
  // proíbe pesca esportiva no estuário durante o defeso (15/05 a 31/07). Contradição interna
  // da peça, resolvida aqui pela janela legal: agosto a abril. Ainda assim amplia a
  // temporada anterior, que era de outubro a março.
  // VALIDAR: o folder promove o tucunaré-pinima (Cichla pinima) sem informar que é
  // introduzido, originário da bacia amazônica. O catálogo registra a condição na ficha da
  // espécie, sem alarde no texto do destino. Reportar à SETUR para a próxima tiragem.
  { id: 's5', main: false, name: 'Canavieiras', region: 'Costa do Cacau', lat: -15.68, lng: -38.95,
    loc: 'Manguezais da RESEX e rios Pardo, Patipe, Una e Jequitinhonha', trophy: 'Camurim / Tarpon', trophyKeys: ['camurim', 'camurupim', 'camurim-pena', 'xareu', 'pescada-amarela', 'tucunare'],
    dificuldade: 'Moderada', acesso: 'Base costeira', months: [1, 2, 3, 4, 8, 9, 10, 11, 12], season: 'Agosto a abril',
    secondary: ['Camurim-pena', 'Xaréu', 'Pescada-amarela', 'Tucunaré'], operators: ['Charlote Fishing — base do Banco Royal Charlotte, opera também pescaria fluvial nos rios Pardo e Salsa.'], lodging: ['Canavieiras'], rules: 'Área da RESEX Marinha de Canavieiras (ICMBio): pesque e solte, com acompanhamento de condutor beneficiário da Resex, que conhece os canais e faz parte da comunidade local. Estuário fechado à pesca esportiva no defeso do robalo (15 de maio a 31 de julho). Leve seu lixo na volta.',
    blurb: 'Porta de entrada do Banco Royal Charlotte e destino por direito próprio. Nos manguezais da RESEX, condutores locais conhecem cada canal onde o robalo e o tarpon se escondem, e os rios da região guardam o tucunaré-pinima. Na volta, a lama negra medicinal e a gastronomia do mar de Canes.' },
  // AUDITADO: Porto Pesca confirmada em fonte primária, incluindo horário de saída
  // e ponto de partida.
  // VALIDAR: as espécies anunciadas pela operadora (marlins, wahoo, olho-de-boi,
  // atum, dourado, badejo) não coincidem com as espécies hoje listadas neste POI
  // (biquara, ariacó, bicuda, bonito-listrado). Revisar o perfil do destino com a
  // SETUR: o ponto pode estar descrito como pescaria recifal leve quando a
  // operação local é predominantemente oceânica.
  // VALIDAR: operadoras "Arraial d'Ajuda Passeios" e "Porto Seguro Passeios" não
  // confirmadas como operações de pesca nesta auditoria.
  { id: 's6', main: false, name: "Porto Seguro / Arraial d'Ajuda", region: 'Costa do Descobrimento', lat: -16.45, lng: -39.07,
    loc: 'Recifes de Coroa Alta (5–15 km)', trophy: 'Camurim / Sororoca', trophyKeys: ['camurim', 'sororoca', 'biquara', 'ariaco', 'bicuda', 'bonito-listrado'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: ['Biquara', 'Ariacó', 'Bicuda', 'Bonito-listrado'], operators: ["Arraial d'Ajuda Passeios", 'Porto Pesca (Cap. Robson Saldanha) — duas lanchas equipadas, partida do píer do Hotel Quinta do Porto, em Arraial d\'Ajuda. Pescaria oceânica das 5h às 15h.', 'Porto Seguro Passeios'], lodging: [], rules: '',
    blurb: 'Microjigging (30–60 g) e fly marinho nos recifes calcários. Saídas às 5h para a atividade máxima; pacotes privativos para até dez pessoas.' },
  // VALIDAR (BLOQUEANTE): mesmas operadoras de p2 (Abrolhos Adventure, Horizonte
  // Aberto) — ver a nota acima de p2: operam mergulho e visitação, não pesca
  // esportiva confirmada. Não há operadora de pesca confirmada para este ponto.
  { id: 's7', main: false, name: 'Caravelas', region: 'Costa das Baleias', lat: -17.73, lng: -39.26,
    loc: 'Rampa de lançamento para Abrolhos', trophy: 'Garoupa / Pargo', trophyKeys: ['garoupa', 'pargo', 'vermelho-caranha', 'cioba'],
    dificuldade: 'Alta', acesso: 'Base liveaboard', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    // VALIDAR: Cioba adicionada por afinidade recifal com Pargo/Vermelho-Caranha na
    // mesma base de saída para Abrolhos — confirmar ocorrência real com operadores.
    secondary: ['Vermelho-Caranha', 'Cioba'], operators: [], lodging: [], rules: '',
    blurb: 'A cerca de 850 km de Salvador, é a base das expedições Liveaboard de 3–4 noites rumo aos parcéis de Abrolhos.' },
  { id: 's8', main: false, name: 'Itacaré', region: 'Costa do Cacau', lat: -14.28, lng: -38.99,
    loc: 'Costão rochoso e cultura do surf', trophy: 'Camurim / Xaréu', trophyKeys: ['camurim', 'xareu'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [10, 11, 12, 1, 2, 3], season: 'Outubro a Março',
    secondary: [], operators: [], lodging: [], rules: '',
    blurb: 'Junta o apelo do surf à pesca nas proximidades rochosas do litoral sul.' },
  // VALIDAR: Barra Grande Sport Fishing localizada em diretório especializado do
  // setor (pescarias costeiras e oceânicas, estrutura própria na Península de
  // Maraú) — indício, não confirmação direta por contato ou site oficial.
  { id: 's9', main: false, name: 'Península de Maraú / Barra Grande', region: 'Costa do Dendê', lat: -13.80, lng: -38.94,
    loc: 'Taipu de Fora e Algodões', trophy: 'Camurim / Xaréu', trophyKeys: ['camurim', 'camurim-pena', 'xareu', 'garoupa', 'albacora-laje', 'guaiuba'],
    dificuldade: 'Moderada', acesso: 'Charter / barco local', months: [11, 12, 1, 2, 3], season: 'Novembro a Março',
    // VALIDAR: Guaiúba adicionada — recife virgem propício a pargos/vieiras pequenas
    // junto com a Garoupa nos mesmos recifes — confirmar ocorrência real.
    secondary: ['Camurim-pena', 'Garoupa', 'Albacora-laje', 'Guaiúba'], operators: ['Tuna Pesca Maraú', 'Maraú Turismo', 'Barra Grande Sport Fishing — pescarias costeiras e oceânicas.'], lodging: [], rules: '',
    blurb: 'Recifes virgens perfeitos para surfcasting e spinning de praia direcionados ao Xaréu; ecoturismo integrado (escuna, mergulho, cachoeiras).' },
  // VALIDAR: o reservatório de Itaparica é divisa BA/PE. Confirmar com a SETUR se o
  // ponto deve permanecer no mapa e qual sede municipal baiana usar como referência.
  { id: 's10', main: false, name: 'Represa de Itaparica', region: 'Lagos e Cânions do São Francisco', lat: -9.15, lng: -38.31,
    loc: 'Glória / Rodelas', trophy: 'Tucunaré', trophyKeys: ['tucunare'],
    dificuldade: 'Moderada', acesso: 'Exige sonda e GPS', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: [], operators: [], lodging: [], rules: '',
    blurb: 'Lago que oculta florestas submersas. Isca artificial de hélice (surface prop) provoca boa resposta de ataque do Tucunaré, espécie introduzida na bacia.' },
  // AUDITADO: rios de Ondas e Ribeirão Boa Sorte confirmados como alvos das
  // campanhas de repovoamento da Codevasf com a Prefeitura de Barreiras.
  { id: 's11', main: false, name: 'Luís Eduardo Magalhães', region: 'Caminhos do Oeste', lat: -12.09, lng: -45.80,
    loc: 'Rio de Ondas e Ribeirão Boa Sorte', trophy: 'Pacu / Tucunaré', trophyKeys: ['pacu', 'tucunare', 'piau'],
    dificuldade: 'Baixa', acesso: 'Acesso rodoviário', months: [5, 6, 7, 8, 9, 10], season: 'Maio a Outubro',
    secondary: ['Piau'], operators: [], lodging: [], rules: '',
    blurb: 'Polo agrícola do Cerrado, irrigado pelas artérias hídricas do oeste baiano. Alvo de campanhas de repovoamento da Codevasf com a Prefeitura de Barreiras.' }
];

// Sedes dos municípios citados em `lodging`, para que cada item de Hospedagem
// no card do destino leve o mapa até o município correspondente.
// VALIDAR: coordenadas aproximadas da sede municipal (não do limite oficial) —
// conferir com base do IBGE antes da publicação institucional.
const MUNICIPIOS = {
  'Canavieiras': { lat: -15.675, lng: -38.947 },
  'Caravelas': { lat: -17.732, lng: -39.262 },
  'Nazaré': { lat: -13.035, lng: -39.000 },
  'Jaguaripe': { lat: -13.113, lng: -38.895 },
  'Jandaíra': { lat: -11.564, lng: -37.784 },
  'Camamu': { lat: -13.945, lng: -39.106 },
  'Maraú': { lat: -14.104, lng: -39.014 },
  'Sobradinho': { lat: -9.462, lng: -40.822 },
  'Juazeiro': { lat: -9.416, lng: -40.498 },
  'Paulo Afonso': { lat: -9.406, lng: -38.216 },
  'Andaraí': { lat: -12.807, lng: -41.331 },
  'Lençóis': { lat: -12.561, lng: -41.390 },
  'Mata de São João': { lat: -12.531, lng: -38.300 },
  'Barreiras': { lat: -12.153, lng: -44.990 }
};

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
  'Caminhos do Jiquiriçá': 'Caminhos do Jiquiriçá',
  'Costa do Descobrimento': 'Costa do Descobrimento',
  'Caminhos do Sudoeste': 'Caminhos do Sudoeste'
};

// ---------------------------------------------------------------------------
// POI removido — 'p8', Alto Rio Paraguaçu (Chapada Diamantina)
// ---------------------------------------------------------------------------
// Removido do array POIS. Fundamentação:
//
// O levantamento da ictiofauna da APA Marimbus-Iraquara, no alto Paraguaçu
// (UEFS, 2025), registrou 23 espécies em dez famílias, nenhuma delas
// Bryconidae, que é a família do dourado (Salminus) e da matrinxã (Brycon). A
// assembleia é dominada por characídeos de pequeno porte (Astyanax lorien,
// Astyanax gr. fasciatus). O gênero Salminus não é nativo das bacias
// costeiras do Leste, ocorrendo no Brasil nas bacias do Paraná, São
// Francisco, Doce e Paraíba do Sul. Os grandes predadores hoje presentes no
// Paraguaçu são introduzidos (Cichla pinima, Astronotus ocellatus). Conclusão:
// o POI não descreve uma pescaria existente. Some-se que o trecho está
// dentro de uma APA com ictiofauna endêmica e mal conhecida, o que torna a
// divulgação de pesca esportiva ali inadequada em peça institucional.
//
// { id: 'p8', main: true, sig: 'SIG 008', name: 'Alto Rio Paraguaçu', region: 'Chapada Diamantina', lat: -12.80, lng: -41.33,
//   loc: 'Andaraí / Poço do Gavião', depth: 'Cristalinidade extrema: 1 m a 15 m',
//   technique: 'Fly Fishing (classes #7 a #9)', trophy: 'Dourado-do-rio / Matrinxã', trophyKeys: ['dourado-do-rio', 'matrinxa'],
//   dificuldade: 'Alta', acesso: 'Guia local obrigatório', months: [5, 6, 7, 8, 9], season: 'Maio a Setembro',
//   secondary: ['Matrinxã'],
//   operators: ['Guias de fly fishing locais (região do Marimbus).'],
//   lodging: ['Andaraí', 'Lençóis'],
//   rules: 'Catch & Release rigoroso. Proibido filtro solar poluente — bioma de montanha frágil.',
//   blurb: 'Águas vítreas incolores permitem sight fishing: o pescador avista o alvo à distância antes do arremesso. Streamers rio acima em derivação natural; saltos acrobáticos do Dourado.' },
