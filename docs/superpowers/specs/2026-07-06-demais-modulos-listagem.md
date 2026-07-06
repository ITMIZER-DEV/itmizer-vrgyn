# Demais Módulos de Listagem — Validações, Migração, Implantações, Recém VR, Infraestrutura, Usuários

Sub-projeto 5 de 6 do redesign "ITmizer Console" (direção 1b "Console técnico"), continuação dos sub-projetos 1-4 já implementados nesta mesma branch/worktree (ainda não mesclados em `master`). Ordem completa: 1) Fundação → 2) Shell → 3) Cliente 360 → 4) Clientes/listagem → **5) Demais módulos** → 6) Formulários.

## Objetivo

Aplicar o mesmo padrão de página de listagem já estabelecido em `Clients/List.tsx` (sub-projeto 4) às outras 6 telas de listagem do sistema, cada uma recebendo o tratamento proporcional ao quão distante está do padrão atual.

## Escopo

- `frontend/src/pages/Migration/List.tsx`
- `frontend/src/pages/Index.tsx` (só a view de listagem no final do arquivo — a view do assistente de preenchimento de validação, mais cedo no mesmo arquivo, não é tocada)
- `frontend/src/pages/Users/List.tsx`
- `frontend/src/pages/Infrastructure.tsx`
- `frontend/src/pages/Deployments/List.tsx` (só a listagem — o `Dialog` de detalhe do cliente embutido no mesmo arquivo, linhas ~257-400, fica de fora)
- `frontend/src/pages/RecemVr/index.tsx`

Nenhuma mudança de dado, prop, coluna, comportamento de busca/filtro/exportação, ou navegação em nenhum dos 6 arquivos.

## Decisões de escopo

- **Dois níveis de tratamento**, dependendo de quão distante cada página já está do padrão do resto do app (investigação prévia confirmou isso arquivo por arquivo):
  - **Ajuste leve** (`Migration/List.tsx`, `Index.tsx`, `Users/List.tsx`, `Infrastructure.tsx`): essas páginas já usam os componentes/tokens certos (`Card`, `DataTable` ou `Table` sem override), só precisam do mesmo ajuste de título (`text-3xl`→`text-2xl`) já aplicado em `Clients/List.tsx`; `Migration/List.tsx` e `Index.tsx` também perdem o `shadow-lg border-2` pesado do `Card` (mesmo fix já aplicado em Clientes). `Users/List.tsx` e `Infrastructure.tsx` já não têm esse problema no `Card`.
  - **Alinhamento completo** (`Deployments/List.tsx`, `RecemVr/index.tsx`): essas duas páginas usam um sistema visual à parte, anterior ao design system atual — wrapper `bg-white rounded-xl shadow-sm border border-slate-200` (não usa os tokens `bg-card`/`border-border` do app), cabeçalho de tabela com `text-slate-700 h-12` hardcoded (não herda a densidade nova do sub-projeto 4), e botão de ação primária em azul (`bg-blue-600`, Implantações) ou verde-esmeralda (`bg-emerald-600`, Recém VR) em vez do laranja da marca. Essas duas recebem o tratamento completo: wrapper com tokens, cabeçalho de tabela sem override (herda a densidade nova), células com `text-foreground`/`text-muted-foreground` no lugar de `text-slate-*`, botão de ação primária virando `gradient-primary`, e o botão de excluir do diálogo de confirmação alinhado ao padrão `bg-destructive` (que `Migration/List.tsx` já usa corretamente).
- **Badges de status não mudam.** Os mapas de cor de status (`MigrationStatusColors`, `DeploymentStatusColors`, `CRITICIDADE_COLORS`, `STATUS_COLORS`, cores de papel em `Users/List.tsx`) são semântica de status (verde=ok, vermelho=crítico, etc.), não cor de marca — ficam como estão.
- **O Dialog de detalhe do cliente em `Deployments/List.tsx` (linhas ~257-400) fica fora de escopo.** Tem seu próprio conjunto grande de classes slate/azul hardcoded, mas é uma modal de detalhe separada da listagem em si, mais parecida com os formulários do sub-projeto 6 do que com uma tela de listagem. Fica para uma rodada futura.

