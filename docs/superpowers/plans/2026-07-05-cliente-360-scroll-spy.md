# Cliente 360 — Header sticky + abas-âncora com scroll-spy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o rail vertical + `Select` mobile do Cliente 360 (`frontend/src/pages/Clients/Form.tsx`, ramo `isEditing`) por um scroll único com header+abas sticky, aba ativa calculada por `IntersectionObserver` (scroll-spy), sem mudar nenhum dado ou lógica de negócio das 8 seções.

**Architecture:** Todo o trabalho fica em um único arquivo (`Form.tsx`). Task 1 adiciona a lógica nova (refs, observer, helper de scroll) sem tocar no JSX renderizado ainda — o app continua com a cara antiga até a Task 2 substituir o `return` inteiro do ramo `isEditing` pela nova estrutura (header+abas sticky + seções empilhadas), preservando o conteúdo interno de cada seção exatamente como está hoje.

**Tech Stack:** React 18 + TypeScript, `IntersectionObserver` (API nativa do browser, sem biblioteca nova), Tailwind CSS (tokens do sub-projeto 1, já disponíveis), shadcn/ui (`Card`, `Button` — já usados no arquivo).

## Global Constraints

- Só `frontend/src/pages/Clients/Form.tsx` é tocado. `ClientInfrastructureTab.tsx`, `ClientCredentialsTab.tsx`, `DashboardLayout.tsx` não mudam.
- O ramo `!isEditing` (formulário de cliente novo) muda só a estrutura do wrapper externo (perde o `max-w-3xl` do container pai compartilhado, que vira condicional só dele) — o conteúdo do formulário (`cadastralForm`) continua idêntico e usado nos dois ramos.
- Nenhum dado/query muda: `assessments`, `migrations`, `deployments`, `recemVrList`, `client` continuam vindo exatamente dos mesmos `useQuery` de hoje.
- Seção "Dados cadastrais" (primeira seção, era "Visão Geral") continua com o `cadastralForm` real e editável — não vira somente leitura.
- Sem chip de fase, sem botão "Exportar" — não existem no código atual, não são adicionados.
- Offset de scroll/observer: **110px** (mesmo valor usado nos dois lugares: `scroll-mt-[110px]` do Tailwind em cada seção, e a string `rootMargin` do `IntersectionObserver`). Esses dois "110" não podem ser extraídos pra uma constante JS compartilhada — Tailwind precisa do valor como string literal na classe pra funcionar (não aceita interpolação de variável), então o número aparece duas vezes no arquivo; ao ajustar um, ajustar o outro.
- Depois de cada task, `cd frontend && npm run build` precisa terminar sem erro antes de commitar.

---

### Task 1: Estado e lógica de scroll-spy (sem mudar o JSX renderizado ainda)

**Files:**
- Modify: `frontend/src/pages/Clients/Form.tsx:1` (import do `react`)
- Modify: `frontend/src/pages/Clients/Form.tsx:24-33` (array `SECTIONS`)
- Modify: `frontend/src/pages/Clients/Form.tsx:41` (estado inicial `activeSection`)
- Modify: `frontend/src/pages/Clients/Form.tsx` (novo bloco de refs/efeito/helper, logo após o `if (isEditing && isLoading) { ... }`)

**Interfaces:**
- Produces: `sectionRefs: React.MutableRefObject<Record<string, HTMLElement | null>>`, `scrollToSection(value: string): void` — consumidos pela Task 2.
- Consumes: `isEditing`, `activeSection`/`setActiveSection` (já existentes).

- [ ] **Step 1: Adicionar `useRef` ao import do React (linha 1)**

De:
```tsx
import { useEffect, useState } from 'react';
```
Para:
```tsx
import { useEffect, useState, useRef } from 'react';
```

- [ ] **Step 2: Renomear a primeira seção em `SECTIONS` (linhas 24-33)**

