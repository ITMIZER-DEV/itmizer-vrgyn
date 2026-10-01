# Handoff: ITmizer-VR — Redesign do Console (direção "Console técnico" / 1b)

## Overview
Redesign visual do sistema interno **ITmizer-VR** (gestão do ciclo de vida de clientes em migração/implantação do sistema VR). Esta entrega define uma **direção de design deliberada** — a direção **1b "Console técnico"** aprovada — e a aplica ao shell do app e às telas principais: Dashboard, Clientes (listagem), Cliente 360, módulos, e formulários (Nova validação, Novo usuário). Inclui **dark mode**, **busca de rotas (command palette ⌘K)** e um **quality floor** consistente.

Objetivos resolvidos:
- **Cor de marca definida:** o **laranja `#FF6A00`** é a cor de marca/primary. O azul deixa de competir e passa a ser apenas cor semântica de status (`info`).
- **Padrão de página escalável:** de formulário simples até tela rica (Cliente 360 com 8 seções + tabelas) — layout em largura total, sem `max-w-3xl` reaproveitado onde não cabe.
- **Densidade compacta** (estilo Linear/admin): hairlines, dados em fonte mono, laranja usado cirurgicamente (só ação/estado ativo).

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar direto**. A tarefa é **recriar estes designs no ambiente existente do projeto** (React 18 + Vite + TS, shadcn/ui sobre Radix + Tailwind, `next-themes`), usando os componentes shadcn e utilitários Tailwind já presentes. Os valores de estilo inline do protótipo devem virar **tokens Tailwind / CSS variables** (ver "Design Tokens" e "Mapeamento para o código atual").

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamento e interações são finais. Recriar a UI fielmente com os componentes do codebase. Onde o protótipo desenha uma tabela/campo à mão, usar o componente shadcn equivalente (`Table`, `Input`, `Select`, `Checkbox`, `Dialog`/`Command`, etc.) mantendo os tokens definidos aqui.

---

## Design Tokens

Paleta como **CSS variables** (o protótipo já usa esta estrutura; migrar para `:root` / `.dark` no `frontend/src/index.css`). Valores em HEX; converta para o formato que o projeto usa (o `index.css` atual usa HSL — mantenha o formato, só troque os valores).

### Light (padrão)
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#FAFAFB` | fundo da página / zebra de linhas |
| `--surface` | `#FFFFFF` | cards, tabelas, sidebar, inputs |
| `--border` | `#ECEDF0` | hairlines, bordas de card/tabela |
| `--divider` | `#F3F4F6` | divisórias internas de linhas |
| `--ink` | `#0D1117` | texto primário / títulos |
| `--text2` | `#374151` | texto secundário |
| `--muted` | `#6B7280` | labels, texto terciário, placeholders |
| `--faint` | `#C7CBD1` | dots neutros / desabilitado |
| `--track` | `#F1F2F4` | trilha de progresso, tiles de ícone |
| `--inputBorder` | `#D8DBE2` | borda de inputs/botões secundários |
| `--hover` | `#F4F5F7` | hover de superfícies neutras |
| **`--brand`** | **`#FF6A00`** | **primary: botões, links, item ativo, focus, progresso** |
| `--brandHover` | `#E55F00` | hover do primary |
| `--brandText` | `#C2410C` | texto laranja legível (nav ativo, fase) |
| `--orangeTint` | `#FFF0E5` | fundo do item de menu ativo / chips |
| `--orangeTintRow` | `#FFF8F2` | hover de linha de tabela (clicável) |
| `--orangeBorder` | `#FFD9BD` | borda de chips/filtros laranja |

### Dark (`.dark` / `[data-theme="dark"]`)
| Token | Valor |
|---|---|
| `--bg` | `#0D1117` |
| `--surface` | `#161B22` |
| `--border` | `#232A34` |
| `--divider` | `#1B212A` |
| `--ink` | `#E6EDF3` |
| `--text2` | `#AEB6C0` |
| `--muted` | `#8B949E` |
| `--faint` | `#495260` |
| `--track` | `#232A34` |
| `--inputBorder` | `#2D3543` |
| `--hover` | `#1C232E` |
| `--brand` | `#FF6A00` |
| `--brandHover` | `#FF7D1F` |
| `--brandText` | `#FF934D` |
| `--orangeTint` | `rgba(255,106,0,.16)` |
| `--orangeTintRow` | `rgba(255,106,0,.07)` |
| `--orangeBorder` | `rgba(255,106,0,.42)` |

