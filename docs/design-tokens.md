# Design tokens — dimensões não-cromáticas

> Fase 3 da higiene de front-end (SYN-72). Complementa `docs/inventario-estilos.md`
> (fonte de verdade das **cores**) e as decisões de `docs/rf16-relatorio-sessao.md`.
> Nada aqui altera o sistema de cor.

## Filosofia

O CSS do app é manual e concentrado em três arquivos (`src/index.css`, `src/pages/Calendar.css`,
`src/components/calendario/EventoModal.css`). Antes desta fase, cada tela trazia seus próprios
números: 33 tamanhos de fonte distintos, ~600 valores literais de espaçamento, 23 raios, 29
assinaturas de transição e 11 breakpoints escritos à mão. O critério que guiou a limpeza foi
único: **se eu quiser mudar isso globalmente amanhã, mudo em um lugar?** Toda dimensão visual
passou a sair de uma escala nomeada declarada em `:root` no `src/index.css`, estendendo a
fundação criada no commit "SYN-58: primeira rodada do polimento" (tokens `--type-*`,
`--control-h`, `--badge-h`, `--radius-pill`) em vez de criar um sistema paralelo. A regra de
substituição foi conservadora: valor idêntico a um passo vira token direto (mudança visual
zero); valor a até 1px de um passo é encaixado e registrado neste documento; valor
deliberadamente fora da escala continua literal, com comentário no CSS explicando o porquê.

## As escalas

### Tipografia — tamanhos (`--text-*`)

Ancorada nos tamanhos mais frequentes do app (14px, 13px, 12px, 11px, 15px). Nove passos de
texto e cinco de display.

| token | valor | px | papel |
|---|---|---|---|
| `--text-3xs` | 0.5rem | 8 | micro-etiquetas do kanban de pintura |
| `--text-2xs` | 0.625rem | 10 | contadores, badges |
| `--text-xs` | 0.6875rem | 11 | metadados |
| `--text-sm` | 0.75rem | 12 | labels, chips |
| `--text-md` | 0.8125rem | 13 | texto secundário |
| `--text-base` | 0.875rem | 14 | **corpo padrão** |
| `--text-lg` | 0.9375rem | 15 | inputs, subtítulos |
| `--text-xl` | 1rem | 16 | títulos de seção |
| `--text-2xl` | 1.125rem | 18 | título de modal |
| `--text-3xl` | 1.25rem | 20 | display |
| `--text-4xl` | 1.5rem | 24 | display |
| `--text-5xl` | 1.75rem | 28 | display |
| `--text-6xl` | 2.25rem | 36 | display (h1 do login) |
| `--text-7xl` | 3.25rem | 52 | display (código de erro 404) |

### Tipografia — pesos e entrelinhas

`--weight-regular` 400 · `--weight-medium` 500 · `--weight-semibold` 600 · `--weight-bold` 700 ·
`--weight-extrabold` 800

`--leading-none` 1 · `--leading-tighter` 1.1 · `--leading-tight` 1.25 · `--leading-snug` 1.4 ·
`--leading-normal` 1.5 · `--leading-relaxed` 1.6

Os papéis semânticos que já existiam (`--type-title`, `--type-medium-title`, `--type-body`,
`--type-label`, `--type-caption`) foram mantidos e agora são **compostos** a partir dos tokens
acima — continuam sendo a forma preferida de tipografar um elemento inteiro de uma vez.

### Espaçamento (`--space-*`) — base 4px

Vale para `padding`, `margin`, `gap` e `inset`. Os nomes são múltiplos de `0.25rem`; os passos
intermediários usam sufixo `-5` (`--space-1-5` = 6px).

| token | px | | token | px | | token | px |
|---|---|---|---|---|---|---|---|
| `--space-05` | 2 | | `--space-3-5` | 14 | | `--space-8` | 32 |
| `--space-1` | 4 | | `--space-4` | 16 | | `--space-9` | 36 |
| `--space-1-5` | 6 | | `--space-4-5` | 18 | | `--space-10` | 40 |
| `--space-2` | 8 | | `--space-5` | 20 | | `--space-11` | 44 |
| `--space-2-5` | 10 | | `--space-6` | 24 | | `--space-12` | 48 |
| `--space-3` | 12 | | `--space-7` | 28 | | `--space-16` | 64 |

`0` continua sendo escrito como `0` — zero não é um passo de escala.

### Raios (`--radius-*`)

