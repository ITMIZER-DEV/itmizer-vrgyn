# Cliente 360 — Layout e Responsividade — Design

Data: 2026-07-04

## Objetivo

Corrigir o layout da página Cliente 360 (`/clients/:id`, `frontend/src/pages/Clients/Form.tsx`), que hoje sofre de três problemas concretos:

1. A página inteira (formulário + 8 abas + tabelas) está presa num container de `max-w-3xl` (768px), pensado originalmente só para um formulário simples de cadastro.
2. A barra de 8 abas horizontais (`TabsList` com `flex flex-wrap`) quebra em várias linhas de forma confusa, principalmente em telas estreitas.
3. As tabelas de Infraestrutura e Vault de Acessos (6 colunas cada) ficam espremidas dentro desse container estreito, tanto no desktop quanto no mobile.

## Escopo

Apenas a página Cliente 360. Outras páginas do sistema com o mesmo padrão de container estreito (Implantações, Usuários, Recém VR) usam o mesmo `max-w-3xl`/`max-w-4xl` centralizado, mas ficam fora deste spec — o usuário optou por resolver o Cliente 360 primeiro e usar o padrão resultante como referência depois.

## Estrutura da página

A página deixa de ter "formulário sempre visível + abas embaixo" e passa a ser um layout de duas colunas, estilo página de configurações (rail lateral de seções + conteúdo):

- **Seção "Visão Geral"** (primeira do rail): passa a conter o formulário de dados cadastrais (nome, CNPJ, endereço, contato) **e** o resumo em números (contagem de validações/migrações/implantações/Recém VR) juntos — hoje essas duas coisas estavam redundantes (formulário sempre visível fora das abas + uma aba "Visão Geral" quase igual).
- As demais 7 seções (Validações, Migrações, Implantações, Recém VR, Infraestrutura, Vault de Acessos, Histórico) mantêm exatamente o mesmo conteúdo e as mesmas queries que já existem hoje — só muda onde aparecem na tela.

Tecnicamente, continua sendo o mesmo componente `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` do shadcn (Radix Tabs suporta orientação vertical) — a mudança é de CSS/arranjo ao redor, não de lógica de dados: os `TabsContent` de cada seção continuam idênticos ao que já está implementado, apenas a `TabsList` passa de uma linha horizontal para uma coluna lateral.

## Layout e responsividade

**Container**: a página deixa de usar `max-w-3xl mx-auto` como wrapper geral. Passa a usar a largura útil já fornecida pelo `<main className="max-w-7xl mx-auto ...">` do `DashboardLayout` (ou seja, o wrapper interno da página vira `w-full`, sem uma nova restrição de largura mais estreita que a do layout pai).

**Rail lateral — desktop (`lg:` e acima, ≥1024px, mesmo breakpoint já usado em `DashboardLayout`)**:
- Coluna fixa à esquerda, ~224px (`w-56`), com as 8 opções de seção empilhadas verticalmente.
- Visual reaproveitado do `DashboardLayout` existente: item ativo com fundo suave (`bg-primary/5 text-primary`), item inativo em `text-muted-foreground`, hover em `hover:bg-muted/40`, cantos em `rounded-xl` — mesmo vocabulário visual do menu lateral principal do sistema, para não introduzir um padrão novo.
- Área de conteúdo à direita ocupa o espaço restante (`flex-1`).

**Abaixo de `lg` (tablet/celular)**:
- O rail lateral é substituído por um `<Select>` (shadcn, já usado em outras partes do sistema) no topo da página, com as mesmas 8 opções ("Seção: Vault de Acessos", etc.).
- Trocar a opção selecionada troca o conteúdo abaixo, sem quebra de linha.
- Isso é implementado deixando o componente `Tabs` controlado (`value`/`onValueChange` em vez de `defaultValue`), com o `<Select>` e o rail lateral compartilhando o mesmo estado — o rail (`hidden lg:flex`) e o `<Select>` (`lg:hidden`) alternam por CSS puro, igual ao padrão já usado no `DashboardLayout` para sidebar desktop vs. drawer mobile.

**Tabelas dentro de cada seção**: as tabelas de Infraestrutura e Vault de Acessos (que hoje renderizam `<Table>` diretamente, sem wrapper) ganham um `<div className="overflow-x-auto">` ao redor — em telas estreitas, a tabela rola horizontalmente dentro do próprio card, em vez de espremer colunas.

## Fora de escopo

- Não mexe em nenhuma lógica de dados, query, mutation, permissão ou endpoint — é puramente reorganização de CSS/JSX na página e nos dois componentes de tabela.
- Não introduz um sistema de design novo — reaproveita exatamente as classes/variáveis (`bg-primary/5`, `text-muted-foreground`, `rounded-xl`, breakpoint `lg:`) já usadas no `DashboardLayout`.
- Não altera as outras páginas do sistema com o mesmo problema de container estreito (fica para uma iteração futura, por decisão do usuário).
