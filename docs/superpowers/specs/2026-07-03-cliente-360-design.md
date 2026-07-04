# Cliente 360 — Design

Data: 2026-07-03

## Objetivo

Reunir numa única página tudo que já existe hoje espalhado por telas diferentes sobre um cliente (validações/assessments, migrações, implantações, Recém VR, histórico) e adicionar três informações novas que hoje não existem no sistema:

1. Infraestrutura real do cliente (servidores e estações/terminais).
2. Vault de credenciais de acesso, criptografado, com responsável pela liberação de cada credencial.
3. Controle de quem pode ver a senha em texto claro versus quem só pode copiá-la.

## Escopo fora desta versão

- Migração dos campos legados de acesso já existentes (`Migration.acessoAnydesk`/`senhaAnydesk`, `Assessment.migracaoAcessos`) para o vault novo. Eles continuam como estão; o vault serve só para credenciais cadastradas daqui para frente.
- Permissões configuráveis por credencial individual (quem vê vs. quem só copia é uma regra fixa por role, não configurável por registro).
- Estações/terminais e servidores compartilham o mesmo model (`ClientInfrastructure`); não há modelagem de rede/topologia.

## Navegação

- Nova rota `/clients/:id` (`ClientDetail.tsx`), com abas: Visão Geral, Validações, Migrações, Implantações, Recém VR, Infraestrutura, Vault de Acessos, Histórico.
- Em `Clients/List.tsx`, a ação "Detalhes/Editar" passa a navegar para `/clients/:id` em vez de abrir `ClientModal`.
- `ClientModal` continua existindo só para o fluxo de criação rápida de um cliente novo (botão "+ Novo Cliente"). Edição completa passa a acontecer na aba Visão Geral da página 360.

## Modelo de dados (Prisma)

```prisma
enum ClientInfraType {
  SERVIDOR_BANCO
  SERVIDOR_APLICACAO
  SERVIDOR_GERENCIADOR
  ESTACAO_TRABALHO
  TERMINAL_PDV
}

model ClientInfrastructure {
  id               String          @id @default(uuid())
  clientId         String          @map("client_id")
  client           Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  type             ClientInfraType
  nome             String
  hostname         String?
  ipAddress        String?         @map("ip_address")
  operatingSystem  String?         @map("operating_system")
  cpuModel         String?         @map("cpu_model")
  ramGb            Int?            @map("ram_gb")
  storageGb        Int?            @map("storage_gb")
  storageType      String?         @map("storage_type")
  observacoes      String?         @db.Text
  isActive         Boolean         @default(true) @map("is_active")
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  @@map("client_infrastructure")
}

enum ClientCredentialType {
  ACESSO_REMOTO
  BANCO_DADOS
  VPN
  SISTEMA_APLICACAO
  OUTRO
}

model ClientCredential {
  id                   String               @id @default(uuid())
  clientId             String               @map("client_id")
  client               Client               @relation(fields: [clientId], references: [id], onDelete: Cascade)
  type                 ClientCredentialType
  label                String
  username             String?
  secretCiphertext     String               @map("secret_ciphertext")
  secretIv             String               @map("secret_iv")
  secretAuthTag        String               @map("secret_auth_tag")
  responsavelNome      String?              @map("responsavel_nome")
  responsavelTelefone  String?              @map("responsavel_telefone")
  responsavelEmail     String?              @map("responsavel_email")
  notes                String?              @db.Text
  isActive             Boolean              @default(true) @map("is_active")
  createdById          String?              @map("created_by_id")
  createdBy            User?                @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdAt            DateTime             @default(now()) @map("created_at")
  updatedAt            DateTime             @updatedAt @map("updated_at")
  accessLogs           ClientCredentialAccessLog[]

  @@map("client_credentials")
}

enum ClientCredentialAction {
  VIEW
  COPY
}

model ClientCredentialAccessLog {
  id           String                  @id @default(uuid())
  credentialId String                  @map("credential_id")
  credential   ClientCredential        @relation(fields: [credentialId], references: [id], onDelete: Cascade)
  userId       String?                 @map("user_id")
  user         User?                   @relation(fields: [userId], references: [id], onDelete: SetNull)
  action       ClientCredentialAction
  createdAt    DateTime                @default(now()) @map("created_at")

  @@map("client_credential_access_logs")
}
```

