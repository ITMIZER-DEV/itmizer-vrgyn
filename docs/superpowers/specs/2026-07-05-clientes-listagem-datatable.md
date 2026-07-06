# Clientes/Listagem + Table/DataTable compartilhados

Sub-projeto 4 de 6 do redesign "ITmizer Console" (direção 1b "Console técnico"), continuação dos sub-projetos 1 (Fundação), 2 (Shell) e 3 (Cliente 360), já implementados nesta mesma branch/worktree (ainda não mesclados em `master`). Ordem completa: 1) Fundação → 2) Shell → 3) Cliente 360 → **4) Clientes/listagem** → 5) Demais módulos → 6) Formulários.

## Objetivo

Aplicar a densidade "Console técnico" (linhas ~32px, cabeçalho mono CAPS) na infraestrutura de tabela compartilhada do sistema, e reestilizar a página de listagem de Clientes por cima dela.

## Escopo

- `frontend/src/components/ui/table.tsx` — primitivos shadcn (`TableHead`, `TableCell`) usados por toda tabela do sistema.
- `frontend/src/components/ui/data-table.tsx` — componente de tabela com busca/exportar/colunas/paginação, usado hoje por `Clients/List.tsx`, `Migration/List.tsx` e `Index.tsx`.
- `frontend/src/pages/Clients/List.tsx` — header da página e o `Card` que envolve a tabela.

Fora de escopo: `Migration/List.tsx`, `Index.tsx` (herdam a densidade nova automaticamente por usarem `DataTable`, mas seu conteúdo/colunas próprias não são tocados — isso é trabalho do sub-projeto 5), `ClientInfrastructureTab.tsx`/`ClientCredentialsTab.tsx` (herdam a densidade nova por usarem `Table` diretamente, sem edição própria), `ClientModal.tsx` (usado sem mudança pelo botão "Novo Cliente").

## Decisões de escopo

- **Sem chips de filtro de fase.** O protótipo mostra chips "Todas as fases / Em migração / Recém VR" no topo da listagem — mesma razão do sub-projeto 3 (Cliente 360): a entidade `Client` não tem campo de fase/status hoje. Chips omitidos.
- **Colunas continuam as mesmas de hoje** (nome fantasia, CNPJ, contato, data de cadastro, ações) — o protótipo mostra colunas de fase/consultor/data de virada que também não existem como dado real no sistema. Nenhuma coluna nova é adicionada, nenhuma é removida.
- **`table.tsx` é compartilhado de propósito.** Mudar sua densidade uma vez beneficia automaticamente `DataTable` (Clientes/Migração/Dashboard) e as tabelas de Infraestrutura/Vault do Cliente 360, sem exigir uma segunda rodada de edição nesses lugares.

## 1. `table.tsx`

- `TableHead`: de `"h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"` para `"h-8 px-3 text-left align-middle text-[10px] font-mono uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0"`.
- `TableCell`: de `"p-4 align-middle [&:has([role=checkbox])]:pr-0"` para `"px-3 py-2 align-middle [&:has([role=checkbox])]:pr-0"`.
- `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableCaption` não mudam.

## 2. `data-table.tsx`

- Densidade dos controles da toolbar (input de busca, botões de exportar Excel/PDF, botão de colunas): reduzir de `h-10`/`h-8` para tamanhos consistentes com a nova escala (ex.: `h-8 text-xs` já usado nos botões de exportar vira o padrão também do input de busca e do botão "Colunas", hoje em `h-10`).
- Corrigir o azul hardcoded do PDF exportado: `headStyles: { fillColor: [37, 99, 235] }` (comentário `// VR Primary Blue roughly`) vira `headStyles: { fillColor: [255, 106, 0] }` (laranja da marca, `#FF6A00` em RGB).
- Nenhuma mudança de comportamento: busca, exportar, colunas visíveis, ordenação, paginação continuam funcionando exatamente como hoje.

## 3. `Clients/List.tsx`

- Header: `h1` ajustado pra escala tipográfica nova (`text-2xl` em vez de `text-3xl`, consistente com o padrão de título de página já usado no Cliente 360), subtítulo mantido.
- `<Card className="glass-card shadow-lg border-2">` perde `shadow-lg border-2` (sombra pesada e borda dupla contradizem a direção flat já aplicada pela Fundação) — vira só `<Card>` (já flat por padrão via `.glass-card`, que o sub-projeto 1 achatou).
- `<ClientModal />` (botão "Novo Cliente") e todas as `columns` do `DataTable` continuam idênticos — nenhuma mudança de dado ou comportamento.

## Fora de escopo / riscos aceitos

- `Migration/List.tsx`, `Index.tsx`: herdam a densidade via `DataTable`/`table.tsx`, mas nenhum conteúdo/coluna própria é tocado nesta rodada.
- Verificação: `npm run build` sem erros em cada tarefa; verificação visual logada (listagem de Clientes, e conferir de relance que Migração/Dashboard não quebraram visualmente) precisa ser feita por um humano com navegador — mesma limitação registrada nos sub-projetos anteriores.
