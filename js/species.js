// Catálogo de espécies-troféu do mapa de pesca esportiva na Bahia.
// Carregado antes de js/data.js — data.js referencia SPECIES/TROPHIES.
//
// O campo `nota` é renderizado no card público da espécie: só entra ali
// curiosidade ou informação de interesse do visitante. Pendências de revisão
// (VALIDAR) e histórico do refactor de chaves ficam em comentário, nunca no dado.

const SPECIES = [
  // ---------- OCEÂNICAS ----------
  { key:'marlin-azul', nome:'Marlin Azul', nomeNacional:'Agulhão-negro',
    cientifico:'Makaira nigricans', aliases:['agulhão-preto','blue marlin'],
    habitat:'oceanico', porte:'até 4,0 m · 600+ kg', status:'ameacada',
    meses:[10,11,12,1,2,3], tecnica:'Corrico pesado (trolling 80–130 lb)',
    nota:'Catch & Release obrigatório para peixes de bico. Recorde mundial IGFA de 636 kg capturado ao largo de Vitória/ES em 1992.' },

  { key:'marlin-branco', nome:'Marlin Branco', nomeNacional:'Agulhão-branco',
    cientifico:'Kajikia albida', aliases:['white marlin'],
    habitat:'oceanico', porte:'até 2,8 m · 80 kg', status:'ameacada',
    meses:[10,11,12,1,2,3], tecnica:'Corrico leve a médio',
    nota:'Catch & Release obrigatório.' },

  { key:'peixe-vela', nome:'Peixe-Vela', nomeNacional:'Agulhão-vela',
    cientifico:'Istiophorus albicans', aliases:['agulhão-bandeira','veleiro','sailfish'],
    habitat:'oceanico', porte:'até 3,0 m · 60 kg', status:'nativo',
    meses:[10,11,12,1,2,3], tecnica:'Corrico com isca natural / bait & switch',
    nota:'Catch & Release obrigatório. Peixe mais veloz do oceano.' },

  { key:'dourado-do-mar', nome:'Dourado-do-mar', nomeNacional:'Dourado',
    cientifico:'Coryphaena hippurus', aliases:['doirado','mahi-mahi','delfim'],
    habitat:'oceanico', porte:'até 1,5 m · 25 kg', status:'nativo',
    meses:[10,11,12,1,2,3,4], tecnica:'Corrico e spinning junto a objetos flutuantes',
    nota:'Associa-se a manchas de sargaço e objetos à deriva. Crescimento muito rápido.' },

  { key:'albacora-laje', nome:'Albacora-laje', nomeNacional:'Atum-de-barbatana-amarela',
    cientifico:'Thunnus albacares', aliases:['albacora','yellowfin'],
    habitat:'oceanico', porte:'até 2,0 m · 150 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Corrico, jigging vertical, isca viva',
    nota:'' },

  { key:'albacorinha', nome:'Albacorinha', nomeNacional:'Atum-de-barbatana-negra',
    cientifico:'Thunnus atlanticus', aliases:['albacora-preta','blackfin'],
    habitat:'oceanico', porte:'até 1,0 m · 20 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Spinning, jigging leve, corrico rápido',
    nota:'Espécie de atum mais frequente na plataforma baiana.' },

  { key:'bonito-listrado', nome:'Bonito-listrado', nomeNacional:'Gaiado',
    cientifico:'Katsuwonus pelamis', aliases:['bonito','gaiado','skipjack'],
    habitat:'oceanico', porte:'até 1,0 m · 20 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Corrico rápido / spinning em cardume',
    nota:'' },

  { key:'wahoo', nome:'Wahoo', nomeNacional:'Cavala-empinge',
    cientifico:'Acanthocybium solandri', aliases:['guarapicu','cavala-da-índia','cavala-aipim'],
    habitat:'oceanico', porte:'até 2,0 m · 60 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Corrico em alta velocidade com líder de aço',
    nota:'Arranques explosivos. Exige líder de aço — dentição corta fluorocarbono.' },

  { key:'cavala', nome:'Cavala', nomeNacional:'Cavala-verdadeira',
    cientifico:'Scomberomorus cavalla', aliases:['cavala-branca','king mackerel'],
    habitat:'oceanico', porte:'até 1,7 m · 45 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Corrico, isca viva de superfície',
    nota:'Não confundir com cavalinha (Scomber), espécie menor e sem valor esportivo.' },

  { key:'sororoca', nome:'Sororoca', nomeNacional:'Serra',
    cientifico:'Scomberomorus brasiliensis', aliases:['serra','cavala-pintada'],
    habitat:'oceanico', porte:'até 1,0 m · 8 kg', status:'nativo',
    meses:[4,5,6,7,8,9], tecnica:'Spinning costeiro, corrico leve',
    nota:'No Nordeste o nome corrente é "serra"; "sororoca" predomina no Sudeste/Sul.' },

  // VALIDAR: porte, meses e status são estimativas gerais da espécie, não dados
  // levantados com a operadora (Charlote Fishing) — confirmar porte típico capturado
  // em Canavieiras, melhor época local e status na Portaria GM/MMA nº 1.667/2026
  // (Anexo I) antes de publicar.
  { key:'meca', nome:'Meca', nomeNacional:'Espadarte',
    cientifico:'Xiphias gladius', aliases:['espadarte','swordfish'],
    habitat:'oceanico', porte:'até 3,5 m · 300 kg', status:'nativo',
    meses:[10,11,12,1,2,3], tecnica:'Deep drop (pesca de fundo profundo, iscas luminosas)',
    nota:'Pescaria oceânica relativamente nova na costa de Canavieiras, com técnica de deep drop distinta do corrico de superfície usado para os peixes de bico.' },

  // ---------- RECIFAIS ----------
  { key:'garoupa', nome:'Garoupa', nomeNacional:'Garoupa-verdadeira',
    cientifico:'Epinephelus marginatus', aliases:['garoupa-legítima'],
    habitat:'recifal', porte:'até 1,5 m · 60 kg', status:'ameacada',
    meses:[10,11,12,1,2,3], tecnica:'Jigging vertical, isca natural de fundo',
    nota:'Espécie ameaçada, categoria Vulnerável na lista nacional oficial (Portaria GM/MMA nº 1.667/2026). Sujeita a restrições de captura definidas na Portaria GM/MMA nº 1.666/2026.' },

  { key:'badejo', nome:'Badejo', nomeNacional:'Badejo-quadrado',
    cientifico:'Mycteroperca bonaci', aliases:['badejo-preto','sirigado'],
    habitat:'recifal', porte:'até 1,3 m · 55 kg', status:'ameacada',
    meses:[10,11,12,1,2,3], tecnica:'Jigging vertical, isca de fundo',
    nota:'Espécie ameaçada, categoria Em Perigo na lista nacional oficial (Portaria GM/MMA nº 1.667/2026). Sujeita a restrições de captura definidas na Portaria GM/MMA nº 1.666/2026.' },

  { key:'cherne', nome:'Cherne', nomeNacional:'Cherne-verdadeiro',
    cientifico:'Hyporthodus niveatus', aliases:['cherne-poveiro'],
    habitat:'recifal', porte:'até 1,2 m · 50 kg', status:'ameacada',
    meses:[5,6,7,8,9], tecnica:'Pesca de fundo profunda, carretilha elétrica',
    nota:'Habita a quebra da plataforma continental, abaixo dos 100 m de profundidade. Espécie ameaçada, categoria Vulnerável na lista nacional oficial (Portaria GM/MMA nº 1.667/2026). Sujeita a restrições de captura definidas na Portaria GM/MMA nº 1.666/2026.' },

  { key:'mero', nome:'Mero', nomeNacional:'Mero',
    cientifico:'Epinephelus itajara', aliases:['canapu','meroaçu'],
    habitat:'recifal', porte:'até 2,5 m · 400 kg', status:'proibida',
    meses:[], tecnica:'—',
    // VALIDAR: confirmar a portaria de moratória vigente. Manter no mapa apenas com
    // selo de proibição — nunca apresentar como espécie-alvo.
    nota:'PESCA PROIBIDA em todo o Brasil. Moratória federal desde 2002 (Portaria IBAMA nº 121/2002), mantida por prazo indeterminado pela Portaria MMA nº 148/2022. Classificada como Criticamente em Perigo (CR) na lista nacional oficial (Portaria GM/MMA nº 1.667/2026). Proibido pescar, manter a bordo, transportar e comercializar.' },

  { key:'vermelho-caranha', nome:'Vermelho-Caranha', nomeNacional:'Caranha',
    cientifico:'Lutjanus cyanopterus', aliases:['caranha','caranho','cubera'],
    habitat:'recifal', porte:'até 1,6 m · 60 kg', status:'ameacada',
    meses:[10,11,12,1,2,3], tecnica:'Jigging pesado, isca natural',
    nota:'Espécie ameaçada, categoria Vulnerável na lista nacional oficial (Portaria GM/MMA nº 1.667/2026). Sujeita a restrições de captura definidas na Portaria GM/MMA nº 1.666/2026.' },

  { key:'pargo', nome:'Pargo', nomeNacional:'Pargo-vermelho',
    cientifico:'Lutjanus purpureus', aliases:['vermelho','pargo-verdadeiro'],
    habitat:'recifal', porte:'até 1,0 m · 20 kg', status:'ameacada',
    meses:[10,11,12,1,2,3], tecnica:'Pesca de fundo, jigging',
    nota:'Nome "pargo" designa outra espécie no Sudeste/Sul (Pagrus pagrus). Aqui refere-se ao vermelho do Nordeste. Espécie ameaçada, categoria Em Perigo na lista nacional oficial (Portaria GM/MMA nº 1.667/2026). Sujeita a restrições de captura definidas na Portaria GM/MMA nº 1.666/2026.' },

  { key:'dentao', nome:'Dentão', nomeNacional:'Dentão',
    cientifico:'Lutjanus jocu', aliases:['caranha-dentão','vermelho-dentão'],
    habitat:'recifal', porte:'até 1,2 m · 30 kg', status:'nativo',
    meses:[10,11,12,1,2,3], tecnica:'Jigging, isca natural de fundo',
    nota:'Juvenis frequentam estuários; adultos, recifes profundos.' },

  { key:'cioba', nome:'Cioba', nomeNacional:'Cioba',
    cientifico:'Lutjanus analis', aliases:['ciobinha','mutton snapper'],
    habitat:'recifal', porte:'até 90 cm · 15 kg', status:'nativo',
    meses:[10,11,12,1,2,3], tecnica:'Isca natural, jigging leve',
    nota:'' },

  { key:'guaiuba', nome:'Guaiúba', nomeNacional:'Guaiúba',
    cientifico:'Ocyurus chrysurus', aliases:['rabo-aberto','yellowtail snapper'],
    habitat:'recifal', porte:'até 70 cm · 4 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Isca natural leve, microjigging',
    nota:'' },

  { key:'ariaco', nome:'Ariacó', nomeNacional:'Ariacó',
    cientifico:'Lutjanus synagris', aliases:['ariocó','areocó','baúna','vermelho-ariocó'],
    habitat:'recifal', porte:'até 60 cm · 3 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Isca natural, microjigging',
    nota:'' },

  { key:'biquara', nome:'Biquara', nomeNacional:'Biquara',
    cientifico:'Haemulon plumierii', aliases:['abiquara','cambuba','corcoroca','pirambu','xira'],
    habitat:'recifal', porte:'até 45 cm · 2 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Isca natural leve, microjigging',
    nota:'Não confundir com a bicuda (barracuda), espécie totalmente distinta.' },

  { key:'arabaiana', nome:'Arabaiana', nomeNacional:'Olho-de-boi',
    cientifico:'Seriola spp. (S. dumerili, S. rivoliana)', aliases:['olho-de-boi','olhete','pitangola','tapiranga','urubaiana'],
    habitat:'recifal', porte:'até 1,8 m · 70 kg', status:'nativo',
    meses:[9,10,11,12,1,2,3], tecnica:'Speed jigging, isca viva',
    // VALIDAR: decidir se cabe um alerta de consumo destacado no card.
    nota:'Associada à síndrome de Haff ("doença da urina preta") em episódios registrados no Brasil.' },

  { key:'bicuda', nome:'Bicuda', nomeNacional:'Barracuda',
    cientifico:'Sphyraena barracuda', aliases:['barracuda','bicuda-preta'],
    habitat:'recifal', porte:'até 1,8 m · 40 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Spinning, corrico com líder de aço',
    nota:'Risco de ciguatera no consumo de exemplares grandes.' },

  { key:'xareu', nome:'Xaréu', nomeNacional:'Xaréu',
    cientifico:'Caranx hippos', aliases:['xaréu-preto','crevalle jack'],
    habitat:'recifal', porte:'até 1,2 m · 30 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Spinning de praia, poppers, isca viva',
    nota:'Entra em estuários e baías. Um dos alvos mais acessíveis da costa baiana.' },

  { key:'xareu-branco', nome:'Xaréu-branco', nomeNacional:'Xaréu-branco',
    cientifico:'Caranx latus', aliases:['guaracema','horse-eye jack'],
    habitat:'recifal', porte:'até 1,0 m · 15 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Spinning, jigging leve',
    nota:'' },

  { key:'guarajuba', nome:'Guarajuba', nomeNacional:'Xaréu-amarelo',
    cientifico:'Carangoides bartholomaei', aliases:['garajuba','carapau','yellow jack'],
    habitat:'recifal', porte:'até 90 cm · 12 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Spinning, jigging leve',
    nota:'Nome dominante no litoral baiano — dá nome a praia no Litoral Norte.' },

  // ---------- ESTUARINAS / COSTEIRAS ----------
  { key:'camurim', nome:'Camurim', nomeNacional:'Robalo-flecha',
    cientifico:'Centropomus undecimalis', aliases:['camorim','robalão','robalo','snook'],
    habitat:'estuarino', porte:'até 1,4 m · 25 kg', status:'nativo',
    meses:[11,12,1,2,3,4,5,9,10], tecnica:'Isco vivo, baitcasting, fly',
    nota:'Defeso na desova (jun–ago). Nome corrente no litoral baiano é camurim.' },

  { key:'camurim-pena', nome:'Camurim-pena', nomeNacional:'Robalo-peva',
    cientifico:'Centropomus parallelus', aliases:['robalo-peba','robalo-peva','robalo'],
    habitat:'estuarino', porte:'até 70 cm · 7 kg', status:'nativo',
    meses:[11,12,1,2,3,4,5,9,10], tecnica:'Isco vivo, jig head, plugs',
    nota:'Defeso na desova (jun–ago). Ocupa porções mais internas do estuário que o camurim.' },

  { key:'camurupim', nome:'Camurupim', nomeNacional:'Tarpon',
    cientifico:'Megalops atlanticus', aliases:['tarpon','pirapema','peixe-prata'],
    habitat:'estuarino', porte:'até 2,5 m · 160 kg', status:'ameacada',
    meses:[12,1,2,3,4], tecnica:'Baitcasting de precisão, fly, isca viva',
    nota:'Catch & Release recomendado. "Pirapema" é o nome usado no Sudeste/Sul.' },

  { key:'carapeba', nome:'Carapeba', nomeNacional:'Carapeba',
    cientifico:'Diapterus rhombeus', aliases:['caratinga','carapicu'],
    habitat:'estuarino', porte:'até 40 cm · 1,5 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Isca natural leve, tarrafa',
    nota:'"Carapicu" designa os exemplares menores (gênero Eucinostomus).' },

  { key:'pescada-amarela', nome:'Pescada-amarela', nomeNacional:'Pescada-amarela',
    cientifico:'Cynoscion acoupa', aliases:['pescadão','pescada'],
    habitat:'estuarino', porte:'até 1,1 m · 20 kg', status:'nativo',
    meses:[12,1,2,3,4], tecnica:'Isca natural de fundo, jig head',
    nota:'' },

  { key:'corvina', nome:'Corvina', nomeNacional:'Corvina',
    cientifico:'Micropogonias furnieri', aliases:['cascote','corvina-branca'],
    habitat:'estuarino', porte:'até 60 cm · 5 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Isca natural de fundo',
    nota:'Não confundir com papa-terra (Menticirrhus), espécie distinta.' },

  { key:'curima', nome:'Curimã', nomeNacional:'Tainha',
    cientifico:'Mugil liza', aliases:['tainha','curimã-açu'],
    habitat:'estuarino', porte:'até 80 cm · 6 kg', status:'nativo',
    meses:[5,6,7,8], tecnica:'Tarrafa, isca vegetal, fly',
    nota:'"Curimã" é o nome corrente no Nordeste; "tainha" predomina no Sul/Sudeste.' },

  { key:'parati', nome:'Parati', nomeNacional:'Parati',
    cientifico:'Mugil curema', aliases:['tainha-parati','saúna','curimã'],
    habitat:'estuarino', porte:'até 40 cm · 1 kg', status:'nativo',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Tarrafa, isca vegetal',
    nota:'Muito usada como isca viva para camurim e xaréu.' },

  // ---------- DULCÍCOLAS ----------
  { key:'surubim', nome:'Surubim', nomeNacional:'Surubim / Pintado',
    cientifico:'Pseudoplatystoma corruscans', aliases:['pintado','surubim-do-são-francisco','moleque'],
    habitat:'dulcicola', porte:'até 1,6 m · 80 kg', status:'ameacada',
    meses:[6,7,8,9,10], tecnica:'Pesca de fundo noturna, plugs sub-superfície',
    nota:'Na Bahia e no rio São Francisco o nome corrente é surubim; "pintado" designa o mesmo peixe no Pantanal e na bacia do Paraná. Espécie ameaçada, categoria Vulnerável na lista nacional oficial (Portaria GM/MMA nº 1.667/2026). Sujeita a restrições de captura definidas na Portaria GM/MMA nº 1.666/2026.' },

  { key:'dourado-do-rio', nome:'Dourado-do-rio', nomeNacional:'Dourado',
    cientifico:'Salminus franciscanus', aliases:['dourado','piraju','valente'],
    habitat:'dulcicola', porte:'até 1,0 m · 20 kg', status:'nativo',
    meses:[5,6,7,8,9,10], tecnica:'Fly fishing, plugs, isca viva',
    nota:'' },

  { key:'traira', nome:'Traíra', nomeNacional:'Traíra',
    cientifico:'Hoplias malabaricus', aliases:['lobó','tarairá'],
    habitat:'dulcicola', porte:'até 60 cm · 4 kg', status:'nativo',
    meses:[4,5,6,7,8,9,10], tecnica:'Plugs de superfície, isca viva',
    nota:'' },

  { key:'piau', nome:'Piau', nomeNacional:'Piau',
    cientifico:'Megaleporinus obtusidens', aliases:['piava','piapara','aracu','piau-verdadeiro'],
    habitat:'dulcicola', porte:'até 50 cm · 4 kg', status:'nativo',
    meses:[4,5,6,7,8,9,10], tecnica:'Espera com ceva, isca vegetal',
    nota:'"Piava/piapara" no Sul-Sudeste, "aracu" no Norte.' },

  { key:'pacu', nome:'Pacu', nomeNacional:'Pacu-prata',
    cientifico:'Myleus micans', aliases:['pacu-prata','pacu-manteiga'],
    habitat:'dulcicola', porte:'até 40 cm · 3 kg', status:'nativo',
    meses:[4,5,6,7,8,9,10], tecnica:'Espera com ceva (fruta, milho fermentado)',
    // VALIDAR: o pacu nativo do São Francisco/Oeste Baiano é Myleus micans. O Piaractus
    // mesopotamicus, comum em pesqueiros, é INTRODUZIDO na bacia — se os pontos se
    // referirem a ele, reclassificar o status da espécie.
    nota:'' },

  { key:'tucunare', nome:'Tucunaré', nomeNacional:'Tucunaré',
    cientifico:'Cichla spp.', aliases:['tucunaré-açu','peacock bass'],
    habitat:'dulcicola', porte:'até 70 cm · 8 kg', status:'introduzida',
    meses:[4,5,6,7,8,9,10], tecnica:'Poppers, sticks de superfície, hélice',
    nota:'ESPÉCIE INTRODUZIDA — originária da Amazônia, estabelecida nos reservatórios do São Francisco.' },

  { key:'corvina-de-agua-doce', nome:'Corvina de água doce', nomeNacional:'Pescada-branca',
    cientifico:'Plagioscion squamosissimus', aliases:['pescada-branca','pescada-do-piauí','curvina'],
    habitat:'dulcicola', porte:'até 50 cm · 3 kg', status:'introduzida',
    meses:[4,5,6,7,8,9,10], tecnica:'Espera de fundo nas calhas profundas',
    nota:'ESPÉCIE INTRODUZIDA — originária da bacia amazônica.' },

  { key:'tambaqui', nome:'Tambaqui', nomeNacional:'Tambaqui',
    cientifico:'Colossoma macropomum', aliases:['ruelo'],
    habitat:'dulcicola', porte:'até 1,0 m · 30 kg', status:'introduzida',
    meses:[4,5,6,7,8,9,10], tecnica:'Espera com ceva (fruta)',
    nota:'ESPÉCIE INTRODUZIDA — amazônica, presente por escape de aquicultura e repovoamento.' },

  { key:'tilapia', nome:'Tilápia', nomeNacional:'Tilápia-do-nilo',
    cientifico:'Oreochromis niloticus', aliases:['saint peter','tilápia'],
    habitat:'dulcicola', porte:'até 50 cm · 3 kg', status:'introduzida',
    meses:[1,2,3,4,5,6,7,8,9,10,11,12], tecnica:'Isca vegetal, jig leve',
    nota:'ESPÉCIE EXÓTICA INVASORA — de origem africana.' }
];

// Array legado, para não quebrar o filtro atual (js/app.js consome TROPHIES).
const TROPHIES = SPECIES.map(s => [s.key, s.nome]);