`Client` ganha `infrastructure ClientInfrastructure[]` e `credentials ClientCredential[]`. `User` ganha as relações inversas (`createdCredentials`, `credentialAccessLogs`).

## Backend

### Criptografia

`CredentialCryptoService` (novo, em `backend/src/clients/credential-crypto.service.ts`):

- AES-256-GCM. Chave de 32 bytes lida de `process.env.CREDENTIAL_ENCRYPTION_KEY` (base64).
- Módulo lança erro no boot (`OnModuleInit`) se a env não estiver setada ou não decodificar para 32 bytes — sem fallback silencioso.
- `encrypt(plaintext): { ciphertext, iv, authTag }` (tudo base64) e `decrypt({ ciphertext, iv, authTag }): plaintext`.
- Nunca loga o plaintext.

### Permissões

Reaproveita `RolesGuard` + `@Roles()` já existente:

- CRUD de metadados de infraestrutura e credenciais (criar/editar/listar sem segredo): permissão de edição já existente do módulo de clientes (menu granular `INCLUSAO_EDICAO`).
- `GET /clients/:clientId/credentials/:id/reveal`: `@Roles(AppRole.admin, AppRole.supervisao)`. Decripta, grava `ClientCredentialAccessLog` com `action: VIEW`, retorna o texto puro.
- `POST /clients/:clientId/credentials/:id/copy`: qualquer role com permissão de visualização do cliente. Decripta, grava log com `action: COPY`, retorna o texto puro.
- Toda checagem de role é no backend; o frontend só esconde o botão "Revelar" por UX.

### Endpoints novos

- `clients/:clientId/infrastructure` — GET (list), POST, PATCH `:id`, DELETE `:id`.
- `clients/:clientId/credentials` — GET (list, sem segredo, com `hasSecret: true` no lugar do valor), POST, PATCH `:id` (metadados; troca de senha é uma ação separada `PATCH .../secret`), DELETE `:id`.
- `clients/:clientId/credentials/:id/reveal` — GET, restrito a admin/supervisao.
- `clients/:clientId/credentials/:id/copy` — POST, qualquer visualizador do cliente.

Cada família de endpoint vive em seu próprio service (`ClientInfrastructureService`, `ClientCredentialsService`) para não inchar `ClientsService`.

### DTOs de saída

`ClientCredential` nunca retorna `secretCiphertext`/`secretIv`/`secretAuthTag` nos endpoints de list/find — só nos usos internos do `reveal`/`copy`, que retornam o plaintext e descartam o resto.

## Frontend

- Aba **Vault de Acessos**: tabela/cards por credencial (tipo, rótulo, usuário, responsável pela liberação). Valor sempre mascarado por padrão.
  - Botão **Copiar**: chama `/copy`, recebe o plaintext só na resposta da chamada, executa `navigator.clipboard.writeText(valor)` e descarta a variável — nunca passa por estado de componente nem é renderizado no DOM.
  - Botão **Revelar** (visível só para `admin`/`supervisao`, checado via contexto de auth já existente): chama `/reveal`, mostra o valor por alguns segundos com aviso de que a ação fica auditada.
- Aba **Infraestrutura**: tabela padrão (mesmo componente `DataTable` já usado em `Clients/List.tsx`) com CRUD de servidores/estações.
- Aba **Histórico**: timeline unindo `ClientHistory` com as demais entidades já linkadas ao cliente.

## Tratamento de erros e casos de borda

- Falha de decriptação (ex: chave rotacionada) → 500 genérico ("Não foi possível recuperar a credencial"); detalhe do erro só no log do servidor, nunca no response.
- Exclusão de cliente cascade-deleta infraestrutura e credenciais (`onDelete: Cascade`), seguindo o padrão já usado em `Deployment`/`Migration`/`RecemVr`.
- Tentativa de `reveal` por role sem permissão → 403 do `RolesGuard`, sem log de acesso bem-sucedido (só tentativa, se necessário auditar negativas — fora de escopo nesta versão).

## Testes

- Round-trip de `CredentialCryptoService.encrypt`/`decrypt`.
- Guard de `reveal` negando acesso para roles fora de admin/supervisao.
- `copy` gravando `ClientCredentialAccessLog` corretamente.
- Cascade delete de cliente removendo infraestrutura e credenciais associadas.
