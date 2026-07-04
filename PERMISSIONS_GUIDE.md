# Sistema de Permissões Granulares - Itmizer VR

## 📋 Visão Geral

O sistema de permissões granulares permite controle fino sobre o que cada perfil de usuário pode fazer em cada rota/menu do sistema.

### 3 Níveis de Permissão

1. **CONSULTA** (View/Read)
   - Visualizar dados, relatórios e listagens
   - Acessar a interface da funcionalidade
   - Ler informações sem poder modificá-las

2. **INCLUSÃO/EDIÇÃO** (Create/Update/Delete)
   - Criar novos registros
   - Editar dados existentes
   - Excluir registros
   - Todas as operações de modificação de dados

3. **ESPECIAL** (Special Actions)
   - Aprovar/Rejeitar processos
   - Exportar relatórios
   - Gerar documentos especiais
   - Ações críticas ou administrativas

---

## 🔧 Backend - Como Usar

### 1. Aplicar Permissões em Rotas (Controllers)

```typescript
import { Permissions, PermissionType, RequiresConsulta, RequiresInclusaoEdicao, RequiresEspecial } from '@/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@/auth/guards/permissions.guard';
import { AppRole } from '@prisma/client';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {

  // Rota de consulta - apenas visualização
  @Get()
  @RequiresConsulta([AppRole.admin, AppRole.user, AppRole.support])
  findAll() {
    return this.clientsService.findAll();
  }

  // Rota de inclusão/edição - criar/editar/deletar
  @Post()
  @RequiresInclusaoEdicao([AppRole.admin, AppRole.support])
  create(@Body() data: CreateClientDto) {
    return this.clientsService.create(data);
  }

  @Patch(':id')
  @RequiresInclusaoEdicao([AppRole.admin, AppRole.support])
  update(@Param('id') id: string, @Body() data: UpdateClientDto) {
    return this.clientsService.update(id, data);
  }

  // Ação especial - exportar ou aprovar
  @Post('export')
  @RequiresEspecial([AppRole.admin])
  exportClients() {
    return this.clientsService.exportAll();
  }

  // Usando decorator completo com tipos explícitos
  @Post(':id/approve')
  @Permissions(PermissionType.ESPECIAL, [AppRole.admin, AppRole.support])
  approve(@Param('id') id: string) {
    return this.clientsService.approve(id);
  }
}
```

### 2. Configurar Guard Globalmente (Opcional)

```typescript
// src/app.module.ts
import { APP_GUARD } from '@nestjs/core';
import { PermissionsGuard } from './auth/guards/permissions.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
```

### 3. Verificar Permissões Programaticamente

```typescript
import { MenusService } from '@/menus/menus.service';
import { PermissionType } from '@/auth/decorators/permissions.decorator';

export class SomeService {
  constructor(private menusService: MenusService) {}

  async checkUserPermission(userRoles: AppRole[], route: string) {
    const canView = await this.menusService.checkRoutePermission(
      route,
      userRoles,
      PermissionType.CONSULTA
    );

    const canEdit = await this.menusService.checkRoutePermission(
      route,
      userRoles,
      PermissionType.INCLUSAO_EDICAO
    );

    const canSpecial = await this.menusService.checkRoutePermission(
      route,
      userRoles,
      PermissionType.ESPECIAL
    );

    return { canView, canEdit, canSpecial };
  }
}
```

---

## 🎨 Frontend - Como Usar

### 1. Hook de Permissões - Todas as Permissões

```typescript
import { usePermissions } from '@/hooks/usePermissions';

export function ClientsPage() {
  const { canView, canEdit, canSpecial, loading } = usePermissions('/clients');

  if (loading) return <div>Carregando...</div>;

  if (!canView) {
    return <div>Você não tem permissão para visualizar esta página</div>;
  }

  return (
    <div>
      <h1>Clientes</h1>

      {/* Lista sempre visível para quem tem canView */}
      <ClientsList />

      {/* Botões de ação apenas para quem tem permissão */}
      {canEdit && (
        <Button onClick={handleCreate}>
          Novo Cliente
        </Button>
      )}

      {canSpecial && (
        <Button onClick={handleExport}>
          Exportar Relatório
        </Button>
      )}
    </div>
  );
}
```

### 2. Hook de Permissão Específica

```typescript
import { usePermission } from '@/hooks/usePermissions';
import { PermissionType } from '@/types/permissions';

export function ClientEditButton({ clientId }: { clientId: string }) {
  const { hasPermission, loading } = usePermission(
    '/clients',
    PermissionType.INCLUSAO_EDICAO
  );

  if (loading || !hasPermission) return null;

  return (
    <Button onClick={() => handleEdit(clientId)}>
      Editar
    </Button>
  );
}
```

### 3. Verificação Manual via Service