`--radius-2xs` 4px · `--radius-xs` 6px · `--radius-sm` 8px · `--radius-md` 10px ·
**`--radius` 12px (padrão)** · `--radius-lg` 24px · `--radius-pill` 50px

`border-radius: 50%` (6 ocorrências) não entra na escala: é uma **forma** (círculo), não uma
medida.

### Camadas de empilhamento (`--z-*`)

Mapeadas a partir dos empilhamentos reais antes da troca; **nenhum valor numérico mudou**.

| token | valor | quem usa |
|---|---|---|
| `--z-behind` | 0 | trilho atrás dos nós de etapa |
| `--z-base` | 1 | nó de etapa |
| `--z-raised` | 2 | conteúdo sobre a foto do login |
| `--z-sticky` | 10 | cabeçalho do dashboard, linha/card com kebab aberto |
| `--z-menu` | 20 | menu dentro do card de pintura |
| `--z-dropdown` | 30 | kebab, seletor de idioma da sidebar |
| `--z-popover` | 50 | dropdown de filtros, painel de notificações |
| `--z-modal` | 100 | overlay de modal; autocomplete dentro do modal |
| `--z-lightbox` | 200 | visualizador de imagem em tela cheia |
| `--z-modal-top` | 1000 | overlay do modal do calendário (ver fora-de-escala) |

### Movimento

`--duration-fast` 0.15s · `--duration-base` 0.2s · `--duration-slow` 0.3s ·
`--duration-slower` 0.4s · `--duration-pulse` 1.5s (loop dos skeletons) ·
`--stagger-step` 35ms (atraso somado por item em listas escalonadas)

`--ease-standard` ease · `--ease-in-out` ease-in-out ·
`--ease-out-expo` cubic-bezier(0.16, 1, 0.3, 1) · `--ease-spring` cubic-bezier(0.34, 1.56, 0.64, 1)

Os blocos `@media (prefers-reduced-motion: …)` existentes foram **preservados intactos** — eles
zeram `transition`/`animation` e não dependem das durações.

### Breakpoints

Media query em CSS puro **não aceita `var()`**, então os valores continuam escritos à mão. O
conjunto canônico está documentado num comentário na seção de tokens do `index.css`:

| apelido | valor | uso |
|---|---|---|
| xs | 480px | telefone pequeno |
| sm | 640px | telefone |
| md | 768px | tablet retrato / colapso geral |
| lg | 1024px | tablet paisagem |

## Interação com o Tailwind 4

Os namespaces `--text-*`, `--radius-*`, `--leading-*` e `--ease-*` **coincidem** com os do tema
padrão do Tailwind 4, assim como `--color-*` já coincidia desde a SYN-50. Como o nosso `:root`
não é *layered* e vem depois do `@import "tailwindcss"`, os nossos valores vencem — que é
exatamente o comportamento desejado (utilitário que venha a ser usado segue a nossa escala).
Hoje o build gera apenas 4 utilitários Tailwind (`.flex`, `.grid`, `.hidden`, `.border`), nenhum
deles referenciando esses tokens, então a sobreposição é inerte. **Atenção para o futuro:** se
alguém escrever `class="text-sm"`, vai receber os nossos 12px, não os 14px do Tailwind.

## Fora da escala (mantidos de propósito)

| onde | valor | motivo |
|---|---|---|
| `.app-container` `padding-top` | 60px | recuo do topo próprio da tela de lista de usuários; não é um passo de espaçamento |
| `.pedido-row.is-advancing … .step-node` | `animation: step-pop 0.55s` | tempo do "pop" de conclusão de etapa; encurtar para 0.4s descaracterizaria o gesto |
| `--z-modal-top` | 1000 | o modal do calendário nasceu com escala própria; alinhar a 100 exigiria revalidar a sobreposição com o lightbox |
| `border-radius: 50%` (6x) | 50% | forma (círculo), não medida |
| `@media (max-width: 540px)` | 540px | ponto em que os dois campos de senha deixam de caber lado a lado |
| `@media (max-width: 900px)` (2x) | 900px | colapso estrutural da sidebar (e do formulário de orçamento, alinhado a ele) |
| `@media (max-width: 1100px)` (2x) | 1100px | ditado pela largura do conteúdo da toolbar, não pelo device |

## Breakpoints normalizados

Só foram movidos valores próximos de um passo canônico **e** cujo bloco faz colapso suave
(empilhar, virar 1 coluna, ajustar padding). Em caso de dúvida o valor foi mantido e apenas
documentado acima.

