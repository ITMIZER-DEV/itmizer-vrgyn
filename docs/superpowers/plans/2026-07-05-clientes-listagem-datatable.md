# Clientes/Listagem + Table/DataTable compartilhados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a densidade "Console técnico" (linhas ~32px, cabeçalho mono CAPS) no primitivo de tabela compartilhado e no `DataTable`, e reestilizar o header/card da página de listagem de Clientes.

**Architecture:** Três arquivos, cada um uma camada: `table.tsx` (primitivo shadcn, base de toda tabela do sistema) → `data-table.tsx` (componente de busca/exportar/paginação que usa o primitivo) → `Clients/List.tsx` (página que usa o `DataTable`). Cada task altera só classes/valores visuais — nenhuma prop, nenhum tipo, nenhum comportamento de dado muda em nenhuma das três.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS, `@tanstack/react-table`, `jspdf`/`jspdf-autotable`, `xlsx`.

## Global Constraints

- Só `frontend/src/components/ui/table.tsx`, `frontend/src/components/ui/data-table.tsx`, `frontend/src/pages/Clients/List.tsx` são tocados.
- Nenhuma prop, tipo, coluna, ou comportamento de busca/exportar/paginação/ordenação muda — só classes Tailwind e o array `fillColor` do PDF.
- Sem chips de filtro de fase, sem colunas novas (não existe dado de fase/consultor/virada no `Client` hoje).
- Depois de cada task, `cd frontend && npm run build` precisa terminar sem erro antes de commitar.

---

### Task 1: Densidade do primitivo `table.tsx`

**Files:**
- Modify: `frontend/src/components/ui/table.tsx:44-56` (`TableHead`)
- Modify: `frontend/src/components/ui/table.tsx:58-63` (`TableCell`)

**Interfaces:**
- Consumes: nenhuma.
- Produces: as mesmas exportações (`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`) com as mesmas assinaturas — só o `className` padrão de `TableHead`/`TableCell` muda. Consumido por `data-table.tsx` (Task 2), `ClientInfrastructureTab.tsx`, `ClientCredentialsTab.tsx`, `Migration/List.tsx`, `Index.tsx` — nenhum desses precisa de alteração própria para herdar a densidade nova.

- [ ] **Step 1: Reduzir `TableHead` e adicionar estilo mono CAPS**

De:
```tsx
const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
```
Para:
```tsx
const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-8 px-3 text-left align-middle text-[10px] font-mono uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
```

- [ ] **Step 2: Reduzir o padding de `TableCell`**

De:
```tsx
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
```
Para:
```tsx
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-3 py-2 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
```

- [ ] **Step 3: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/components/ui/table.tsx
git commit -m "style(table): densidade Console tecnico (linha ~32px, header mono CAPS)"
```

---

### Task 2: Densidade da toolbar em `data-table.tsx` + correção do azul no PDF

**Files:**
- Modify: `frontend/src/components/ui/data-table.tsx:115` (`fillColor` do PDF)
- Modify: `frontend/src/components/ui/data-table.tsx:127-134` (input de busca)
- Modify: `frontend/src/components/ui/data-table.tsx:162-165` (botão "Colunas")

**Interfaces:**
- Consumes: `TableHead`/`TableCell` (Task 1, herdado automaticamente — nenhuma mudança de import necessária).
- Produces: nenhuma interface nova.

- [ ] **Step 1: Corrigir a cor do cabeçalho do PDF exportado**

De:
```tsx
    autoTable(doc, {
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }, // VR Primary Blue roughly
      styles: { fontSize: 8 },
    });
```
Para:
```tsx
    autoTable(doc, {
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [255, 106, 0] }, // VR Brand Orange (#FF6A00)
      styles: { fontSize: 8 },
    });
```

- [ ] **Step 2: Reduzir a altura do input de busca**

De:
```tsx
            <Input
              placeholder={`Buscar...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm h-10"
            />
```
Para:
```tsx
            <Input
              placeholder={`Buscar...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm h-8 text-xs"
            />
```

- [ ] **Step 3: Reduzir a altura do botão "Colunas"**

De:
```tsx
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <Settings2 className="w-4 h-4" />
                Colunas
              </Button>
```
Para:
```tsx
              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                <Settings2 className="w-3.5 h-3.5" />
                Colunas
              </Button>
```

- [ ] **Step 4: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/components/ui/data-table.tsx
git commit -m "style(data-table): densidade da toolbar e corrige azul do PDF exportado"
```

---

### Task 3: Header e card da página de Clientes

**Files:**
- Modify: `frontend/src/pages/Clients/List.tsx:158` (`h1`)
- Modify: `frontend/src/pages/Clients/List.tsx:164` (`Card`)

**Interfaces:**
- Consumes: `ClientModal`, `DataTable` (já existentes, sem mudança de props).

- [ ] **Step 1: Ajustar o tamanho do título**

De:
```tsx
                        <h1 className="text-3xl font-bold font-display">Clientes</h1>
```
Para:
```tsx
                        <h1 className="text-2xl font-bold font-display">Clientes</h1>
```

- [ ] **Step 2: Remover sombra/borda pesada do card**

De:
```tsx
                <Card className="glass-card shadow-lg border-2">
```
Para:
```tsx
                <Card className="glass-card">
```

- [ ] **Step 3: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/pages/Clients/List.tsx
git commit -m "style(clientes): ajusta titulo e remove sombra/borda pesada do card da listagem"
```

---

### Task 4: Verificação final

**Files:**
- Nenhum arquivo novo — só verificação do resultado das Tasks 1-3.

- [ ] **Step 1: Grep por resíduos**

Run: `cd frontend && grep -n "37, 99, 235\|shadow-lg border-2\|h-12 px-4\|p-4 align-middle" src/components/ui/table.tsx src/components/ui/data-table.tsx src/pages/Clients/List.tsx`
Expected: nenhuma ocorrência (exit code 1 do grep = esperado).

- [ ] **Step 2: Build de verificação final**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 3: Checar visualmente**

Rodar `npm run dev`, abrir `/clients` e confirmar: tabela mais densa (linhas ~32px, cabeçalho em mono CAPS), toolbar (busca/exportar/colunas) com controles menores, card sem sombra pesada, título menor. Abrir também `/migration` e o Dashboard (`/`) de relance — devem estar mais densos também (herdam de `table.tsx`/`data-table.tsx`), sem quebrar layout. Abrir um Cliente 360 existente e conferir que as tabelas de Infraestrutura/Vault também ficaram mais densas. Repetir em modo escuro.

Esta etapa não pode ser automatizada nesta sessão (sem acesso a navegador conectado nem credenciais de login) — registrar como pendência se quem executar o plano também não tiver acesso interativo.