### Cores semânticas de status (o azul mora aqui)
Cada status tem uma cor de **texto** (adaptada por tema) e uma cor de **dot** (constante, boa em qualquer fundo).

| Status | Texto light | Texto dark | Dot |
|---|---|---|---|
| Sucesso / Concluído / Homologado | `#15803D` | `#4ADE80` | `#22C55E` |
| Atenção / Ressalvas / Em migração | `#B45309` | `#FBBF24` | `#F59E0B` |
| Info / Validação | `#2563EB` | `#60A5FA` | `#2563EB` (dark `#3B82F6`) |
| Perigo / Reprovar / Crítico | `#DC2626` | `#F87171` | `#DC2626` (dark `#EF4444`) |
| Recém VR (marca) | `#C2410C` / `#FF934D` | — | `#FF6A00` |

### Tipografia
- **Títulos (`font-display`):** **Sora** 600/700. h1 de página ~19px; números de KPI ~22px; títulos de card 13–14px. `letter-spacing:-.01em`.
- **Corpo/UI:** **Inter** 400/500/600. Base **12.5px**; texto de tabela 12px; labels 10–11px em CAPS com `letter-spacing:.05–.07em`.
- **Dados técnicos (IDs, CNPJ, IP, SO, versões, datas, percentuais):** **fonte monoespaçada** (`ui-monospace, Menlo, monospace`), 11.5–12px. Este é o traço central da direção 1b.

### Forma & profundidade
- **Radius:** `6px` padrão (cards, tabelas, inputs, botões); `7px` em controles do header; `12px` em overlays (palette). Atualizar `--radius` do projeto para `0.375rem` (6px) — **abandonar o `0.75rem`/`rounded-xl` atual**.
- **Sombras:** praticamente nenhuma (flat). Única exceção: overlay da command palette — `0 12px 40px rgba(13,17,23,.14)` (light) / `rgba(0,0,0,.55)` (dark).
- **Glass:** NÃO usar como padrão nesta direção. (O `glass-card`/`glass-card-premium` da direção "Hub"/1c ficou de fora; se quiser reintroduzir, restringir a header sticky e cards de KPI.)
- **Densidade de tabela:** linhas ~32px de altura (`padding:8px 12px`), header em mono CAPS 10px, zebra com `--bg`, hover clicável com `--orangeTintRow`.

---

## Screens / Views

### Shell (todas as telas)
- **Sidebar retrátil à esquerda**, `position:sticky; height:100vh`. Expandida `224px`, recolhida `56px` (só tiles de ícone centralizados). Estado persistido em `localStorage['itmizer-sidebar-collapsed']` (`'1'`/`'0'`). Botão "Recolher menu" no rodapé (`«`/`»`).
  - Logo: hexágono **outline** laranja (stroke `#FF6A00`, `fill:none`) + wordmark `IT`(laranja)`MIZER` em Sora 700.
  - Itens: tile mono 20×20 (`glyph` de 2 letras) + label Inter 12.5. **Ativo:** fundo `--orangeTint`, borda-esquerda 2px `--brand`, texto `--brandText`, tile com fundo `--brand` e glyph branco.
  - Rodapé: badge **"Vinculado ao VRGYN"** (dot verde + wordmark VRGYN em Sora/laranja). Prop para ocultar.
- **Top bar** (46px, `--surface`, borda inferior): breadcrumb à esquerda → **campo de busca de rotas** ("Buscar telas… ⌘K") → **toggle de tema** (ícone sol/lua) → avatar (28px, iniciais).

### Command palette (busca de rotas)
- Abre por clique no campo ou **⌘K / Ctrl+K**; fecha por **ESC** ou clique no backdrop.
- Overlay: backdrop `rgba(13,17,23,.45)` + blur; painel centralizado `min(560px,92vw)`, `--surface`, radius 12px, sombra.
- Input com ícone de lupa; lista filtrável (`label` + `kind`) de páginas/módulos/ações. Cada item: tile mono + label Inter 13/500 + `kind` em CAPS à direita. Enter/clique navega. Estado vazio: "Nada encontrado para …".
- Rotas indexadas: Dashboard, Clientes, Cliente 360, Validações, Migração, Implantações, Recém VR, Infraestrutura, Usuários, Perfil, Admin—permissões, Nova validação (ação), Novo usuário (ação).
- **No codebase:** usar o componente **`Command` (cmdk) do shadcn** dentro de um `Dialog`; alimentar com as rotas do React Router.

