# Demais Módulos de Listagem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o padrão de listagem já estabelecido em `Clients/List.tsx` às outras 6 telas de listagem — ajuste leve em 4 delas, alinhamento completo de tokens/botões nas outras 2.

**Architecture:** 4 tasks — uma pra agrupar os 4 ajustes leves (arquivos independentes, mudanças mínimas de 1-2 linhas cada), uma pra cada um dos 2 arquivos de alinhamento completo (mudanças maiores, cada um merece sua própria revisão), e uma de verificação final.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS. Nenhuma dependência nova.

## Global Constraints

- Nenhuma prop, tipo, coluna, dado, ou comportamento de busca/filtro/exportação/navegação muda em nenhum dos 6 arquivos — só classes Tailwind.
- Mapas de cor de status (`MigrationStatusColors`, `DeploymentStatusColors`, `CRITICIDADE_COLORS`, `STATUS_COLORS`, cores de papel em `Users/List.tsx`) não mudam.
- O `Dialog` de detalhe do cliente em `Deployments/List.tsx` (a partir de `{/* Modal de Detalhes da Implantação */}`) não é tocado.
- Em `Index.tsx`, só a seção de listagem no final do arquivo é tocada — a view do assistente de preenchimento de validação não é tocada.
- Depois de cada task, `cd frontend && npm run build` precisa terminar sem erro antes de commitar.

---

### Task 1: Ajuste leve — Migração, Validações, Usuários, Infraestrutura

**Files:**
- Modify: `frontend/src/pages/Migration/List.tsx:236` (h1) e `:247` (Card)
- Modify: `frontend/src/pages/Index.tsx:491-493` (h1) e `:607` (Card) — só a seção de listagem
- Modify: `frontend/src/pages/Users/List.tsx:95` (h1)
- Modify: `frontend/src/pages/Infrastructure.tsx:101` (h1)

**Interfaces:** nenhuma — só classes.

- [ ] **Step 1: `Migration/List.tsx` — título**

De:
```tsx
                        <h1 className="text-3xl font-bold font-display">Migrações</h1>
```
Para:
```tsx
                        <h1 className="text-2xl font-bold font-display">Migrações</h1>
```

- [ ] **Step 2: `Migration/List.tsx` — card**

De:
```tsx
                <Card className="glass-card shadow-lg border-2">
```
Para:
```tsx
                <Card className="glass-card">
```

- [ ] **Step 3: `Index.tsx` — título da listagem**

De:
```tsx
          <h1 className="font-display text-3xl font-bold">
            Validações de Infraestrutura
          </h1>
```
Para:
```tsx
          <h1 className="font-display text-2xl font-bold">
            Validações de Infraestrutura
          </h1>
```
(Este é o único `<h1>` com `text-3xl` no arquivo — o `<h1>` da view do assistente de validação, mais cedo no arquivo, usa `text-xl` e não deve ser confundido com este.)

- [ ] **Step 4: `Index.tsx` — card da listagem**

De:
```tsx
      <Card className="glass-card shadow-lg border-2">
        <CardContent className="p-6">
          <DataTable 
            columns={columns} 
            data={assessments} 
            searchKey="company_nomeFantasia" 
            filename="validacoes-itmizer"
          />
        </CardContent>
      </Card>
```
Para:
```tsx
      <Card className="glass-card">
        <CardContent className="p-6">
          <DataTable 
            columns={columns} 
            data={assessments} 
            searchKey="company_nomeFantasia" 
            filename="validacoes-itmizer"
          />
        </CardContent>
      </Card>
```
(Note a indentação com 2 espaços a menos que o padrão do resto do arquivo — é assim que o bloco já está no arquivo hoje; manter a mesma indentação, só trocar a classe do `Card`.)

- [ ] **Step 5: `Users/List.tsx` — título**

De:
```tsx
                        <h1 className="text-3xl font-bold font-display">{title || 'Gestão de Usuários'}</h1>
```
Para:
```tsx
                        <h1 className="text-2xl font-bold font-display">{title || 'Gestão de Usuários'}</h1>
```

- [ ] **Step 6: `Infrastructure.tsx` — título**

De:
```tsx
                <h1 className="font-display text-3xl font-bold">Configurações de Infraestrutura</h1>
```
Para:
```tsx
                <h1 className="font-display text-2xl font-bold">Configurações de Infraestrutura</h1>
```

- [ ] **Step 7: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 8: Commit**