## 1. Ajuste leve

- `Migration/List.tsx`: `h1` (`text-3xl font-bold font-display` → `text-2xl font-bold font-display`); `Card` (`glass-card shadow-lg border-2` → `glass-card`).
- `Index.tsx`: mesmo par de mudanças, só na seção de listagem (título "Validações de Infraestrutura" e o `Card` que envolve o `DataTable` de validações no final do arquivo).
- `Users/List.tsx`: só `h1` (`text-3xl font-bold font-display` → `text-2xl font-bold font-display`).
- `Infrastructure.tsx`: só `h1` (`font-display text-3xl font-bold` → `font-display text-2xl font-bold`).

## 2. Alinhamento completo (`Deployments/List.tsx`, `RecemVr/index.tsx`)

- **Wrapper externo:** `bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden` → `bg-card border border-border rounded-md overflow-hidden` (só troca de classe, mantém a mesma `<div>`, sem virar um componente `Card` novo).
- **Header interno da tabela (o `<div>` com a busca, acima da tabela):** remove `bg-slate-50/50 border-slate-100` hardcoded, troca por `border-border`.
- **`TableHeader`:** troca `className="bg-slate-50"` por `className="bg-muted/30"` (mesmo tom usado pelo cabeçalho de tabela do `DataTable`, em `data-table.tsx:190` — consistência entre os dois padrões de tabela do app).
- **`TableRow` do cabeçalho:** remove `className="hover:bg-slate-50"` (redundante — o primitivo `TableRow` já tem `hover:bg-muted/50` por padrão).
- **`TableHead` de cada coluna:** remove `font-semibold text-slate-700 h-12` (herda a densidade nova do sub-projeto 4 automaticamente); mantém classes de largura/alinhamento específicas onde existirem (ex: `w-[100px] text-right` na coluna de ações).
- **Células de dado:** `text-slate-900` → `text-foreground`; `text-slate-600` → `text-muted-foreground`; `text-slate-400` (itálico "não atribuído"/"sem previsão", ícones) → `text-muted-foreground`. O nome do cliente clicável em Implantações (`text-blue-600 ... hover:underline`) vira `text-primary`.
- **Botão de ação primária:** "Nova Implantação" (`bg-blue-600 hover:bg-blue-700 shadow-md`) e "Novo Recém VR" (`bg-emerald-600 hover:bg-emerald-700 shadow-md`) viram `gradient-primary` (sem `shadow-md`, consistente com os botões "Novo Cliente"/"Nova Migração").
- **Botão de ícone de ação (editar/excluir na linha):** `hover:bg-blue-50 hover:text-blue-600` → `hover:bg-primary/10 hover:text-primary`; `hover:text-red-600 hover:bg-red-50` → `hover:text-destructive hover:bg-destructive/10`.
- **Botão "Excluir" do `AlertDialogAction`:** `bg-red-600 hover:bg-red-700 text-white` → `bg-destructive hover:bg-destructive/90` (mesmo padrão de `Migration/List.tsx:217`).
- **Campo de busca:** remove `focus-visible:ring-blue-500`/`focus-visible:ring-emerald-500` hardcoded (o `Input` já usa o token `--ring`, que é laranja desde a Fundação).
- **Título:** remove `text-gray-900` hardcoded (herda a cor de texto padrão); tamanho `text-3xl` → `text-2xl` como as demais.

## Fora de escopo / riscos aceitos

- Dialog de detalhe do cliente em `Deployments/List.tsx` (linhas ~257-400).
- Qualquer mapa de cor de status/badge (não são cor de marca).
- Verificação: `npm run build` sem erros em cada tarefa; verificação visual logada (as 6 páginas, claro/escuro) precisa ser feita por um humano com navegador — mesma limitação registrada nos sub-projetos anteriores.