### Dashboard (`/`)
- h1 "Dashboard". Faixa de 4 KPIs (grid 4 col, gap 1px sobre `--border` = hairline entre cards): Clientes ativos, Em migração (número em `--brand`), Implantações no mês, Recém VR críticos (número em `--danger`).
- Grid 1.4fr / 1fr: "Migrações em andamento" (tabela compacta com barra de progresso laranja; linha clicável → Cliente 360) e "Recém VR — atenção" (lista com dots de status + contador D+n).

### Clientes — listagem (`/clients`)
- Header: h1 + contador mono + botão primary "Novo cliente" à direita.
- Toolbar: campo de busca (nome/CNPJ) + chips de filtro (chip ativo em laranja `--orangeTint`/`--orangeBorder`, demais neutros).
- Tabela: colunas `cliente | cnpj(mono) | fase(dot+texto) | consultor | virada(mono)`. Linha inteira clicável → Cliente 360; hover `--orangeTintRow`.

### Cliente 360 (`/clients/:id`) — tela crítica
- **Header do cliente sticky** (`--surface`, borda inferior, `z-index:30`): nome (Sora 19), `#ID` mono, chip de fase; à direita "Exportar" (secundário) + "Nova validação" (primary → abre formulário).
- **Tabs-âncora** logo abaixo, também sticky: Dados, Validações, Migrações, Implantações, Recém VR, Infraestrutura, Vault, Histórico. **Um único scroll** percorre as 8 seções; a tab ativa acompanha o scroll (scroll-spy); clicar rola até a seção (offset ~110px). **Este é o padrão que substitui o rail lateral anterior** e resolve o "não está legal".
- Seções (largura total, `padding:20/24px`, gap 28px entre seções):
  1. **Dados cadastrais** — grid 4 col de pares label/valor (label CAPS mono 10px `--muted`; valor mono ou Inter).
  2. **Validações** — tabela `data|escopo|responsável|resultado(dot+texto)`.
  3. **Migrações** — tabela `base|registros(mono)|progresso(barra)|status`. Barra concluída em `--dotOk`, em execução em `--brand`.
  4. **Implantações** — lista com dot de status + data mono.
  5. **Recém VR** — estado "ainda não virou" + chip de criticidade.
  6. **Infraestrutura do cliente** — tabela `equipamento(mono)|tipo|loja|so(mono)|status`. (Tabela de dados real — não pode ser esmagada; largura total.)
  7. **Vault de credenciais** — chip "criptografado"; linhas com senha mascarada `••••••••••` + botão "Revelar".
  8. **Histórico** — timeline vertical (dot + linha) com evento + timestamp mono + autor.

### Módulos (Validações, Migração, Implantações, Recém VR, Infraestrutura, Usuários)
- Mesmo esqueleto: h1 + "Novo registro" (primary) + toolbar (busca + Filtros) + tabela compacta no padrão de Clientes. No protótipo há um placeholder pontilhado indicando "mesmo padrão da tela Clientes" — implementar com dados reais de cada módulo.

### Formulário — Nova validação (assessment do parque de TI)
- Voltar (←) + h1. Cards de seção:
  1. **Identificação:** grid 2 col — Cliente (select), Data (date), Responsável técnico (input), Escopo (select).
  2. **Equipamentos levantados:** mini-tabela **editável** (linhas com inputs mono + select de parecer Homologado/Atenção/Reprovar) + botão "+ Adicionar linha" (laranja outline).
  3. **Conectividade & parecer:** link de internet (input), resultado geral (select), Observações (textarea).
- **Rodapé de ações sticky** (bottom, gradiente para `--bg`): Cancelar (ghost) · Salvar rascunho (secundário) · **Concluir validação** (primary).

### Formulário — Novo usuário
- Voltar + h1. Cards:
  1. **Dados do usuário:** grid 2 col — Nome, E-mail corporativo, Papel (select), Equipe (select).
  2. **Permissões por menu:** grid 2 col de checkboxes (um por módulo do sistema) — `accent-color:#FF6A00`. Atende o requisito de **permissões granulares por menu** (`/admin/menus`).
