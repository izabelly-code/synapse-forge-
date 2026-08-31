# SYN-81 — Camada de interação

Porte das 8 mecânicas de interação do [interior.dev](https://www.interior.dev/docs/) para o
design system do SynapseForge.

## Decisão: portar a mecânica, não copiar o componente

Os componentes originais são copy-paste em React + Tailwind + `motion`, com paleta própria
(`stone-*`, `emerald-*`, `#4568FF` fixo). Copiá-los traria um segundo sistema de cor para dentro
do app e uma dependência de animação de ~35 KB gzip. Como o valor deles está na **mecânica** — e
não na folha de estilo — cada um foi reescrito com os tokens semânticos de `src/index.css`, em
CSS puro. **Nenhuma dependência nova.**

Consequência prática: tema claro/escuro e `prefers-reduced-motion` passam a valer para as oito
mecânicas de graça, porque tudo sai dos mesmos tokens do resto do app.

O único ponto que CSS sozinho não resolve é a reordenação de lista (não há como transicionar a
mudança de posição de um elemento no fluxo). Aí entra `useFlipList`, ~60 linhas usando a Web
Animations API — a mesma técnica FLIP que a `motion` usa por baixo.

## O que foi criado

| Arquivo | Papel |
|---|---|
| `hooks/useSkeletonSwap.ts` | Janelas de `delay` e `minVisible` do skeleton |
| `hooks/useFocusTrap.ts` | Foco preso no painel + devolução ao gatilho |
| `hooks/useMenuHighlight.ts` | Mede o item sob o cursor/foco e publica em custom properties |
| `hooks/useFlipList.ts` | FLIP dos itens de uma lista/grade |
| `hooks/useValueFlash.ts` | Detecta mudança de número, direção e janela de destaque |
| `utils/motion.ts` | `prefersReducedMotion()` para as animações imperativas |
| `ui/SkeletonSwap.tsx` | Crossfade skeleton → conteúdo na mesma célula de grid |
| `ui/LoadingButton.tsx` | Faces empilhadas: rótulo vira spinner sem mudar a largura |
| `ui/FieldMessage.tsx` | Slot de mensagem de altura reservada (dica ⇄ erro) |
| `ui/FieldStatus.tsx` | Tique / alerta dentro do campo, à direita |
| `ui/MenuSurface.tsx` | Painel de menu com o realce viajante |
| `ui/ValueFlash.tsx` | Destaque do número que acabou de mudar |
| `index.css` | Seção "CAMADA DE INTERAÇÃO (SYN-81)" no fim do arquivo + utilitário `.sr-only` |

## Onde foi aplicado

| Mecânica | Telas |
|---|---|
| Skeleton Swap | PedidosDashboard, MateriaisDashboard, PaletaCores, OrcamentoHistorico |
| Loading Button | Login, Register, PasswordRecovery, NovoPedidoModal, MaterialModal, NovaCorModal |
| Inline Validation | Login, Register, PasswordRecovery (continuação da SYN-73): mensagem em slot reservado + marca de status dentro do campo |
| Modal (focus trap) | NovoPedidoModal, PedidoDetalheModal, MaterialModal, NovaCorModal, EventoModal |
| Dropdown (realce viajante) | dropup de idioma da Sidebar, kebabs de PedidoRow/CorCard, dropdowns de filtro de Pedidos e Cores |
| Sortable Table | lista de Pedidos, histórico de Orçamentos |
| Filter Grid | Pedidos (lista e grade) e Cores (lista e grade) |
| Value Flash | stat cards do dashboard de Pedidos, nível de estoque nos cards/linhas de Cores |

## Notas de implementação

- **O escalonamento de entrada é congelado na montagem** (`--row-index` vem de um
  `useState(index)` em PedidoRow/CorCard). A animação de entrada é uma animação CSS com
  `fill: forwards` cujo `animation-delay` depende de `--row-index`; mudar um `animation-delay`
  recoloca a animação já terminada na fase ativa, ou seja, ela **roda de novo**. Reordenar
  mudava o índice de todo mundo e cada linha "sentava" uma segunda vez logo depois de o FLIP
  deixá-la no lugar. Escalonar só faz sentido na entrada mesmo, então o índice não precisa
  acompanhar a ordem.
- **`useFlipList` leva ao fim (`finish()`) qualquer animação pendente no item antes de movê-lo**,
  para nada disputar o `transform` no meio do trajeto (pulando animações infinitas, que fazem
  `finish()` lançar).
- **`--ease-settle`** (`cubic-bezier(0.32, 0.72, 0, 1)`) é a curva de assentamento da camada:
  o `--ease-out-expo` cobre quase toda a distância no começo e arrasta os últimos pixels por
  centenas de milissegundos, o que também é lido como um segundo assentamento.
- **A marca de status usa a propriedade `scale`**, não `transform`, para o crossfade não brigar
  com nenhum posicionamento por transform.
- **`.input-wrapper input` passou a usar `--color-border-strong`**, igual a `.input-group input`:
  antes só o campo de senha vivia no wrapper e a borda mais fraca passava batida; com a marca de
  validação, mais campos entram ali.
- **`data-flip-id`** é obrigatório em cada item animável; `useFlipList` recebe uma string de
  ordem (ids concatenados) e remede a cada mudança. O container troca de identidade ao alternar
  lista/grade (`key={view}`), e o hook detecta isso para não animar itens vindos de outro layout.
- **Value Flash em stat card usa `tone="neutral"`**: nos contadores do dashboard "subir" não é
  necessariamente bom (pedidos atrasados), então o destaque só marca *que* mudou. O nível de
  estoque das cores usa `tone="direction"`, onde cair de fato significa consumo.
- **O ValueFlash dos stat cards só monta quando os dados chegam.** Durante o carregamento os
  contadores valem 0; montando depois, a tela não pisca inteira só por ter terminado de carregar.
- **`useFocusTrap` lê o elemento que abriu o modal na primeira renderização**, não dentro do
  efeito: um `autoFocus` no primeiro campo já move o foco para dentro do painel durante o commit,
  e ler `document.activeElement` no efeito devolveria o foco para lugar nenhum ao fechar.
- **O guarda de `focusin` ignora alvos dentro de outro `[role="dialog"]`**, senão o lightbox de
  imagem aberto por cima do modal de pedido teria o foco roubado de volta.
- **O realce dos menus mede cada item** (`offsetTop`/`offsetHeight`) em vez de assumir altura
  fixa de linha — é o que permite o mesmo hook servir aos kebabs, aos filtros e ao dropup de
  idioma, que têm alturas diferentes (e itens que quebram em duas linhas).
- **Cascata:** a seção nova fica no fim do `index.css`, depois das regras base, para que
  `.loading-button` sobre `.button` e `[data-highlight] > .filtro-option:hover` sobre
  `.filtro-option:hover` vençam sem `!important`.

## Fora de escopo

- O histórico de Orçamentos ainda **não tem controle de ordenação** na interface; o FLIP está
  ligado e passa a valer assim que existir um (ou quando a lista mudar por outro motivo).
- Itens que *saem* de um filtro somem sem animação de saída: manter o item montado durante a
  saída exigiria um `AnimatePresence` próprio. Os que entram continuam usando a animação de
  entrada de `.pedido-row` / `.cor-card`.
- Os demais componentes do interior.dev (Progress Bar, Load More, Streaming Text, Task Steps,
  Toast, gestos) não foram portados.
