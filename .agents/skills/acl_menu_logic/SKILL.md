---
name: acl_menu_logic
description: Lógica para gerenciamento de menus e permissões ACL (Consulta, Inclusão/Edição, Especial)
---

# Skill: Lógica de Menus e ACL

Esta skill documenta os padrões e a implementação do sistema de Controle de Acesso (ACL) granular no projeto .

## 📋 Níveis de Permissão

O sistema utiliza três níveis básicos de acesso definidos no backend e refletidos no frontend:

1.  **CONSULTA** (Visualização):
    *   Acesso de apenas leitura a listagens e detalhes.
    *   Arquivos chave: `PermissionsGuard` (Backend), `usePermissions` (Frontend).

2.  **INCLUSÃO/EDIÇÃO** (Modificação):
    *   Permissão para criar, editar e excluir registros.
    *   Controla a visibilidade de botões "Novo", "Editar", "Excluir" e "Salvar".

3.  **ESPECIAL** (Ações Críticas):
    *   Permissão para aprovações, exportações e relatórios sensíveis.

## 🔑 Perfis de Usuário (AppRole)

Os perfis disponíveis são:
*   `admin`: Acesso total (bypass de ACL em muitos casos).
*   `supervisao`: Supervisor.
*   `user`: Usuário padrão.
*   `support`: Suporte técnico.
*   `seller`: Vendedor.
*   `migrador`: Especialista em migração.
*   `implantador`: Especialista em implementação.

## 🚀 Implementação Frontend

### Hooks de Permissão
Use o hook `usePermissions` para verificar o acesso de uma rota:

```tsx
const { canView, canEdit, canSpecial, loading } = usePermissions('/deployments');
```

### Formulários Read-Only
Ao implementar o modo de "apenas leitura" em formulários (ex: `DeploymentForm.tsx`):
1.  Obtenha `canEdit`.
2.  Defina `const isReadOnly = !canEdit;`.
3.  Passe `disabled={isReadOnly}` para todos os campos:
    *   `Input`, `Select`, `Textarea`, `Checkbox`.
    *   Botão do `Popover` (Date Picker).
4.  Renderize condicionalmente o botão de salvar: `{!isReadOnly && <Button>Salvar</Button>}`.
5.  Altere o texto do botão de cancelar para "Voltar" se `isReadOnly` for true.

### Listagens
Proteja as ações na tabela:
```tsx
{canEdit && (
  <TableCell>
    <Button>Editar</Button>
    <Button>Excluir</Button>
  </TableCell>
)}
```

## 🛠️ Implementação Backend

### Decoradores
Proteja as rotas nos controllers:
*   `@RequiresConsulta([AppRole.admin, ...])`
*   `@RequiresInclusaoEdicao([AppRole.admin, ...])`
*   `@RequiresEspecial([AppRole.admin, ...])`

### Service de Menus
As permissões são persistidas nas tabelas `menus` e `submenus` nas colunas:
*   `roles_consulta`
*   `roles_inclusao_edicao`
*   `roles_especial`

## ⚙️ Configuração Admin
A gestão dessas permissões é feita em `/admin/menus`.

### Submenus vs Menus Master
*   **Menus Master**: Itens de primeiro nível. Suas permissões controlam o acesso ao agrupamento.
*   **Submenus**: Itens de segundo nível. São entidades separadas no banco de dados (`Submenu`).
*   **Localização**: Para configurar um item, o editor deve buscar recursivamente nos menus e seus respectivos submenus.
*   **Persistência**: Ao salvar, o backend deve identificar se o ID pertence ao modelo `Menu` ou `Submenu` para atualizar a tabela correta.

### Fluxo de Edição
1.  Clique no botão "Acessos" (ícone de escudo).
2.  O sistema navega para `/admin/menus/:id`.
3.  O componente `MenuPermissions` localiza o item (menu ou submenu).
4.  O `MenuPermissionsEditor` gerencia o estado das roles.
5.  O salvamento é feito via `menuService.updateMenuPermissions`.
