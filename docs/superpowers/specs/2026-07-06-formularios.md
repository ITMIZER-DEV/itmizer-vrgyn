# Formulários — Implantações, Recém VR

Sub-projeto 6 de 6 (último) do redesign "ITmizer Console" (direção 1b "Console técnico"), continuação dos sub-projetos 1-5 já implementados nesta mesma branch/worktree (ainda não mesclados em `master`). Ordem completa: 1) Fundação → 2) Shell → 3) Cliente 360 → 4) Clientes/listagem → 5) Demais módulos → **6) Formulários**.

## Objetivo

Aplicar o alinhamento de tokens (já feito nas páginas de listagem de Implantações/Recém VR no sub-projeto 5) às páginas de formulário correspondentes, e corrigir o caso real de "container estreito demais pro conteúdo" identificado no briefing original de design.

## Escopo

- `frontend/src/pages/Deployments/Form.tsx`
- `frontend/src/pages/RecemVr/RecemVrForm.tsx`
- `frontend/src/pages/RecemVr/RecemVrDetail.tsx`

**Sem mudança** (investigação prévia confirmou que já estão adequados):
- `frontend/src/pages/Users/Form.tsx` — já usa tokens (`text-destructive`, `gradient-primary`), sem cor hardcoded.
- `frontend/src/components/assessment/AssessmentForm.tsx` — já renderiza em largura total (sem `max-w-*` restritivo) e já usa tokens (`gradient-primary`, `border-border`).

## Decisões de escopo

- **A "mini-tabela editável" de equipamentos do protótipo original (com botão "+ Adicionar linha") fica de fora desta rodada.** Ela não existe hoje — o assistente de Nova Validação (`PDVsStep.tsx`, `BackofficeStep.tsx` e possivelmente outros steps) usa um padrão de cards expansíveis (`Collapsible`) para adicionar/editar/remover equipamentos. Reconstruir isso como uma tabela de verdade é mudança de interação/funcionalidade em uma ferramenta usada no dia a dia, não um ajuste visual — fica registrado como pendência para um projeto de funcionalidade à parte, não como item deste redesign.
- **`RecemVrDetail.tsx` é o caso real do problema "container estreito" citado no briefing original de design** (`docs/superpowers/specs/2026-07-04-briefing-design-itmizer-vr.md`, seção de problemas de UX): usa `max-w-3xl` pra uma página com abas que incluem lista de reuniões planejadas, histórico de acompanhamentos e timeline de auditoria — conteúdo genuinamente denso, não um formulário simples. O container alarga para `max-w-5xl` (mais espaço, mas não full-width como o Cliente 360, que é uma página com 8 seções — proporção diferente).
- **Badges de criticidade/status não mudam** (`bg-red-100 text-red-700` "Alta", `bg-slate-100 text-slate-500` "Cancelado") — mesma regra já aplicada em todos os sub-projetos anteriores: cor de status não é cor de marca.
- **Os botões inline de Salvar/Cancelar por campo em `RecemVrDetail.tsx` continuam exatamente como estão hoje** (cada campo tem seu próprio mini-editor com botão de salvar ao lado) — não viram um rodapé de ações sticky único, porque essa página não é "um formulário", é uma coleção de editores de campo independentes; inventar um rodapé sticky mudaria a interação, não só o visual.

## 1. `Deployments/Form.tsx` e `RecemVr/RecemVrForm.tsx`

Mesmo tratamento de "alinhamento completo" já aplicado em `Deployments/List.tsx`/`RecemVr/index.tsx` no sub-projeto 5:
- Labels: `text-slate-700 font-medium` → `text-muted-foreground` (ou o padrão de `Label` do shadcn, sem cor extra).
- Bordas de inputs/selects/wrapper: `border-slate-200`/`border-slate-300` → `border-border`/`border-input`.
- Wrapper do formulário: `bg-white rounded-xl border border-slate-200` (ou equivalente) → `bg-card border border-border`.
- Botão de submit: `bg-blue-600 hover:bg-blue-700` (Implantações) / `bg-emerald-600 hover:bg-emerald-700` (Recém VR) → `gradient-primary`.
- Título/ícone do header (`text-gray-900`, ícone já `text-orange-600`/`text-emerald-600`): mesma regra dos sub-projetos anteriores — título perde a cor hardcoded, ícone decorativo não é tocado.
- Larguras (`max-w-4xl` em Implantações, `max-w-2xl` em Recém VR) **não mudam** — nenhuma das duas páginas tem tabela/histórico que justifique alargar.

## 2. `RecemVr/RecemVrDetail.tsx`

- Container: `max-w-3xl mx-auto` → `max-w-5xl mx-auto` (incluindo o wrapper do estado de loading/skeleton, que usa o mesmo `max-w-3xl`).
- Cores hardcoded de slate (`text-slate-800/700/600/500/400`, `bg-slate-50`, `border-slate-200`) → tokens equivalentes (`text-foreground`/`text-muted-foreground`, `bg-muted`, `border-border`).
- Botões de ação primária com cor hardcoded (`bg-emerald-600 hover:bg-emerald-700`, `bg-orange-600 hover:bg-orange-700`) → `gradient-primary`.
- Botão destrutivo (`bg-red-600 hover:bg-red-700`) → `bg-destructive hover:bg-destructive/90`.
- Ícone decorativo `text-emerald-600` (mesmo padrão do ícone do header em `RecemVrForm.tsx`/listagem) — não é tocado.
- Badges de criticidade/status (`bg-red-100 text-red-700`, `bg-slate-100 text-slate-500`) — não são tocados.

## Fora de escopo / riscos aceitos

- Reconstrução da mini-tabela editável de equipamentos no assistente de Nova Validação.
- `Users/Form.tsx`, `AssessmentForm.tsx` — sem mudança (já adequados).
- Verificação: `npm run build` sem erros em cada tarefa; verificação visual logada (as 3 páginas, claro/escuro, incluindo os editores de campo inline de `RecemVrDetail.tsx` continuando a funcionar) precisa ser feita por um humano com navegador — mesma limitação registrada em todos os sub-projetos anteriores.
