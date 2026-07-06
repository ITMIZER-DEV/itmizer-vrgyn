# Cliente 360 — Documentação, Abas Reais e Tickets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No Cliente 360 (`frontend/src/pages/Clients/Form.tsx`), trocar o scroll-spy por abas reais, expor o link do Drive já existente como um botão "Documentação" no cabeçalho, e adicionar uma nova aba "Tickets" para cadastro manual de tickets do Movidesk (data, número, assunto, classificação de urgência).

**Architecture:** Três mudanças independentes no mesmo arquivo de tela (`Form.tsx`) mais uma entidade CRUD nova ponta a ponta (`ClientTicket`), seguindo exatamente o padrão já estabelecido por `ClientInfrastructure`/`ClientCredential` (módulo NestJS espelho + Prisma model + service/dto/service TS no frontend + componente de aba com tabela e diálogo de formulário).

**Tech Stack:** NestJS + Prisma (backend), React + react-hook-form + TanStack Query + shadcn/ui (frontend), Jest (testes de serviço no backend).

## Global Constraints

- `driveLink` já existe no schema Prisma, DTO e `ClientModal.tsx` — não recriar o campo, só consumir.
- Botão "Adicionar Link"/edição de `driveLink` só aparece para quem tem `canSpecial` em `usePermissions('/clients')` (mesma regra usada em `ClientModal.tsx`).
- CRUD de tickets é gated por `canEdit` de `usePermissions('/clients')`, igual a `ClientInfrastructureTab.tsx`.
- Classificação do ticket é uma lista fixa de urgência: Baixa, Média, Alta, Crítica — sem integração com a API do Movidesk.
- Nenhuma mudança em `ClientInfrastructureTab.tsx`, `ClientCredentialsTab.tsx`, `DashboardLayout.tsx`, ou nas queries de `assessments`/`migrations`/`deployments`/`recemVrList` (continuam todas carregadas juntas no topo de `Form.tsx`, sem lazy-loading por aba).

---

### Task 1: Cliente 360 — converter scroll-spy em abas reais

**Files:**
- Modify: `frontend/src/pages/Clients/Form.tsx`

**Interfaces:**
- Consumes: nada de tarefas anteriores.
- Produces: `activeSection` (state `string`, já existia) passa a controlar exclusivamente qual seção é renderizada no DOM — tarefas futuras (Task 7) dependem de `activeSection === 'tickets'` para exibir a nova aba.

- [ ] **Step 1: Remover o import não usado `useRef` e a lógica de scroll-spy**

Em `frontend/src/pages/Clients/Form.tsx`, troque a linha 1:

```tsx
import { useEffect, useState, useRef } from 'react';
```

por:

```tsx
import { useEffect, useState } from 'react';
```

