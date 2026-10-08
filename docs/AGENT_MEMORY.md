# ITmizer-VR — Memória Técnica do Agente (Agent Memory Protocol)

Este documento registra o histórico contínuo de decisões arquiteturais, novos módulos, componentes e diretrizes do **ITmizer-VR (VRGYN)**.

---

## [2026-10-08 12:45] - Migração de Infraestrutura: Docker + Portainer, Ferramentas de Backup/Restore e Cloudflare Tunnel
- **Agente / Modelo**: Antigravity (Gemini 3.7 Flash)
- **Objetivo / Demanda do Usuário**: Migrar a plataforma de banco e hospedagem do ITmizer-VR de Prisma Platform / Vercel para Containers Docker gerenciados via Portainer, criar ferramentas automatizadas de backup e restore com integridade referencial, e disponibilizar a aplicação localmente e via Cloudflare Tunnel com frontend na porta 3009 e API blindada na rede interna.
- **Módulos e Arquivos Criados/Afetados**:
  - `backend/Dockerfile` & `backend/.dockerignore`: Multi-stage build Node 20 Alpine com `prisma db push` automático na inicialização e suporte aos scripts utilitários compilados.
  - `frontend/Dockerfile` & `frontend/nginx.conf`: Multi-stage build com Nginx 1.27 Alpine, compressão gzip, cache de estáticos e proxy reverso interno para `/api/` e `/apiDocs` apontando para `http://backend:3000`.
  - `docker-compose.yml`: Stack de produção/Portainer com PostgreSQL 16 (volume persistente `itmizer_pgdata`), Backend NestJS interno, Frontend Nginx (porta 3009) e Cloudflare Tunnel (`vrgyn.itmizer.com`).
  - `docker-compose.local.yml`: Compose para desenvolvimento de banco local.
  - `.env.docker.example` & `DOCKER_PORTAINER_GUIDE.md`: Template de variáveis para Portainer Stack e guia passo a passo de deploy e restauração.
  - `backend/scripts/backup-db.ts`: Ferramenta que extrai todas as 27 tabelas do schema Prisma com metadados e relatório (`npm run db:backup`).
  - `backend/scripts/restore-db.ts`: Ferramenta de restore sequencial idempotente (`upsert`) com ordenação de chaves estrangeiras e tratamento nullish coalescing (`npm run db:restore`).
  - `backend/src/prisma/prisma.service.ts`: Desacoplado do Prisma Accelerate, usando conexão nativa de alta performance do PostgreSQL quando `DATABASE_URL` for `postgresql://` (e fallback se `prisma://`).
  - `frontend/src/App.tsx`: Fallback seguro para Google Client ID prevenindo exceções do SDK OAuth.
- **Modelos Prisma / Banco de Dados**:
  - Adicionado `linux-musl-openssl-3.0.x` e `debian-openssl-3.0.x` aos `binaryTargets` do `schema.prisma`.
  - Migração de dados 100% concluída: **2.037 registros** extraídos do banco legado e restaurados com sucesso no novo PostgreSQL em Docker.
- **Decisões Técnicas & Segurança (Zero Trust / LGPD)**:
  - **API e Banco Blindados**: Nem a porta do PostgreSQL (5432) nem a da API NestJS (3000) ficam expostas para a internet. Toda a comunicação externa é intermediada pelo Nginx do frontend na porta 3009 e pelo Cloudflare Tunnel.
  - **Volume Persistente**: Os dados residem em volume nomeado do Docker (`itmizer_pgdata`), sobrevivendo a reinicializações e updates de container no Portainer.
  - **Preparação para Redundância (HA / Failover)**: Arquitetura desenhada para permitir nó secundário de backup com PostgreSQL Streaming Replication e Cloudflare Load Balancing.
- **Pontos de Atenção para o Próximo Agente**:
  - Para cadastrar novas origens de login Google OAuth, adicionar no Google Cloud Console: `http://localhost:3009` e `https://vrgyn.itmizer.com`.
  - Ao subir no Portainer em VPS/Servidor, basta colar o `docker-compose.yml` e preencher as variáveis do `.env.docker.example`.