| antes | depois | arquivo | o que o bloco faz |
|---|---|---|---|
| 600px | 640px | EventoModal.css | modal vai a 95% de largura, rodapé empilha |
| 700px | 768px | index.css | padding do conteúdo de pintura, busca 100%, grid do modal em 1 coluna |
| 720px | 768px | Calendar.css | cabeçalhos empilham, padding da página |
| 980px | 1024px | Calendar.css | `.calendar-layout` vira 1 coluna |

Verificado que os blocos de 768px resultantes não compartilham nenhum seletor entre si, portanto
não há sobreposição nova na cascata.

## Snaps com mudança real

155 declarações tiveram o valor computado alterado. **Todas** dentro do orçamento de ≤1px (a
maioria é sub-pixel: eram valores como `0.78rem` = 12.48px encaixados em 12px) ou, no caso do
movimento, de 20–50ms. Os valores abaixo estão em px para facilitar a conferência.

`999px`/`9999px` → `50px` não muda nada visualmente: os elementos afetados têm 20–22px de altura,
então qualquer raio acima da metade da altura já os arredonda por completo.

#### `animation`

| antes | depois | n | onde |
|---|---|---|---|
| modal-card-in 280ms cubic-bezier(.16, 1, .3, 1) forwards | modal-card-in 300ms cubic-bezier(.16, 1, .3, 1) forwards | 1 | `.modal-card` |

#### `border-radius`

| antes | depois | n | onde |
|---|---|---|---|
| 10.4px | 10px | 1 | `.pintura-card` |
| 3.2px | 4px | 1 | `.pintura-card-color > span` |
| 5.6px | 6px | 1 | `.pintura-date-tag, .pintura-priority` |
| 6.4px | 6px | 3 | `.pintura-view-toggle button`; `.pintura-card-menu-btn`; `.pintura-card-menu > button, .pintura-card-menu > div button` |
| 7.2px | 8px | 2 | `.pintura-reference-images img`; `.pintura-color-summary > span` |
| 7px | 8px | 1 | `.mistura-resumo-swatch` |
| 8.8px | 8px | 4 | `.pintura-search input`; `.pintura-filter-static, .pintura-view-toggle`; `.pintura-toolbar .ui-select-filter .filtro-action`; `.pintura-card-menu` |
| 9999px | 50px | 1 | `.input-group input[type="file"]::file-selector-button` |
| 999px | 50px | 2 | `.pedido-edit-image > span`; `.pintura-column > header span` |

#### `font-size`

| antes | depois | n | onde |
|---|---|---|---|
| 10.08px | 10px | 1 | `.pintura-column > header span` |
| 10.4px | 10px | 2 | `.pintura-card-menu > div button`; `.week-day` |
| 10.88px | 11px | 5 | `.pedido-edit-image > span`; `.pintura-updated`; `.pintura-card-menu > span`; `.pintura-card-color strong` (+1) |
| 11.2px | 11px | 1 | `.event-card-action` |
| 11.52px | 11px | 4 | `.pedido-edit-image button`; `.pintura-card-menu > button, .pintura-card-menu > div button`; `.pintura-reference-panel span, .pintura-reference-panel small`; `.event-card-time, .event-card-participants` |
| 12.16px | 12px | 4 | `.pedido-edit-file > div span`; `.pintura-filter-static`; `.pintura-toolbar .ui-select-filter .filtro-action`; `.pintura-card-ref` |
| 12.48px | 12px | 7 | `.pedido-arquivo-3d span`; `.pedido-edit-section-title span`; `.pintura-search input`; `.pintura-column > header h2` (+3) |
| 12.8px | 12px | 4 | `.event-card-title`; `.next-event-title`; `.next-event-date`; `.detalhe-id` |
| 13.12px | 13px | 3 | `.pedido-download-error`; `.pedido-edit-btn, .pedido-upload-btn, .pedido-remove-btn`; `.pedido-removal-notice` |
| 13.6px | 13px | 5 | `.pintura-reference-panel strong`; `.day-number`; `.panel-empty`; `.btn.mini` (+1) |
| 14.4px | 14px | 5 | `.pedido-detalhe-info strong`; `.pedido-detalhe-section p`; `.mistura-linha-prop input`; `.status-button-ghost` (+1) |
| 15.2px | 15px | 4 | `.pedido-detalhe-section h3`; `.pedido-edit-section-title h3`; `.status-description`; `.status-button` |
| 16.8px | 16px | 3 | `.mistura-card-head h2`; `.mistura-total-valor`; `.orcamento-preview-final` |
| 17.6px | 18px | 1 | `.evento-modal-titulo` |
| 20.8px | 20px | 1 | `.evento-modal-titulo` |
| 8.32px | 8px | 1 | `.pintura-date-tag, .pintura-priority` |
| 8.8px | 8px | 1 | `.pintura-card-footer > div:first-child span` |
| 9.28px | 10px | 1 | `.pintura-card-color small` |
| 9.6px | 10px | 2 | `.day-badge`; `.event-chip` |
| 9.76px | 10px | 1 | `.pintura-card-footer > div:first-child strong` |