```bash
cd frontend
git add src/pages/Migration/List.tsx src/pages/Index.tsx src/pages/Users/List.tsx src/pages/Infrastructure.tsx
git commit -m "style(listagens): ajusta titulo e card de Migracao/Validacoes/Usuarios/Infraestrutura"
```

---

### Task 2: Alinhamento completo — `Deployments/List.tsx`

**Files:**
- Modify: `frontend/src/pages/Deployments/List.tsx:104-253` (bloco inteiro da listagem — header, wrapper, tabela)

**Interfaces:** nenhuma — só classes. O `Dialog` de detalhe (linha ~256 em diante) não é tocado.

- [ ] **Step 1: Substituir o bloco da listagem**

Localizar o bloco que começa em `return (` (logo após `const activeDeployment = ...`) e vai até o fechamento da `</div>` principal, imediatamente antes de `{/* Modal de Detalhes da Implantação */}`:

De:
```tsx
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 group flex items-center gap-3">
                            <MapIcon className="w-8 h-8 text-orange-600 group-hover:rotate-12 transition-transform" />
                            Guia de Implantação
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Gerencie e acompanhe as implantações de clientes.
                        </p>
                    </div>

                    {canEdit && (
                        <Button onClick={() => navigate('/deployments/new')} className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-md">
                            <Plus className="w-4 h-4" /> Nova Implantação
                        </Button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente ou implantador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-full"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700 h-12">Cliente</TableHead>
                                    <TableHead className="font-semibold text-slate-700 h-12">Implantador</TableHead>
                                    <TableHead className="font-semibold text-slate-700 h-12">Data Previsão</TableHead>
                                    <TableHead className="font-semibold text-slate-700 h-12">Status</TableHead>
                                    {canEdit && <TableHead className="font-semibold text-slate-700 h-12 w-[100px] text-right">Ações</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                                            {canEdit && <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>}
                                        </TableRow>
                                    ))
                                ) : filtered?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={canEdit ? 5 : 4} className="h-32 text-center text-muted-foreground">
                                            Nenhuma implantação encontrada. {searchTerm && 'Tente outro termo na busca.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered?.map((dep) => (
                                        <TableRow key={dep.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('.action-button')) return;
                                            setSelectedDeployment(dep);
                                        }}>
                                            <TableCell className="font-medium text-slate-900">
                                                <div
                                                    className="inline-flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 -ml-1.5 rounded-md transition-colors hover:underline text-blue-600 action-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDeployment(dep);
                                                    }}
                                                >
                                                    {dep.client?.nomeFantasia || 'Cliente não encontrado'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {dep.implantador || <span className="text-slate-400 italic">Não atribuído</span>}
                                            </TableCell>
                                            <TableCell>
                                                {dep.dataPrevisao ? (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {format(new Date(dep.dataPrevisao), "dd/MM/yyyy", { locale: ptBR })}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Sem previsão</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={DeploymentStatusColors[dep.status] + " border-0 rounded-full px-3 py-1 font-medium"}>
                                                    {DeploymentStatusLabels[dep.status]}
                                                </Badge>
                                            </TableCell>
                                            {canEdit && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 action-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/deployments/${dep.id}`);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 action-button"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Excluir implantação?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a ficha de implantação deste cliente.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                                        onClick={() => deleteMutation.mutate(dep.id)}
                                                                    >
                                                                        Excluir
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
```
Para:
```tsx
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight group flex items-center gap-3">
                            <MapIcon className="w-8 h-8 text-orange-600 group-hover:rotate-12 transition-transform" />
                            Guia de Implantação
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Gerencie e acompanhe as implantações de clientes.
                        </p>
                    </div>

                    {canEdit && (
                        <Button onClick={() => navigate('/deployments/new')} className="gap-2 shrink-0 gradient-primary">
                            <Plus className="w-4 h-4" /> Nova Implantação
                        </Button>
                    )}
                </div>

                <div className="bg-card border border-border rounded-md overflow-hidden">
                    <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente ou implantador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 rounded-full"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Implantador</TableHead>
                                    <TableHead>Data Previsão</TableHead>
                                    <TableHead>Status</TableHead>
                                    {canEdit && <TableHead className="w-[100px] text-right">Ações</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                                            {canEdit && <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>}
                                        </TableRow>
                                    ))
                                ) : filtered?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={canEdit ? 5 : 4} className="h-32 text-center text-muted-foreground">
                                            Nenhuma implantação encontrada. {searchTerm && 'Tente outro termo na busca.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered?.map((dep) => (
                                        <TableRow key={dep.id} className="group cursor-pointer" onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('.action-button')) return;
                                            setSelectedDeployment(dep);
                                        }}>
                                            <TableCell className="font-medium text-foreground">
                                                <div
                                                    className="inline-flex items-center gap-2 cursor-pointer hover:bg-muted p-1.5 -ml-1.5 rounded-md transition-colors hover:underline text-primary action-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDeployment(dep);
                                                    }}
                                                >
                                                    {dep.client?.nomeFantasia || 'Cliente não encontrado'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {dep.implantador || <span className="text-muted-foreground italic">Não atribuído</span>}
                                            </TableCell>
                                            <TableCell>
                                                {dep.dataPrevisao ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {format(new Date(dep.dataPrevisao), "dd/MM/yyyy", { locale: ptBR })}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Sem previsão</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={DeploymentStatusColors[dep.status] + " border-0 rounded-full px-3 py-1 font-medium"}>
                                                    {DeploymentStatusLabels[dep.status]}
                                                </Badge>
                                            </TableCell>
                                            {canEdit && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 action-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/deployments/${dep.id}`);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 action-button"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Excluir implantação?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a ficha de implantação deste cliente.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className="bg-destructive hover:bg-destructive/90"
                                                                        onClick={() => deleteMutation.mutate(dep.id)}
                                                                    >
                                                                        Excluir
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
```

- [ ] **Step 2: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/Deployments/List.tsx
git commit -m "style(implantacoes): alinha tokens/botao primario, remove slate/azul hardcoded"
```

---

### Task 3: Alinhamento completo — `RecemVr/index.tsx`

**Files:**
- Modify: `frontend/src/pages/RecemVr/index.tsx:72-250` (bloco inteiro da listagem — header, wrapper, filtros, tabela)

**Interfaces:** nenhuma — só classes.

- [ ] **Step 1: Substituir o bloco da listagem**

De:
```tsx
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              Recém VR
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Acompanhe clientes em período pós-implantação.
            </p>
          </div>

          {canEdit && (
            <Button
              onClick={() => navigate('/recem-vr/new')}
              className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              <Plus className="w-4 h-4" /> Nova Solicitação
            </Button>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filtros */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou analista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white border-slate-200 focus-visible:ring-emerald-500 rounded-full"
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as RecemVrStatus | 'TODOS')}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Status</SelectItem>
                {(Object.keys(STATUS_LABELS) as RecemVrStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCriticidade}
              onValueChange={(v) => setFilterCriticidade(v as RecemVrCriticidade | 'TODAS')}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Criticidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as Criticidades</SelectItem>
                {(Object.keys(CRITICIDADE_LABELS) as RecemVrCriticidade[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CRITICIDADE_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 h-12">Cliente</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Criticidade</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Analista</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Próxima Reunião</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Reuniões</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                      </TableRow>
                    ))
                  : filtered?.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Nenhum Recém VR encontrado.{searchTerm && ' Tente outro termo.'}
                      </TableCell>
                    </TableRow>
                  )
                  : filtered?.map((rv) => {
                      const proximaReuniao = getProximaReuniao(rv.datasAcompanhamento);
                      const isAlta = rv.criticidade === 'ALTA';

                      return (
                        <TableRow
                          key={rv.id}
                          className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            isAlta ? 'border-l-4 border-l-red-400' : ''
                          }`}
                          onClick={() => navigate(`/recem-vr/${rv.id}`)}
                        >
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              {isAlta && (
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                              <span className="hover:text-emerald-600 transition-colors">
                                {rv.client?.nomeFantasia}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {CRITICIDADE_LABELS[rv.criticidade]}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${STATUS_COLORS[rv.status]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {STATUS_LABELS[rv.status]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-slate-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {rv.analista?.profile?.fullName ??
                                rv.analista?.email ?? (
                                  <span className="text-slate-400 italic">Não atribuído</span>
                                )}
                            </div>
                          </TableCell>

                          <TableCell>
                            {proximaReuniao ? (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {format(proximaReuniao, 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-sm">Sem agenda</span>
                            )}
                          </TableCell>

                          <TableCell className="text-slate-600 text-sm">
                            {rv._count?.acompanhamentos ?? 0} registros
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </div>
```
Para:
```tsx
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              Recém VR
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Acompanhe clientes em período pós-implantação.
            </p>
          </div>

          {canEdit && (
            <Button
              onClick={() => navigate('/recem-vr/new')}
              className="gap-2 shrink-0 gradient-primary"
            >
              <Plus className="w-4 h-4" /> Nova Solicitação
            </Button>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-card border border-border rounded-md overflow-hidden">
          {/* Filtros */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou analista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-full"
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as RecemVrStatus | 'TODOS')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Status</SelectItem>
                {(Object.keys(STATUS_LABELS) as RecemVrStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCriticidade}
              onValueChange={(v) => setFilterCriticidade(v as RecemVrCriticidade | 'TODAS')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Criticidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as Criticidades</SelectItem>
                {(Object.keys(CRITICIDADE_LABELS) as RecemVrCriticidade[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CRITICIDADE_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Analista</TableHead>
                  <TableHead>Próxima Reunião</TableHead>
                  <TableHead>Reuniões</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                      </TableRow>
                    ))
                  : filtered?.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Nenhum Recém VR encontrado.{searchTerm && ' Tente outro termo.'}
                      </TableCell>
                    </TableRow>
                  )
                  : filtered?.map((rv) => {
                      const proximaReuniao = getProximaReuniao(rv.datasAcompanhamento);
                      const isAlta = rv.criticidade === 'ALTA';

                      return (
                        <TableRow
                          key={rv.id}
                          className={`group cursor-pointer ${
                            isAlta ? 'border-l-4 border-l-red-400' : ''
                          }`}
                          onClick={() => navigate(`/recem-vr/${rv.id}`)}
                        >
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              {isAlta && (
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                              <span className="hover:text-primary transition-colors">
                                {rv.client?.nomeFantasia}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {CRITICIDADE_LABELS[rv.criticidade]}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${STATUS_COLORS[rv.status]} border-0 rounded-full px-3 py-1 font-medium`}
                            >
                              {STATUS_LABELS[rv.status]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              {rv.analista?.profile?.fullName ??
                                rv.analista?.email ?? (
                                  <span className="text-muted-foreground italic">Não atribuído</span>
                                )}
                            </div>
                          </TableCell>

                          <TableCell>
                            {proximaReuniao ? (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                {format(proximaReuniao, 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">Sem agenda</span>
                            )}
                          </TableCell>

                          <TableCell className="text-muted-foreground text-sm">
                            {rv._count?.acompanhamentos ?? 0} registros
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </div>
```

- [ ] **Step 2: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/RecemVr/index.tsx
git commit -m "style(recem-vr): alinha tokens/botao primario, remove slate hardcoded"
```

---

### Task 4: Verificação final

**Files:**
- Nenhum arquivo novo — só verificação do resultado das Tasks 1-3.

- [ ] **Step 1: Grep por resíduos**

Run: `cd frontend && grep -rn "text-slate-\|bg-slate-\|border-slate-\|bg-blue-600\|bg-emerald-600\|text-gray-900\|shadow-lg border-2" src/pages/Migration/List.tsx src/pages/Index.tsx src/pages/Users/List.tsx src/pages/Infrastructure.tsx src/pages/Deployments/List.tsx src/pages/RecemVr/index.tsx`
Expected: nenhuma ocorrência dentro das seções de listagem tocadas. **Atenção:** este grep também vai encontrar (esperado, não é erro) ocorrências de `text-slate-*`/`bg-blue-*` dentro do `Dialog` de detalhe em `Deployments/List.tsx` (linhas ~257-400+) — esse bloco está fora de escopo desta rodada e não deve ser alterado. Confirme que as ocorrências restantes, se houver, estão todas dentro desse bloco de Dialog.

- [ ] **Step 2: Build de verificação final**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 3: Checar visualmente**

Rodar `npm run dev` e abrir `/migration`, `/assessments`, `/users`, `/infrastructure`, `/deployments`, `/recem-vr`. Confirmar: títulos no mesmo tamanho das outras telas já redesenhadas; tabelas de Implantações e Recém VR com a mesma densidade/cor de header das demais (não mais brancas/slate soltas); botões "Nova Implantação"/"Nova Solicitação" em laranja; nenhuma tabela quebrada. Repetir em modo escuro. Confirmar que o modal de detalhe de Implantações (clicar num cliente na listagem) ainda abre e funciona normalmente, mesmo sem ter sido redesenhado.

Esta etapa não pode ser automatizada nesta sessão (sem acesso a navegador conectado nem credenciais de login) — registrar como pendência se quem executar o plano também não tiver acesso interativo.
