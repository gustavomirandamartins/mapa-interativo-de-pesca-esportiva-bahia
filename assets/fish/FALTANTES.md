# Imagens em `assets/fish/`

**Situação atual: nenhuma imagem faltando.** `meca.avif` (Meca / Espadarte, *Xiphias
gladius*) e `apaiari.avif` (Apaiari / Acará-açu / Oscar, *Astronotus ocellatus*)
foram entregues em 30/07/2026. Todas as 45 espécies de `js/species.js` têm arquivo
`<chave>.avif` correspondente.

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

`matrinxa.avif` foi removido do repositório (`git rm`) quando a espécie `matrinxa`
saiu do catálogo, junto com a remoção do POI `p8` (Alto Rio Paraguaçu) — levantamento
ictiológico da UEFS (2025) não confirma a ocorrência de Bryconidae (dourado, matrinxã)
no alto Paraguaçu. A espécie pode retornar ao catálogo, com nova imagem, se houver um
destino confirmado de matrinxã na bacia do São Francisco.