Remova o bloco (linhas 101-128 no arquivo atual):

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
    }, [isEditing, isLoading]);

    const scrollToSection = (value: string) => {
        setActiveSection(value);
        sectionRefs.current[value]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

```

Não substitua por nada — a função de clique agora é inline no passo 3.

- [ ] **Step 2: Rodar o build para confirmar que só falta o clique da aba**

Run: `cd frontend && npm run build`
Expected: erro do tipo `Cannot find name 'scrollToSection'` (linha do botão da régua de abas) — confirma que os únicos usos restantes são o botão, tratado no próximo passo.

- [ ] **Step 3: Trocar o clique da régua de abas de "rolar" para "trocar seção"**

Troque:

```tsx
                                    <button
                                        key={section.value}
                                        type="button"
                                        onClick={() => scrollToSection(section.value)}
```

por:

```tsx
                                    <button
                                        key={section.value}
                                        type="button"
                                        onClick={() => setActiveSection(section.value)}
```

- [ ] **Step 4: Trocar o conteúdo empilhado por renderização condicional da seção ativa**

Troque todo o bloco de conteúdo (da abertura `<div className="flex flex-col gap-8 pb-8">` até o `</div>` que o fecha, imediatamente antes do `</div>` final do `isEditing && (...)`) por:

```tsx
                    <div className="flex flex-col gap-8 pb-8">
                        {activeSection === 'dados-cadastrais' && cadastralForm}

                        {activeSection === 'validacoes' && (
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
                        )}

                        {activeSection === 'migracoes' && (
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
                        )}

                        {activeSection === 'implantacoes' && (
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
                        )}

                        {activeSection === 'recem-vr' && (
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
                        )}

                        {activeSection === 'infraestrutura' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientInfrastructureTab clientId={id!} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'vault' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientCredentialsTab clientId={id!} />
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'historico' && (
                            (client as any)?.history && (client as any).history.length > 0 ? (
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
                            )
                        )}
                    </div>
```

- [ ] **Step 5: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros (0 erros de TypeScript).

- [ ] **Step 6: Verificação manual no navegador**

Suba o front (`npm run dev`), abra um cliente existente (`/clients/:id`), clique em cada aba e confirme que só o conteúdo daquela aba aparece (sem rolagem pelas outras seções) e que a aba clicada fica destacada.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Clients/Form.tsx
git commit -m "refactor(cliente-360): converte scroll-spy em abas reais"
```

---

### Task 2: Cliente 360 — botão "Documentação" / "Adicionar Link"

**Files:**
- Modify: `frontend/src/pages/Clients/Form.tsx`

**Interfaces:**
- Consumes: `clientService.update(id, data)` (já existe em `frontend/src/services/clientService.ts:44`, aceita `Partial<CreateClientDto>` incluindo `driveLink`), `usePermissions` (já usado em outras telas via `@/hooks/usePermissions`).
- Produces: nada consumido por tarefas futuras.

- [ ] **Step 1: Importar dependências novas**

No topo de `frontend/src/pages/Clients/Form.tsx`, ajuste os imports:

```tsx
import { ArrowLeft, Save, FileText, Database, Clock, History as HistoryIcon, MapIcon, LifeBuoy, Link as LinkIcon } from 'lucide-react';
```

Adicione, junto aos demais imports de componentes de UI:

```tsx
import { usePermissions } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
```

- [ ] **Step 2: Adicionar estado do diálogo e permissão**

Dentro do componente `ClientForm`, logo após a linha `const [activeSection, setActiveSection] = useState<string>('dados-cadastrais');`, adicione:

```tsx
    const { canSpecial } = usePermissions('/clients');
    const [driveLinkDialogOpen, setDriveLinkDialogOpen] = useState(false);
    const [driveLinkInput, setDriveLinkInput] = useState('');
```

- [ ] **Step 3: Adicionar a mutation de salvar o link**

Logo após a `mutation` existente (que termina em `});` na linha do `onError` do `useMutation` principal), adicione:

```tsx
    const driveLinkMutation = useMutation({
        mutationFn: (driveLink: string) => clientService.update(id!, { driveLink }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            setDriveLinkDialogOpen(false);
            toast({ title: 'Sucesso', description: 'Link de documentação salvo.' });
        },
        onError: () => toast({ title: 'Erro', description: 'Falha ao salvar o link.', variant: 'destructive' }),
    });
```

- [ ] **Step 4: Abrir o diálogo com o valor atual pré-preenchido**

Adicione, próximo às demais funções auxiliares do componente (antes do `return`):

```tsx
    const openDriveLinkDialog = () => {
        setDriveLinkInput(client?.driveLink || '');
        setDriveLinkDialogOpen(true);
    };
```

- [ ] **Step 5: Renderizar o botão no cabeçalho e o diálogo**

Troque:

```tsx
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto gap-2"
                                onClick={() => navigate(`/?clientId=${id}&create=true`)}
                            >
                                <FileText className="w-4 h-4" />
                                Criar Validação
                            </Button>
```

por:

```tsx
                            <div className="ml-auto flex items-center gap-2">
                                {client?.driveLink ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => window.open(client.driveLink, '_blank', 'noopener,noreferrer')}
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Documentação
                                    </Button>
                                ) : canSpecial ? (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={openDriveLinkDialog}>
                                        <LinkIcon className="w-4 h-4" />
                                        Adicionar Link
                                    </Button>
                                ) : null}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => navigate(`/?clientId=${id}&create=true`)}
                                >
                                    <FileText className="w-4 h-4" />
                                    Criar Validação
                                </Button>
                            </div>
```

- [ ] **Step 6: Adicionar o Dialog de edição do link, fora do header sticky**

Logo antes do fechamento `</DashboardLayout>` (depois do bloco `{isEditing && (...)}`), adicione:

```tsx
            <Dialog open={driveLinkDialogOpen} onOpenChange={setDriveLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link de Documentação (Drive)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="driveLinkInput">URL do Drive</Label>
                        <Input
                            id="driveLinkInput"
                            value={driveLinkInput}
                            onChange={(e) => setDriveLinkInput(e.target.value)}
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => driveLinkMutation.mutate(driveLinkInput)}
                            disabled={driveLinkMutation.isPending || !driveLinkInput}
                        >
                            {driveLinkMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
```

- [ ] **Step 7: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros.

- [ ] **Step 8: Verificação manual no navegador**

Abra um cliente sem `driveLink`: deve aparecer "Adicionar Link" (se você tiver a permissão `canSpecial`) e nenhum botão de link se não tiver. Preencha um link, salve, recarregue a seção — o botão deve virar "Documentação" e abrir o link em nova aba ao clicar.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/Clients/Form.tsx
git commit -m "feat(cliente-360): expõe botão de Documentação/Adicionar Link do Drive"
```

---

### Task 3: Backend — model Prisma `ClientTicket`

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create (gerado automaticamente): `backend/prisma/migrations/<timestamp>_add_client_tickets/migration.sql`

**Interfaces:**
- Produces: model Prisma `ClientTicket` com campos `id, clientId, data, numero, assunto, classificacao (TicketUrgencia), createdAt, updatedAt` — consumido pelo `PrismaService` na Task 4 via `this.prisma.clientTicket`.

- [ ] **Step 1: Adicionar o enum e o model no schema**

Em `backend/prisma/schema.prisma`, adicione o enum próximo aos demais enums do arquivo (ex: perto de `ClientInfraType`):

```prisma
enum TicketUrgencia {
  BAIXA
  MEDIA
  ALTA
  CRITICA
}
```

Adicione o model, próximo ao model `ClientInfrastructure`:

```prisma
model ClientTicket {
  id            String         @id @default(uuid())
  clientId      String         @map("client_id")
  client        Client         @relation(fields: [clientId], references: [id])
  data          DateTime
  numero        String
  assunto       String
  classificacao TicketUrgencia
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  @@map("client_tickets")
}
```

No model `Client` (linha 123 do arquivo atual), adicione a relação reversa junto às demais (`infrastructure`, `credentials`):

```prisma
  tickets         ClientTicket[]
```

- [ ] **Step 2: Gerar e aplicar a migração**

> Antes de rodar qualquer comando de migração, siga a skill `no-db-reset` — nunca usar `migrate reset` nem rodar contra produção.

Run: `cd backend && npx prisma migrate dev --name add_client_tickets`
Expected: saída confirma a criação da migração e `Your database is now in sync with your schema.`

- [ ] **Step 3: Gerar o client do Prisma**

Run: `cd backend && npx prisma generate`
Expected: `Generated Prisma Client` sem erros.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(db): adiciona model ClientTicket para cadastro manual de tickets do Movidesk"
```

---

### Task 4: Backend — módulo `client-tickets`

**Files:**
- Create: `backend/src/client-tickets/dto/create-client-ticket.dto.ts`
- Create: `backend/src/client-tickets/dto/update-client-ticket.dto.ts`
- Create: `backend/src/client-tickets/client-tickets.service.ts`
- Create: `backend/src/client-tickets/client-tickets.service.spec.ts`
- Create: `backend/src/client-tickets/client-tickets.controller.ts`
- Create: `backend/src/client-tickets/client-tickets.module.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService` (já existente em `backend/src/prisma/prisma.service.ts`), model `ClientTicket` da Task 3.
- Produces: rotas REST `POST /client-tickets`, `GET /client-tickets/client/:clientId`, `PATCH /client-tickets/:id`, `DELETE /client-tickets/:id` — consumidas pelo `clientTicketService.ts` do frontend na Task 5.

- [ ] **Step 1: Escrever o teste de serviço (falhando)**

Create `backend/src/client-tickets/client-tickets.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientTicketsService } from './client-tickets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientTicketsService', () => {
  let service: ClientTicketsService;
  const prismaMock = {
    clientTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [ClientTicketsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get<ClientTicketsService>(ClientTicketsService);
  });

  it('creates a ticket scoped to a client', async () => {
    prismaMock.clientTicket.create.mockResolvedValue({ id: '1', clientId: 'c1', numero: '1001' });
    const result = await service.create({
      clientId: 'c1',
      data: '2026-07-06',
      numero: '1001',
      assunto: 'Erro ao emitir NF-e',
      classificacao: 'ALTA' as any,
    });
    expect(prismaMock.clientTicket.create).toHaveBeenCalledWith({
      data: { clientId: 'c1', data: '2026-07-06', numero: '1001', assunto: 'Erro ao emitir NF-e', classificacao: 'ALTA' },
    });
    expect(result.id).toBe('1');
  });

  it('lists tickets filtered by clientId ordered by data desc', async () => {
    prismaMock.clientTicket.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findByClient('c1');
    expect(prismaMock.clientTicket.findMany).toHaveBeenCalledWith({
      where: { clientId: 'c1' },
      orderBy: { data: 'desc' },
    });
    expect(result).toHaveLength(1);
  });

  it('throws NotFoundException when updating a ticket that does not exist', async () => {
    prismaMock.clientTicket.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { numero: '9999' } as any)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when removing a ticket that does not exist', async () => {
    prismaMock.clientTicket.findUnique.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `cd backend && npx jest client-tickets.service`
Expected: FAIL — `Cannot find module './client-tickets.service'`

- [ ] **Step 3: Criar os DTOs**

Create `backend/src/client-tickets/dto/create-client-ticket.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { TicketUrgencia } from '@prisma/client';

export class CreateClientTicketDto {
  @ApiProperty({ example: 'uuid', description: 'ID do cliente' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: '2026-07-06', description: 'Data do ticket' })
  @IsDateString()
  data: string;

  @ApiProperty({ example: '1001', description: 'Número do ticket no Movidesk' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: 'Erro ao emitir NF-e' })
  @IsString()
  @IsNotEmpty()
  assunto: string;

  @ApiProperty({ enum: TicketUrgencia })
  @IsEnum(TicketUrgencia)
  classificacao: TicketUrgencia;
}
```

Create `backend/src/client-tickets/dto/update-client-ticket.dto.ts`:

```ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateClientTicketDto } from './create-client-ticket.dto';

