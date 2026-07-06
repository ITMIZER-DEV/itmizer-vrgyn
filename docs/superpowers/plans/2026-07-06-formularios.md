# Formulários Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar `Deployments/Form.tsx` e `RecemVr/RecemVrForm.tsx` aos tokens já usados no resto do app, e corrigir o container estreito demais de `RecemVr/RecemVrDetail.tsx` (o caso real do problema "container estreito pro conteúdo" citado no briefing original).

**Architecture:** Três arquivos independentes, cada um com sua própria task. `Deployments/Form.tsx` e `RecemVrDetail.tsx` são grandes o suficiente pra justificar um único bloco de substituição (como nos sub-projetos anteriores); `RecemVrForm.tsx` é pequeno e recebe edições pontuais.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS. Nenhuma dependência nova, nenhuma mudança de prop/dado/comportamento.

## Global Constraints

- Nenhuma prop, tipo, query, mutation, ou comportamento de formulário/navegação/validação muda em nenhum dos 3 arquivos — só classes Tailwind.
- Mapas de cor de status (`CRITICIDADE_COLORS`, `STATUS_COLORS`) e os badges "Criticidade Alta" (`bg-red-100 text-red-700`) / "Cancelado" (`bg-slate-100 text-slate-500`) em `RecemVrDetail.tsx` não mudam — são semântica de status.
- Ícones decorativos de header já corretos (`Sparkles` `text-emerald-600` em `RecemVrForm.tsx`/`RecemVrDetail.tsx`) não são tocados.
- `Users/Form.tsx` e `components/assessment/AssessmentForm.tsx` não são tocados nesta rodada (já adequados).
- Depois de cada task, `cd frontend && npm run build` precisa terminar sem erro antes de commitar.

---

### Task 1: `Deployments/Form.tsx`

**Files:**
- Modify: `frontend/src/pages/Deployments/Form.tsx:131-301` (bloco `return (...)` inteiro)

**Interfaces:** nenhuma — só classes. Nenhum hook, query, mutation ou handler muda.

- [ ] **Step 1: Substituir o bloco `return (...)` inteiro**