- Mesmo rodapé sticky; submit = "Criar usuário".

---

## Interactions & Behavior
- **Navegação:** SPA via React Router. No protótipo é troca de `route` em estado; no codebase são rotas reais. Sidebar/palette/breadcrumb/linhas de tabela navegam.
- **Sidebar collapse:** anima `width` (`transition:width .18s`); persistente.
- **Tema:** toggle no header alterna `data-theme`/classe `.dark` no `<html>`; persistente em `localStorage['itmizer-theme']`. No codebase, **usar o `next-themes` já instalado** em vez de reimplementar.
- **Command palette:** ⌘K/Ctrl+K abre; ESC/backdrop fecha; filtro por substring em label+kind; autofocus no input ao abrir.
- **Scroll-spy** no Cliente 360: seção ativa = a que está com `top <= 140px`; tab clicada rola suave com offset.
- **Hover states:** linhas clicáveis → `--orangeTintRow`; superfícies neutras → `--hover`; botão primary → `--brandHover`.
- **Focus:** anel laranja (`box-shadow:0 0 0 3px rgba(255,106,0,.15)` + borda `--brand`) nos inputs.

## State Management
- `theme` (via next-themes), `sidebarCollapsed` (localStorage), `paletteOpen` + `query` (local/efêmero), `activeSection` do Cliente 360 (scroll-spy). Dados reais via **TanStack Query**; formulários via **react-hook-form + zod** (já no stack).

## Responsive (desktop-first, mobile funcional)
- Sidebar vira **drawer** no mobile (padrão atual do `DashboardLayout` mantido).
- Tabs-âncora do Cliente 360: `overflow-x:auto` (scroll horizontal em telas estreitas).
- Grids de KPI/cards colapsam para 1–2 colunas; tabelas ganham scroll horizontal em vez de esmagar colunas. **Quality floor:** nenhuma tabela deve quebrar/comprimir — largura mínima + scroll.

---

## Mapeamento para o código atual (o que mudar)
1. **`frontend/src/index.css`:** substituir os valores de `--primary` (azul `217 91% 50/60%`) pelo **laranja `#FF6A00`**; introduzir os tokens acima em `:root` e `.dark`. Trocar `--radius` para `0.375rem`.
2. **`DashboardLayout.tsx`:** unificar a marca — remover o conflito azul(design system)×laranja(logo). Wordmark `ITMIZER`/`VRGYN` e item ativo usam `--brand`/`--brandText`. Substituir o `.hero-overlay` laranja improvisado.
3. **Remover o efeito glass** como padrão (`glass-card`/`glass-card-premium`) — superfícies sólidas. Reavaliar caso a caso.
4. **Páginas com `max-w-3xl`/`max-w-4xl`** que também mostram tabelas/histórico (`Clients/Form`, `Deployments/Form`, `Users/Form`, `RecemVr/*`): trocar pelo padrão de página em largura total; reservar container estreito só para formulários realmente simples.
5. **Cliente 360:** adotar header sticky + tabs-âncora com scroll-spy (substitui o rail lateral da iteração anterior).

## Remover referências ao Lovable (fora dos arquivos de design)
No repositório (não neste pacote):
- **`package.json`:** remover a dependência `lovable-tagger` de `devDependencies`.
- **`vite.config.ts`:** remover o `import` e o uso do plugin `componentTagger()` (normalmente dentro de um bloco `mode === 'development'`).
- Rodar o gerenciador de pacotes para atualizar o lockfile. Conferir `index.html`/README por menções remanescentes.

## Files
Neste pacote:
- `ITmizer Console - Cliente 360.dc.html` — protótipo hifi navegável (shell + Dashboard, Clientes, Cliente 360, módulos, formulários, dark mode, command palette). **Referência principal.**
- `ITmizer Design System.dc.html` — as 3 direções exploradas lado a lado (1a Base sólida, **1b Console técnico — escolhida**, 1c Hub). Útil para contexto das decisões.

> Os `.dc.html` abrem direto no navegador. São **referência de design**, não código a portar — recrie no ambiente React/shadcn do projeto seguindo os tokens e descrições acima.
