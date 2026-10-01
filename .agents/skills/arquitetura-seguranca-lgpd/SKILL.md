---
name: arquitetura-seguranca-lgpd
description: Padrão arquitetural para blindagem de APIs no ITmizer-VR (NestJS + Prisma + PostgreSQL) com Zero Trust, autenticação JWT criptográfica, proteção de dados e credenciais de clientes (LGPD), logs de auditoria de acessos e anti-IDOR.
---

# Skill: Arquitetura de Segurança Zero Trust, LGPD e Auditoria — ITmizer-VR

Esta skill define as diretrizes mandatórias para **blindagem de API, conformidade com a LGPD (Lei Geral de Proteção de Dados)**, proteção de credenciais sensíveis e auditoria de acesso no ecossistema **ITmizer-VR** (ITmizer Console / Cliente 360 / Gestão de Implantações e Migrações VR).

---

## 🎯 Pilares Mandatórios de Segurança

### 1. Autenticação & Zero Trust no Backend (NestJS + Passport JWT)
- **Privacidade por Padrão**: Todos os endpoints de negócio devem ser protegidos por `@UseGuards(JwtAuthGuard, PermissionsGuard)` ou guards equivalentes.
- **Whitelist Pública Estrita**:
  - `/api/auth/login`, `/api/auth/google`, `/api/auth/register` (quando habilitado)
  - `/api/health` ou endpoint raiz de monitoramento
- **Proibido Mock ou Spoofing de Identidade**:
  - Toda a identidade do usuário (`id`, `email`, `roles`) deve ser extraída do token JWT validado (`req.user`).
  - O JWT é assinado criptograficamente com `JWT_SECRET` e expiração definida.
  - Nunca confiar em cabeçalhos estáticos (como `x-user-id` ou `x-user-email`) para tomada de decisão de segurança.

---

### 2. Proteção de Credenciais de Clientes & Cofre Seguro (`client-credentials`)
No módulo de credenciais de clientes (acessos SSH, VPN, RDP, Banco de Dados, VR Master, etc.):
- **Criptografia de Senhas**: Senhas de acesso a servidores e bases de clientes **NUNCA** devem ser armazenadas em texto puro no PostgreSQL. Devem utilizar algoritmo de criptografia simétrica reversível com chave mestra segura (`ENCRYPTION_KEY`) ou hash seguro quando aplicável.
- **Auditoria Obrigatória de Acesso (`ClientCredentialAccessLog`)**:
  - Sempre que um usuário solicitar a visualização/revelação de uma senha (`GET /client-credentials/:id/reveal`), o backend **DEVE** registrar imediatamente um registro de auditoria na tabela `client_credential_access_logs`:
    ```typescript
    await this.prisma.clientCredentialAccessLog.create({
      data: {
        credentialId: id,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        action: 'REVEAL_PASSWORD',
        accessedAt: new Date(),
      }
    });
    ```
- **Nível de Acesso Exclusivo**: Revelação de credenciais exige permissão **ESPECIAL** ou perfil `admin` / `supervisao` / `implantador` autorizado.

---

### 3. Conformidade LGPD & Minimização de Dados (PII)
- **Minimização de Dados**:
  - Endpoints de listagens analíticas, relatórios e métricas de migração não devem expor dados pessoais desnecessários de contatos ou colaboradores dos clientes.
  - CNPJs e CPFs em telas públicas/gerais devem ser formatados e protegidos contra raspagem automatizada.
- **Isolamento de Clientes & Casos Críticos (Anti-IDOR)**:
  - Nas rotas que recebem `clientId` ou `assessmentId`, o backend deve validar se o recurso existe e se o usuário autenticado possui as devidas permissões de visualização/edição no escopo.
- **Auditoria de Operações Críticas**:
  - Histórico de alterações (`ClientHistory`, `AssessmentHistory`, `DeploymentHistory`, `MigrationHistory`, `RecemVrHistory`) deve sempre vincular o `userId` responsável, data/hora e o descritivo da ação realizada.

---

### 4. Proteção do Banco de Dados & Hardness Rules (Prisma / PostgreSQL)
- **PROIBIDO RESETAR BANCO DE DADOS**:
  - Nunca executar ou sugerir `prisma migrate reset`, `db:reset`, scripts de `DROP DATABASE` ou comandos destrutivos.
- **PROIBIDO APAGAR DADOS EM MASSA**:
  - Operações `DELETE FROM` ou `TRUNCATE` em massa são terminantemente proibidas sem aprovação explícita do usuário.
  - Preferir sempre soft deletes ou exclusões pontuais validadas por ID único.

---

### 5. Interceptação e Segurança no Frontend (React + Axios / Fetch)
- **Injeção Automática de Token**: O cliente HTTP central do frontend deve injetar o cabeçalho `Authorization: Bearer <token>` em todas as requisições autenticadas.
- **Tratamento de Sessão Expirada (401 / 403)**:
  - Ao receber status `401 Unauthorized`:
    - Limpar tokens armazenados no `localStorage` ou `sessionStorage`.
    - Redirecionar para `/login`.
  - Ao receber status `403 Forbidden`:
    - Exibir toast/notificação de "Acesso negado: seu perfil não possui permissão para esta ação".
- **Controle de Interface (`usePermissions`)**:
  - Ocultar botões críticos antes da renderização para melhorar a UX, mas mantendo o backend como a autoridade final e inviolável de segurança.
