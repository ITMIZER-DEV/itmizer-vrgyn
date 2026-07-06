# Recém VR — Periodicidade de Acompanhamento por Criticidade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir a periodicidade de acompanhamento (Alta → 7 dias · semanal, Média → 15 dias · quinzenal, Baixa → 30 dias · mensal) junto de cada nível de criticidade do Recém VR, nos balões do seletor e nos badges de leitura.

**Architecture:** Um único mapa novo (`CRITICIDADE_PERIODICIDADE`) em `frontend/src/types/recemVr.ts`, consumido por 4 pontos de UI já existentes — nenhum componente novo, nenhuma mudança de dado/schema.

**Tech Stack:** React + TypeScript (frontend apenas, `vite build` como verificação).

## Global Constraints

- Mudança é só de exibição — nenhuma alteração em `RecemVrCriticidade`, no schema do backend, ou em lógica de agendamento/lembrete.
- Texto do mapa: `BAIXA: '30 dias · mensal'`, `MEDIA: '15 dias · quinzenal'`, `ALTA: '7 dias · semanal'` (separador " · ", exatamente como especificado).
- Nos balões do `CriticidadeSelector`: periodicidade é **adicional** — o texto descritivo atual (`opt.desc`, ex: "Cliente em risco") permanece, a periodicidade aparece como linha extra abaixo dele.
- Nos badges de leitura (cabeçalho do Recém VR, badge estático da aba Solicitação, badge da listagem): texto do badge passa a ser `{label} · {periodicidade}` (ex: "3 - Alta · 7 dias · semanal").
- Fora de escopo: o dropdown de filtro de criticidade em `RecemVr/index.tsx:137-141` (não é um badge de leitura) e o badge de alerta "Criticidade Alta" com ícone (`RecemVrDetail.tsx:166-170`) não mudam.

---

### Task 1: Adicionar o mapa `CRITICIDADE_PERIODICIDADE`

**Files:**
- Modify: `frontend/src/types/recemVr.ts:1-8`

**Interfaces:**
- Produces: `CRITICIDADE_PERIODICIDADE: Record<RecemVrCriticidade, string>` — consumido pelas Tasks 2, 3 e 4.

- [ ] **Step 1: Adicionar o mapa logo após `CRITICIDADE_LABELS`**

Em `frontend/src/types/recemVr.ts`, troque:

```ts
export const CRITICIDADE_LABELS: Record<RecemVrCriticidade, string> = {
  BAIXA: '1 - Baixa',
  MEDIA: '2 - Média',
  ALTA: '3 - Alta',
};
```

por:

```ts
export const CRITICIDADE_LABELS: Record<RecemVrCriticidade, string> = {
  BAIXA: '1 - Baixa',
  MEDIA: '2 - Média',
  ALTA: '3 - Alta',
};

export const CRITICIDADE_PERIODICIDADE: Record<RecemVrCriticidade, string> = {
  BAIXA: '30 dias · mensal',
  MEDIA: '15 dias · quinzenal',
  ALTA: '7 dias · semanal',
};
```

- [ ] **Step 2: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros (o mapa novo ainda não é consumido em nenhum lugar, mas deve compilar).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/recemVr.ts
git commit -m "feat(recem-vr): adiciona mapa de periodicidade por criticidade"
```

---

### Task 2: `CriticidadeSelector` — linha extra de periodicidade nos balões

**Files:**
- Modify: `frontend/src/components/CriticidadeSelector.tsx`

**Interfaces:**
- Consumes: `CRITICIDADE_PERIODICIDADE` (Task 1).
- Produces: nada consumido por tarefas futuras (componente folha).

- [ ] **Step 1: Importar o mapa e adicionar o campo `periodicidade` nas opções**

Em `frontend/src/components/CriticidadeSelector.tsx`, troque a linha 1-2:

```tsx
import { cn } from '@/lib/utils';
import type { RecemVrCriticidade } from '@/types/recemVr';
```

por:

```tsx
import { cn } from '@/lib/utils';
import { CRITICIDADE_PERIODICIDADE } from '@/types/recemVr';
import type { RecemVrCriticidade } from '@/types/recemVr';
```

- [ ] **Step 2: Adicionar a linha de periodicidade abaixo do texto descritivo**

Troque:

```tsx
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {opt.desc}
            </span>
```

por:

```tsx
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {opt.desc}
            </span>
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {CRITICIDADE_PERIODICIDADE[opt.value]}
            </span>
