---
name: itmizer-change-memory
description: Protocolo contínuo de registro e leitura de memória técnica de alterações do ITmizer-VR (Console / Cliente 360 / Implantações e Migrações). Garante que todo agente registre decisões arquiteturais, arquivos alterados, novos endpoints e regras de negócio para preservação de contexto contínuo.
---

# ITmizer-VR — Skill de Memória Contínua de Alterações (Agent Memory Protocol)

Esta skill estabelece o protocolo mandatório de preservação de contexto e documentação de alterações para todos os agentes de IA que operam no ecossistema **ITmizer-VR**.

---

## 🎯 Objetivo Principal

Evitar perda de contexto, regressão de código e retrabalho entre diferentes sessões de trabalho. Toda decisão técnica, criação de tabelas/modelos no Prisma, novos endpoints no NestJS, novos componentes React/Shadcn e correções de bugs devem ser memorizados de forma padronizada.

---

## 🧭 Regra 1: Leitura Inicial Obrigatória (Ao Iniciar uma Sessão)

Antes de fazer qualquer alteração em arquivos de código ou banco de dados, o agente **DEVE**:

1. **Consultar o histórico e arquitetura**:
   - Verificar modelos em [`backend/prisma/schema.prisma`](file:///d:/Projects/itmizer-VR/backend/prisma/schema.prisma).
   - Consultar o guia de permissões em [`PERMISSIONS_GUIDE.md`](file:///d:/Projects/itmizer-VR/PERMISSIONS_GUIDE.md).
   - Consultar `docs/` para entender requisitos específicos de negócios (Assessments, Migração, Clientes 360).
2. **Verificar os padrões de stack ativos**:
   - **Backend**: NestJS + Prisma ORM + PostgreSQL + Passport JWT + Swagger.
   - **Frontend**: Vite + React 18 + TypeScript + TailwindCSS + Shadcn/ui + TanStack Query + React Router DOM.
   - **Controle de Acesso**: Níveis `Consulta`, `InclusaoEdicao`, `Especial` vinculados a `AppRole`.

---

## ✍️ Regra 2: Registro Mandatório ao Finalizar Alterações

Sempre que você criar novas funcionalidades, alterar páginas, corrigir bugs ou ajustar esquemas, registre no topo de `docs/AGENT_MEMORY.md` (criando o arquivo caso não exista):

### Formato Padrão de Entrada no `docs/AGENT_MEMORY.md`:

```markdown
## [YYYY-MM-DD HH:mm] - <Título Conciso da Modificação>
- **Agente / Modelo**: Nome do modelo ou agente executor
- **Objetivo / Demanda do Usuário**: O que foi pedido e qual problema foi resolvido
- **Módulos Afetados**:
  - `backend/src/<modulo>/...`: descrição dos endpoints/services criados ou modificados
  - `frontend/src/<modulo>/...`: componentes, hooks e páginas criadas ou ajustadas
- **Modelos Prisma / Banco de Dados**:
  - Alterações no schema ou migrations executadas (sempre preservando dados existentes!)
- **Decisões Técnicas & Padrões**:
  - Justificativa arquitetural das escolhas feitas
- **Pontos de Atenção / Gotchas para o Próximo Agente**:
  - Peculiaridades descobertas, validações de formulário, regras de ACL ou constraints
- **Validação Executada**:
  - [x] Build do frontend (`npm run build` em `frontend`)
  - [x] Build da API (`npm run build` em `backend`)
```

---

## 🚀 Regra 3: Checklist Pré-Deploy e Validação

Antes de concluir qualquer tarefa de grande porte:

1. **Validar compilação do Backend (NestJS)**:
   ```powershell
   cd backend ; npm run build
   ```
2. **Validar compilação do Frontend (Vite/React)**:
   ```powershell
   cd frontend ; npm run build
   ```
3. **Respeitar as Hardness Rules**:
   - Nunca executar comandos de reset de banco de dados (`prisma migrate reset`, etc.).
   - Nunca executar exclusões em massa de dados sem autorização expressa.

---

## 📦 Padrões Essenciais Memorizados do ITmizer-VR

| Assunto | Arquivo / Referência | Diretriz |
| :--- | :--- | :--- |
| **ACL Backend** | `backend/src/auth/decorators/permissions.decorator.ts` | Usar `@RequiresConsulta`, `@RequiresInclusaoEdicao`, `@RequiresEspecial` nos controllers. |
| **ACL Frontend** | `frontend/src/hooks/usePermissions.ts` | Consumir `{ canView, canEdit, canSpecial } = usePermissions('/rota')`. |
| **Segurança de Senhas** | `backend/src/client-credentials/` | Senhas criptografadas + log de auditoria obrigatório no acesso. |
| **ORM / Banco** | `backend/prisma/schema.prisma` | PostgreSQL com Prisma Client. |
| **UI Components** | `frontend/src/components/ui/` | Padrão Shadcn/ui com TailwindCSS e Radix UI. |
