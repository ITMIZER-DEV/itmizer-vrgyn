# Briefing de Design — ITmizer-VR

## O que é o sistema

ITmizer-VR é o sistema interno da VR Software para gerenciar todo o ciclo de vida de um cliente que está migrando/implantando o sistema da empresa: da validação técnica inicial (assessment do parque tecnológico do cliente), passando pela migração de dados, implantação, até o acompanhamento pós-virada ("Recém VR"). É uma ferramenta de uso interno — equipes de vendas, suporte, migração e implantação usam diariamente, não é voltado ao público externo.

## Stack técnica

- **Backend:** NestJS + Prisma (PostgreSQL).
- **Frontend:** React 18 + Vite + TypeScript, React Router, TanStack Query, react-hook-form + zod, axios, `next-themes` (dark/light mode já implementado).
- **Design system atual:** shadcn/ui sobre Radix UI + Tailwind CSS. Projeto nasceu no Lovable (há um `lovable-tagger` no toolchain), então a base de componentes é o kit padrão do shadcn, com uma camada de estilo customizado por cima.

## Identidade visual atual

- **Cores (`frontend/src/index.css`):** o token `--primary` é um **azul** (`hsl(217 91% 50%)` no claro, `hsl(217 91% 60%)` no escuro). Mas a logo/marca (`DashboardLayout.tsx`) usa **laranja** (`text-orange-600` no texto "VRGYN" ao lado da logo, e um `.hero-overlay` em laranja `rgb(255,107,0)`) — ou seja, **hoje existem duas cores de marca competindo** (azul do design system vs. laranja da logo/wordmark). Isso é uma inconsistência real que vale resolver: qual é a cor de marca de verdade?
- **Tipografia:** Inter (corpo) + Space Grotesk (títulos, via classe utilitária `font-display`, aplicada em `h1`-`h6`).
- **Vocabulário visual:** cards com efeito "glass" (`glass-card`, `glass-card-premium` — fundo semi-transparente + blur + sombra), `rounded-xl` como padrão de borda, `--radius: 0.75rem`. O menu lateral principal (`DashboardLayout.tsx`) tem um item ativo com fundo `bg-primary/5` e texto `text-primary`, hover `hover:bg-muted/40`.
- **Layout geral:** shell fixo com sidebar à esquerda (colapsável, com o próprio estado persistido em localStorage) + header superior + área de conteúdo central limitada a `max-w-7xl`. No mobile, a sidebar vira um drawer.

## Mapa de páginas (módulos principais)

- **Dashboard** (`/`) — landing pós-login.
- **Clientes** (`/clients`, `/clients/:id`) — listagem + página de detalhe do cliente ("Cliente 360": dados cadastrais, validações, migrações, implantações, Recém VR, infraestrutura real do cliente, vault de credenciais criptografado, histórico).
- **Validações / Assessments** (`/assessments`) — formulário de levantamento técnico do parque de TI do cliente.
- **Migração** (`/migration`, `/migration/billing`, `/migration/reports`) — gestão de migrações de dados, faturamento, relatórios.
- **Implantações** (`/deployments`) — guia de implantação por cliente.
- **Recém VR** (`/recem-vr`) — acompanhamento pós-virada, com critérios de criticidade.
- **Usuários / Admin** (`/users`, `/admin`, `/admin/menus`) — gestão de usuários, papéis e permissões granulares por menu.
- **Infraestrutura** (`/infrastructure`) — catálogo de requisitos homologados (servidores, terminais, internet) — diferente da infraestrutura real por cliente (que fica dentro do Cliente 360).
- **Perfil** (`/profile`).

## Problemas de UX/responsividade já identificados

1. **Padrão de container estreito reaproveitado onde não devia.** Várias páginas de formulário (`Clients/Form.tsx`, `Deployments/Form.tsx`, `Users/Form.tsx`, `RecemVr/Form.tsx`, `RecemVr/RecemVrDetail.tsx`) usam um wrapper `max-w-3xl`/`max-w-4xl` centralizado — ótimo para um formulário simples de poucos campos, ruim quando a mesma página também precisa mostrar tabelas, históricos ou múltiplas seções de conteúdo.
2. **Caso mais grave: "Cliente 360" (`/clients/:id`).** Essa página cresceu para ter 8 seções de conteúdo (dados cadastrais, validações, migrações, implantações, Recém VR, infraestrutura do cliente, vault de senhas, histórico) — incluindo duas tabelas de dados reais (servidores/estações, credenciais). Isso já foi parcialmente atacado numa iteração anterior: trocamos abas horizontais por um menu lateral (rail) no desktop + dropdown no mobile, e largura da página. Mesmo assim, o usuário ainda reportou que o layout "não está legal" depois dessa mudança — ou seja, o ajuste feito resolveu o sintoma técnico (não quebra mais/não esmaga mais as tabelas) mas não resolveu a percepção visual/de qualidade da tela. **Este é provavelmente o ponto de partida mais concreto para o Claude Design analisar.**
3. **Sem processo de design estabelecido.** Até agora, toda a interface foi construída reaproveitando padrões shadcn "de fábrica" com ajustes pontuais, sem uma direção visual deliberada — o que provavelmente é a causa raiz de "não parecer muito funcional/responsivo": funciona, mas não foi desenhado como um sistema coeso.

## O que se espera do Claude Design

Repensar a experiência visual do ITmizer-VR como um todo — não só corrigir bugs de responsividade pontuais, mas decidir uma direção de design deliberada para um sistema interno B2B denso em dados (tabelas, formulários, fluxos multi-etapa), incluindo:
- Resolver a inconsistência azul vs. laranja e definir a paleta de marca de verdade.
- Definir um padrão de layout de página que escale de formulário simples até tela rica em abas/tabelas (o problema visto no Cliente 360 provavelmente se repete nas outras páginas listadas no item 1).
- Estabelecer um "quality floor" responsivo (mobile → desktop) consistente entre todas as páginas, não resolvido caso a caso.
