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
| `VITE_API_URL` | `http://localhost:8081` | Endereço do back-end. Entra no build: defina antes do `npm run build`. Na Vercel vem das variáveis do projeto (ver [Deploy](#deploy)). |

Para mudar localmente, copie `.env.example` para `.env.local` (ignorado pelo git).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |

A CI (`.github/workflows/ci.yml`) roda `npm ci`, lint, typecheck e build em todo PR e, quando
passa, publica na Vercel (ver [Deploy](#deploy)).

## Deploy

O front é publicado na **Vercel** pelo **GitHub Actions** (SYN-88), com a CLI da Vercel. O projeto
fica na conta da Vercel do Victor; o repositório não usa a integração Git da Vercel (o repo é de
conta pessoal, e só a dona poderia instalar o app), por isso o `vercel.json` desliga os deploys
automáticos por Git (`git.deploymentEnabled: false`) e quem publica é o workflow.

### Ambientes

| Gatilho | Ambiente da Vercel | Endereço | `VITE_API_URL` |
|---|---|---|---|
| PR para `dev` ou `main` | Preview | URL única do deploy (no resumo do job) | API de homologação |
| push na `dev` | Preview (variáveis da branch `dev`) | `synapse-forge-homolog.vercel.app` (alias) | API de homologação |
| push na `main` | Production | `synapse-forge-one.vercel.app` | API de produção |

O pipeline fica no job `deploy · vercel` do `ci.yml`, que só roda depois do `lint · typecheck · build`
passar no mesmo commit:

1. `vercel pull --yes --environment=preview|production` baixa as configurações do projeto e as
   variáveis do ambiente (na `dev`, com `--git-branch=dev`, para valerem as variáveis de Preview
   específicas da branch, se existirem);
2. `vercel build` (ou `vercel build --prod`) gera o build com essas variáveis;
3. `vercel deploy --prebuilt` (ou `--prod`) publica e devolve a URL;
4. na `dev`, `vercel alias set <url> synapse-forge-homolog.vercel.app` mantém o endereço fixo da
   homologação apontando para o último deploy.

Sem o segredo `VERCEL_TOKEN` (PR vindo de fork ou segredos ainda não cadastrados), o job mostra um
aviso e termina verde, sem publicar.

Atenção: enquanto o projeto não tem nenhum deploy de produção, a Vercel promove o primeiro deploy que
chegar, mesmo sem `--prod`. No primeiro uso, publique a `main` antes da `dev` (ou rode de novo o
workflow da `main` depois), senão o domínio de produção fica com o build da homologação.

### Variáveis na Vercel

`VITE_API_URL` entra no build (o Vite embute o valor no JavaScript), então vem das variáveis do
projeto na Vercel, baixadas pelo `vercel pull`. Em *Project → Settings → Environment Variables*:

| Variável | Production | Preview |
|---|---|---|
| `VITE_API_URL` | `https://synapse-forge-api-1dfp.onrender.com` (API de produção) | `https://synapse-forge-api-homolog.onrender.com` (API de homologação) |

Os endereços exatos são os que o Render mostrar para cada serviço (o de produção ganhou o sufixo `-1dfp`
porque `synapse-forge-api` já existia). Mudou a variável, é preciso um
novo deploy para valer (re-executar o workflow ou um novo push).

### Segredos do GitHub (a dona do repo cadastra uma vez)

Em *Settings → Secrets and variables → Actions → New repository secret* (segredos comuns do
repositório, sem GitHub Environments):

| Segredo | Onde achar |
|---|---|
| `VERCEL_TOKEN` | Vercel → *Account Settings → Tokens → Create* (escopo: a conta onde está o projeto) |
| `VERCEL_ORG_ID` | campo `orgId` de `.vercel/project.json`, criado por `vercel link` na pasta do front |
| `VERCEL_PROJECT_ID` | campo `projectId` do mesmo arquivo |

Opcional: a variável de repositório `VERCEL_HOMOLOG_ALIAS` (*Variables*, não *Secrets*) troca o
endereço da homologação; o padrão é `synapse-forge-homolog.vercel.app`.

### Configuração única

1. **Victor (conta da Vercel):** criar o projeto e ligar a pasta local a ele:
   ```bash
   npx vercel login
   npx vercel link      # cria .vercel/project.json (ignorado pelo git) com orgId e projectId
   ```
   Quando perguntar se quer conectar o repositório Git, responder que não.
2. **Victor:** cadastrar `VITE_API_URL` em Production e em Preview (tabela acima) e criar o token.
3. **Victor:** em *Settings → Deployment Protection*, desligar a *Vercel Authentication* (senão
   previews e homologação pedem login na Vercel para abrir).
4. **Izabelly (dona do repo):** cadastrar os 3 segredos (`VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID`).
5. **Back-end:** incluir os domínios da Vercel em `APP_CORS_ALLOWED_ORIGINS` de cada API, senão o
   navegador bloqueia as chamadas:
   - homologação: `https://synapse-forge-homolog.vercel.app` e os previews
     (`https://synapse-forge-*.vercel.app`);
   - produção: só o domínio de produção (`https://synapse-forge-one.vercel.app`).

   O `CorsConfig` do back usa `setAllowedOriginPatterns`, então o `*` no meio do domínio funciona.
   O `APP_URL` de cada API (links dos e-mails) aponta para o front do mesmo ambiente.

A configuração de rotas fica no [`vercel.json`](vercel.json): toda rota que não é arquivo vai para o
`index.html` (o React Router resolve no navegador, então recarregar `/pedidos` não dá 404), e os
arquivos de `/assets` (com hash no nome) ficam em cache por um ano.

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