De:
```tsx
const SECTIONS = [
    { value: 'visao-geral', label: 'Visão Geral' },
    { value: 'validacoes', label: 'Validações' },
    { value: 'migracoes', label: 'Migrações' },
    { value: 'implantacoes', label: 'Implantações' },
    { value: 'recem-vr', label: 'Recém VR' },
    { value: 'infraestrutura', label: 'Infraestrutura' },
    { value: 'vault', label: 'Vault de Acessos' },
    { value: 'historico', label: 'Histórico' },
] as const;
```
Para:
```tsx
const SECTIONS = [
    { value: 'dados-cadastrais', label: 'Dados cadastrais' },
    { value: 'validacoes', label: 'Validações' },
    { value: 'migracoes', label: 'Migrações' },
    { value: 'implantacoes', label: 'Implantações' },
    { value: 'recem-vr', label: 'Recém VR' },
    { value: 'infraestrutura', label: 'Infraestrutura' },
    { value: 'vault', label: 'Vault de Acessos' },
    { value: 'historico', label: 'Histórico' },
] as const;
```

- [ ] **Step 3: Trocar o valor inicial de `activeSection` (linha 41)**

De:
```tsx
    const [activeSection, setActiveSection] = useState<string>('visao-geral');
```
Para:
```tsx
    const [activeSection, setActiveSection] = useState<string>('dados-cadastrais');
```

- [ ] **Step 4: Adicionar refs, o efeito de scroll-spy e o helper de clique**

**Importante:** este bloco precisa ficar ANTES do `if (isEditing && isLoading) { return (...) }` (que é um retorno antecipado condicional) — hooks (`useRef`/`useEffect`) nunca podem ser chamados depois de um `return` condicional, senão a contagem de hooks muda entre renders assim que `isLoading` virar `false` e o React quebra em runtime ("Rendered fewer hooks than expected"). Inserir logo depois de:
```tsx
    const onSubmit = (data: CreateClientDto) => {
        mutation.mutate(data);
    };
```
e ANTES de:
```tsx
    if (isEditing && isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-8">Carregando...</div>
            </DashboardLayout>
        )
    }
```
adicionar:
```tsx
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        if (!isEditing) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((entry) => entry.isIntersecting);
                if (visible.length === 0) return;
                const top = visible.reduce((best, entry) =>
                    entry.intersectionRatio > best.intersectionRatio ? entry : best
                );
                setActiveSection(top.target.id);
            },
            { rootMargin: '-110px 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        SECTIONS.forEach((section) => {
            const el = sectionRefs.current[section.value];
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [isEditing]);

    const scrollToSection = (value: string) => {
        setActiveSection(value);
        sectionRefs.current[value]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
```

