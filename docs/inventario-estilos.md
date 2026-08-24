# Inventário de Estilos — SynapseForge Front-end

> Levantamento preparatório para o **RF16 "Personalizar Interface"** (tema claro/escuro, i18n PT/EN, preferências salvas).
> Data: 2026-08-16 · Escopo: `synapse-forge-front-end/`
> **Nenhum arquivo de código foi alterado.** Este documento é somente leitura/diagnóstico.

---

## 0. Avisos sobre premissas do pedido

Dois itens solicitados **não existem no disco**:

| Arquivo pedido | Situação |
|---|---|
| `synapse-forge-tokens-v2.json` | **Não encontrado.** Busca em `/Users/victor` (profundidade 6, excluindo `node_modules` e `~/Library`) não retornou nenhum arquivo com `synapse` + `tokens` no nome. |
| `figma/design-system-board.html` | **Não encontrado.** Não existe pasta `figma/` nem arquivo `design-system-board.*` em nenhum lugar da máquina. |

A raiz do repo-guarda-chuva (`/Users/victor/GitHub/synapse-forge/`) contém apenas:

```
SYNAPSE-FORGE-SETUP.md
start.command
synapse-forge-back-end/
synapse-forge-front-end/
```

Também **não há pasta `docs/`** em lugar nenhum do projeto — este arquivo cria a primeira.
Consequência: a comparação "design system declarado × código aplicado" foi feita contra a **única fonte de verdade que existe**, o bloco `:root` de `src/index.css` (seção 2 abaixo). Se o JSON de tokens e o board do Figma existirem em outro lugar (Drive, Figma na nuvem, outra máquina), me passe e eu refaço o diff.

Outro ponto: a pasta é `synapse-forge-front-end/`, não `synapse-forge-/`.

---

## 1. Resumo executivo

O projeto usa **Tailwind v4** (`@tailwindcss/vite`, sem `tailwind.config.js` — modo CSS-first), mas na prática **quase não usa classes utilitárias de cor**. Toda a cor vive em CSS escrito à mão.

Existe uma camada de tokens razoável em `:root` (27 variáveis), e a parte "app" do produto a consome bem. O problema está concentrado em **três focos**:

1. **Landing page (`Hero.css` + `Footer.css`)** — 120 ocorrências de cor hardcoded, **zero** `var(--…)`. É uma segunda paleta completa, com outra família de cinzas e outro laranja.
2. **Ordens de Pintura (`.pintura-*` em `index.css`)** — 28 ocorrências hardcoded, incluindo uma escada inteira de 12 cinzas sem nome.
3. **Escalas de estado (`tone-*`, `prioridade-*`)** — reinventam erro/sucesso/aviso com valores diferentes dos tokens.

### Números

| Métrica | Valor |
|---|---|
| Ocorrências de cor hardcoded (hex + rgb/rgba) | **242** |
| Valores hex distintos | **73** |
| Valores rgba distintos | **76** |
| Tokens `--*` definidos em `:root` | **27** (23 de cor, 4 de sombra/raio) |
| Chamadas `var(--…)` no código | **615** |
| Classes Tailwind de cor hardcoded | **2** (mesma classe, 2 linhas) |
| Cores inline em `style={{}}` que precisam de token | **0** |
| Suporte a tema escuro hoje | **Nenhum** — zero ocorrências de `prefers-color-scheme`, `color-scheme`, `[data-theme]` ou `.dark` |

### Cobertura de tokens por arquivo

| Arquivo | Hardcoded | `var(--…)` | Cobertura | Veredito |
|---|---:|---:|---:|---|
| `src/index.css` (4432 ln) | 113 | 508 | 82% | Bom, com bolsões ruins |
| `src/pages/Calendar.css` (354 ln) | 3 | 53 | 95% | Quase pronto |
| `src/components/calendario/EventoModal.css` (346 ln) | 6 | 41 | 87% | Quase pronto |
| `src/components/landing/Hero.css` (883 ln) | **82** | **0** | **0%** | Migração total |
| `src/components/landing/Footer.css` (291 ln) | **38** | **0** | **0%** | Migração total |
| `src/pages/App.css` (184 ln) | 0 | 13 | — | **Arquivo morto** (ver §4.4) |

---

## 2. O que já existe de design system

Fonte única: `src/index.css:5-66`. Nomenclatura segue Material Design 3 (`surface-container-*`, `on-surface`, `on-primary`).

