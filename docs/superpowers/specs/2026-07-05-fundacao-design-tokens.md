# Fundação de Design Tokens — ITmizer-VR

Sub-projeto 1 de 6 do redesign "ITmizer Console" (direção 1b "Console técnico"), importado via Claude Design a partir de `ITmizer Console - Cliente 360.dc.html` / `design_handoff_itmizer_console/README.md`. Ordem completa acordada com o usuário: **1) Fundação → 2) Shell (sidebar/topbar/command palette) → 3) Cliente 360 → 4) Clientes/listagem → 5) Demais módulos de listagem → 6) Formulários.** Cada sub-projeto tem seu próprio ciclo spec → plano → implementação. Este documento cobre **apenas o sub-projeto 1**.

## Objetivo

Substituir a paleta azul (que hoje compete com o laranja da logo) e a tipografia/densidade atuais pelos tokens da direção 1b, sem tocar em nenhum componente React. Isso faz o app inteiro herdar cor, tipografia e radius corretos imediatamente; a reestruturação de layout de cada tela fica para os sub-projetos 2-6.

## Escopo

Arquivos tocados:
- `frontend/src/index.css` — tokens de cor (`:root`/`.dark`), `--radius`, `@import` de fontes, utilitários `.glass-card`/`.glass-card-premium`/`.glass-header`.
- `frontend/tailwind.config.ts` — `fontFamily`, `fontSize`, `colors.brand.orange`.
- `frontend/package.json` / `frontend/vite.config.ts` — remoção do `lovable-tagger`.

Fora de escopo (sub-projetos seguintes): `DashboardLayout.tsx` (sidebar/topbar/logo/command palette), `Clients/Form.tsx` (Cliente 360), `Clients/List.tsx`, demais páginas de listagem/módulos, formulários com `max-w-3xl` mal aplicado. Essas telas herdam os tokens automaticamente por causa deste sub-projeto, mas sua reestruturação de layout é trabalho separado.

## 1. Paleta de cores

Conversão HEX → HSL calculada exatamente (mantendo o formato `H S% L%` já usado no projeto, sem o prefixo `hsl()` na variável — igual ao padrão atual).

### Tokens novos (sem slot shadcn direto)

Guardam o valor bruto do handoff; ficam disponíveis para os sub-projetos 2-6 consumirem via `var(--nome)` (não usam o padrão `hsl(var(--x))` porque duas variantes dark são `rgba()` com alfa).

| Token CSS | Light | Dark |
|---|---|---|
| `--divider` | `#F3F4F6` | `#1B212A` |
| `--faint` | `#C7CBD1` | `#495260` |
| `--track` | `#F1F2F4` | `#232A34` |
| `--hover` | `#F4F5F7` | `#1C232E` |
| `--brand-hover` | `#E55F00` | `#FF7D1F` |
| `--brand-text` | `#C2410C` | `#FF934D` |
| `--orange-tint` | `#FFF0E5` | `rgba(255,106,0,.16)` |
| `--orange-tint-row` | `#FFF8F2` | `rgba(255,106,0,.07)` |
| `--orange-border` | `#FFD9BD` | `rgba(255,106,0,.42)` |
| `--dot-ok` | `142 71% 45%` (`#22C55E`) | mesmo valor |
| `--dot-warn` | `38 92% 50%` (`#F59E0B`) | mesmo valor |
| `--dot-info` | `221 83% 53%` (`#2563EB`) | `217 91% 60%` (`#3B82F6`) |
| `--dot-danger` | `0 72% 51%` (`#DC2626`) | `0 84% 60%` (`#EF4444`) |
| `--dot-recemvr` | `25 100% 50%` (`#FF6A00`) | mesmo valor |

`--dot-*` seguem o padrão HSL-triplet normal (`hsl(var(--dot-ok))`); os três `--orange-*`/`--brand-*` acima da linha ficam como valor de cor completo (hex ou rgba), consumidos diretamente (`background: var(--orange-tint)`), não via `hsl()`.

