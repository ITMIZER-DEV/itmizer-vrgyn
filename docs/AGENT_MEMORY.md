# ITmizer-VR — Memória Técnica do Agente (Agent Memory Protocol)

Este documento registra o histórico contínuo de decisões arquiteturais, novos módulos, componentes e diretrizes do **ITmizer-VR (VRGYN)**.

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