#### `gap`

| antes | depois | n | onde |
|---|---|---|---|
| 1.6px | 2px | 1 | `.pintura-reference-panel > div:first-child` |
| 1.92px | 2px | 2 | `.pintura-card-color > div`; `.pintura-card-footer > div:first-child` |
| 10.4px | 10px | 2 | `.pintura-toolbar`; `.pintura-card-color` |
| 11.2px | 12px | 1 | `.pintura-board` |
| 12.8px | 12px | 1 | `.month-navigator` |
| 14.4px | 14px | 1 | `.pintura-modal-grid` |
| 2.4px | 2px | 1 | `.pedido-edit-file > div` |
| 3.2px | 4px | 3 | `.pintura-card-menu`; `.pintura-date-tag, .pintura-priority`; `.events-preview` |
| 3px | 4px | 1 | `.cor-meta-item` |
| 4.8px | 4px | 2 | `.pedido-edit-image button`; `.event-card-action` |
| 5.6px | 6px | 2 | `.event-card-time, .event-card-participants`; `.detalhe-item` |
| 5px | 6px | 1 | `.input-group` |
| 6.4px | 6px | 6 | `.pedido-edit-btn, .pedido-upload-btn, .pedido-remove-btn`; `.pintura-card-footer`; `.cor-presets`; `.mistura-btn-add, .mistura-btn-limpar` (+2) |
| 7.2px | 8px | 3 | `.pedido-download-btn`; `.pintura-filter-static`; `.pintura-card-menu > button, .pintura-card-menu > div button` |
| 8.8px | 8px | 1 | `.pintura-column-body` |
| 9.6px | 10px | 3 | `.calendar-card-header, .panel-header`; `.event-card`; `.next-event-row` |

#### `line-height`

| antes | depois | n | onde |
|---|---|---|---|
| 1.55 | 1.6 | 1 | `.pedido-detalhe-section p` |

#### `margin`

| antes | depois | n | onde |
|---|---|---|---|
| 0 0 3.2px | 0 0 4px | 1 | `.pedido-edit-section-title h3` |
| 0 0 5.6px | 0 0 6px | 1 | `.panel-label` |
| 0 0 9.6px | 0 0 10px | 1 | `.panel-section h4` |
| 6.4px 0 0 | 6px 0 0 | 1 | `.event-card-time, .event-card-participants` |

#### `margin-bottom`

| antes | depois | n | onde |
|---|---|---|---|
| 10.4px | 10px | 2 | `.pintura-card-head`; `.pintura-reference-panel > div:first-child` |
| 12.8px | 12px | 1 | `.panel-accent-header` |
| 13.6px | 14px | 1 | `.pintura-card-color` |
| 14.4px | 14px | 1 | `.calendar-card-header, .panel-header` |
| 3.2px | 4px | 1 | `.pintura-modal-kicker` |
| 9.6px | 10px | 1 | `.week-days` |

#### `margin-top`

| antes | depois | n | onde |
|---|---|---|---|
| 14.4px | 14px | 1 | `.pintura-color-summary` |
| 6.4px | 6px | 1 | `.events-preview` |

#### `padding`

