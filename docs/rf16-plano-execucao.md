# RF16 — Plano de Execução Autônoma

> Especificação completa das fases do RF16 "Personalizar Interface" para execução autônoma via `/goal`.
> Trabalhar em fases, na ordem, verificando cada uma antes de avançar. Decisões tomadas com bom senso devem ser registradas no relatório final (`docs/rf16-relatorio-sessao.md`), sem parar para perguntar. Parar apenas se atingir uma CONDIÇÃO DE PARADA (lista no final).

## Contexto

- Projeto: SynapseForge, sistema de gestão de produção 3D. Frontend React 19 + Vite + TypeScript + Tailwind 4, na pasta `synapse-forge-front-end/` (o repositório remoto chama-se `synapse-forge-`).
- RF16 = tema claro/escuro com tokens, i18n PT/EN, preferências persistidas por usuário.
- Já feito: `docs/inventario-estilos.md` (relatório de estilos), Epic **SYN-48** e issues **SYN-49 a SYN-53** criadas no Jira (projeto **SYN**, site synapseforge.atlassian.net, via MCP Atlassian), e a branch `feature/SYN-50-tokens-dark-mode` criada localmente.

### Mapa de issues (códigos reais do Jira)

| Issue | Título | Fase |
|---|---|---|
| SYN-48 | Epic: TCC 2 - Sprint 2 - Personalizar Interface | — |
| SYN-49 | RF16: Inventário de estilos e tokens | Fase 0 (já concluída no código) |
| SYN-50 | RF16: Tokens de design + dark/light mode | Fase 1 |
| SYN-51 | RF16: Migrar telas restantes para tokens | Fase 2 |
| SYN-52 | RF16: Fundação de i18n (spike) | Fase 3 |
| SYN-53 | RF16: Mapa do novo menu (5 áreas) | Fora deste plano (validação com professores) |

Padrão de branch: `feature/SYN-xx-descricao-curta`. Padrão de commit: `SYN-xx: descrição`.

---

## FASE 0 — Detecção de estado (não pule)

1. `git status` + `git branch`: descubra em que branch estamos e se o working tree está limpo. Se houver mudanças não commitadas que não são suas, faça stash e anote no relatório. (Estado conhecido: um stash `WIP pedidos (guardado antes de iniciar RF16/SYN-50)` já existe com alterações de pedidos de terceiros — não aplicar nem descartar.)
2. Via MCP Atlassian: liste as issues do projeto **SYN** com "RF16" no título. Anote os códigos. Se as issues NÃO existirem, crie-as: "RF16: Inventário de estilos e tokens" / "RF16: Tokens de design + dark/light mode" / "RF16: Migrar telas restantes para tokens" / "RF16: Fundação de i18n (spike)" / "RF16: Mapa do novo menu (5 áreas)" — tipo **Tarefa** (o projeto não tem "Task"/"Story"), atribuídas a Victor, vinculadas ao Epic SYN-48. (Estado conhecido: SYN-49 a SYN-53 já foram criadas.)
3. Se a branch `feature/SYN-50-tokens-dark-mode` não existir, crie-a a partir da main atualizada. (Estado conhecido: já existe localmente.)
4. Leia `docs/inventario-estilos.md` inteiro. Ele é a fonte de verdade sobre as cores atuais.
5. Marque **SYN-49** como concluída no Jira (transição para Done/Feito) com comentário linkando o arquivo do relatório.

## FASE 1 — Tokens + dark/light mode (branch `feature/SYN-50-tokens-dark-mode`)

1. Crie tokens semânticos como CSS variables no `src/index.css` (padrão Tailwind 4, `@theme`/`:root`): `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-primary` (laranja da marca), `--color-success`, `--color-warning`, `--color-error`. Tema claro em `:root`, tema escuro em `.dark` no `<html>`.
   **REGRA DE DECISÃO para inconsistências do inventário:** onde houver variações da mesma cor funcional, padronize na cor mais usada; para o laranja primário, use o valor do design system (`synapse-forge-tokens-v2.json` na raiz do umbrella, **se existir** — o inventário já constatou que esse arquivo NÃO existe; nesse caso use o `--primary: #FB4A14` atual do `:root`) e registre a escolha no relatório.