```css
:root {
  /* Brand */
  --primary: #FB4A14;   --primary-dark: #e04310;
  --secondary: #ae2b00; --secondary-fixed: #FFDBD1;
  --on-primary: #ffffff;
  --brand: #FB4A14;     --brand-dark: #e04310;   /* aliases duplicados */

  /* Surfaces */
  --background: #ffffff;              --surface: #ffffff;
  --surface-container-lowest: #f8f8fa; --surface-container-low: #f2f2f6;
  --surface-container: #ebebf0;        --surface-container-high: #e4e4ea;

  /* Text */
  --on-background: #1F1A1E; --on-surface: #1F1A1E;
  --on-surface-variant: #434656;

  /* Border */
  --outline-variant: rgba(67, 70, 86, 0.15);

  /* Status */
  --error-color: #B3261E;   --error-container: rgba(179, 38, 30, 0.08);
  --success-color: #1a7f3c; --success-container: rgba(26, 127, 60, 0.08);

  /* Elevation / shape */
  --shadow-sm / --shadow / --shadow-md / --shadow-card / --shadow-ambient
  --radius: 0.75rem;
}
```

### Frequência de uso (615 chamadas)

| Token | Usos | | Token | Usos |
|---|---:|---|---|---:|
| `--radius` | 103 | | `--secondary` | 12 |
| `--on-surface-variant` | 90 | | `--success-color` | 11 |
| `--outline-variant` | 74 | | `--on-primary` | 9 |
| `--on-surface` | 45 | | `--shadow-sm` | 7 |
| `--primary` | 44 | | `--brand` | 7 |
| `--surface` | 39 | | `--shadow-md` / `-card` / `-ambient` / `--shadow` | 6 cada |
| `--on-background` | 27 | | `--brand-dark` | 6 |
| `--error-color` | 25 | | `--success-container` | 4 |
| `--surface-container-low` | 22 | | `--secondary-fixed` | 3 |
| `--surface-container-lowest` | 17 | | `--primary-dark` | 2 |
| `--surface-container` | 15 | | `--background` | **1** |
| `--error-container` | 14 | | | |
| `--surface-container-high` | 13 | | | |

**Nenhum token está órfão** (todos os 27 são usados pelo menos uma vez) — bom sinal. Mas:

- `--background` é usado **uma única vez** (`body`, `index.css:81`). Todo o resto usa `--surface`. No tema escuro isso significa que trocar `--background` muda praticamente nada — é `--surface` que carrega o peso. **Ponto de atenção para o RF16.**
- `--brand`/`--brand-dark` são aliases literais de `--primary`/`--primary-dark` (mesmos valores). 13 usos passam pelo alias. São dois nomes para a mesma coisa — consolidar antes de introduzir o tema escuro, senão o dark mode precisa manter 4 variáveis sincronizadas em vez de 2.

### Lacuna: não há token de **aviso/warning**