### Mapeamento para os slots shadcn existentes

Decisão de mapeamento (para evitar que o `--accent` genérico do shadcn — usado por Dropdown/Select/Command/Calendar para hover neutro de qualquer item — vire laranja global sem querer): `--accent` mapeia para a superfície neutra `--hover`/`--text2`, **não** para `--orange-tint`. O laranja de estado ativo/linha clicável é aplicado seletivamente pelos sub-projetos 2-6 usando os tokens novos acima, não através do slot genérico `--accent`.

| Slot shadcn | Light (HSL) | Dark (HSL) | Origem |
|---|---|---|---|
| `--background` | `240 11% 98%` | `216 28% 7%` | bg |
| `--foreground` | `216 28% 7%` | `208 35% 93%` | ink |
| `--card` | `0 0% 100%` | `215 21% 11%` | surface |
| `--card-foreground` | `216 28% 7%` | `208 35% 93%` | ink |
| `--popover` | `0 0% 100%` | `215 21% 11%` | surface |
| `--popover-foreground` | `216 28% 7%` | `208 35% 93%` | ink |
| `--primary` | `25 100% 50%` | `25 100% 50%` | brand `#FF6A00` (igual nos dois temas) |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | branco |
| `--secondary` | `220 16% 96%` | `217 24% 15%` | hover |
| `--secondary-foreground` | `217 19% 27%` | `213 12% 72%` | text2 |
| `--muted` | `220 12% 95%` | `215 20% 17%` | track |
| `--muted-foreground` | `220 9% 46%` | `212 9% 58%` | muted |
| `--accent` | `220 16% 96%` | `217 24% 15%` | hover (ver decisão acima) |
| `--accent-foreground` | `216 28% 7%` | `208 35% 93%` | ink |
| `--destructive` | `0 72% 51%` | `0 91% 71%` | danger |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 100%` | branco |
| `--success` | `142 72% 29%` | `142 69% 58%` | status sucesso |
| `--success-foreground` | `0 0% 100%` | `216 28% 7%` | branco / ink (contraste no verde claro do dark) |
| `--warning` | `26 90% 37%` | `43 96% 56%` | status atenção |
| `--warning-foreground` | `0 0% 100%` | `216 28% 7%` | branco / ink |
| `--border` | `225 12% 93%` | `215 20% 17%` | border |
| `--input` | `222 15% 87%` | `218 20% 22%` | inputBorder |
| `--ring` | `25 100% 50%` | `25 100% 50%` | brand |
| `--radius` | `0.375rem` | — | 6px (era `0.75rem`) |
| `--sidebar-background` | `0 0% 100%` | `215 21% 11%` | surface |
| `--sidebar-foreground` | `217 19% 27%` | `213 12% 72%` | text2 |
| `--sidebar-primary` | `25 100% 50%` | `25 100% 50%` | brand |
| `--sidebar-primary-foreground` | `0 0% 100%` | `0 0% 100%` | branco |
| `--sidebar-accent` | light usa `--orange-tint` (valor bruto, não HSL) | dark idem | orangeTint — item ativo da sidebar é o único lugar do slot "accent" que usa laranja, e é o `sidebar-accent` especificamente, não o `accent` genérico |
| `--sidebar-accent-foreground` | `17 88% 40%` | `24 100% 65%` | brandText |
| `--sidebar-border` | `225 12% 93%` | `215 20% 17%` | border |
| `--sidebar-ring` | `25 100% 50%` | `25 100% 50%` | brand |

Nota sobre `--sidebar-accent`: como é um valor bruto (hex/rgba) e não HSL-triplet, `tailwind.config.ts` deve referenciá-lo como `"var(--sidebar-accent)"` diretamente (sem o wrapper `hsl(...)`), igual aos tokens `--orange-*`.

## 2. Tipografia

`index.css`: trocar o `@import` do Google Fonts — sai Space Grotesk, entra **Sora** (pesos 600/700); Inter continua (pesos 300/400/500/600/700, já carregados).

`tailwind.config.ts` → `theme.extend.fontFamily`:
```ts
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  display: ['Sora', 'sans-serif'],
  mono: ['ui-monospace', 'Menlo', 'monospace'],
}
```

`theme.extend.fontSize` — redefine `xs`–`3xl` (override pontual; `4xl` em diante continuam o padrão Tailwind, usados hoje só em `Auth.tsx`/`Privacy.tsx`/`Terms.tsx`, fora do escopo deste redesign):

| Chave | Valor | Line-height | Uso pretendido (próximos sub-projetos) |
|---|---|---|---|
| `2xs` (nova) | `0.625rem` (10px) | `0.875rem` | labels CAPS, limite inferior |
| `xs` | `0.6875rem` (11px) | `1rem` | labels CAPS, limite superior / legendas |
| `sm` | `0.75rem` (12px) | `1.125rem` | texto de tabela |
| `base` | `0.78125rem` (12.5px) | `1.25rem` | corpo padrão |
| `lg` | `0.8125rem` (13px) | `1.25rem` | títulos de card, limite inferior |
| `xl` | `0.875rem` (14px) | `1.375rem` | títulos de card, limite superior |
| `2xl` | `1.1875rem` (19px) | `1.5rem` | h1 de página |
| `3xl` | `1.375rem` (22px) | `1.75rem` | números de KPI |

`2xs` é uma chave nova (aditiva, não substitui nada existente).

## 3. Forma & profundidade

- `--radius`: `0.75rem` → `0.375rem` (6px). Efeito imediato em toda classe `rounded-lg`/`rounded-md`/`rounded-sm` do Tailwind (que já derivam de `var(--radius)`); `rounded-xl`/`rounded-full` explícitos no código não são afetados por este token e continuam do tamanho que estão até serem tocados nos sub-projetos seguintes.
- Utilitários `.glass-card`, `.glass-card-premium`, `.glass-header` em `index.css` perdem `backdrop-blur-*`, opacidade (`/80`, `/50`) e sombra grande, viram superfícies sólidas: `bg-card` opaco, `border border-border`, sem `shadow-lg`/`shadow-xl` (no máximo uma sombra mínima ou nenhuma). **Os nomes das classes não mudam** — nenhum componente que usa `className="glass-card"` etc. precisa ser editado nesta rodada.
- `.hero-overlay` (gradiente laranja hardcoded em `rgba(255,107,0,...)`) fica como está — é consumido só pelo `DashboardLayout.tsx`, que é sub-projeto 2.

## 4. Limpeza do Lovable

- `frontend/package.json`: remover `"lovable-tagger": "^1.1.11"` de `devDependencies`.
- `frontend/vite.config.ts`: remover `import { componentTagger } from "lovable-tagger"` e a expressão `mode === "development" && componentTagger()` do array `plugins`.
- Rodar `npm install` no `frontend/` para atualizar o lockfile.
- `frontend/tailwind.config.ts`: atualizar `colors.brand.orange` de `#FF6B00` para `#FF6A00` (alinhar com o novo `--brand` exato; usado hoje em `Auth.tsx`/`Privacy.tsx`/`Terms.tsx`, fora do escopo visual deste redesign, mas a cor deve ser a mesma em todo o app). `colors.brand.dark` não muda.

## Fora de escopo / riscos aceitos

- Nenhum componente React é editado. Páginas ainda não redesenhadas (Auth, Privacy, Terms, e todas as telas dos sub-projetos 2-6) mudam de cor/fonte/radius automaticamente, mas continuam com o mesmo layout até seu próprio sub-projeto.
- `--accent` genérico do shadcn (Dropdown/Select/Command/Calendar) fica neutro, não laranja — ver decisão de mapeamento acima.
- Verificação: rodar a aplicação localmente (`npm run dev` no frontend) e conferir visualmente que nenhuma tela quebrou (texto ilegível, contraste ruim) em light e dark antes de considerar este sub-projeto concluído.