2. ThemeContext + hook `useTheme`: estado light/dark, toggle, persistência em `localStorage`, padrão inicial via `prefers-color-scheme`, classe `.dark` aplicada em `document.documentElement`.
3. Botão de alternância (sol/lua) no layout logado (Sidebar).
4. Migre para tokens: Sidebar/DashboardLayout, DashboardPage/PedidosDashboard e LoginPage.
5. **VALIDAÇÃO:** `npm run build` tem que passar; se houver testes/lint, rode. Commits pequenos no formato `SYN-50: descrição`. Ao final da fase, comente na issue **SYN-50** o que foi feito e transicione para Done (ou "Em revisão", se o board tiver essa coluna).

## FASE 2 — Migração das telas restantes (nova branch `feature/SYN-51-migracao-tokens`, a partir da branch da Fase 1)

Migre por grupos, 1 commit por grupo (`SYN-51: descrição`), visual do tema claro deve permanecer idêntico:

- a) Pedidos: PedidoRow, NovoPedidoModal, PedidoDetalheModal, PedidoCard
- b) Cores/Pintura: PaletaCores, CalculadoraMistura, NovaCorModal, CorCard, OrdensPinturaKanban
- c) Agenda: Calendar.tsx + Calendar.css + EventoModal (converter cores fixas dos .css para `var(--color-*)`)
- d) Auth/Perfil: Login, Register, PasswordRecovery, UserProfilePage, telas de confirmação de e-mail
- e) Materiais/Orçamento: MateriaisDashboard, MaterialModal, OrcamentoCalculator, OrcamentoHistorico

Regra: nenhum hex ou classe de cor fixa (ex.: `bg-zinc-900`) pode sobrar nesses arquivos. Cores de domínio (hex de tintas cadastradas pelo usuário, ex. swatches) não contam — são dados, não estilo. A landing (Hero/Footer) fica **FORA do escopo** — não mexa nela. `npm run build` após cada grupo. Jira: comentar e transicionar **SYN-51** ao final.

## FASE 3 — Spike de i18n (nova branch `feature/SYN-52-i18n-spike`, a partir da Fase 2)

1. Instale `react-i18next` + `i18next`; configure `src/i18n.ts` com pt-BR (padrão) e en-US, persistência da escolha em `localStorage`.
2. Estrutura: `src/locales/pt-BR/common.json` e `src/locales/en-US/common.json`.
3. Traduza a LoginPage completa (textos, placeholders, mensagens de validação) + seletor PT|EN na própria tela.
4. Crie `src/utils/format.ts` com `formatDate` e `formatCurrency` usando `Intl` (sem biblioteca adicional).
5. Estime o total de strings visíveis do app (grep) e registre no relatório. `npm run build`. Commits `SYN-52: descrição`. Jira: comentar e transicionar **SYN-52**.

## FASE 4 — Encerramento

1. Faça push de TODAS as branches criadas (`git push -u origin <branch>`). **NUNCA faça push na main, nunca use force push, não faça merge** — os PRs quem abre é o Victor.
2. Escreva `docs/rf16-relatorio-sessao.md` com: o que foi feito em cada fase, decisões tomadas (cores padronizadas, trade-offs), pendências, e um checklist de como o Victor deve validar visualmente (quais telas abrir, o que alternar).
3. Comente na issue **SYN-50** ("RF16: Tokens de design + dark/light mode") um resumo geral com os nomes das branches.

---

## CONDIÇÕES DE PARADA (pare e deixe explicado no `docs/rf16-relatorio-sessao.md`)

- **MCP Atlassian indisponível ou sem permissão** → continue o trabalho de código normalmente e liste as ações de Jira pendentes no relatório; NÃO pare o código por causa do Jira.
- **Build quebrado que não se consegue consertar em 3 tentativas** → reverta o último commit problemático, deixe o restante funcionando e registre.
- **Conflito de git ou estado de repositório que exija decisão destrutiva** (`reset --hard`, rebase de main, deletar branch de outra pessoa) → não execute, registre e pare a fase afetada.
- **Qualquer coisa que exigiria tocar no repositório do backend** → fora de escopo, não toque.

## Restrições permanentes (valem em todas as fases)

- Nunca fazer push na `main`.
- Nunca usar force push.
- Nunca fazer merge — PRs são abertos pelo Victor.
- Não tocar no repositório do backend (`synapse-forge-back-end/`).
- Não mexer na landing (Hero/Footer) nem aplicar/descartar o stash de pedidos de terceiros.