De:
```tsx
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/deployments')} className="shrink-0 bg-white shadow-sm border border-slate-200">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            {isEditing ? 'Editar Ficha de Implantação' : 'Nova Ficha de Implantação'}
                        </h1>
                        <p className="text-muted-foreground mt-1">Preencha os dados abaixo.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Look-up Cliente */}
                            <div className="space-y-3">
                                <Label className="text-slate-700 font-medium">Cliente *</Label>
                                <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openClientCombo}
                                            disabled={isReadOnly}
                                            className={cn("w-full justify-between h-11 border-slate-300", !watch('clientId') && "text-muted-foreground")}
                                        >
                                            {watch('clientId') ? selectedClientName : "Selecione um cliente..."}
                                            <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 shadow-lg border-slate-200" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Digite p/ buscar (mín. 4 letras)..."
                                                value={clientSearch}
                                                onValueChange={setClientSearch}
                                            />
                                            <CommandList>
                                                {isSearchingClient && <div className="p-4 flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</div>}
                                                {!isSearchingClient && clientSearch.length >= 4 && clientOptions.length === 0 && (
                                                    <CommandEmpty className="p-4 text-center text-sm">Nenhum cliente encontrado.</CommandEmpty>
                                                )}
                                                {!isSearchingClient && clientSearch.length < 4 && (
                                                    <CommandEmpty className="p-4 text-center text-sm text-slate-500">Digite pelo menos 4 caracteres para buscar de forma inteligente.</CommandEmpty>
                                                )}
                                                <CommandGroup>
                                                    {clientOptions.map((cli) => (
                                                        <CommandItem
                                                            key={cli.id}
                                                            value={cli.id}
                                                            onSelect={(currentValue) => {
                                                                setValue('clientId', currentValue === watch('clientId') ? "" : cli.id, { shouldValidate: true });
                                                                setSelectedClientName(`${cli.nomeFantasia} - ${cli.cnpj}`);
                                                                setOpenClientCombo(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", watch('clientId') === cli.id ? "opacity-100" : "opacity-0")} />
                                                            {cli.nomeFantasia} <span className="text-muted-foreground ml-2 text-xs">({cli.cnpj})</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.clientId && <span className="text-sm text-red-500 font-medium">O cliente é obrigatório.</span>}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="implantador" className="text-slate-700 font-medium">Implantador</Label>
                                <Input id="implantador" {...register('implantador')} disabled={isReadOnly} className="h-11 border-slate-300" placeholder="Nome do responsável" />
                            </div>

                            <div className="space-y-3 flex flex-col pt-1">
                                <Label className="text-slate-700 font-medium mb-1">Data de Início</Label>
                                <Controller
                                    control={control}
                                    name="dataInicio"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} disabled={isReadOnly} className={cn("w-full pl-3 text-left font-normal h-11 border-slate-300", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                    <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-slate-200 shadow-lg" align="start">
                                                <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            <div className="space-y-3 flex flex-col pt-1">
                                <Label className="text-slate-700 font-medium mb-1">Data Previsão</Label>
                                <Controller
                                    control={control}
                                    name="dataPrevisao"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} disabled={isReadOnly} className={cn("w-full pl-3 text-left font-normal h-11 border-slate-300", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                    <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-slate-200 shadow-lg" align="start">
                                                <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="drive" className="text-slate-700 font-medium">Link do GDrive (Documentação)</Label>
                                <Input id="drive" type="url" {...register('driveDocumentacao')} disabled={isReadOnly} className="h-11 border-slate-300" placeholder="https://drive.google.com/..." />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="status" className="text-slate-700 font-medium">Status da Implantação</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange} disabled={isReadOnly}>
                                            <SelectTrigger className="w-full h-11 border-slate-300 bg-white">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(DeploymentStatusLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.status && <span className="text-sm text-red-500 font-medium">O status é obrigatório.</span>}
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="observacao" className="text-slate-700 font-medium">Observações</Label>
                                <Textarea id="observacao" {...register('observacao')} disabled={isReadOnly} className="min-h-[120px] resize-y border-slate-300" placeholder="Anotações gerais sobre a implantação..." />
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <Button type="button" variant="outline" onClick={() => navigate('/deployments')} className="min-w-[120px] font-medium border-slate-300">
                            {isReadOnly ? 'Voltar' : 'Cancelar'}
                        </Button>
                        {!isReadOnly && (
                            <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 min-w-[140px] font-medium gap-2 shadow-md">
                                <Save className="w-4 h-4" />
                                {mutation.isPending ? 'Salvando...' : 'Salvar Ficha'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
```
Para:
```tsx
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/deployments')} className="shrink-0 bg-card shadow-sm border border-border">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEditing ? 'Editar Ficha de Implantação' : 'Nova Ficha de Implantação'}
                        </h1>
                        <p className="text-muted-foreground mt-1">Preencha os dados abaixo.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-card p-6 rounded-xl border border-border space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Look-up Cliente */}
                            <div className="space-y-3">
                                <Label>Cliente *</Label>
                                <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openClientCombo}
                                            disabled={isReadOnly}
                                            className={cn("w-full justify-between h-11", !watch('clientId') && "text-muted-foreground")}
                                        >
                                            {watch('clientId') ? selectedClientName : "Selecione um cliente..."}
                                            <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 border-border" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Digite p/ buscar (mín. 4 letras)..."
                                                value={clientSearch}
                                                onValueChange={setClientSearch}
                                            />
                                            <CommandList>
                                                {isSearchingClient && <div className="p-4 flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</div>}
                                                {!isSearchingClient && clientSearch.length >= 4 && clientOptions.length === 0 && (
                                                    <CommandEmpty className="p-4 text-center text-sm">Nenhum cliente encontrado.</CommandEmpty>
                                                )}
                                                {!isSearchingClient && clientSearch.length < 4 && (
                                                    <CommandEmpty className="p-4 text-center text-sm text-muted-foreground">Digite pelo menos 4 caracteres para buscar de forma inteligente.</CommandEmpty>
                                                )}
                                                <CommandGroup>
                                                    {clientOptions.map((cli) => (
                                                        <CommandItem
                                                            key={cli.id}
                                                            value={cli.id}
                                                            onSelect={(currentValue) => {
                                                                setValue('clientId', currentValue === watch('clientId') ? "" : cli.id, { shouldValidate: true });
                                                                setSelectedClientName(`${cli.nomeFantasia} - ${cli.cnpj}`);
                                                                setOpenClientCombo(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", watch('clientId') === cli.id ? "opacity-100" : "opacity-0")} />
                                                            {cli.nomeFantasia} <span className="text-muted-foreground ml-2 text-xs">({cli.cnpj})</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.clientId && <span className="text-sm text-destructive font-medium">O cliente é obrigatório.</span>}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="implantador">Implantador</Label>
                                <Input id="implantador" {...register('implantador')} disabled={isReadOnly} className="h-11" placeholder="Nome do responsável" />
                            </div>

                            <div className="space-y-3 flex flex-col pt-1">
                                <Label className="mb-1">Data de Início</Label>
                                <Controller
                                    control={control}
                                    name="dataInicio"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} disabled={isReadOnly} className={cn("w-full pl-3 text-left font-normal h-11", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                    <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-border" align="start">
                                                <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            <div className="space-y-3 flex flex-col pt-1">
                                <Label className="mb-1">Data Previsão</Label>
                                <Controller
                                    control={control}
                                    name="dataPrevisao"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} disabled={isReadOnly} className={cn("w-full pl-3 text-left font-normal h-11", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                                    <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-border" align="start">
                                                <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="drive">Link do GDrive (Documentação)</Label>
                                <Input id="drive" type="url" {...register('driveDocumentacao')} disabled={isReadOnly} className="h-11" placeholder="https://drive.google.com/..." />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="status">Status da Implantação</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange} disabled={isReadOnly}>
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(DeploymentStatusLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.status && <span className="text-sm text-destructive font-medium">O status é obrigatório.</span>}
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <Label htmlFor="observacao">Observações</Label>
                                <Textarea id="observacao" {...register('observacao')} disabled={isReadOnly} className="min-h-[120px] resize-y" placeholder="Anotações gerais sobre a implantação..." />
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => navigate('/deployments')} className="min-w-[120px] font-medium">
                            {isReadOnly ? 'Voltar' : 'Cancelar'}
                        </Button>
                        {!isReadOnly && (
                            <Button type="submit" disabled={mutation.isPending} className="gradient-primary min-w-[140px] font-medium gap-2">
                                <Save className="w-4 h-4" />
                                {mutation.isPending ? 'Salvando...' : 'Salvar Ficha'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
```

