---
name: itmizer-fullstack-patterns
description: Guia de padrões arquiteturais fullstack do ITmizer-VR para desenvolvimento de novos módulos e manutenção do sistema (Prisma ORM + NestJS REST APIs + React 18 / Vite / Shadcn/ui / Tailwind / TanStack Query).
---

# ITmizer-VR — Padrões Arquiteturais Fullstack

Esta skill fornece o guia canônico para desenvolvimento e extensão de módulos no projeto **ITmizer-VR**.

---

## 🏗️ Visão da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite / React 18)           │
│  React Router v6 ── Shadcn/ui ── TanStack Query ── Axios │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / REST (JWT Bearer)
┌────────────────────────────▼────────────────────────────┐
│                    Backend (NestJS 11)                  │
│  Controllers ── Guards (JWT + ACL) ── Services ── DTOs  │
└────────────────────────────┬────────────────────────────┘
                             │ Prisma ORM Client
┌────────────────────────────▼────────────────────────────┐
│               PostgreSQL Database (Supabase/Host)       │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Passo a Passo para Novos Módulos

### 1. Modelagem no Banco de Dados (`backend/prisma/schema.prisma`)
1. Adicione o modelo com convenções do Prisma (`camelCase` no schema, mapeado para `snake_case` no banco via `@map` e `@@map`).
2. Vincule relações com `User` ou `Client` com integridade referencial.
3. Gere os tipos do Prisma:
   ```powershell
   cd backend ; npx prisma generate
   ```

### 2. Criação do Módulo no Backend (NestJS)
Estrutura recomendada em `backend/src/<modulo>/`:
- `<modulo>.module.ts`
- `<modulo>.controller.ts`: Endpoints protegidos com `JwtAuthGuard` + `PermissionsGuard` e decorators de permissão (`@RequiresConsulta`, `@RequiresInclusaoEdicao`, `@RequiresEspecial`).
- `<modulo>.service.ts`: Lógica de negócio, consultas Prisma e regras de auditoria.
- `dto/create-<modulo>.dto.ts` & `dto/update-<modulo>.dto.ts`: Validações com `class-validator` e decorators Swagger (`@ApiProperty`).

### 3. Integração no Frontend (React + Vite)
Estrutura recomendada em `frontend/src/`:
- `services/<modulo>Service.ts`: Chamadas HTTP com `api.get`, `api.post`, `api.patch`, `api.delete`.
- `hooks/use<Modulo>.ts`: Mutators e Queries com TanStack Query para cache e refetch reativo.
- `pages/<Modulo>Page.tsx` ou `pages/<Modulo>Form.tsx`: Telas completas integrando o hook de permissão `usePermissions('/<modulo>')`.
- `components/<modulo>/`: Componentes modulares, formulários e modais construídos com Shadcn/ui.

---

## 🎨 Diretrizes Visuais & UX do Frontend

1. **Componentes Base**: Utilizar exclusivamente a biblioteca de componentes Shadcn/ui (`@/components/ui/*`).
2. **Ícones**: Utilizar `lucide-react` com tamanho padronizado (`h-4 w-4` em botões, `h-5 w-5` em cards).
3. **Notificações / Feedback**: Utilizar `toast` da biblioteca `sonner` para sucessos e erros.
4. **Estados de Carregamento**: Nunca deixar telas em branco durante requisições. Exibir `Skeleton` ou spinners de loading.
5. **Formulários**: Utilizar `react-hook-form` com `@hookform/resolvers/zod` para validação robusta no frontend antes do envio à API.