- **Validações Executadas**:
  - [x] Extração de Backup: 2.037 registros salvos em `backups/backup_itmizer_*.json`.
  - [x] Restauração no PostgreSQL do Docker: 2.037 registros restaurados com sucesso em 10.02s.
  - [x] Build do Backend e Frontend em containers Docker: OK.
  - [x] Healthcheck do PostgreSQL: Healthy.
  - [x] Resposta HTTP do Frontend na porta 3009 e Swagger `/apiDocs`: 200 OK.
  - [x] Conexão do Cloudflare Tunnel: Conectado via QUIC para `vrgyn.itmizer.com`.

---

## [2026-10-01] - Revisão de Skills do Projeto e Modal de Histórico de Releases

- **Agente / Modelo**: Antigravity (Gemini Flash)
- **Objetivo / Demanda do Usuário**: Revisão e adequação completa de todas as skills de IA ao ecossistema real do ITmizer-VR (NestJS + Prisma + PostgreSQL + React 18/Vite + Shadcn/ui) e implementação de recurso interativo para acompanhamento de Releases e Changelog diretamente na interface do sistema.
- **Skills Criadas / Atualizadas** (`.agents/skills/`):
  - [`acl_menu_logic`](file:///d:/Projects/itmizer-VR/.agents/skills/acl_menu_logic/SKILL.md): Padrão de 3 níveis de permissões (`Consulta`, `InclusaoEdicao`, `Especial`) com decorators NestJS e hooks React.
  - [`arquitetura-seguranca-lgpd`](file:///d:/Projects/itmizer-VR/.agents/skills/arquitetura-seguranca-lgpd/SKILL.md): Blindagem Zero Trust, cofre seguro de credenciais com criptografia e auditoria obrigatória (`ClientCredentialAccessLog`), conformidade LGPD e anti-IDOR.
  - [`itmizer-change-memory`](file:///d:/Projects/itmizer-VR/.agents/skills/itmizer-change-memory/SKILL.md): Protocolo de documentação de contexto contínuo.
  - [`itmizer-excel-generation`](file:///d:/Projects/itmizer-VR/.agents/skills/itmizer-excel-generation/SKILL.md): Geração e validação de planilhas para Migrações VR, Diagnósticos de Infraestrutura e Relatórios de Implantação.
  - [`itmizer-fullstack-patterns`](file:///d:/Projects/itmizer-VR/.agents/skills/itmizer-fullstack-patterns/SKILL.md): Guia de arquitetura de ponta a ponta (Prisma $\rightarrow$ NestJS $\rightarrow$ React).
  - [`sistema-versionamento`](file:///d:/Projects/itmizer-VR/.agents/skills/sistema-versionamento/SKILL.md): Automação de SemVer com `scripts/bump-version.js` e rollback.
- **Frontend & Interfaces Criadas**:
  - [`ReleaseNotesDialog.tsx`](file:///d:/Projects/itmizer-VR/frontend/src/components/ReleaseNotesDialog.tsx): Diálogo interativo com linha do tempo de releases, badges coloridos por tipo (`major`, `minor`, `patch`), data e detalhamento das novidades.
  - [`DashboardLayout.tsx`](file:///d:/Projects/itmizer-VR/frontend/src/components/DashboardLayout.tsx): Badge do rodapé do sidebar tornado clicável com hover effect e ícone de novidades, integração no menu de perfil e no drawer mobile.
  - [`version.ts`](file:///d:/Projects/itmizer-VR/frontend/src/config/version.ts) e [`bump-version.js`](file:///d:/Projects/itmizer-VR/scripts/bump-version.js): Tipagem e sincronização automática do array de histórico de versões.
- **Validações Executadas**:
  - [x] Build do frontend (`npm run build` em `frontend` $\rightarrow$ OK)
  - [x] Build da API (`npm run build` em `backend` $\rightarrow$ OK)