- [ ] **Step 2: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/Deployments/Form.tsx
git commit -m "style(implantacoes): alinha formulario aos tokens do app"
```

---

### Task 2: `RecemVr/RecemVrForm.tsx`

**Files:**
- Modify: `frontend/src/pages/RecemVr/RecemVrForm.tsx:90` (wrapper do form)
- Modify: `frontend/src/pages/RecemVr/RecemVrForm.tsx:163` (hover do link externo)
- Modify: `frontend/src/pages/RecemVr/RecemVrForm.tsx:204` (botão de submit)

**Interfaces:** nenhuma — só classes. O ícone `Sparkles` (`text-emerald-600`, linha 83) não é tocado.

- [ ] **Step 1: Wrapper do formulário**

De:
```tsx
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
```
Para:
```tsx
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-5">
```

- [ ] **Step 2: Hover do link do MV067**

De:
```tsx
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600"
```
Para:
```tsx
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
```

- [ ] **Step 3: Botão de submit**

De:
```tsx
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
```
Para:
```tsx
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 gradient-primary"
            >
```

- [ ] **Step 4: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/pages/RecemVr/RecemVrForm.tsx
git commit -m "style(recem-vr): alinha formulario de nova solicitacao aos tokens do app"
```

---

### Task 3: `RecemVr/RecemVrDetail.tsx`

**Files:**
- Modify: `frontend/src/pages/RecemVr/RecemVrDetail.tsx:137-626` (bloco de loading + `return (...)` inteiro)

**Interfaces:** nenhuma — só classes. Nenhum hook, query, mutation ou handler muda. `CRITICIDADE_COLORS`, `STATUS_COLORS`, e os badges "Criticidade Alta"/"Cancelado" não mudam.