```

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros.

- [ ] **Step 4: Verificação manual no navegador**

Abra a criação de um Recém VR (ou a edição de criticidade de um existente) e confirme que cada balão mostra, abaixo do texto descritivo, a periodicidade correspondente: Baixa → "30 dias · mensal", Média → "15 dias · quinzenal", Alta → "7 dias · semanal".

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CriticidadeSelector.tsx
git commit -m "feat(recem-vr): exibe periodicidade nos balões do CriticidadeSelector"
```

---

### Task 3: Badges de leitura em `RecemVrDetail.tsx`

**Files:**
- Modify: `frontend/src/pages/RecemVr/RecemVrDetail.tsx:30-32,177-179,341-346`

**Interfaces:**
- Consumes: `CRITICIDADE_PERIODICIDADE` (Task 1).
- Produces: nada consumido por tarefas futuras.

- [ ] **Step 1: Importar o mapa**

Em `frontend/src/pages/RecemVr/RecemVrDetail.tsx`, troque:

```tsx
  CRITICIDADE_LABELS, CRITICIDADE_COLORS, STATUS_LABELS, STATUS_COLORS,
```

por:

```tsx
  CRITICIDADE_LABELS, CRITICIDADE_COLORS, CRITICIDADE_PERIODICIDADE, STATUS_LABELS, STATUS_COLORS,
```

- [ ] **Step 2: Badge do cabeçalho**

Troque:

```tsx
                <Badge variant="outline" className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0`}>
                  {CRITICIDADE_LABELS[rv.criticidade]}
                </Badge>
```

por:

```tsx
                <Badge variant="outline" className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0`}>
                  {CRITICIDADE_LABELS[rv.criticidade]} · {CRITICIDADE_PERIODICIDADE[rv.criticidade]}
                </Badge>
```

- [ ] **Step 3: Badge estático da aba Solicitação**

Troque:

```tsx
                  <Badge
                    variant="outline"
                    className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 text-sm px-3 py-1`}
                  >
                    {CRITICIDADE_LABELS[rv.criticidade]}
                  </Badge>
```

por:

```tsx
                  <Badge
                    variant="outline"
                    className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 text-sm px-3 py-1`}
                  >
                    {CRITICIDADE_LABELS[rv.criticidade]} · {CRITICIDADE_PERIODICIDADE[rv.criticidade]}
                  </Badge>
```

- [ ] **Step 4: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros.

- [ ] **Step 5: Verificação manual no navegador**

Abra um Recém VR existente e confirme que o badge do cabeçalho e o badge da aba Solicitação (quando não estiver editando a criticidade) mostram "Alta · 7 dias · semanal" (ou o texto correspondente à criticidade daquele registro).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/RecemVr/RecemVrDetail.tsx
git commit -m "feat(recem-vr): exibe periodicidade nos badges de criticidade do Recém VR"
```

---

### Task 4: Badge da listagem em `RecemVr/index.tsx`

**Files:**
- Modify: `frontend/src/pages/RecemVr/index.tsx:31-38,201-208`

**Interfaces:**
- Consumes: `CRITICIDADE_PERIODICIDADE` (Task 1).
- Produces: nada — última tarefa do plano.

- [ ] **Step 1: Importar o mapa**

Em `frontend/src/pages/RecemVr/index.tsx`, troque:

```tsx
import {
  CRITICIDADE_LABELS,
  CRITICIDADE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  type RecemVrCriticidade,
  type RecemVrStatus,
} from '@/types/recemVr';
```

por:

```tsx
import {
  CRITICIDADE_LABELS,
  CRITICIDADE_COLORS,
  CRITICIDADE_PERIODICIDADE,
  STATUS_LABELS,
  STATUS_COLORS,
  type RecemVrCriticidade,
  type RecemVrStatus,
} from '@/types/recemVr';
```

- [ ] **Step 2: Badge da coluna Criticidade na tabela**

Troque:

```tsx
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {CRITICIDADE_LABELS[rv.criticidade]}
                            </Badge>
                          </TableCell>
```

por:

```tsx
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {CRITICIDADE_LABELS[rv.criticidade]} · {CRITICIDADE_PERIODICIDADE[rv.criticidade]}
                            </Badge>
                          </TableCell>
```

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros.

- [ ] **Step 4: Verificação manual no navegador**

Abra a listagem de Recém VR (`/recem-vr`) e confirme que a coluna Criticidade de cada linha mostra o texto concatenado (ex: "1 - Baixa · 30 dias · mensal").

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/RecemVr/index.tsx
git commit -m "feat(recem-vr): exibe periodicidade no badge de criticidade da listagem"
```
