# Imagens em `assets/fish/`

**Situação atual: nenhuma imagem faltando.** As 44 espécies de `js/species.js` têm
arquivo `<chave>.avif` correspondente — confirmado por `node scripts/check-data.js`
(itens 3 e 4 zerados).

O fallback para `_placeholder.svg` continua em `fishImg()` (`js/app.js`) como rede de
segurança: se uma chave nova for criada em `js/species.js` antes da foto existir, o
card mostra o placeholder em vez de uma imagem quebrada.

## Histórico

As 13 espécies abaixo ficaram sem foto entre a Etapa 3 do refactor e julho de 2026,
quando as imagens foram entregues:

`xareu`, `xareu-branco`, `sororoca`, `biquara`, `ariaco`, `tambaqui`, `tilapia`,
`albacorinha`, `guaiuba`, `dentao`, `cioba`, `badejo`, `cherne`.

A imagem do Badejo (*Mycteroperca bonaci*) chegou nomeada `robalo.avif` — nome de outra
espécie, que no catálogo é o `camurim` (robalo-flecha) e já tinha foto própria. O arquivo
foi renomeado para `badejo.avif`, que era a única chave ainda descoberta.
