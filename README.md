# Synapse Forge · Front-end

Interface do **Synapse Forge**, sistema de gestão para oficinas de impressão 3D e pintura:
pedidos e etapas de produção, orçamentos, ordens de pintura, paleta e misturas de cores,
estoque de insumos, agenda, equipes e notificações. Back-end em
[victor-eidt/synapse-forge-back-end](https://github.com/victor-eidt/synapse-forge-back-end).

## Stack

React 19 · Vite · TypeScript · Tailwind 4 (configuração CSS-first, sem `tailwind.config.js`) ·
react-i18next (pt-BR e en-US) · Hugeicons.

## Rodar localmente

Requer Node 22 e o back-end rodando (por padrão em `http://localhost:8081`).

```bash
npm ci
npm run dev        # http://localhost:5173
```

O back só aceita CORS das origens em `APP_CORS_ALLOWED_ORIGINS` (padrão: `localhost:5173` e
`127.0.0.1:5173`).

## Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8081` | Endereço do back-end. Entra no build: defina antes do `npm run build`. |

Para mudar localmente, copie `.env.example` para `.env.local` (ignorado pelo git).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |

A CI (`.github/workflows/ci.yml`) roda `npm ci`, lint, typecheck e build em todo PR.

## Organização

- `src/pages`, `src/components`: telas e componentes (`components/ui` são os primitivos).
- `src/services`: chamadas à API; o endereço vem de `src/config/api.ts`.
- `src/hooks`, `src/contexts`: tema (`sf-theme`), autenticação e utilidades de interação.
- `src/locales`: traduções por namespace.
- `src/index.css`: tokens de cor (`--color-*`, claro em `:root`, escuro em `.dark`) e escalas.

## Documentação

- [`docs/git-flow.md`](docs/git-flow.md): branches (`main`, `dev`, `feature/SYN-xx-...`), PRs e CI.
- [`docs/design-tokens.md`](docs/design-tokens.md) e [`docs/inventario-estilos.md`](docs/inventario-estilos.md): cores, tipografia e espaçamentos.
- [`docs/papeis.md`](docs/papeis.md): o que cada papel (CLIENTE, TECNICO, GERENTE, ADMIN) vê e faz.