| antes | depois | n | onde |
|---|---|---|---|
| 0 14.4px | 0 14px | 2 | `.pintura-filter-static`; `.pintura-column > header` |
| 0 5.6px | 0 6px | 1 | `.pintura-column > header span` |
| 1.6px 6.4px | 2px 6px | 1 | `.day-badge` |
| 10.4px 16px | 10px 16px | 1 | `.btn.mini` |
| 11.2px | 12px | 1 | `.pintura-color-summary` |
| 11.52px 40px 11.52px 14.4px | 12px 40px 12px 14px | 1 | `.pintura-search input` |
| 12.48px | 12px | 1 | `.pintura-card` |
| 12.8px 16px | 12px 16px | 2 | `.status-button`; `.status-button-ghost` |
| 13.6px | 14px | 1 | `.pintura-reference-panel` |
| 2.4px 6.4px | 2px 6px | 1 | `.event-chip` |
| 2.88px | 2px | 1 | `.pintura-view-toggle` |
| 3px 8px | 4px 8px | 3 | `.cor-swatch-acabamento`; `.cor-estoque-baixo`; `.cor-chip-acabamento` |
| 4px 5.44px | 4px 6px | 1 | `.pintura-date-tag, .pintura-priority` |
| 4px 7.2px | 4px 8px | 1 | `.pedido-edit-image > span` |
| 5.6px | 6px | 2 | `.pintura-column-body`; `.pintura-card-menu` |
| 5.6px 6.4px | 6px 6px | 1 | `.pintura-card-menu > span` |
| 5.6px 9.6px | 6px 10px | 1 | `.event-card-action` |
| 6.4px 0 | 6px 0 | 1 | `.week-day` |
| 6.4px 12px | 6px 12px | 1 | `.participant-chip` |
| 6.4px 8.8px | 6px 8px | 1 | `.pedido-edit-image button` |
| 7px 14px | 8px 14px | 1 | `.btn-acao-pequeno` |
| 7px 8px | 8px 8px | 1 | `.cores-limpar` |
| 8.8px 0 | 8px 0 | 1 | `.sidebar-icon-btn` |
| 8.8px 11.2px | 8px 12px | 1 | `.pedido-remove-btn` |
| 8.8px 12.8px | 8px 12px | 1 | `.pedido-edit-btn` |
| 8.8px 12px | 8px 12px | 1 | `.next-event-row` |
| 8px 8.8px | 8px 8px | 1 | `.pintura-card-menu > button, .pintura-card-menu > div button` |
| 9.6px 12px | 10px 12px | 1 | `.event-card` |

#### `transition`

| antes | depois | n | onde |
|---|---|---|---|
| background 250ms ease | background 200ms ease | 1 | `.mistura-preview-swatch` |
| transform 120ms ease, box-shadow 120ms ease | transform 150ms ease, box-shadow 150ms ease | 1 | `.cor-preset` |
| transform 350ms cubic-bezier(.34, 1.56, .64, 1) | transform 300ms cubic-bezier(.34, 1.56, .64, 1) | 1 | `.sidebar-logo` |
| transform 450ms ease, background 300ms ease | transform 400ms ease, background 300ms ease | 1 | `.step-line-fill` |

## Quanto foi substituído

| dimensão | literais trocados por token |
|---|---|
| Tipografia — `font-size` | 173 |
| Tipografia — `font-weight` | 105 |
| Tipografia — `line-height` | 8 |
| Espaçamento (`padding`/`margin`/`gap`/`inset`, por valor atômico) | 496 |
| Raios | 24 |
| Z-index | 17 |
| Durações de `transition`/`animation` | 108 |
| Easings | 108 |
| Escalonamento de lista (`animation-delay`) | 2 |
| **Total** | **1041** |

Breakpoints não entram na conta (não são substituíveis por `var()`): 4 foram normalizados e 5
mantidos com justificativa.

Verificação de que nada se perdeu: o CSS compilado antes e depois tem **exatamente o mesmo número
de declarações** em cada uma dessas propriedades (`font-size` 204, `font-weight` 122,
`line-height` 22, `border-radius` 158, `z-index` 22, `transition` 62, `animation` 13,
`padding` 181, `margin` 60, `gap` 184, `margin-bottom` 43, `margin-top` 37, `padding-top` 5), e a
única diferença de valor computado são os 155 snaps listados acima.

## Estilos inline em TSX (não convertidos)

Restam ~65 atributos `style={{…}}` nos componentes. A maioria é layout pontual (`flex: 1`,
`textAlign`, `gridTemplateColumns`) ou dado de domínio (`background: cor.hex`), que não pertence
a uma escala. O único grupo com valores visuais literais é o bloco de emoji de status das telas
de confirmação de e-mail — `fontSize: "2rem"` / `"2.5rem"` com `marginBottom: "1rem"` em
`ConfirmEmailPage.tsx`, `ConfirmEmailMudancaPage.tsx` e `Register.tsx`. A conversão pede uma
classe compartilhada (ex.: `.status-emoji`) e mexe em três arquivos de página, dois deles com
erros de lint pré-existentes; ficou fora desta fase para não misturar escopo.