- [ ] **Step 5: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros. `sectionRefs`/`scrollToSection` ainda não são usados no JSX (isso é a Task 2) — isso não quebra o build, só pode gerar um aviso de lint (não faz parte do `vite build`).

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/pages/Clients/Form.tsx
git commit -m "feat(cliente-360): adiciona logica de scroll-spy (refs, observer, helper)"
```

---

### Task 2: Substituir o layout de rail/Select pela estrutura de scroll único

**Files:**
- Modify: `frontend/src/pages/Clients/Form.tsx:11-12` (remover imports de `Tabs`/`Select`)
- Modify: `frontend/src/pages/Clients/Form.tsx` (bloco `return (...)` inteiro, do `return (` até o fechamento da função)

**Interfaces:**
- Consumes: `sectionRefs`, `scrollToSection`, `activeSection` (Task 1); `client`, `id`, `assessments`, `migrations`, `deployments`, `recemVrList`, `cadastralForm` (já existentes, sem mudança de forma).

- [ ] **Step 1: Remover os imports de `Tabs` e `Select` (linhas 11-12)**

Remover as duas linhas inteiras:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```
(Nenhum outro lugar do arquivo usa `Tabs`/`Select` depois desta task.)

- [ ] **Step 2: Substituir o `return (...)` inteiro**

Localizar o bloco que começa em:
```tsx
    return (
        <DashboardLayout>
            <div className={cn('flex flex-col gap-6', isEditing ? 'w-full' : 'max-w-3xl mx-auto')}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div>
                            <h1 className="text-2xl font-bold font-display">
                                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
                            </h1>
                            {isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 gap-2"
                                    onClick={() => navigate(`/?clientId=${id}&create=true`)}
                                >
                                    <FileText className="w-4 h-4" />
                                    Criar Validação
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {!isEditing && cadastralForm}

                {isEditing && (
                    <Tabs
                        value={activeSection}
                        onValueChange={setActiveSection}
                        orientation="vertical"
                        className="flex flex-col lg:flex-row gap-6 pb-8"
                    >
                        <div className="lg:hidden">
                            <Select value={activeSection} onValueChange={setActiveSection}>
                                <SelectTrigger aria-label="Seção">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SECTIONS.map((section) => (
                                        <SelectItem key={section.value} value={section.value}>
                                            {section.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <TabsList className="hidden lg:flex flex-col h-auto w-56 shrink-0 items-stretch justify-start gap-1 bg-transparent p-0">
                            {SECTIONS.map((section) => (
                                <TabsTrigger
                                    key={section.value}
                                    value={section.value}
                                    className="w-full justify-start rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/40 hover:text-foreground"
                                >
                                    {section.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex-1 min-w-0">
                            <TabsContent value="visao-geral" className="mt-0 space-y-6">
                                {cadastralForm}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-2xl font-bold">{assessments?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">Validações</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-2xl font-bold">{migrations?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">Migrações</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-2xl font-bold">{deployments?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">Implantações</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-2xl font-bold">{recemVrList?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">Recém VR</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="validacoes" className="mt-0">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Validações (Assessments)</CardTitle></CardHeader>
                                    <CardContent>
                                        {assessments && assessments.length > 0 ? (
                                            <div className="space-y-3">
                                                {assessments.map((assessment) => (
                                                    <div key={assessment.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-sm">Validado em {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}</p>
                                                            <p className="text-xs text-muted-foreground uppercase">{assessment.status}</p>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/?clientId=${id}&view=${assessment.id}`)}>
                                                            Abrir
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma validação encontrada.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="migracoes" className="mt-0">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Migrações</CardTitle></CardHeader>
                                    <CardContent>
                                        {migrations && migrations.length > 0 ? (
                                            <div className="space-y-3">
                                                {migrations.map((migration) => (
                                                    <div key={migration.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-sm flex items-center gap-1">
                                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                                {new Date(migration.createdAt || '').toLocaleDateString('pt-BR')}
                                                                <span className="ml-1 text-xs text-muted-foreground">({migration.tipoMigracao})</span>
                                                            </p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${migration.status === 'concluida' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                {MigrationStatusLabels[migration.status] || migration.status}
                                                            </span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/migration/${migration.id}`)}>
                                                            Abrir
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma migração encontrada.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="implantacoes" className="mt-0">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><MapIcon className="w-5 h-5 text-primary" /> Implantações</CardTitle></CardHeader>
                                    <CardContent>
                                        {deployments && deployments.length > 0 ? (
                                            <div className="space-y-3">
                                                {deployments.map((deployment) => (
                                                    <div key={deployment.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-sm">{deployment.implantador || 'Sem implantador definido'}</p>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                                {DeploymentStatusLabels[deployment.status]}
                                                            </span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/deployments/${deployment.id}`)}>
                                                            Abrir
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma implantação encontrada.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="recem-vr" className="mt-0">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-primary" /> Recém VR</CardTitle></CardHeader>
                                    <CardContent>
                                        {recemVrList && recemVrList.length > 0 ? (
                                            <div className="space-y-3">
                                                {recemVrList.map((recemVr) => (
                                                    <div key={recemVr.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-sm">{recemVr.resumo}</p>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                                {RECEM_VR_STATUS_LABELS[recemVr.status]}
                                                            </span>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/recem-vr/${recemVr.id}`)}>
                                                            Abrir
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum Recém VR encontrado.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="infraestrutura" className="mt-0">
                                <Card>
                                    <CardContent className="pt-6">
                                        <ClientInfrastructureTab clientId={id!} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="vault" className="mt-0">
                                <Card>
                                    <CardContent className="pt-6">
                                        <ClientCredentialsTab clientId={id!} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="historico" className="mt-0">
                                {(client as any)?.history && (client as any).history.length > 0 ? (
                                    <Card>
                                        <CardHeader><CardTitle className="flex items-center gap-2"><HistoryIcon className="w-5 h-5 text-primary" /> Histórico de Alterações</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {(client as any).history.map((hist: any) => (
                                                    <div key={hist.id} className="flex gap-4 p-3 border rounded-lg bg-card text-sm">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-medium text-foreground">{hist.action}</p>
                                                                <span className="text-muted-foreground text-xs">
                                                                    {new Date(hist.createdAt).toLocaleString('pt-BR')}
                                                                </span>
                                                            </div>
                                                            <p className="text-muted-foreground">
                                                                Por: {hist.user?.profile?.fullName || hist.user?.email || 'Sistema'}
                                                            </p>
                                                            {hist.details && (
                                                                <div className="mt-2 text-xs bg-muted/50 p-2 rounded-md space-y-1">
                                                                    {(() => {
                                                                        try {
                                                                            const parsed = JSON.parse(hist.details);
                                                                            return Object.entries(parsed).map(([campo, val]: [string, any]) => (
                                                                                <div key={campo} className="flex flex-wrap gap-1">
                                                                                    <span className="font-semibold text-foreground">{campo}:</span>
                                                                                    <span className="text-red-500 line-through">{typeof val.de === 'object' ? JSON.stringify(val.de) : String(val.de ?? '(vazio)')}</span>
                                                                                    <span className="text-muted-foreground">→</span>
                                                                                    <span className="text-green-600">{typeof val.para === 'object' ? JSON.stringify(val.para) : String(val.para ?? '(vazio)')}</span>
                                                                                </div>
                                                                            ));
                                                                        } catch (e) {
                                                                            return <span className="text-muted-foreground font-mono break-all">{hist.details}</span>;
                                                                        }
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma alteração registrada ainda.</p>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </div>
        </DashboardLayout>
    );
}
```

e substituir **o bloco inteiro acima** por:

```tsx
    return (
        <DashboardLayout>
            {!isEditing && (
                <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-bold font-display">Novo Cliente</h1>
                    </div>
                    {cadastralForm}
                </div>
            )}

            {isEditing && (
                <div className="flex flex-col gap-6">
                    <div className="sticky top-0 z-20 -mx-4 lg:-mx-8 bg-card border-b border-border">
                        <div className="px-4 lg:px-8 py-3.5 flex items-center gap-3 flex-wrap">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h1 className="font-display text-2xl font-bold">{client?.nomeFantasia}</h1>
                            <span className="font-mono text-xs text-muted-foreground">#{id?.slice(0, 8).toUpperCase()}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto gap-2"
                                onClick={() => navigate(`/?clientId=${id}&create=true`)}
                            >
                                <FileText className="w-4 h-4" />
                                Criar Validação
                            </Button>
                        </div>
                        <div className="px-4 lg:px-8 overflow-x-auto">
                            <div className="flex gap-1 min-w-max">
                                {SECTIONS.map((section) => (
                                    <button
                                        key={section.value}
                                        type="button"
                                        onClick={() => scrollToSection(section.value)}
                                        className={cn(
                                            "px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                            activeSection === section.value
                                                ? "border-primary text-foreground font-semibold"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 pb-8">
                        <section
                            id="dados-cadastrais"
                            ref={(el) => (sectionRefs.current['dados-cadastrais'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            {cadastralForm}
                        </section>

                        <section
                            id="validacoes"
                            ref={(el) => (sectionRefs.current['validacoes'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Validações
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{assessments?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {assessments && assessments.length > 0 ? (
                                        <div className="space-y-3">
                                            {assessments.map((assessment) => (
                                                <div key={assessment.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm">Validado em {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}</p>
                                                        <p className="text-xs text-muted-foreground uppercase">{assessment.status}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/?clientId=${id}&view=${assessment.id}`)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma validação encontrada.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="migracoes"
                            ref={(el) => (sectionRefs.current['migracoes'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="w-5 h-5 text-primary" />
                                        Migrações
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{migrations?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {migrations && migrations.length > 0 ? (
                                        <div className="space-y-3">
                                            {migrations.map((migration) => (
                                                <div key={migration.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                                            {new Date(migration.createdAt || '').toLocaleDateString('pt-BR')}
                                                            <span className="ml-1 text-xs text-muted-foreground">({migration.tipoMigracao})</span>
                                                        </p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${migration.status === 'concluida' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {MigrationStatusLabels[migration.status] || migration.status}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/migration/${migration.id}`)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma migração encontrada.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="implantacoes"
                            ref={(el) => (sectionRefs.current['implantacoes'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapIcon className="w-5 h-5 text-primary" />
                                        Implantações
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{deployments?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {deployments && deployments.length > 0 ? (
                                        <div className="space-y-3">
                                            {deployments.map((deployment) => (
                                                <div key={deployment.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm">{deployment.implantador || 'Sem implantador definido'}</p>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                            {DeploymentStatusLabels[deployment.status]}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/deployments/${deployment.id}`)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma implantação encontrada.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="recem-vr"
                            ref={(el) => (sectionRefs.current['recem-vr'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LifeBuoy className="w-5 h-5 text-primary" />
                                        Recém VR
                                        <span className="font-mono text-xs text-muted-foreground font-normal">{recemVrList?.length ?? 0}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recemVrList && recemVrList.length > 0 ? (
                                        <div className="space-y-3">
                                            {recemVrList.map((recemVr) => (
                                                <div key={recemVr.id} className="flex justify-between items-center p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-sm">{recemVr.resumo}</p>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                            {RECEM_VR_STATUS_LABELS[recemVr.status]}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/recem-vr/${recemVr.id}`)}>
                                                        Abrir
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum Recém VR encontrado.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="infraestrutura"
                            ref={(el) => (sectionRefs.current['infraestrutura'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientInfrastructureTab clientId={id!} />
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="vault"
                            ref={(el) => (sectionRefs.current['vault'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientCredentialsTab clientId={id!} />
                                </CardContent>
                            </Card>
                        </section>

                        <section
                            id="historico"
                            ref={(el) => (sectionRefs.current['historico'] = el)}
                            className="scroll-mt-[110px]"
                        >
                            {(client as any)?.history && (client as any).history.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <HistoryIcon className="w-5 h-5 text-primary" />
                                            Histórico de Alterações
                                            <span className="font-mono text-xs text-muted-foreground font-normal">{(client as any).history.length}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {(client as any).history.map((hist: any) => (
                                                <div key={hist.id} className="flex gap-4 p-3 border rounded-lg bg-card text-sm">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium text-foreground">{hist.action}</p>
                                                            <span className="text-muted-foreground text-xs">
                                                                {new Date(hist.createdAt).toLocaleString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        <p className="text-muted-foreground">
                                                            Por: {hist.user?.profile?.fullName || hist.user?.email || 'Sistema'}
                                                        </p>
                                                        {hist.details && (
                                                            <div className="mt-2 text-xs bg-muted/50 p-2 rounded-md space-y-1">
                                                                {(() => {
                                                                    try {
                                                                        const parsed = JSON.parse(hist.details);
                                                                        return Object.entries(parsed).map(([campo, val]: [string, any]) => (
                                                                            <div key={campo} className="flex flex-wrap gap-1">
                                                                                <span className="font-semibold text-foreground">{campo}:</span>
                                                                                <span className="text-red-500 line-through">{typeof val.de === 'object' ? JSON.stringify(val.de) : String(val.de ?? '(vazio)')}</span>
                                                                                <span className="text-muted-foreground">→</span>
                                                                                <span className="text-green-600">{typeof val.para === 'object' ? JSON.stringify(val.para) : String(val.para ?? '(vazio)')}</span>
                                                                            </div>
                                                                        ));
                                                                    } catch (e) {
                                                                        return <span className="text-muted-foreground font-mono break-all">{hist.details}</span>;
                                                                    }
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma alteração registrada ainda.</p>
                            )}
                        </section>
                    </div>
                </div>
            )}
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
git add src/pages/Clients/Form.tsx
git commit -m "feat(cliente-360): header e abas-ancora sticky, scroll unico, contadores por secao"
```

---

### Task 3: Verificação final

**Files:**
- Nenhum arquivo novo — só verificação do resultado das Tasks 1-2.

- [ ] **Step 1: Grep por resíduos do layout antigo**

Run: `cd frontend && grep -n "visao-geral\|TabsTrigger\|TabsContent\|SelectTrigger\|orientation=\"vertical\"" src/pages/Clients/Form.tsx`
Expected: nenhuma ocorrência (exit code 1 do grep = esperado).

- [ ] **Step 2: Build de verificação final**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 3: Checar visualmente**

Rodar `npm run dev`, abrir um Cliente 360 existente (`/clients/:id`) e confirmar: um scroll único percorre as 8 seções (sem abas verticais nem dropdown mobile); a régua de abas no topo destaca a seção visível conforme rola a página; clicar numa aba rola suavemente até a seção certa, sem ficar escondida atrás do header/abas sticky; em telas estreitas a régua de abas tem scroll horizontal; o nome do cliente aparece no header (não mais "Editar Cliente" genérico); "Dados cadastrais" continua editável e salva normalmente. Repetir em modo escuro.

Esta etapa não pode ser automatizada nesta sessão (sem acesso a navegador conectado nem credenciais de login) — registrar como pendência se quem executar o plano também não tiver acesso interativo.
