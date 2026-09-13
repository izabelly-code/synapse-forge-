# SYN-76 — Audit de responsividade (28/08/2026)

Audit feito por 4 agentes em paralelo (layout+dashboard · pedidos · estoque&cores · agenda/orçamento/perfil),
sobre a main (b29551e). Read-only: nada foi alterado. Este doc consolida os achados; os números de linha
referem-se ao estado da main nessa data.

## Diagnóstico geral

**A premissa "responsividade zero" está errada — e isso muda a estratégia.** O app já tem ~17 media
queries (colapso da sidebar em 900px, empilhamento das linhas em 768px, stat cards em 1024/640, filtros
em 640, modais em 768...). O problema não é ausência, é **inconsistência**:

1. **Todos os breakpoints medem o viewport, mas o conteúdo vive num container `viewport − 280px`
   (sidebar) `− 80px` (padding).** Resultado: uma **faixa morta de ~769px a ~1266px** em que as
   tabelas estouram horizontalmente — exatamente a faixa de notebook 1024/1280 e tablet em paisagem.
2. **Dois gatilhos de colapso desalinhados**: sidebar colapsa em 900px, conteúdo empilha em 768px.
   A lacuna de 132px entre eles é onde tudo quebra. Nenhum dos dois pertence ao conjunto canônico
   (480/640/768/1024 de docs/design-tokens.md).
3. **Nenhuma rede de segurança de overflow**: listas sem `overflow-x: auto`, body sem guard —
   um único estouro vira scroll horizontal da página inteira, arrastando a sidebar sticky junto.

## Quebras de gravidade ALTA por área

### Shell / Sidebar (index.css 2716, 3085-3150; DashboardLayout.tsx)
- **Não existe drawer/hambúrguer.** Abaixo de 900px a sidebar vira barra horizontal com scroll
  lateral cego (8 itens ≈ 1100px numa faixa de ~230px em 375px) e `position: static` — a navegação
  some ao rolar.
- Os popovers do rodapé (idioma, sino) são hardcoded para abrir **para cima** e ficam invisíveis /
  clipados no modo barra (o `overflow-x: auto` da barra recorta filhos absolutos; `overflow-y:
  visible` + `overflow-x: auto` computa `auto` nos dois eixos).
- `.notif-panel` 300px e `.sidebar-lang-menu` fixos sem `max-width: calc(100vw - 2rem)`.

