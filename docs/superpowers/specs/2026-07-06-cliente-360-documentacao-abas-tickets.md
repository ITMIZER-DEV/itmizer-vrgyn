# Cliente 360 — Botão Documentação, abas reais e aba Tickets

## Objetivo

Três ajustes independentes no Cliente 360 (`frontend/src/pages/Clients/Form.tsx`, ramo `isEditing`):

1. Expor o link do Drive (`driveLink`, já existente no backend) como um botão "Documentação" no cabeçalho.
2. Reverter o padrão de scroll-spy (implementado em `docs/superpowers/specs/2026-07-05-cliente-360-scroll-spy.md`) para abas reais: clicar numa aba troca o conteúdo exibido, sem empilhar todas as seções na mesma rolagem.
3. Adicionar uma nova aba "Tickets" com cadastro manual de tickets do Movidesk (data, número, assunto, classificação de urgência) — não é integração com a API do Movidesk, é entrada manual pela equipe.

## Decisões de escopo

- **`driveLink` já existe de ponta a ponta**: schema Prisma (`Client.driveLink`), DTO (`create-client.dto.ts`), e o campo de edição já existe em `ClientModal.tsx` (atrás da permissão `canSpecial`). Este spec só adiciona a *leitura/atalho* no Cliente 360, não muda o modelo de dados nem a permissão de edição via modal.
- **Sem integração com API do Movidesk.** O campo "Classificação" é uma lista fixa de urgência (Baixa/Média/Alta/Crítica), não o schema de categorias do Movidesk. Os tickets são cadastrados manualmente pela equipe, refletindo o que já existe no Movidesk — o sistema não consulta o Movidesk.
- **Abas reais substituem o scroll-spy só no Cliente 360.** Nenhuma outra tela muda. A régua de abas mantém o mesmo visual (mesmas classes, mesmos labels, mesmos contadores) — só o comportamento de clique e o que fica montado no DOM mudam.
- **`ClientInfrastructureTab.tsx` e `ClientCredentialsTab.tsx` não mudam.** Seguem recebendo `clientId` e renderizando dentro de um `<Card>` da seção ativa, como hoje.

## 1. Botão "Documentação"

No cabeçalho sticky do Cliente 360, ao lado do botão "Criar Validação" existente:

- Se `client.driveLink` estiver preenchido: botão `Documentação` (ícone `Link` ou `FileText` do lucide-react) que faz `window.open(client.driveLink, '_blank', 'noopener,noreferrer')`.
- Se `client.driveLink` estiver vazio: botão `Adicionar Link` que abre um `Dialog` pequeno e dedicado (não o `ClientModal` inteiro) com um único campo `Input` (URL) e botão Salvar, gravando via `clientService.update(id, { driveLink })` e invalidando a query `['client', id]` no sucesso.
- Ambos os botões respeitam a mesma regra de permissão (`canSpecial`) já usada em `ClientModal.tsx` para o campo de Drive — só quem pode editar o link vê o botão "Adicionar Link"; quem não pode, e não há link, não vê nenhum dos dois botões.

## 2. Abas reais (substitui scroll-spy)

Em `Form.tsx`:

- Remove: `IntersectionObserver`, `sectionRefs`, `scrollToSection` com `scrollIntoView`, classes `scroll-mt-[110px]`.
- `activeSection` passa a ser controlado só por clique na régua de abas (estado simples, sem observer).
- A área de conteúdo renderiza **apenas** a seção cujo `value` é igual a `activeSection` — as demais não ficam no DOM (`{activeSection === 'migracoes' && <secão migrações/>}` ou equivalente com um `switch`/lookup).
- A régua de abas mantém o visual atual (`border-b-2 border-primary` na ativa, `overflow-x-auto` no mobile) e os contadores (`{migrations?.length ?? 0}` etc.) que já são buscados via `useQuery` no topo do componente — essas queries continuam rodando todas de uma vez (não lazy por aba), preservando o comportamento atual de dados sempre atualizados nas abas.
- Os 8 itens de `SECTIONS` recebem um 9º: `{ value: 'tickets', label: 'Tickets' }`, inserido entre `recem-vr` e `infraestrutura`.

## 3. Aba "Tickets" (cadastro manual)

### Backend

- Novo model Prisma `ClientTicket`:
  ```prisma
  enum TicketUrgencia {
    BAIXA
    MEDIA
    ALTA
    CRITICA
  }

  model ClientTicket {
    id             String         @id @default(uuid())
    clientId       String         @map("client_id")
    client         Client         @relation(fields: [clientId], references: [id])
    data           DateTime
    numero         String
    assunto        String
    classificacao  TicketUrgencia
    createdAt      DateTime       @default(now()) @map("created_at")
    updatedAt      DateTime       @updatedAt @map("updated_at")

    @@map("client_tickets")
  }
  ```
  Adicionar `tickets ClientTicket[]` em `model Client`.
- Novo módulo `backend/src/client-tickets/` espelhando exatamente `client-infrastructure/` (controller, service, `create-client-ticket.dto.ts`, `update-client-ticket.dto.ts`, module registrado em `app.module.ts`):
  - `POST /client-tickets`
  - `GET /client-tickets/client/:clientId`
  - `PATCH /client-tickets/:id`
  - `DELETE /client-tickets/:id`
  - Mesmo `JwtAuthGuard`, mesmo padrão de `NotFoundException` no `findOne`.

### Frontend

- `frontend/src/types/clientTicket.ts`: tipo `ClientTicket`, `CreateClientTicketDto`, `TICKET_URGENCIA_LABELS` (Baixa/Média/Alta/Crítica) e um mapa de cor por urgência para o badge (ex: Baixa=cinza, Média=azul, Alta=laranja, Crítica=vermelho — reaproveitando os tokens de cor já usados em `Badge`/status pills no restante do app).
- `frontend/src/services/clientTicketService.ts`: mesmo formato de `clientInfrastructureService.ts` (`findByClient`, `create`, `update`, `delete`).
- `frontend/src/pages/Clients/ClientTicketsTab.tsx`: mesmo esqueleto de `ClientInfrastructureTab.tsx` — tabela (Data, Número, Assunto, Classificação, Ações), botão "Novo Ticket" com `Dialog` de formulário (`data` como input date, `numero` e `assunto` como texto, `classificacao` como `Select`), editar/excluir por linha com `AlertDialog` de confirmação, gate de `canEdit` via `usePermissions('/clients')` (mesma regra das outras duas abas).
- Em `Form.tsx`, nova seção `tickets` renderiza `<ClientTicketsTab clientId={id!} />` dentro de um `<Card>`, seguindo o mesmo wrapper de Infraestrutura/Vault.

## Fora de escopo / riscos aceitos

- Integração real com a API do Movidesk (autenticação, sincronização automática de tickets) — não faz parte deste spec; pode ser um sub-projeto futuro se a equipe quiser automatizar depois do cadastro manual se provar útil.
- Lazy-loading de dados por aba (buscar `migrations`/`deployments`/etc. só quando a aba correspondente é aberta) — as queries continuam sendo disparadas todas juntas no carregamento da página, como hoje; otimizar isso é uma mudança de performance não solicitada.
- Edição de `driveLink` pelo modal completo (`ClientModal.tsx`) continua existindo e não muda — o diálogo novo do botão "Adicionar Link" é um atalho complementar, não uma substituição.
- Verificação: `npm run build` (frontend e backend) sem erros, `npx prisma migrate dev` para a nova tabela; verificação visual (abas trocando sem scroll, botão de documentação nos dois estados, CRUD de tickets) precisa ser feita por um humano com navegador.
