# Cliente 360 — Header sticky + abas-âncora com scroll-spy

Sub-projeto 3 de 6 do redesign "ITmizer Console" (direção 1b "Console técnico"), continuação dos sub-projetos 1 (Fundação de Design Tokens) e 2 (Shell), ambos já implementados nesta mesma branch/worktree (ainda não mesclados em `master`). Ordem completa: 1) Fundação → 2) Shell → **3) Cliente 360** → 4) Clientes/listagem → 5) Demais módulos → 6) Formulários.

## Objetivo

Substituir o layout de rail vertical + `Select` mobile (implementado numa iteração anterior, ver `docs/superpowers/specs/2026-07-04-cliente-360-layout-responsive.md`) por um único scroll vertical com header sticky do cliente + régua de abas-âncora sticky, onde a aba ativa acompanha a posição de rolagem (scroll-spy) e clicar numa aba rola suavemente até a seção correspondente.

## Escopo

Só o ramo `isEditing` (cliente existente) de `frontend/src/pages/Clients/Form.tsx`. O ramo `!isEditing` (formulário de criar cliente novo, `max-w-3xl mx-auto`) não muda. `frontend/src/pages/Clients/ClientInfrastructureTab.tsx` e `ClientCredentialsTab.tsx` não mudam (nenhum dos dois renderiza seu próprio `Card` externo — encaixam sem alteração como seções da nova página). `frontend/src/components/DashboardLayout.tsx` não muda (o padding do `<main>` é compartilhado por todas as páginas).

## Decisões de escopo (a partir da investigação do código atual)

- **Dados cadastrais continuam editáveis.** O protótipo mostra essa seção como grade só-leitura, mas a tela atual usa esse formulário pra editar CNPJ/razão social/contato de um cliente existente — remover a edição exigiria um mecanismo novo (modal de edição) fora do escopo desta rodada. A seção mantém o `<form>` real com `register`/`handleSubmit`, só reorganizado visualmente.
- **Sem chip de fase no header.** O protótipo mostra um chip "Em migração" ao lado do nome do cliente, mas a entidade `Client` (`frontend/src/services/clientService.ts`) não tem nenhum campo de fase/status — seria preciso inventar uma regra de negócio pra derivar isso (ex: a partir de migrações/implantações/Recém VR), o que é uma feature nova, não parte de um redesign visual. Chip omitido nesta rodada.
- **Sem botão "Exportar".** O protótipo tem um botão "Exportar" no header; não existe essa funcionalidade hoje em nenhum lugar do sistema. Omitido — não crio um botão que não faz nada.
- **Contadores de seção só onde o dado já está disponível no componente.** Validações, Migrações, Implantações, Recém VR e Histórico já são buscados via `useQuery` dentro de `Form.tsx` — cada um ganha um contador (`{lista?.length ?? 0}`) ao lado do título da seção, substituindo os 4 cards de estatística que hoje ficam soltos na antiga aba "Visão Geral". Infraestrutura e Vault **não** ganham contador nesta rodada — os dados desses dois vivem dentro de `ClientInfrastructureTab`/`ClientCredentialsTab` (cada um com seu próprio `useQuery`), e levantar essas queries pra cima só pra mostrar um número no cabeçalho da seção seria tocar em arquivos que este sub-projeto deixa intactos.
- **Mobile usa a mesma régua de abas com scroll horizontal, sem `Select`.** É assim que o protótipo resolve mobile — a régua de abas ganha `overflow-x-auto`. O `<Select>` mobile atual (`lg:hidden`) é removido.
- **`#ID` do cliente:** exibido como `#` + os 8 primeiros caracteres de `client.id` em maiúsculo e fonte mono (ex.: `#A1B2C3D4`) — o protótipo mostra um identificador curto (`#CLI-0412`), e o `id` real é um UUID longo; truncar os 8 primeiros caracteres é a aproximação mais simples que não exige um campo de "código curto" novo no backend.

## 1. Estrutura

- **Header do cliente** — `sticky top-0 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 bg-card border-b border-border py-3.5` (a margem negativa + padding equivalente faz o header "sangrar" até a borda do `<main>`, que tem padding próprio em `DashboardLayout.tsx` — não tocado). Conteúdo: nome (`font-display text-2xl font-bold`), `#ID` (`font-mono text-xs text-muted-foreground`), e o botão "Criar Validação" existente à direita (mesmo `onClick` de hoje).
- **Régua de abas-âncora** — logo abaixo do header, também `sticky` (offset pela altura do header, ~56-60px — medir e ajustar no plano), mesma técnica de `-mx-4 lg:-mx-8 px-4 lg:px-8`, `overflow-x-auto`, uma aba por seção (mesmas 8 labels de `SECTIONS` já existente). Aba ativa: `border-b-2 border-primary text-foreground font-semibold`; inativa: `text-muted-foreground hover:text-foreground`.
- **Conteúdo** — as 8 seções empilhadas verticalmente (`<section id={section.value}>`), `scroll-margin-top` (ou offset calculado no scroll do clique) de **110px** (mesmo valor documentado no handoff original) pra não ficar atrás do header+abas sticky.

## 2. Scroll-spy

- `IntersectionObserver` observando as 8 `<section>` (via callback ref guardado num `useRef<Record<string, HTMLElement | null>>({})`), com `rootMargin` negativo no topo equivalente à altura do header+abas sticky, atualizando `activeSection` para a seção com maior `intersectionRatio` entre as que estão intersectando no momento.
- Clique numa aba: `sectionRefs.current[value]?.scrollIntoView({ behavior: 'smooth', block: 'start' })`, com o offset de 110px aplicado via `scroll-margin-top` CSS na seção (mais simples e mais robusto que calcular `window.scrollTo` manualmente).
- `activeSection` deixa de ser só o estado inicial de um `Tabs` clicado — passa a ser atualizado tanto por clique quanto pelo observer.

## 3. Seções (conteúdo idêntico ao atual, só reorganizado)

1. **Dados cadastrais** — o `cadastralForm` existente (mesmos campos/`register`), grid reorganizado (`grid-cols-1 md:grid-cols-2` já é o padrão atual, mantido).
2. **Validações** — lista atual + contador `{assessments?.length ?? 0}`.
3. **Migrações** — lista atual + contador `{migrations?.length ?? 0}`.
4. **Implantações** — lista atual + contador `{deployments?.length ?? 0}`.
5. **Recém VR** — lista atual + contador `{recemVrList?.length ?? 0}`.
6. **Infraestrutura** — `<ClientInfrastructureTab clientId={id!} />`, sem contador (ver decisão de escopo).
7. **Vault** — `<ClientCredentialsTab clientId={id!} />`, sem contador (ver decisão de escopo).
8. **Histórico** — timeline atual + contador `{(client as any)?.history?.length ?? 0}`.

## Fora de escopo / riscos aceitos

- `DashboardLayout.tsx`, `ClientInfrastructureTab.tsx`, `ClientCredentialsTab.tsx`, rota de criação de cliente novo — nenhum tocado.
- Chip de fase e botão "Exportar" do protótipo, omitidos por falta de dado/funcionalidade real (ver decisões de escopo acima) — não são regressões, são recursos que nunca existiram.
- Verificação: `npm run build` sem erros em cada tarefa; verificação visual logada (scroll único, abas acompanhando o scroll, clique rolando suave, mobile com scroll horizontal, claro/escuro) precisa ser feita por um humano com navegador — mesma limitação registrada nos sub-projetos 1 e 2.
