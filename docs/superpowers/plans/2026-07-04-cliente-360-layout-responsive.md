# Cliente 360 Layout & Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Cliente 360 page (`/clients/:id`) from a narrow, horizontally-tabbed layout into a full-width, settings-style page with a vertical section rail on desktop and a `<Select>` dropdown on mobile, so its 8 sections and data tables get real room instead of being squeezed into a 768px column.

**Architecture:** Same Radix/shadcn `Tabs` primitive already in use, re-arranged: `TabsList` becomes a vertical rail (`hidden lg:flex flex-col`) paired with a `<Select>` that's visible only below the `lg` breakpoint, both driving the same controlled `Tabs` state. The 7 existing `TabsContent` sections keep their exact current JSX/queries; only the "Visão Geral" section gains the cadastral form (extracted into a local JSX variable so it isn't duplicated between the editing and non-editing states). Two small, unrelated table components get an `overflow-x-auto` wrapper so their tables can scroll horizontally on narrow viewports instead of squeezing columns.

**Tech Stack:** React + Vite + TypeScript, shadcn/ui (Radix Tabs, Select), Tailwind CSS (`lg:` breakpoint, matching the breakpoint already used by `DashboardLayout` for its own desktop-sidebar/mobile-drawer split).

## Global Constraints

- Scope is limited to `frontend/src/pages/Clients/Form.tsx`, `frontend/src/pages/Clients/ClientInfrastructureTab.tsx`, and `frontend/src/pages/Clients/ClientCredentialsTab.tsx` — no other page, no backend, no data-fetching/query/mutation logic changes.
- No new dependencies. Reuse existing shadcn primitives (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`; `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`) and the existing `cn` helper from `@/lib/utils`.
- Desktop/mobile breakpoint is `lg:` (1024px) — the same breakpoint `DashboardLayout` already uses for its own sidebar-vs-drawer split (`hidden lg:flex` / `lg:hidden`).
- Rail visual style must reuse the existing design vocabulary already used in `DashboardLayout`'s own sidebar: active item `bg-primary/5 text-primary`, inactive `text-muted-foreground`, hover `hover:bg-muted/40`, `rounded-xl` corners.
- This repo has no frontend test runner — verification is `cd frontend && npm run build` plus a manual browser walkthrough (documented per task), same as every prior frontend task in this project.

---

### Task 1: Rework `Form.tsx` into a rail (desktop) + Select (mobile) layout

**Files:**
- Modify: `frontend/src/pages/Clients/Form.tsx` (full-file replacement — nearly every part of the render function changes; safer to replace the whole file than patch fragments)

**Interfaces:**
- Consumes: `ClientInfrastructureTab` (`clientId: string` prop, default export from `./ClientInfrastructureTab`), `ClientCredentialsTab` (same shape, from `./ClientCredentialsTab`) — both unchanged, already exist.
- No new exports — `ClientForm` remains the default export with the same signature (no props, reads `id` from `useParams()`).

- [ ] **Step 1: Replace the full contents of `frontend/src/pages/Clients/Form.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { clientService, CreateClientDto } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, FileText, Database, Clock, History as HistoryIcon, MapIcon, LifeBuoy } from 'lucide-react';
import { assessmentService } from '@/services/assessmentService';
import { migrationService, MigrationStatusLabels } from '@/services/migrationService';
import { deploymentService, DeploymentStatusLabels } from '@/services/deploymentService';
import { recemVrService } from '@/services/recemVrService';
import { STATUS_LABELS as RECEM_VR_STATUS_LABELS } from '@/types/recemVr';
import { cn } from '@/lib/utils';
import ClientInfrastructureTab from './ClientInfrastructureTab';
import ClientCredentialsTab from './ClientCredentialsTab';

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

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;
    const [activeSection, setActiveSection] = useState<string>('visao-geral');

    const { register, handleSubmit, reset } = useForm<CreateClientDto>();

    const { data: client, isLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: () => clientService.findOne(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (client) {
            reset(client);
        }
    }, [client, reset]);

    const { data: assessments } = useQuery({
        queryKey: ['client-assessments', id],
        queryFn: () => assessmentService.findByClient(id!),
        enabled: isEditing,
    });

    const { data: migrations } = useQuery({
        queryKey: ['client-migrations', id],
        queryFn: () => migrationService.findByClient(id!),
        enabled: isEditing,
    });

    const { data: deployments } = useQuery({
        queryKey: ['client-deployments', id],
        queryFn: () => deploymentService.findByClient(id!),
        enabled: isEditing,
    });

    const { data: recemVrList } = useQuery({
        queryKey: ['client-recem-vr', id],
        queryFn: () => recemVrService.findByClient(id!),
        enabled: isEditing,
    });

    const mutation = useMutation({
        mutationFn: (data: CreateClientDto) => {
            if (isEditing) {
                return clientService.update(id!, data);
            }
            return clientService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({ title: 'Sucesso', description: `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso.` });
            navigate('/clients');
        },
        onError: (error) => {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao salvar cliente.', variant: 'destructive' });
        },
    });

    const onSubmit = (data: CreateClientDto) => {
        mutation.mutate(data);
    };

    if (isEditing && isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-8">Carregando...</div>
            </DashboardLayout>
        )
    }

    const cadastralForm = (
        <Card>
            <CardHeader>
                <CardTitle>Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                            <Input id="nomeFantasia" {...register('nomeFantasia', { required: true })} placeholder="Ex: Empresa X" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="razaoSocial">Razão Social</Label>
                            <Input id="razaoSocial" {...register('razaoSocial')} placeholder="Ex: Empresa X LTDA" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ *</Label>
                            <Input id="cnpj" {...register('cnpj', { required: true })} placeholder="00.000.000/0000-00" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input id="endereco" {...register('endereco')} placeholder="Rua, número, cidade..." />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h3 className="font-semibold mb-4">Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contatoNome">Nome do Contato</Label>
                                <Input id="contatoNome" {...register('contatoNome')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contatoEmail">Email</Label>
                                <Input id="contatoEmail" type="email" {...register('contatoEmail')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contatoTelefone">Telefone</Label>
                                <Input id="contatoTelefone" {...register('contatoTelefone')} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/clients')}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="gradient-primary" disabled={mutation.isPending}>
                            <Save className="w-4 h-4 mr-2" />
                            {mutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

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
                                <SelectTrigger>
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

- [ ] **Step 2: Verify the frontend builds**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Manual verification — desktop**

Run `cd backend && npm run start:dev` and `cd frontend && npm run dev` (or use the already-running dev servers). Open `/clients/:id` for an existing client at a desktop window width (≥1024px) and confirm:
- A vertical rail of 8 items appears on the left (not a horizontal row), each a full-width rounded button; the active section has a subtle tinted background.
- The page content is NOT capped at a narrow column — tables in Infraestrutura/Vault sections use the wide content area.
- Clicking each rail item switches the content on the right without a page reload.
- The `<Select>` dropdown is NOT visible on desktop.

- [ ] **Step 4: Manual verification — mobile width**

Resize the browser window (or use devtools device toolbar) to below 1024px width and confirm:
- The vertical rail disappears; a `<Select>` labeled with the current section appears instead.
- Opening the select and choosing a different section switches the content below it.
- No 8-item row of tabs wraps into multiple messy lines anywhere.

- [ ] **Step 5: Manual verification — creating a new client**

Navigate to `/clients/new` and confirm the page still shows just the header and the cadastral form (no rail, no Select, no tabs) — unchanged from before this task, still reasonably narrow (`max-w-3xl`).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Clients/Form.tsx
git commit -m "refactor(clients): rework Cliente 360 into a rail+Select layout for responsiveness"
```

---

### Task 2: Horizontal scroll wrapper for Infraestrutura and Vault tables

**Files:**
- Modify: `frontend/src/pages/Clients/ClientInfrastructureTab.tsx:183` (the `<Table>` element)
- Modify: `frontend/src/pages/Clients/ClientCredentialsTab.tsx:211` (the `<Table>` element)

**Interfaces:**
- No interface changes — purely wraps existing JSX in a scroll container.

- [ ] **Step 1: Wrap the infrastructure table**

In `frontend/src/pages/Clients/ClientInfrastructureTab.tsx`, find:

```tsx
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
```

Replace the opening `<Table>` line and the file's matching closing `</Table>` so the whole table is wrapped in a scroll container:

```tsx
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
```

(re-indent the rest of the existing `<Table>...</Table>` block one level deeper to stay valid JSX), and change the file's closing:

```tsx
        </Table>
      </div>
```

- [ ] **Step 2: Wrap the credentials table**

In `frontend/src/pages/Clients/ClientCredentialsTab.tsx`, apply the identical change: wrap the existing `<Table>...</Table>` block (starting at the `<Table>` line right after the create-dialog `</Dialog>` closes) in a `<div className="overflow-x-auto">...</div>`, re-indenting the contents one level deeper.

- [ ] **Step 3: Verify the frontend builds**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 4: Manual verification**

At a narrow browser width (e.g. 375px, phone-sized), open the Infraestrutura and Vault sections of an existing client and confirm each table scrolls horizontally within its own card (a horizontal scrollbar appears under the table) instead of squeezing all columns to fit, and the rest of the page (rail/Select, section switching) stays fixed in place while only the table scrolls.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Clients/ClientInfrastructureTab.tsx frontend/src/pages/Clients/ClientCredentialsTab.tsx
git commit -m "fix(clients): wrap vault/infrastructure tables in overflow-x-auto for mobile"
```

## Post-implementation checklist

- [ ] `cd frontend && npm run build` — succeeds.
- [ ] Manual walkthrough from Task 1 Steps 3-5 and Task 2 Step 4, repeated end-to-end after both tasks are done.
- [ ] Confirm no other page was touched (`git diff --stat` against the base commit should show exactly 3 files).