### Pedidos (index.css 1450, 1889, 1781/1907)
- `.pedido-row`: min-content de **906px** (84px + minmax's + 290px do stepper + gaps + padding);
  colapsa só em ≤768px → **overflow do documento em toda a faixa 769–1265px**. É o pior sintoma
  do app no notebook.
- `.kebab-menu { right: 0 }` + `.cell-acoes { justify-content: flex-start }` no ≤768px → o menu
  abre ~122px **fora da viewport** no layout empilhado. Funcionalidade inacessível no mobile.
- `.filtros-actions` sem `flex-wrap` + `.filtro-action` nowrap → estoura em 360px.
- Stepper: 5 labels nowrap a 10px se sobrepõem em ≤375px.
- Contraponto: **os modais de pedido estão certos** (max-width sobre width:100%, 100dvh, grids
  colapsam em 768) — nada de largura fixa.

### Estoque & Cores (index.css 3656, 3933, 3239-3303; OrdensPinturaKanban.tsx 410-462)
- `.material-row` (min 752px) e `.cor-row` (min 736px) colapsam em 768px mas só cabem a partir de
  ~1120px → mesma faixa morta.
- **Kanban de pintura: quebra FUNCIONAL em touch** — usa drag-and-drop HTML5 (`draggable`/`onDrop`),
  que não funciona em celular/tablet; o kebab não oferece "Mover para...". E o ViewToggle
  Kanban/Lista está **morto** (sem onClick) — a visão lista, fallback natural do mobile, nunca foi
  implementada.
- Board: `overflow-x` no container errado (header/toolbar deslizam junto); colunas com
  `min-height: 610px` fixo = ~3.7k px de altura em mobile mesmo vazio.
- `.filtro-dropdown` sem `max-height`/`overflow-y` → menus dinâmicos (Fornecedor, Técnico)
  estouram a viewport.
- Contraponto: `.cores-grid` (`auto-fill minmax(240px,1fr)`), a Calculadora e os modais já estão
  corretos — o `auto-fill/minmax` é o padrão a replicar.

### Agenda (Calendar.css 126-207; Calendar.tsx 257-291; EventoModal.css 121-131, 284-286)
- **Única tela inutilizável em 375px**: grade mensal de 7 colunas sem nenhum fallback → células de
  ~39px (21px úteis), badges vazando sobre células vizinhas, event-chips ilegíveis. **Só existe
  visão mensal** — sem semana/dia/lista.
- EventoModal: `.field-row` de 3 colunas (data + 2 horários) **sem media query** → inputs de
  ~52px úteis em 375px; e o `.btn { width: 100% }` do ≤640px colapsa o campo de participantes
  para ~35px.

### Orçamentos / Perfil
- OrcamentoHistorico: no ≤768px o cabeçalho some mas as células **não têm `.cell-label`** → valores
  empilhados sem rótulo (mesmo bug em Materiais; Pedidos só tem label no prazo).
- `.orcamento-form-grid` colapsa em 900px, mas o breakpoint real com sidebar é ~1180px.
- Perfil: padding 32px fixo, `.profile-actions` sem wrap, 6 blocos de estilo inline que bloqueiam
  media queries. ConfirmEmail×2: layout 100% inline com 100vh aninhado.
- NotFound/SessionExpired: **já responsivas**, não precisam de trabalho.

## Padrões sistêmicos (transversais)

| # | Padrão | Onde |
|---|--------|------|
| S1 | Breakpoints keyed no viewport ignorando os 280px da sidebar → faixa morta 769–1266px | pedido-row, cor-row, material-row, orcamento-form, calendar-layout, stat-cards |
| S2 | Colapso da sidebar (900) ≠ colapso do conteúdo (768) | shell vs todas as listas |
| S3 | Sem rede de overflow: listas sem `overflow-x: auto`, body sem guard | pedidos-list, cores-list, materiais |
| S4 | Popovers com ancoragem fixa (`right:0`, `bottom:`, larguras 300/190/172/168px) dentro de containers com overflow | kebab, filtro-dropdown, sino, idioma, sugestões do EventoModal |
| S5 | `white-space: nowrap` em flex/grid sem `min-width:0`/ellipsis | step-label, filtro-action, btn-novo-pedido, badge estoque |
| S6 | Inputs a 15px (`--text-lg`) → zoom automático no iOS Safari a cada foco | todos os forms do app logado |
| S7 | Alvos de toque 28–36px (mín. recomendado 44) + `100vh` em vez de `100dvh` + `⌘K` visível em touch | geral |

## Plano de ataque proposto (fases → commits)

**Fase 1 — Fundação do shell (resolve a maior parte sozinha):**
unificar o colapso em **1024px** e transformar a sidebar em **drawer real** (estado no
DashboardLayout, hambúrguer, scrim, `translateX`, header mobile sticky). Mata a faixa morta
901–1266px, o clipping dos popovers do rodapé e a navegação que some no scroll.

**Fase 2 — Listas/tabelas:** empilhamento das linhas (`pedido-row`, `cor-row`, `material-row`,
`orcamento-row`) via **container query** no `.dashboard-content` (já tem `min-width:0`) ou
breakpoint ~1120–1280px; `overflow-x: auto` como rede nas listas; `.cell-label` completo em
Pedidos/Materiais/Orçamentos.

**Fase 3 — Popovers:** padrão único de posicionamento (flip/clamp, `max-width: calc(100vw-2rem)`,
`max-height` no `.filtro-dropdown`); kebab do layout empilhado abrindo para o lado certo.

**Fase 4 — Agenda mobile:** visão lista/agenda ≤640px no lugar da grade (reaproveita `.event-card`);
`overflow:hidden` na célula + esconder chips; EventoModal `.field-row` → 1 coluna, escopar o
`.btn width:100%`, dvh + rodapé sticky.

**Fase 5 — Kanban touch:** "Mover para..." no kebab (reaproveita `moverOrdem`); implementar a visão
Lista do ViewToggle morto (default em ≤768px); min-height das colunas e wrapper de scroll correto.
**Muda comportamento — validar com o Victor antes.**

**Fase 6 — Fluidez e polimento:** stat-cards `auto-fit/minmax`, paddings com `clamp()`, inputs 16px
+ `inputMode`, `100dvh`, alvos de toque via `@media (pointer: coarse)`, esconder `⌘K`, filtros
mobile compactos, Perfil/ConfirmEmail (tirar inline styles).

**Limpeza prévia barata:** apagar CSS morto `.app-container`/`.dashboard-layout`/`.dashboard-header*`
(index.css 823-871, herança do UserList removido).

Fases 1–2 eliminam todos os itens de gravidade alta de layout; a fase 5 é a única quebra funcional.