```typescript
import { menuService } from '@/services/menuService';
import { PermissionType } from '@/types/permissions';

async function checkBeforeAction() {
  const canEdit = await menuService.checkPermission(
    '/clients',
    PermissionType.INCLUSAO_EDICAO
  );

  if (canEdit) {
    // Executar ação
  } else {
    toast.error('Você não tem permissão para editar');
  }
}
```

### 4. Componente de Proteção Condicional

```typescript
import { usePermission } from '@/hooks/usePermissions';
import { PermissionType } from '@/types/permissions';

interface ProtectedActionProps {
  route: string;
  permissionType: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedAction({
  route,
  permissionType,
  children,
  fallback = null,
}: ProtectedActionProps) {
  const { hasPermission, loading } = usePermission(route, permissionType);

  if (loading) return null;
  if (!hasPermission) return <>{fallback}</>;

  return <>{children}</>;
}

// Uso:
<ProtectedAction route="/clients" permissionType={PermissionType.INCLUSAO_EDICAO}>
  <Button>Editar Cliente</Button>
</ProtectedAction>
```

---

## 🗄️ Banco de Dados - Schema

### Tabela: menus

```sql
id                      UUID PRIMARY KEY
label                   VARCHAR
route                   VARCHAR
order                   INTEGER
is_active               BOOLEAN
roles                   AppRole[]  -- Compatibilidade retroativa

-- Permissões granulares
roles_consulta          AppRole[]  -- Quem pode visualizar
roles_inclusao_edicao   AppRole[]  -- Quem pode criar/editar/deletar
roles_especial          AppRole[]  -- Quem pode executar ações especiais
```

### Tabela: submenus

Mesma estrutura da tabela `menus` com uma coluna adicional `menu_id`.

---

## 🔄 Migration - Aplicar no Banco

```bash
# No backend
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## 📝 Configurar Permissões via Interface Admin

1. Acesse: `/admin` → Aba "Menus & Navegação"
2. Clique no botão "Permissões" ao lado do menu desejado
3. Configure as 3 permissões:
   - **Consulta**: Quais perfis podem visualizar
   - **Inclusão/Edição**: Quais perfis podem modificar
   - **Especial**: Quais perfis podem executar ações críticas
4. Salve as alterações

---

## 🎯 Perfis Disponíveis (AppRole)

- `admin` - Administrador (acesso total)
- `user` - Usuário comum
- `support` - Suporte técnico
- `seller` - Vendedor
- `migrador` - Responsável por migrações
- `implantador` - Responsável por implantações

---

## 🧪 Exemplos Práticos

### Exemplo 1: Módulo de Migrações

```typescript
// Consulta: admin, support, migrador, implantador
// Inclusão/Edição: admin, migrador
// Especial (aprovar): admin

@Controller('migrations')
export class MigrationsController {
  @Get()
  @RequiresConsulta([AppRole.admin, AppRole.support, AppRole.migrador, AppRole.implantador])
  findAll() {
    return this.migrationsService.findAll();
  }

  @Post()
  @RequiresInclusaoEdicao([AppRole.admin, AppRole.migrador])
  create(@Body() data: CreateMigrationDto) {
    return this.migrationsService.create(data);
  }

  @Post(':id/approve')
  @RequiresEspecial([AppRole.admin])
  approve(@Param('id') id: string) {
    return this.migrationsService.approve(id);
  }
}
```

### Exemplo 2: Módulo de Clientes

```typescript
// Consulta: admin, support, seller
// Inclusão/Edição: admin, seller
// Especial (exportar): admin

@Controller('clients')
export class ClientsController {
  @Get()
  @RequiresConsulta([AppRole.admin, AppRole.support, AppRole.seller])
  findAll() {
    return this.clientsService.findAll();
  }

  @Post()
  @RequiresInclusaoEdicao([AppRole.admin, AppRole.seller])
  create(@Body() data: CreateClientDto) {
    return this.clientsService.create(data);
  }

  @Post('export')
  @RequiresEspecial([AppRole.admin])
  exportClients() {
    return this.clientsService.exportAll();
  }
}
```

---

## ⚠️ Notas Importantes

1. **Admin sempre tem acesso total**: Por padrão, o role `admin` tem acesso a tudo
2. **Compatibilidade retroativa**: O campo `roles` ainda existe para manter compatibilidade
3. **Verificação em cascata**: Se um menu pai bloqueia o acesso, os submenus também são bloqueados
4. **Cache**: Considere implementar cache nas verificações de permissão para melhor performance

---

## 🚀 Próximos Passos

1. Aplicar a migration no banco de dados
2. Configurar as permissões dos menus existentes via interface admin
3. Adicionar os decorators `@RequiresConsulta`, `@RequiresInclusaoEdicao`, `@RequiresEspecial` nos controllers
4. Atualizar o frontend para usar os hooks de permissões
5. Testar com diferentes perfis de usuário

---

## 📞 Suporte

Em caso de dúvidas ou problemas, consulte a documentação do NestJS sobre Guards e Decorators:
- https://docs.nestjs.com/guards
- https://docs.nestjs.com/custom-decorators