- [ ] **Step 1: Substituir o bloco de loading**

De:
```tsx
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }
```
Para:
```tsx
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }
```

- [ ] **Step 2: Substituir o bloco `return (...)` principal**

De (do `return (` na linha 152 até o fechamento da função):
```tsx
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/recem-vr')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-600" />
                {rv.client.nomeFantasia}
              </h1>
              {isAlta && (
                <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                  <AlertTriangle className="w-3 h-3" /> Criticidade Alta
                </Badge>
              )}
              {rv.status === 'CANCELADA' && (
                <Badge className="bg-slate-100 text-slate-500 border-0">Cancelado</Badge>
              )}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0`}>
                  {CRITICIDADE_LABELS[rv.criticidade]}
                </Badge>
                <Badge variant="outline" className={`${STATUS_COLORS[rv.status]} border-0`}>
                  {STATUS_LABELS[rv.status]}
                </Badge>
              </div>

              {/* Ações exclusivas de admin */}
              {isAdmin && rv.status !== 'CANCELADA' && rv.status !== 'FINALIZADA' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Recém VR?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O registro será marcado como cancelado. Esta ação fica registrada no histórico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => cancelarMutation.mutate()}
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todos os acompanhamentos e o histórico serão apagados. Esta ação <strong>não pode ser desfeita</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => removeMutation.mutate()}
                      >
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="solicitacao">
          <TabsList className="w-full">
            <TabsTrigger value="solicitacao" className="flex-1">Solicitação</TabsTrigger>
            <TabsTrigger value="planejamento" className="flex-1">Planejamento</TabsTrigger>
            <TabsTrigger value="acompanhamentos" className="flex-1">
              Acompanhamentos ({rv.acompanhamentos?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
          </TabsList>

          {/* ABA: SOLICITAÇÃO */}
          <TabsContent value="solicitacao">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
                  <p className="font-medium">{rv.client.nomeFantasia}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {rv.client.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Solicitante</p>
                  <p className="font-medium">
                    {rv.solicitante?.profile?.fullName ?? rv.solicitante?.email ?? 'N/A'}
                  </p>
                </div>
              </div>

              {/* MV067 — editável */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    MV067 — Termo de Encerramento
                  </p>
                  {canEdit && !editMv067 && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => { setEditMv067(true); setNovoMv067(rv.mv067 ?? ''); }}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                  )}
                </div>
                {editMv067 ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      placeholder="https://drive.google.com/..."
                      value={novoMv067}
                      onChange={(e) => setNovoMv067(e.target.value)}
                    />
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                      disabled={solicitacaoMutation.isPending}
                      onClick={() => solicitacaoMutation.mutate({ mv067: novoMv067 } as any)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditMv067(false)}>Cancelar</Button>
                  </div>
                ) : rv.mv067 ? (
                  <a href={rv.mv067} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline">
                    <FileText className="w-4 h-4" />
                    Abrir Termo de Encerramento
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não informado</p>
                )}
              </div>

              {/* CRITICIDADE — editável com histórico */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criticidade</p>
                  {canEdit && !editCriticidade && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => { setEditCriticidade(true); setNovaCriticidade(rv.criticidade); }}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                  )}
                </div>
                {editCriticidade ? (
                  <div className="space-y-3">
                    <CriticidadeSelector
                      value={(novaCriticidade || rv.criticidade) as RecemVrCriticidade}
                      onChange={(v) => setNovaCriticidade(v)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={solicitacaoMutation.isPending}
                        onClick={() => solicitacaoMutation.mutate({ criticidade: (novaCriticidade || rv.criticidade) as RecemVrCriticidade })}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditCriticidade(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 text-sm px-3 py-1`}
                  >
                    {CRITICIDADE_LABELS[rv.criticidade]}
                  </Badge>
                )}
              </div>

              {/* RESUMO */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Resumo</p>
                <div className="bg-slate-50 p-3 rounded-md border text-sm text-slate-700 whitespace-pre-wrap">
                  {rv.resumo}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Criado em {format(new Date(rv.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </TabsContent>

          {/* ABA: PLANEJAMENTO */}
          <TabsContent value="planejamento">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Select
                    value={status || rv.status}
                    onValueChange={(v) => setStatus(v as RecemVrStatus)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as RecemVrStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ status: (status || rv.status) as RecemVrStatus })}
                      disabled={planejamentoMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
              </div>

              {/* Analista */}
              <div className="space-y-2">
                <Label>Analista Responsável</Label>
                <div className="flex gap-2">
                  <Select
                    value={analistaId || rv.analistaId || ''}
                    onValueChange={setAnalistaId}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar analista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.profile?.fullName ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ analistaId: analistaId || rv.analistaId || undefined })}
                      disabled={planejamentoMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
                {rv.analista && (
                  <p className="text-sm text-muted-foreground">
                    Atual: {rv.analista.profile?.fullName ?? rv.analista.email}
                  </p>
                )}
              </div>

              {/* 1ª Reunião */}
              <div className="space-y-2">
                <Label>Data da 1ª Reunião</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dataPrimeira || (rv.dataPrimeiraReuniao ? rv.dataPrimeiraReuniao.split('T')[0] : '')}
                    onChange={(e) => setDataPrimeira(e.target.value)}
                    disabled={!canEdit}
                  />
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ dataPrimeiraReuniao: dataPrimeira })}
                      disabled={planejamentoMutation.isPending || !dataPrimeira}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
                {rv.dataPrimeiraReuniao && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(rv.dataPrimeiraReuniao), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
              </div>

              {/* Datas de acompanhamento */}
              <div className="space-y-2">
                <Label>Datas de Acompanhamento Planejadas</Label>
                {rv.datasAcompanhamento.length > 0 ? (
                  <ul className="space-y-1">
                    {rv.datasAcompanhamento.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm bg-slate-50 border rounded px-3 py-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {format(new Date(d), 'dd/MM/yyyy', { locale: ptBR })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhuma data planejada ainda.</p>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      type="date"
                      value={novaDataAcomp}
                      onChange={(e) => setNovaDataAcomp(e.target.value)}
                    />
                    <Button onClick={adicionarData} disabled={!novaDataAcomp || planejamentoMutation.isPending}
                      variant="outline" className="gap-1">
                      <Plus className="w-4 h-4" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ABA: ACOMPANHAMENTOS */}
          <TabsContent value="acompanhamentos">
            <div className="space-y-4">
              {/* Form nova reunião */}
              {canEdit && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-slate-800">Registrar Reunião Realizada</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Data da Reunião *</Label>
                      <Input type="date" value={dataReuniao} onChange={(e) => setDataReuniao(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Ata (texto ou link)</Label>
                    <Textarea placeholder="Cole o link da ata ou escreva o conteúdo..." value={ata}
                      onChange={(e) => setAta(e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-1">
                    <Label>Observações</Label>
                    <Textarea placeholder="Pontos relevantes da reunião..." value={observacao}
                      onChange={(e) => setObservacao(e.target.value)} className="min-h-[60px]" />
                  </div>
                  <Button onClick={() => acompanhamentoMutation.mutate()}
                    disabled={!dataReuniao || acompanhamentoMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 w-full">
                    {acompanhamentoMutation.isPending ? 'Salvando...' : 'Registrar Reunião'}
                  </Button>
                </div>
              )}

              {/* Lista de acompanhamentos */}
              {rv.acompanhamentos && rv.acompanhamentos.length > 0 ? (
                <div className="space-y-3">
                  {rv.acompanhamentos.map((ac) => (
                    <div key={ac.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          {format(new Date(ac.dataReuniao), "dd/MM/yyyy", { locale: ptBR })}
                          {ac.user?.profile?.fullName && (
                            <span className="text-muted-foreground font-normal">• {ac.user.profile.fullName}</span>
                          )}
                        </div>
                        {canEdit && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover acompanhamento?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => removeAcompMutation.mutate(ac.id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      {ac.ata && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-muted-foreground">Ata: </span>
                          {ac.ata.startsWith('http') ? (
                            <a href={ac.ata} target="_blank" rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline">Abrir link</a>
                          ) : (
                            <span className="whitespace-pre-wrap text-slate-700">{ac.ata}</span>
                          )}
                        </div>
                      )}
                      {ac.observacao && (
                        <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded p-2 border">
                          {ac.observacao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-muted-foreground italic">
                  Nenhuma reunião registrada ainda.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA: HISTÓRICO */}
          <TabsContent value="historico">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              {rv.history && rv.history.length > 0 ? (
                <div className="space-y-4">
                  {rv.history.map((h) => (
                    <div key={h.id} className="relative pl-4 border-l-2 border-slate-200 pb-2">
                      <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full -left-[6px] top-1.5 ring-4 ring-white" />
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-slate-800">{h.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {h.user?.profile?.fullName && (
                        <p className="text-xs text-slate-500 mb-1">Por: {h.user.profile.fullName}</p>
                      )}
                      {h.details && (
                        <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded border">
                          {h.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground italic py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Nenhum histórico ainda.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
```
Para:
```tsx
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/recem-vr')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-600" />
                {rv.client.nomeFantasia}
              </h1>
              {isAlta && (
                <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                  <AlertTriangle className="w-3 h-3" /> Criticidade Alta
                </Badge>
              )}
              {rv.status === 'CANCELADA' && (
                <Badge className="bg-slate-100 text-slate-500 border-0">Cancelado</Badge>
              )}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0`}>
                  {CRITICIDADE_LABELS[rv.criticidade]}
                </Badge>
                <Badge variant="outline" className={`${STATUS_COLORS[rv.status]} border-0`}>
                  {STATUS_LABELS[rv.status]}
                </Badge>
              </div>

              {/* Ações exclusivas de admin */}
              {isAdmin && rv.status !== 'CANCELADA' && rv.status !== 'FINALIZADA' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"
                      className="text-primary border-primary/20 hover:bg-primary/10 gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Recém VR?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O registro será marcado como cancelado. Esta ação fica registrada no histórico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        className="gradient-primary"
                        onClick={() => cancelarMutation.mutate()}
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todos os acompanhamentos e o histórico serão apagados. Esta ação <strong>não pode ser desfeita</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => removeMutation.mutate()}
                      >
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="solicitacao">
          <TabsList className="w-full">
            <TabsTrigger value="solicitacao" className="flex-1">Solicitação</TabsTrigger>
            <TabsTrigger value="planejamento" className="flex-1">Planejamento</TabsTrigger>
            <TabsTrigger value="acompanhamentos" className="flex-1">
              Acompanhamentos ({rv.acompanhamentos?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
          </TabsList>

          {/* ABA: SOLICITAÇÃO */}
          <TabsContent value="solicitacao">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
                  <p className="font-medium">{rv.client.nomeFantasia}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {rv.client.cnpj}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Solicitante</p>
                  <p className="font-medium">
                    {rv.solicitante?.profile?.fullName ?? rv.solicitante?.email ?? 'N/A'}
                  </p>
                </div>
              </div>

              {/* MV067 — editável */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    MV067 — Termo de Encerramento
                  </p>
                  {canEdit && !editMv067 && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => { setEditMv067(true); setNovoMv067(rv.mv067 ?? ''); }}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                  )}
                </div>
                {editMv067 ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      placeholder="https://drive.google.com/..."
                      value={novoMv067}
                      onChange={(e) => setNovoMv067(e.target.value)}
                    />
                    <Button size="sm" className="gradient-primary shrink-0"
                      disabled={solicitacaoMutation.isPending}
                      onClick={() => solicitacaoMutation.mutate({ mv067: novoMv067 } as any)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditMv067(false)}>Cancelar</Button>
                  </div>
                ) : rv.mv067 ? (
                  <a href={rv.mv067} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <FileText className="w-4 h-4" />
                    Abrir Termo de Encerramento
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não informado</p>
                )}
              </div>

              {/* CRITICIDADE — editável com histórico */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criticidade</p>
                  {canEdit && !editCriticidade && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => { setEditCriticidade(true); setNovaCriticidade(rv.criticidade); }}>
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                  )}
                </div>
                {editCriticidade ? (
                  <div className="space-y-3">
                    <CriticidadeSelector
                      value={(novaCriticidade || rv.criticidade) as RecemVrCriticidade}
                      onChange={(v) => setNovaCriticidade(v)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="gradient-primary"
                        disabled={solicitacaoMutation.isPending}
                        onClick={() => solicitacaoMutation.mutate({ criticidade: (novaCriticidade || rv.criticidade) as RecemVrCriticidade })}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditCriticidade(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={`${CRITICIDADE_COLORS[rv.criticidade]} border-0 text-sm px-3 py-1`}
                  >
                    {CRITICIDADE_LABELS[rv.criticidade]}
                  </Badge>
                )}
              </div>

              {/* RESUMO */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Resumo</p>
                <div className="bg-muted p-3 rounded-md border text-sm text-foreground whitespace-pre-wrap">
                  {rv.resumo}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Criado em {format(new Date(rv.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </TabsContent>

          {/* ABA: PLANEJAMENTO */}
          <TabsContent value="planejamento">
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Select
                    value={status || rv.status}
                    onValueChange={(v) => setStatus(v as RecemVrStatus)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as RecemVrStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ status: (status || rv.status) as RecemVrStatus })}
                      disabled={planejamentoMutation.isPending}
                      className="gradient-primary"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
              </div>

              {/* Analista */}
              <div className="space-y-2">
                <Label>Analista Responsável</Label>
                <div className="flex gap-2">
                  <Select
                    value={analistaId || rv.analistaId || ''}
                    onValueChange={setAnalistaId}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar analista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.profile?.fullName ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ analistaId: analistaId || rv.analistaId || undefined })}
                      disabled={planejamentoMutation.isPending}
                      className="gradient-primary"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
                {rv.analista && (
                  <p className="text-sm text-muted-foreground">
                    Atual: {rv.analista.profile?.fullName ?? rv.analista.email}
                  </p>
                )}
              </div>

              {/* 1ª Reunião */}
              <div className="space-y-2">
                <Label>Data da 1ª Reunião</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dataPrimeira || (rv.dataPrimeiraReuniao ? rv.dataPrimeiraReuniao.split('T')[0] : '')}
                    onChange={(e) => setDataPrimeira(e.target.value)}
                    disabled={!canEdit}
                  />
                  {canEdit && (
                    <Button
                      onClick={() => planejamentoMutation.mutate({ dataPrimeiraReuniao: dataPrimeira })}
                      disabled={planejamentoMutation.isPending || !dataPrimeira}
                      className="gradient-primary"
                    >
                      Salvar
                    </Button>
                  )}
                </div>
                {rv.dataPrimeiraReuniao && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(rv.dataPrimeiraReuniao), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
              </div>

              {/* Datas de acompanhamento */}
              <div className="space-y-2">
                <Label>Datas de Acompanhamento Planejadas</Label>
                {rv.datasAcompanhamento.length > 0 ? (
                  <ul className="space-y-1">
                    {rv.datasAcompanhamento.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm bg-muted border rounded px-3 py-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(new Date(d), 'dd/MM/yyyy', { locale: ptBR })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhuma data planejada ainda.</p>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      type="date"
                      value={novaDataAcomp}
                      onChange={(e) => setNovaDataAcomp(e.target.value)}
                    />
                    <Button onClick={adicionarData} disabled={!novaDataAcomp || planejamentoMutation.isPending}
                      variant="outline" className="gap-1">
                      <Plus className="w-4 h-4" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ABA: ACOMPANHAMENTOS */}
          <TabsContent value="acompanhamentos">
            <div className="space-y-4">
              {/* Form nova reunião */}
              {canEdit && (
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Registrar Reunião Realizada</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Data da Reunião *</Label>
                      <Input type="date" value={dataReuniao} onChange={(e) => setDataReuniao(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Ata (texto ou link)</Label>
                    <Textarea placeholder="Cole o link da ata ou escreva o conteúdo..." value={ata}
                      onChange={(e) => setAta(e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-1">
                    <Label>Observações</Label>
                    <Textarea placeholder="Pontos relevantes da reunião..." value={observacao}
                      onChange={(e) => setObservacao(e.target.value)} className="min-h-[60px]" />
                  </div>
                  <Button onClick={() => acompanhamentoMutation.mutate()}
                    disabled={!dataReuniao || acompanhamentoMutation.isPending}
                    className="gradient-primary w-full">
                    {acompanhamentoMutation.isPending ? 'Salvando...' : 'Registrar Reunião'}
                  </Button>
                </div>
              )}

              {/* Lista de acompanhamentos */}
              {rv.acompanhamentos && rv.acompanhamentos.length > 0 ? (
                <div className="space-y-3">
                  {rv.acompanhamentos.map((ac) => (
                    <div key={ac.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-primary" />
                          {format(new Date(ac.dataReuniao), "dd/MM/yyyy", { locale: ptBR })}
                          {ac.user?.profile?.fullName && (
                            <span className="text-muted-foreground font-normal">• {ac.user.profile.fullName}</span>
                          )}
                        </div>
                        {canEdit && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover acompanhamento?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => removeAcompMutation.mutate(ac.id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      {ac.ata && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-muted-foreground">Ata: </span>
                          {ac.ata.startsWith('http') ? (
                            <a href={ac.ata} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline">Abrir link</a>
                          ) : (
                            <span className="whitespace-pre-wrap text-foreground">{ac.ata}</span>
                          )}
                        </div>
                      )}
                      {ac.observacao && (
                        <p className="mt-2 text-sm text-muted-foreground bg-muted rounded p-2 border">
                          {ac.observacao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground italic">
                  Nenhuma reunião registrada ainda.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA: HISTÓRICO */}
          <TabsContent value="historico">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              {rv.history && rv.history.length > 0 ? (
                <div className="space-y-4">
                  {rv.history.map((h) => (
                    <div key={h.id} className="relative pl-4 border-l-2 border-border pb-2">
                      <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-[6px] top-1.5 ring-4 ring-background" />
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-foreground">{h.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {h.user?.profile?.fullName && (
                        <p className="text-xs text-muted-foreground mb-1">Por: {h.user.profile.fullName}</p>
                      )}
                      {h.details && (
                        <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded border">
                          {h.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground italic py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  Nenhum histórico ainda.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 3: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/pages/RecemVr/RecemVrDetail.tsx
git commit -m "style(recem-vr): alarga container para max-w-5xl e alinha tokens do detalhe"
```

---

### Task 4: Verificação final

**Files:**
- Nenhum arquivo novo — só verificação do resultado das Tasks 1-3.

- [ ] **Step 1: Grep por resíduos**

Run: `cd frontend && grep -rn "bg-blue-600\|bg-emerald-600\|text-gray-900\|border-slate-\|bg-slate-\|text-slate-\|max-w-3xl" src/pages/Deployments/Form.tsx src/pages/RecemVr/RecemVrForm.tsx src/pages/RecemVr/RecemVrDetail.tsx`
Expected: nenhuma ocorrência (exit code 1 do grep = esperado). Os ícones `Sparkles`/`text-emerald-600` (decorativos, não tocados por decisão de escopo) usam `text-emerald-600` — confirme que esse grep não os captura (o padrão busca só `bg-emerald-600`, não `text-emerald-600`, então isso é esperado e não deve aparecer como problema).

- [ ] **Step 2: Build de verificação final**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 3: Checar visualmente**

Rodar `npm run dev` e abrir `/deployments/new` (ou editar uma implantação existente), `/recem-vr/new`, e um Recém VR existente (`/recem-vr/:id`). Confirmar: formulários com bordas/labels no tom neutro certo (sem slate visível), botões de submit em laranja; a tela de detalhe do Recém VR mais larga (não mais espremida em ~768px), com as 4 abas (Solicitação/Planejamento/Acompanhamentos/Histórico) e os editores inline de campo (MV067, Criticidade, Status, Analista, Data 1ª Reunião) continuando a salvar normalmente; badges de criticidade/status continuam com as cores de sempre. Repetir em modo escuro.

Esta etapa não pode ser automatizada nesta sessão (sem acesso a navegador conectado nem credenciais de login) — registrar como pendência se quem executar o plano também não tiver acesso interativo.