export class UpdateClientTicketDto extends PartialType(
  OmitType(CreateClientTicketDto, ['clientId'] as const),
) {}
```

- [ ] **Step 4: Criar o service**

Create `backend/src/client-tickets/client-tickets.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientTicketDto } from './dto/create-client-ticket.dto';
import { UpdateClientTicketDto } from './dto/update-client-ticket.dto';

@Injectable()
export class ClientTicketsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateClientTicketDto) {
    return this.prisma.clientTicket.create({ data });
  }

  findByClient(clientId: string) {
    return this.prisma.clientTicket.findMany({
      where: { clientId },
      orderBy: { data: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.clientTicket.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Ticket não encontrado');
    return item;
  }

  async update(id: string, data: UpdateClientTicketDto) {
    await this.findOne(id);
    return this.prisma.clientTicket.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.clientTicket.delete({ where: { id } });
  }
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `cd backend && npx jest client-tickets.service`
Expected: PASS — 4 testes passando.

- [ ] **Step 6: Criar o controller**

Create `backend/src/client-tickets/client-tickets.controller.ts`:

```ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientTicketsService } from './client-tickets.service';
import { CreateClientTicketDto } from './dto/create-client-ticket.dto';
import { UpdateClientTicketDto } from './dto/update-client-ticket.dto';

@ApiTags('client-tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('client-tickets')
export class ClientTicketsController {
  constructor(private readonly service: ClientTicketsService) {}

  @Post()
  create(@Body() dto: CreateClientTicketDto) {
    return this.service.create(dto);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientTicketDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

- [ ] **Step 7: Criar o module e registrar no `AppModule`**

Create `backend/src/client-tickets/client-tickets.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ClientTicketsService } from './client-tickets.service';
import { ClientTicketsController } from './client-tickets.controller';

@Module({
  controllers: [ClientTicketsController],
  providers: [ClientTicketsService],
})
export class ClientTicketsModule {}
```

Em `backend/src/app.module.ts`, adicione o import:

```ts
import { ClientTicketsModule } from './client-tickets/client-tickets.module';
```

E adicione `ClientTicketsModule` ao array `imports` do `@Module`, junto aos demais (`ClientInfrastructureModule, ClientCredentialsModule, ClientTicketsModule`).

- [ ] **Step 8: Rodar o build do backend**

Run: `cd backend && npm run build`
Expected: build finaliza sem erros.

- [ ] **Step 9: Commit**

```bash
git add backend/src/client-tickets backend/src/app.module.ts
git commit -m "feat(client-tickets): adiciona módulo CRUD de tickets manuais do Movidesk"
```

---

### Task 5: Frontend — tipos e service de `ClientTicket`

**Files:**
- Create: `frontend/src/types/clientTicket.ts`
- Create: `frontend/src/services/clientTicketService.ts`

**Interfaces:**
- Consumes: rotas REST da Task 4 (`/client-tickets/...`), `api` (instância axios de `frontend/src/services/api.ts`).
- Produces: tipo `ClientTicket`, `CreateClientTicketDto`, `TicketUrgencia`, `TICKET_URGENCIA_LABELS`, `TICKET_URGENCIA_COLORS`, e `clientTicketService` (`findByClient`, `create`, `update`, `delete`) — consumidos por `ClientTicketsTab.tsx` na Task 6.

- [ ] **Step 1: Criar o arquivo de tipos**

Create `frontend/src/types/clientTicket.ts`:

```ts
export type TicketUrgencia = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export const TICKET_URGENCIA_LABELS: Record<TicketUrgencia, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const TICKET_URGENCIA_COLORS: Record<TicketUrgencia, string> = {
  BAIXA: 'bg-slate-100 text-slate-700 border-transparent',
  MEDIA: 'bg-blue-100 text-blue-800 border-transparent',
  ALTA: 'bg-orange-100 text-orange-800 border-transparent',
  CRITICA: 'bg-red-100 text-red-800 border-transparent',
};

export interface ClientTicket {
  id: string;
  clientId: string;
  data: string;
  numero: string;
  assunto: string;
  classificacao: TicketUrgencia;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientTicketDto {
  clientId: string;
  data: string;
  numero: string;
  assunto: string;
  classificacao: TicketUrgencia;
}
```

- [ ] **Step 2: Criar o service**

Create `frontend/src/services/clientTicketService.ts`:

```ts
import api from './api';
import type { ClientTicket, CreateClientTicketDto } from '@/types/clientTicket';

export const clientTicketService = {
  findByClient: async (clientId: string) => {
    const response = await api.get<ClientTicket[]>(`/client-tickets/client/${clientId}`);
    return response.data;
  },
  create: async (data: CreateClientTicketDto) => {
    const response = await api.post<ClientTicket>('/client-tickets', data);
    return response.data;
  },
  update: async (id: string, data: Partial<CreateClientTicketDto>) => {
    const response = await api.patch<ClientTicket>(`/client-tickets/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/client-tickets/${id}`);
  },
};
```

- [ ] **Step 3: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros (nenhum arquivo consome ainda estes módulos, mas o TypeScript deve compilar limpo).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/clientTicket.ts frontend/src/services/clientTicketService.ts
git commit -m "feat(client-tickets): adiciona tipos e service de frontend para tickets do cliente"
```

---

### Task 6: Frontend — componente `ClientTicketsTab`

**Files:**
- Create: `frontend/src/pages/Clients/ClientTicketsTab.tsx`

**Interfaces:**
- Consumes: `clientTicketService`, `ClientTicket`, `CreateClientTicketDto`, `TicketUrgencia`, `TICKET_URGENCIA_LABELS`, `TICKET_URGENCIA_COLORS` (Task 5); `usePermissions` (`@/hooks/usePermissions`).
- Produces: componente `ClientTicketsTab({ clientId }: { clientId: string })` — consumido por `Form.tsx` na Task 7.

- [ ] **Step 1: Criar o componente completo**

Create `frontend/src/pages/Clients/ClientTicketsTab.tsx`:

```tsx
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { clientTicketService } from '@/services/clientTicketService';
import {
  ClientTicket, CreateClientTicketDto, TICKET_URGENCIA_LABELS, TICKET_URGENCIA_COLORS,
} from '@/types/clientTicket';

interface Props {
  clientId: string;
}

const EMPTY_FORM: CreateClientTicketDto = {
  clientId: '',
  data: '',
  numero: '',
  assunto: '',
  classificacao: 'BAIXA',
};

export default function ClientTicketsTab({ clientId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions('/clients');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientTicket | null>(null);

  const { register, handleSubmit, reset, control } = useForm<CreateClientTicketDto>({
    defaultValues: EMPTY_FORM,
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['client-tickets', clientId],
    queryFn: () => clientTicketService.findByClient(clientId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client-tickets', clientId] });

  const saveMutation = useMutation({
    mutationFn: (data: CreateClientTicketDto) => {
      if (editing) return clientTicketService.update(editing.id, data);
      return clientTicketService.create(data);
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast({ title: 'Sucesso', description: `Ticket ${editing ? 'atualizado' : 'cadastrado'} com sucesso.` });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao salvar o ticket.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientTicketService.delete,
    onSuccess: () => {
      invalidate();
      toast({ title: 'Excluído', description: 'Ticket removido.' });
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' }),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ ...EMPTY_FORM, clientId });
    setOpen(true);
  };

  const openEdit = (item: ClientTicket) => {
    setEditing(item);
    reset({
      clientId,
      data: item.data.slice(0, 10),
      numero: item.numero,
      assunto: item.assunto,
      classificacao: item.classificacao,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" /> Tickets (Movidesk)
        </h3>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" /> Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar' : 'Novo'} Ticket</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input id="data" type="date" {...register('data', { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <Input id="numero" {...register('numero', { required: true })} placeholder="Ex: 100234" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Input id="assunto" {...register('assunto', { required: true })} placeholder="Ex: Erro ao emitir NF-e" />
                </div>
                <div className="space-y-2">
                  <Label>Classificação</Label>
                  <Controller
                    name="classificacao"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TICKET_URGENCIA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Classificação</TableHead>
              {canEdit && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            )}
            {!isLoading && (!tickets || tickets.length === 0) && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum ticket cadastrado.</TableCell></TableRow>
            )}
            {tickets?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-sm">{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium">{item.numero}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.assunto}</TableCell>
                <TableCell><Badge className={TICKET_URGENCIA_COLORS[item.classificacao]}>{TICKET_URGENCIA_LABELS[item.classificacao]}</Badge></TableCell>
                {canEdit && (
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir ticket?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(item.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros (o componente ainda não é importado em nenhum lugar, mas deve compilar isoladamente).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Clients/ClientTicketsTab.tsx
git commit -m "feat(client-tickets): adiciona componente de aba com CRUD de tickets"
```

---

### Task 7: Cliente 360 — integrar a aba "Tickets"

**Files:**
- Modify: `frontend/src/pages/Clients/Form.tsx`

**Interfaces:**
- Consumes: `ClientTicketsTab` (Task 6), `activeSection`/renderização condicional (Task 1).
- Produces: nada — última tarefa do plano.

- [ ] **Step 1: Importar o componente novo**

Em `frontend/src/pages/Clients/Form.tsx`, adicione junto aos outros imports de aba:

```tsx
import ClientTicketsTab from './ClientTicketsTab';
```

- [ ] **Step 2: Adicionar o item na lista de seções**

Troque o array `SECTIONS` (já sem `as const` alterado) inserindo `tickets` entre `recem-vr` e `infraestrutura`:

```tsx
const SECTIONS = [
    { value: 'dados-cadastrais', label: 'Dados cadastrais' },
    { value: 'validacoes', label: 'Validações' },
    { value: 'migracoes', label: 'Migrações' },
    { value: 'implantacoes', label: 'Implantações' },
    { value: 'recem-vr', label: 'Recém VR' },
    { value: 'tickets', label: 'Tickets' },
    { value: 'infraestrutura', label: 'Infraestrutura' },
    { value: 'vault', label: 'Vault de Acessos' },
    { value: 'historico', label: 'Histórico' },
] as const;
```

- [ ] **Step 3: Renderizar a nova seção**

No bloco de renderização condicional criado na Task 1, adicione o bloco `tickets` logo após o de `recem-vr` e antes do de `infraestrutura`:

```tsx
                        {activeSection === 'tickets' && (
                            <Card>
                                <CardContent className="pt-6">
                                    <ClientTicketsTab clientId={id!} />
                                </CardContent>
                            </Card>
                        )}
```

- [ ] **Step 4: Rodar o build**

Run: `cd frontend && npm run build`
Expected: build finaliza sem erros.

- [ ] **Step 5: Verificação manual no navegador**

Com o backend rodando (módulo `client-tickets` da Task 4 no ar), abra um cliente existente, clique na aba "Tickets", cadastre um ticket (data, número, assunto, classificação), confirme que aparece na tabela com o badge de urgência colorido, edite-o e exclua-o.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Clients/Form.tsx
git commit -m "feat(cliente-360): integra aba Tickets ao Cliente 360"
```