Existe `--error-*` e `--success-*`, mas **nenhum `--warning-*`**. As telas que precisam de amarelo/âmbar inventaram o próprio (ver §5, inconsistência #3).

---

## 3. Paleta real em uso, agrupada por função

### 3.1 Fundo e superfície

| Cor | Origem | Onde |
|---|---|---|
| `#ffffff` | token `--background` / `--surface` | base do app |
| `#f8f8fa` | token `--surface-container-lowest` | cards de auth |
| `#f2f2f6` | token `--surface-container-low` | |
| `#ebebf0` | token `--surface-container` | |
| `#e4e4ea` | token `--surface-container-high` | |
| `#fff` (forma curta) | **hardcoded ×11** | `.pintura-search input`, `.pintura-card`, `.pintura-card-menu`, `.pintura-loading`, `.cor-card-kebab .kebab-btn:hover`, e 6 usos como cor de texto sobre fundo escuro |
| `#ffffff` | **hardcoded ×4** (index) + ×7 (landing) | `.left-content`, `.sf-hero-contact`, `.sf-hero-primary`, `.sf-footer-cta-primary` |
| `#fafafa` | **hardcoded** | `.pintura-column` (fundo de coluna do kanban) |
| `#fff1eb` | **hardcoded** | `.pintura-view-toggle button.active` |

**Landing (paleta separada, todas hardcoded):**
`#f6f6f6`, `#efefef`, `#f7f7f7`, `#fcfcfc`, `#f1f1f1` (Hero) · `#f2f2f2`, `#ebebeb`, `#f8f8f8` (Footer) — mais ~18 `rgba(255,255,255,·)` e `rgba(2xx,2xx,2xx,·)` em gradientes e vidros.

### 3.2 Texto

| Cor | Origem | Papel |
|---|---|---|
| `#1F1A1E` | token `--on-surface` / `--on-background` | texto primário |
| `#434656` | token `--on-surface-variant` | texto secundário |

**Escada de cinzas hardcoded no módulo Pintura (`index.css`) — 12 valores sem nome:**

| Cor | Linha | Seletor |
|---|---:|---|
| `#24252b` | 2868 | `.pintura-card-ref` |
| `#34353b` | 2988 | `.pintura-card-color strong` |
| `#44464f` | 2828 | `.tone-waiting > header` |
| `#4b4d55` | 2928 | `.pintura-card-menu > div button` |
| `#55575f` | 2946, 3023 | `.pintura-card-menu > span`, `.pintura-card-footer strong` |
| `#6b6e77` | 2823 | `.pintura-column > header span` |
| `#777a84` | 3064 | `.pintura-loading` |
| `#8a8d96` | 2752 | `.pintura-updated button` |
| `#8b8e97` | 2768, 2893 | `.pintura-view-toggle button`, `.pintura-card-menu-btn` |
| `#92949c` | 2742 | `.pintura-updated` |
| `#94969e` | 2996 | `.pintura-card-color small` |
| `#9a9ca4` | 3017 | `.pintura-card-footer span` |

**Cinzas do EventoModal — família totalmente diferente (paleta Tailwind `gray`):**

| Cor | Linha | Seletor |
|---|---:|---|
| `#1f2937` | 338 | `.user-suggestion-item strong` |
| `#6b7280` | 343 | `.user-suggestion-item small` |
| `#9ca3af` | 223 | `.detalhe-id` |

**Cinzas quentes da landing — terceira família:**
`#3a3835`, `#4e4b48`, `#6e6e6e`, `#8d8a87`, `#8f8a85`, `#9b9794`, `#b0ada9`

**Quase-pretos da landing (7 tons para o mesmo papel):**
`#111111`, `#121212`, `#161616`, `#171717`, `#181818`, `#202020`, `#232323`

> **Total: 29 tons de texto hardcoded** para o que os tokens resolvem com 2.

### 3.3 Primária / laranja

| Cor | Origem | Papel |
|---|---|---|
| `#FB4A14` | token `--primary` / `--brand` | laranja da logo, ações |
| `#e04310` | token `--primary-dark` / `--brand-dark` | hover |
| `#ae2b00` | token `--secondary` | laranja escuro / aviso reaproveitado |
| `#FFDBD1` | token `--secondary-fixed` | container claro |

**Derivados de `#FB4A14` escritos à mão como rgba — 16 ocorrências, 7 alfas distintos:**

`rgba(251, 74, 20, α)` com α ∈ {`0.08`, `0.1`, `0.12`, `0.2`, `0.35`, `0.4`} — sendo `0.12` sozinho ×8 (anel de foco de todos os inputs: `index.css:279, 407, 471, 945, 1806, 3294` + `EventoModal.css:135`).
Também `rgba(174, 43, 0, 0.12)` (derivado de `--secondary`, em `.stat-warn`).

**Laranjas fora do token:**

| Cor | Local | Papel |
|---|---|---|
| `#ef762c` | `index.css:3050` `.pintura-date-tag` | tag de data |
| `#fff3ea` | `index.css:3049` `.pintura-date-tag` | fundo da tag |
| `#fb5a21` | `Hero.css:350` `.sf-hero-card-icon` | **laranja da marca na landing** |
| `rgba(255,111,60,0.22)` | `Hero.css:297` `.sf-hero-symbol-shadow` | halo do símbolo |
| `rgba(255,106,18,0.18)` | `Hero.css:548` `.sf-showcase-visual-empty::before` | borda tracejada |

### 3.4 Estados

#### Erro / perigo — **4 vermelhos diferentes**

| Cor | Origem | Onde |
|---|---|---|
| `#B3261E` | token `--error-color` | padrão do app (25 usos) |
| `rgba(179,38,30,0.08)` | token `--error-container` | fundo |
| `rgba(179,38,30,0.15)` | **hardcoded** `Calendar.css:16` | borda de `.calendar-error` — mesmo RGB do token, alfa diferente |
| `#e64b4b` + `#ffeded` | **hardcoded** `index.css:3053` | `.prioridade-alta` |
| `#d34949` + `#fff0f0` | **hardcoded** `index.css:3054` | `.tone-rework` |
| `#b3261e` | **hardcoded** `index.css:2028` | `.pedido-download-error` — via `var(--error, #b3261e)`, **token inexistente** (ver §5 #10) |

#### Sucesso — **3 verdes diferentes**

| Cor | Origem | Onde |
|---|---|---|
| `#1a7f3c` | token `--success-color` | padrão (11 usos) |
| `rgba(26,127,60,0.08)` | token `--success-container` | fundo |
| `#3b8a4d` + `#eef9f0` | **hardcoded** `index.css:2832` | `.tone-done` |
| `#45945a` + `#eaf7ed` | **hardcoded** `index.css:3055` | `.prioridade-baixa` |

#### Aviso / atenção — **sem token, 2 âmbares divergentes**

| Cor | Origem | Onde |
|---|---|---|
| `#b87112` + `#fff6df` | **hardcoded** `index.css:2830` | `.tone-painting` |
| `#bd851e` + `#fff6dc` | **hardcoded** `index.css:3054` | `.prioridade-media` |
| `#ae2b00` (`--secondary`) | token reaproveitado | `.stat-warn` — laranja fazendo papel de aviso |

#### Informativo / neutro (kanban `tone-*`)

| Cor | Onde |
|---|---|
| `#2f69a7` + `#eef6ff` | `.tone-mixing` (azul) |
| `#8052aa` + `#f6efff` | `.tone-drying` (roxo) |
| `#44464f` + `#f3f3f5` | `.tone-waiting` (cinza) |

### 3.5 Bordas

| Cor | Origem |
|---|---|
| `rgba(67,70,86,0.15)` | token `--outline-variant` (74 usos) |
| `rgba(67,70,86,0.12)` | **hardcoded** `index.css:2845` `.pintura-card` — mesmo RGB, alfa diferente |
| `rgba(67,70,86,0.4)` | **hardcoded** `index.css:1472` `.step-label` (usado como cor de texto) |
| `rgba(0,0,0,0.08)` | **hardcoded** `index.css:2974` `.pintura-card-color > span` |
| `rgba(214,214,214, 0.6–0.95)` · `rgba(224,224,224,0.95)` · `rgba(241,241,241,0.95)` · `rgba(255,255,255,0.75)` | **hardcoded** landing (Hero/Footer) |

### 3.6 Scrim / overlay — **5 valores, 2 matizes diferentes**

| Cor | Linha | Papel |
|---|---|---|
| `rgba(31,26,30,0.4)` | `index.css:1706` `.modal-overlay` | fundo de modal |
| `rgba(31,26,30,0.4)` | `EventoModal.css:4` | mesmo papel, **duplicado** |
| `rgba(31,26,30,0.55)` | `index.css:3617` `.cor-modal-swatch-hint` | |
| `rgba(31,26,30,0.7)` | `index.css:376` `.img-preview-remove` | |
| `rgba(31,26,30,0.82)` | `index.css:332, 2232` | lightbox |
| `rgba(11,15,26,0.65)` | `index.css:113` `.left-overlay` | **matiz azulado diferente** (auth) |

`rgba(31,26,30)` é o `--on-surface` (`#1F1A1E`) reescrito como RGB.

### 3.7 Sombra — **4 bases de cor diferentes**

| Base | Onde |
|---|---|
| `rgba(0,0,0, 0.04/0.05)` | tokens `--shadow*` (`:root`) |
| `rgba(24,25,30, 0.035/0.08)` | `index.css:2848, 2855` `.pintura-card` |
| `rgba(15,23,42, 0.02–0.12)` | **Hero/Footer — 14 ocorrências** (é `slate-900` do Tailwind) |
| `rgba(23,23,23,0.16)` / `rgba(24,24,24,0.15)` | `Hero.css:123, 233`, `Footer.css:83` |

### 3.8 Cores de domínio — **não tokenizar**

`src/components/cores/NovaCorModal.tsx:26-27` define um seletor de amostras de tinta:

```
#FB4A14  #E63946  #F4A261  #E9C46A  #2A9D8F
#264653  #1D3557  #6D597A  #000000  #FFFFFF
```

Mais os defaults em `:48` e `:63` (`"#FB4A14"`) e o placeholder em `:188`.

Estes são **dados do produto** (cores de tinta que o usuário cadastra), não cor de interface. Devem ficar como estão. O mesmo vale para os `style={{ background: cor.hex }}` dinâmicos em `CorCard.tsx:99,127`, `CalculadoraMistura.tsx:225,299,396`, `NovaCorModal.tsx:170,205` e `OrdensPinturaKanban.tsx:212,593`.

> ⚠️ **Implicação para o tema escuro:** amostras de cor renderizam o hex do usuário. No dark mode elas continuam com a cor real (correto), mas `#000000` e `#FFFFFF` vão sumir contra o fundo. Vão precisar de uma borda de contraste. `.pintura-card-color > span` já tem `rgba(0,0,0,0.08)` + `inset rgba(255,255,255,0.18)` para isso — esse par precisa virar token.

---

## 4. Arquivos que precisam migrar para tokens

Ordenado por esforço/impacto.

### 4.1 🔴 Prioridade máxima — `src/components/landing/Hero.css`

**82 ocorrências hardcoded, 0 tokens.** 883 linhas. É a maior peça de dívida do projeto.

Não é só volume: a landing usa uma **linguagem visual inteiramente diferente** do app (cinzas quentes, quase-pretos, glassmorphism com ~30 `rgba(255,255,255,α)`, sombras em slate). Migrar não é substituição 1:1 — exige decidir antes se a landing adota o design system do app ou mantém identidade própria com um subconjunto de tokens dedicado (`--landing-*`).

Concentrações: `.sf-hero-page` (gradientes), `.sf-hero-nav`, `.sf-hero-primary`/`-secondary`, `.sf-hero-card`, `.sf-hero-visual-panel`, `.sf-showcase-card`, `.sf-hero-logo-marquee`.

### 4.2 🔴 Prioridade máxima — `src/components/landing/Footer.css`

**38 ocorrências hardcoded, 0 tokens.** 291 linhas. Mesma paleta e mesmas decisões que o Hero — migrar em conjunto.

### 4.3 🟠 Prioridade alta — `src/index.css`, bloco `.pintura-*` (linhas ~2690–3070)

**28 ocorrências**, incluindo a escada de 12 cinzas de §3.2. Como todo o resto de `index.css` já está tokenizado, este bloco é uma anomalia isolada e razoavelmente mecânica de corrigir — desde que se decida primeiro a escala de cinzas (§6).

Sub-blocos: `.tone-*` (6 pares de cor), `.prioridade-*` (3 pares), `.pintura-date-tag`, `.pintura-column`, `.pintura-card*`.

### 4.4 🟡 `src/pages/App.css` — **arquivo morto, candidato a remoção**

184 linhas, **zero cor hardcoded**, mas:

- **Não é importado por nenhum arquivo.** Os únicos `import './*.css'` do projeto são `index.css` (main.tsx:3), `EventoModal.css`, `Calendar.css`, `Footer.css`, `Hero.css`.
- Consome **6 variáveis que não existem em lugar nenhum**: `--accent`, `--accent-bg`, `--accent-border`, `--border`, `--text-h`, `--social-bg`.

Parece resíduo de outro projeto. Recomendo **deletar** em vez de migrar — mas confirme comigo antes, já que eu não alterei nada.

### 4.5 🟡 `src/components/calendario/EventoModal.css`

**6 ocorrências.** Baixo esforço:

| Linha | Valor | Ação sugerida |
|---:|---|---|
| 4 | `rgba(31,26,30,0.4)` | → token de scrim (duplica `index.css:1706`) |
| 135 | `rgba(251,74,20,0.12)` | → token de anel de foco |
| 223 | `#9ca3af` | → `--on-surface-variant` (ou token de texto terciário) |
| 256 | `rgba(251,74,20,0.2)` | → token de sombra da primária |
| 338 | `#1f2937` | → `--on-surface` |
| 343 | `#6b7280` | → `--on-surface-variant` |

### 4.6 🟢 `src/pages/Calendar.css`

**3 ocorrências.** Trivial:

| Linha | Valor | Ação |
|---:|---|---|
| 16 | `rgba(179,38,30,0.15)` | → `--error-container` (ou novo `--error-outline`) |
| 157 | `rgba(251,74,20,0.35)` | → token de borda "hoje" |
| 158 | `rgba(251,74,20,0.08)` | → token de fundo "hoje" |

### 4.7 🟢 `src/components/auth/Login.tsx` — única classe Tailwind de cor

```tsx
150: <FiEyeOff className="text-gray-700" />
151: <FiEye    className="text-gray-700" />
```

Único uso de utilitário de cor do Tailwind em todo o `src/`. `gray-700` (`#374151`) não corresponde a nenhum token. No tema escuro, esse ícone de "mostrar senha" fica ilegível. Trocar por `color: var(--on-surface-variant)`.

**Não foram encontradas** classes Tailwind com valor arbitrário (`bg-[#…]`) nem cores hex inline em `style={{}}` de interface — os `style={{}}` com cor ou já usam `var(--…)` (EventoModal:323,327; Register:171,173,175; ConfirmEmail*, ResetPassword, UserProfile) ou são cores de domínio (§3.8).

---

## 5. Inconsistências encontradas

Mesma função semântica resolvida com cores diferentes em telas diferentes.

| # | Função | Divergência | Evidência |
|---|---|---|---|
| **1** | **Vermelho de erro/perigo** | 4 vermelhos | `#B3261E` (token) · `#e64b4b` (`.prioridade-alta`, 3053) · `#d34949` (`.tone-rework`, 3054) · fundos `#ffeded` vs `#fff0f0` |
| **2** | **Verde de sucesso** | 3 verdes | `#1a7f3c` (token) · `#3b8a4d` (`.tone-done`, 2832) · `#45945a` (`.prioridade-baixa`, 3055) · fundos `#eef9f0` vs `#eaf7ed` |
| **3** | **Âmbar de aviso** | 2 âmbares, **nenhum token** | `#b87112`/`#fff6df` (`.tone-painting`) vs `#bd851e`/`#fff6dc` (`.prioridade-media`). Os fundos diferem em **1 dígito** (`df` vs `dc`) — quase certamente erro de digitação, não decisão de design. |
| **4** | **Laranja da marca** | 5 laranjas | `#FB4A14` (token) · `#fb5a21` (`Hero.css:350`) · `#ef762c` (`.pintura-date-tag`) · `rgba(255,111,60)` · `rgba(255,106,18)`. **A landing usa um laranja diferente do logo do app.** |
| **5** | **Texto secundário** | 29 cinzas hardcoded para 2 tokens | 12 na Pintura · 3 no EventoModal (família Tailwind `gray`) · 7 quentes na landing · 7 quase-pretos na landing |
| **6** | **Base da sombra** | 4 bases | `rgba(0,0,0)` (tokens) · `rgba(24,25,30)` (pintura) · `rgba(15,23,42)` (landing, ×14 — `slate-900`) · `rgba(23,23,23)`/`rgba(24,24,24)` |
| **7** | **Scrim de modal** | 5 alfas + 2 matizes | `rgba(31,26,30,·)` com α ∈ {0.4, 0.55, 0.7, 0.82} · e `rgba(11,15,26,0.65)` (`.left-overlay`) com **matiz azulado**, único no projeto |
| **8** | **Borda sutil** | mesmo RGB, alfas diferentes | `rgba(67,70,86,0.15)` (token) vs `0.12` (`.pintura-card`, 2845) vs `0.4` (`.step-label`, 1472) |
| **9** | **Branco** | 3 formas para o mesmo valor | `#fff` ×11 · `#ffffff` ×4 (+×7 na landing) · tokens `--surface`/`--on-primary`. Sem padrão de forma curta/longa. |
| **10** | **Nome de token errado** | `index.css:2028` usa `var(--error, #b3261e)` — **`--error` não existe** (o token é `--error-color`). Funciona só porque o fallback está presente. |
| **11** | **Aliases duplicados** | `--brand`/`--brand-dark` são cópias literais de `--primary`/`--primary-dark`. 13 usos passam pelo alias. |
| **12** | **Variáveis indefinidas** | `App.css` consome `--accent`, `--accent-bg`, `--accent-border`, `--border`, `--text-h`, `--social-bg` — nenhuma existe. Inofensivo hoje só porque o arquivo é morto (§4.4). |
| **13** | **Anel de foco replicado** | `rgba(251,74,20,0.12)` repetido em 7 lugares (`279, 407, 471, 945, 1806, 3294` + `EventoModal:135`) em vez de um token único. |
| **14** | **Duas linguagens visuais** | App = cinzas neutros frios + laranja + M3. Landing = cinzas quentes + quase-pretos + glass + sombras slate. **Zero sobreposição de tokens.** É a inconsistência estrutural mais séria. |

---

## 6. O que isso significa para o RF16

### 6.1 Tema claro/escuro

**Ponto de partida hoje:** nenhum. Zero `prefers-color-scheme`, `color-scheme`, `[data-theme]` ou `.dark` em `src/` ou `index.html`.

Bloqueadores, em ordem:

1. **As 242 cores hardcoded não respondem a troca de tema.** Um `[data-theme="dark"]` que redefina os 27 tokens deixaria a landing inteira (120 ocorrências) e o kanban de Pintura (28) presos no claro. Migração de §4.1–4.3 é **pré-requisito**, não polimento.
2. **`--background` tem 1 uso só.** Redefini-lo no dark quase não muda nada — o app pinta com `--surface`. Antes de escrever o tema escuro, decidir se `--background` e `--surface` continuam sendo dois tokens (e então usar `--background` de fato nos containers de página) ou viram um.
3. **Falta a camada semântica.** Os tokens de hoje são de *superfície*, não de *papel*. Não existe `--warning-*`, nem token para scrim, anel de foco, sombra da primária, ou borda de amostra de cor — exatamente os valores que hoje estão hardcoded e replicados (inconsistências #3, #7, #13).
4. **Escalas `tone-*` e `prioridade-*` sobrepostas.** Duas escalas com a mesma semântica (crítico/atenção/ok) e cores diferentes. No dark cada uma precisaria de tratamento próprio. Unificar antes.
5. **Cores de domínio precisam de contorno de contraste** (§3.8) — tintas `#000000`/`#FFFFFF` somem contra o fundo escuro.
6. **`Login.tsx:150-151`** (`text-gray-700`) é o único ponto onde uma classe Tailwind fixa quebra o tema.

**Sugestão de arquitetura:** como o projeto é Tailwind v4 CSS-first (sem `tailwind.config.js`), o caminho natural é um bloco `@theme` em `index.css` expondo os tokens como utilitários, com `:root` / `:root[data-theme="dark"]` / `@media (prefers-color-scheme: dark)` — cobrindo os três estados (explícito claro, explícito escuro, "sistema").

### 6.2 i18n PT/EN

Fora do escopo pedido, mas levantei ao ler os arquivos:

- **Nenhuma biblioteca de i18n instalada** (`package.json` tem apenas react, react-dom, react-router-dom, react-icons, tailwindcss).
- **`index.html` declara `lang="en"`** com conteúdo inteiramente em PT. Precisa virar dinâmico junto com a preferência de idioma.
- Todas as strings estão inline nos componentes — não há arquivo de mensagens.

### 6.3 Achado incidental, fora do escopo

`index.html:13` carrega `<script type="module" src="/src/main.jsx">`, mas o arquivo no disco é **`src/main.tsx`** (não existe `main.jsx`). Não investiguei o impacto — não faz parte do inventário de estilos, mas vale verificar.

---

## Apêndice — Método

- Extração de cor por AWK com rastreio de seletor, sobre os 6 arquivos CSS (6.490 linhas).
- Padrões: `#RGB`/`#RRGGBB`/`#RRGGBBAA`, `rgb()`/`rgba()`, `hsl()`/`hsla()`, palavras-chave CSS.
- Classes Tailwind: regex sobre todas as famílias de cor × 21 prefixos utilitários (`bg-`, `text-`, `border-`, `ring-`, `from-`, `to-`, `via-`, `fill-`, `stroke-`, `shadow-`, `divide-`, `outline-`, `accent-`, `caret-`, `decoration-`, `placeholder-`) em todos os `.tsx`; mais busca separada por valores arbitrários `bg-[…]`.
- Inline: varredura de todo `style={{` com chave de cor, em todos os `.tsx`.
- Auditoria de variáveis: diff entre o conjunto definido (`^\s*--x:`) e o consumido (`var(--x)`), nos dois sentidos.
- `node_modules/` excluído em todas as buscas.
