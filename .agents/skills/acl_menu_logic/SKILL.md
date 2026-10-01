---
name: acl_menu_logic
description: Padrão arquitetural e diretrizes práticas para gerenciamento de menus dinâmicos e controle de permissões ACL granular (Consulta, Inclusão/Edição, Especial) no ITmizer-VR (NestJS + Prisma + React/Shadcn).
---

# Skill: Lógica de Menus e Controle de Acesso (ACL) — ITmizer-VR

Esta skill documenta os padrões, convenções e implementação do sistema de **Controle de Acesso Granular (ACL)** e **Menus Dinâmicos** no ecossistema **ITmizer-VR**.

---

## 📋 Níveis de Permissão

O sistema implementa 3 níveis granulares de autorização:

1. **CONSULTA** (`roles_consulta` / Read-Only):
   - Acesso apenas para leitura a listagens, dashboards e detalhes de registros.
   - Os formulários devem ser renderizados em modo desabilitado (`isReadOnly = true`).
   - Botões de ações mutativas ("Novo", "Editar", "Excluir", "Salvar") são ocultados ou desabilitados.

2. **INCLUSÃO/EDIÇÃO** (`roles_inclusao_edicao` / Write):
   - Permissão total para criar novos registros, editar dados existentes e excluir itens autorizados.
   - Habilita inputs, botões de ação e submissão de formulários.

3. **ESPECIAL** (`roles_especial` / Admin & Critical Actions):
   - Execução de ações de alto impacto: aprovação de migrações, exportação massiva de dados, revelação de senhas no cofre de credenciais (`client-credentials`), alteração de status críticos e parametrizações globais.

---

## 🔑 Perfis de Usuário (`AppRole`)

Definidos no enum do Prisma (`schema.prisma`):
- `admin`: Acesso total e bypass em regras de visualização administrativa.
- `supervisao`: Supervisores de equipe e gestores de processos.
- `user`: Usuário padrão do sistema.
- `support`: Equipe de suporte técnico e atendimento.
- `seller`: Vendedores e consultores comerciais.
- `migrador`: Especialistas em migração de banco de dados e planilhas para VR Software.
- `implantador`: Técnicos de implantação e configuração em campo/remoto.

---

## 🛠️ Implementação Backend (NestJS + Prisma)

### 1. Decorators e Guards nos Controllers

Sempre utilize os decorators específicos associados ao `JwtAuthGuard` e `PermissionsGuard`:

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/guards/permissions.guard';
import { RequiresConsulta, RequiresInclusaoEdicao, RequiresEspecial } from '@/auth/decorators/permissions.decorator';
import { AppRole } from '@prisma/client';

@Controller('deployments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeploymentsController {

  @Get()
  @RequiresConsulta([AppRole.admin, AppRole.supervisao, AppRole.implantador, AppRole.support])
  findAll() {
    return this.deploymentsService.findAll();
  }

  @Post()
  @RequiresInclusaoEdicao([AppRole.admin, AppRole.supervisao, AppRole.implantador])
  create(@Body() dto: CreateDeploymentDto) {
    return this.deploymentsService.create(dto);
  }

  @Patch(':id')
  @RequiresInclusaoEdicao([AppRole.admin, AppRole.implantador])
  update(@Param('id') id: string, @Body() dto: UpdateDeploymentDto) {
    return this.deploymentsService.update(id, dto);
  }

  @Post(':id/approve-go-live')
  @RequiresEspecial([AppRole.admin, AppRole.supervisao])
  approveGoLive(@Param('id') id: string) {
    return this.deploymentsService.approveGoLive(id);
  }
}
```

### 2. Persistência de Menus e Submenus

As permissões são persistidas no PostgreSQL através dos modelos Prisma:
- **`Menu`**: Item principal da barra de navegação (`title`, `path`, `icon`, `order`, `roles_consulta`, `roles_inclusao_edicao`, `roles_especial`).
- **`Submenu`**: Itens filhos vinculados a um menu master (`menu_id`, `title`, `path`, `order`, `roles_consulta`, `roles_inclusao_edicao`, `roles_especial`).

Ao atualizar permissões no backend (`menus.service.ts`), o endpoint deve verificar se o ID fornecido corresponde a um `Menu` ou a um `Submenu` e salvar os arrays de `AppRole` correspondentes.

---

## 🚀 Implementação Frontend (React + Vite + Tailwind + Shadcn)

### 1. Hook `usePermissions`

Em qualquer página ou componente, consuma o hook passando a rota correspondente:

```tsx
import { usePermissions } from '@/hooks/usePermissions';

export function DeploymentDetailPage() {
  const { canView, canEdit, canSpecial, loading } = usePermissions('/deployments');

  if (loading) return <SkeletonLoader />;
  if (!canView) return <AccessDeniedMessage />;

  const isReadOnly = !canEdit;

  return (
    <div>
      <DeploymentForm isReadOnly={isReadOnly} />
      {canSpecial && <ApproveGoLiveButton />}
    </div>
  );
}
```

### 2. Padrão de Formulários Read-Only

Quando `isReadOnly === true`:
1. Desabilitar todos os inputs e controles (`Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `DatePicker`).
2. Ocultar o botão "Salvar" ou desabilitá-lo.
3. Substituir o botão "Cancelar" por "Voltar".
4. Exibir aviso informativo sutil (Badge ou Alert) indicando modo de apenas leitura.

```tsx
<Input 
  {...register("companyName")} 
  disabled={isReadOnly} 
  className={isReadOnly ? "bg-muted cursor-not-allowed opacity-80" : ""}
/>
```

### 3. Proteção em Tabelas e Ações

```tsx
<TableCell className="text-right space-x-2">
  <Button variant="ghost" size="sm" onClick={() => navigate(`/deployments/${item.id}`)}>
    Visualizar
  </Button>
  
  {canEdit && (
    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
      Editar
    </Button>
  )}

  {canSpecial && (
    <Button variant="destructive" size="sm" onClick={() => handleCriticalAction(item)}>
      Ação Especial
    </Button>
  )}
</TableCell>
```

---

## ⚙️ Painel Administrativo de Menus (`/admin/menus`)

A rota `/admin/menus` permite aos administradores:
1. Reorganizar ordem e visibilidade de menus e submenus.
2. Definir dinamicamente quais `AppRole` possuem acesso de Consulta, Inclusão/Edição e Especial por funcionalidade.
3. Propagar alterações instantaneamente sem necessidade de redeploy da aplicação.
