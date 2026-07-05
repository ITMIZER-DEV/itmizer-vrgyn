# Fundação de Design Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a paleta azul/tokens shadcn atuais pela paleta laranja "Console técnico" (direção 1b), a densidade tipográfica, o radius de 6px e os utilitários "glass" achatados, além de remover o `lovable-tagger` — tudo em `index.css`/`tailwind.config.ts`/`package.json`/`vite.config.ts`, sem editar nenhum componente React.

**Architecture:** Mudança isolada em 4 arquivos de configuração/estilo do `frontend/`. Nenhum componente consome os tokens novos ainda (isso é trabalho dos sub-projetos 2-6); o objetivo aqui é só trocar os valores por trás dos nomes que os componentes já usam (`--primary`, `--border`, `--radius`, `.glass-card`, `font-display` etc.), então o app inteiro herda a nova aparência automaticamente no primeiro build.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind CSS, shadcn/ui (tokens CSS custom properties em HSL).

## Global Constraints

- Nenhum arquivo `.tsx` é criado ou editado neste plano — só `frontend/src/index.css`, `frontend/tailwind.config.ts`, `frontend/package.json`, `frontend/vite.config.ts`.
- `--primary` é `25 100% 50%` (`#FF6A00`) em light **e** dark (mesmo valor nos dois temas, ao contrário do azul anterior que mudava entre light/dark).
- `--radius` vira `0.375rem` (era `0.75rem`). Não mexer em classes `rounded-xl`/`rounded-full` explícitas no código — só o token.
- `--accent`/`--accent-foreground` (slot genérico do shadcn usado por Dropdown/Select/Command/Calendar) ficam **neutros** (`--hover`/`--ink`), não laranja. O laranja de estado ativo é só em `--sidebar-accent`/`--sidebar-accent-foreground` e nos tokens novos (`--orange-tint` etc.), que ficam disponíveis mas sem nenhum consumidor ainda.
- `--orange-tint`, `--orange-tint-row`, `--orange-border`, `--brand-hover`, `--brand-text`, `--sidebar-accent` guardam valor de cor bruto (hex ou `rgba()`), **não** o formato HSL-triplet — são consumidos como `var(--nome)` diretamente, nunca com wrapper `hsl(...)`.
- Depois de cada task, `cd frontend && npm run build` precisa terminar sem erro antes de commitar.

---

### Task 1: Tokens de cor + radius + import de fonte em `index.css`

**Files:**
- Modify: `frontend/src/index.css:1` (linha do `@import`)
- Modify: `frontend/src/index.css:8-75` (blocos `:root` e `.dark`)

**Interfaces:**
- Produces: variáveis CSS `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--border`, `--input`, `--ring`, `--radius`, `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` (valores HSL-triplet, exceto `--sidebar-accent` que é hex/rgba bruto) — todas já consumidas pelos componentes existentes via `tailwind.config.ts`, nada muda de nome.
- Produces: variáveis novas `--divider`, `--faint`, `--track`, `--hover`, `--brand-hover`, `--brand-text`, `--orange-tint`, `--orange-tint-row`, `--orange-border`, `--dot-ok`, `--dot-warn`, `--dot-info`, `--dot-danger`, `--dot-recemvr` — sem consumidor nesta rodada, disponíveis para os sub-projetos 2-6.

- [ ] **Step 1: Trocar o `@import` de fontes (linha 1)**

Substituir a linha 1 inteira de:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
```
para:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@600;700&display=swap');
```

- [ ] **Step 2: Substituir o bloco `:root` (linhas 8-41)**

Substituir o bloco `:root { ... }` inteiro (da chave de abertura na linha 8 até o fechamento na linha 41) por:

```css
  :root {
    --background: 240 11% 98%;
    --foreground: 216 28% 7%;
    --card: 0 0% 100%;
    --card-foreground: 216 28% 7%;
    --popover: 0 0% 100%;
    --popover-foreground: 216 28% 7%;
    --primary: 25 100% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 16% 96%;
    --secondary-foreground: 217 19% 27%;
    --muted: 220 12% 95%;
    --muted-foreground: 220 9% 46%;
    --accent: 220 16% 96%;
    --accent-foreground: 216 28% 7%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 72% 29%;
    --success-foreground: 0 0% 100%;
    --warning: 26 90% 37%;
    --warning-foreground: 0 0% 100%;
    --border: 225 12% 93%;
    --input: 222 15% 87%;
    --ring: 25 100% 50%;
    --radius: 0.375rem;
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 217 19% 27%;
    --sidebar-primary: 25 100% 50%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: #FFF0E5;
    --sidebar-accent-foreground: 17 88% 40%;
    --sidebar-border: 225 12% 93%;
    --sidebar-ring: 25 100% 50%;

    --divider: #F3F4F6;
    --faint: #C7CBD1;
    --track: #F1F2F4;
    --hover: #F4F5F7;
    --brand-hover: #E55F00;
    --brand-text: #C2410C;
    --orange-tint: #FFF0E5;
    --orange-tint-row: #FFF8F2;
    --orange-border: #FFD9BD;
    --dot-ok: 142 71% 45%;
    --dot-warn: 38 92% 50%;
    --dot-info: 221 83% 53%;
    --dot-danger: 0 72% 51%;
    --dot-recemvr: 25 100% 50%;
  }
```

- [ ] **Step 3: Substituir o bloco `.dark` (linhas 43-75)**

Substituir o bloco `.dark { ... }` inteiro por:

```css
  .dark {
    --background: 216 28% 7%;
    --foreground: 208 35% 93%;
    --card: 215 21% 11%;
    --card-foreground: 208 35% 93%;
    --popover: 215 21% 11%;
    --popover-foreground: 208 35% 93%;
    --primary: 25 100% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 217 24% 15%;
    --secondary-foreground: 213 12% 72%;
    --muted: 215 20% 17%;
    --muted-foreground: 212 9% 58%;
    --accent: 217 24% 15%;
    --accent-foreground: 208 35% 93%;
    --destructive: 0 91% 71%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 69% 58%;
    --success-foreground: 216 28% 7%;
    --warning: 43 96% 56%;
    --warning-foreground: 216 28% 7%;
    --border: 215 20% 17%;
    --input: 218 20% 22%;
    --ring: 25 100% 50%;
    --sidebar-background: 215 21% 11%;
    --sidebar-foreground: 213 12% 72%;
    --sidebar-primary: 25 100% 50%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: rgba(255, 106, 0, 0.16);
    --sidebar-accent-foreground: 24 100% 65%;
    --sidebar-border: 215 20% 17%;
    --sidebar-ring: 25 100% 50%;

    --divider: #1B212A;
    --faint: #495260;
    --track: #232A34;
    --hover: #1C232E;
    --brand-hover: #FF7D1F;
    --brand-text: #FF934D;
    --orange-tint: rgba(255, 106, 0, 0.16);
    --orange-tint-row: rgba(255, 106, 0, 0.07);
    --orange-border: rgba(255, 106, 0, 0.42);
    --dot-ok: 142 71% 45%;
    --dot-warn: 38 92% 50%;
    --dot-info: 217 91% 60%;
    --dot-danger: 0 84% 60%;
    --dot-recemvr: 25 100% 50%;
  }
```

- [ ] **Step 4: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina com `✓ built in ...` e sem erros de TypeScript/CSS.

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/index.css
git commit -m "feat(design): substitui tokens de cor shadcn pela paleta laranja Console técnico"
```

---

### Task 2: Achatar utilitários "glass" e corrigir gradiente em `index.css`

**Files:**
- Modify: `frontend/src/index.css` (bloco `@layer utilities`, classes `.glass-card`, `.glass-card-premium`, `.glass-header`, `.gradient-primary`)

**Interfaces:**
- Consumes: nenhuma (edição só de CSS).
- Produces: as mesmas classes `.glass-card`, `.glass-card-premium`, `.glass-header` continuam existindo com os mesmos nomes — nenhum componente React precisa mudar `className`.

- [ ] **Step 1: Substituir as três classes glass**

Localizar (dentro do `@layer utilities` já existente) e substituir:

```css
  .glass-card {
    @apply bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg;
  }
  .glass-card-premium {
    @apply bg-card/50 backdrop-blur-md border border-border/40 shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300;
  }
  .glass-header {
    @apply sticky top-0 z-40 w-full border-b border-border/30 bg-card/50 backdrop-blur-md transition-all duration-300;
  }
```

por:

```css
  .glass-card {
    @apply bg-card border border-border;
  }
  .glass-card-premium {
    @apply bg-card border border-border transition-all duration-300;
  }
  .glass-header {
    @apply sticky top-0 z-40 w-full border-b border-border bg-card transition-all duration-300;
  }
```

- [ ] **Step 2: Corrigir o stop hardcoded azul em `.gradient-primary`**

`.gradient-primary` hoje é:
```css
  .gradient-primary {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(217 91% 65%) 100%);
  }
```
O segundo stop (`hsl(217 91% 65%)`) é um azul fixo que sobrou do tema antigo — como `--primary` agora é laranja, esse gradiente ficaria laranja→azul. Substituir por um laranja mais claro (mesma abordagem antes usada: leve variação de luminosidade do brand):
```css
  .gradient-primary {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(25 100% 65%) 100%);
  }
```

- [ ] **Step 3: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/index.css
git commit -m "style(design): achata utilitarios glass e corrige stop azul do gradiente primary"
```

---

### Task 3: Tipografia, fontSize e cores em `tailwind.config.ts`

**Files:**
- Modify: `frontend/tailwind.config.ts:21-24` (`fontFamily`)
- Modify: `frontend/tailwind.config.ts:67-70` (`colors.brand`)
- Modify: `frontend/tailwind.config.ts:71-80` (`colors.sidebar`)
- Modify: `frontend/tailwind.config.ts` (adicionar `fontSize` dentro de `theme.extend`)

**Interfaces:**
- Consumes: variáveis CSS de `index.css` (Task 1): `--sidebar-accent` (valor bruto, não HSL).
- Produces: classes utilitárias Tailwind `font-sans`, `font-display`, `font-mono`; escala `text-2xs`/`text-xs`/`text-sm`/`text-base`/`text-lg`/`text-xl`/`text-2xl`/`text-3xl` com os novos tamanhos; `bg-brand-orange`/`text-brand-orange`/`bg-brand-dark` continuam existindo (só o hex de `orange` muda).

- [ ] **Step 1: Atualizar `fontFamily` (linhas 21-24)**

De:
```ts
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
```
Para:
```ts
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
      },
```

- [ ] **Step 2: Adicionar `fontSize` logo após `fontFamily` (dentro de `theme.extend`)**

Inserir depois do bloco `fontFamily` do Step 1:
```ts
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.6875rem', { lineHeight: '1rem' }],
        sm: ['0.75rem', { lineHeight: '1.125rem' }],
        base: ['0.78125rem', { lineHeight: '1.25rem' }],
        lg: ['0.8125rem', { lineHeight: '1.25rem' }],
        xl: ['0.875rem', { lineHeight: '1.375rem' }],
        '2xl': ['1.1875rem', { lineHeight: '1.5rem' }],
        '3xl': ['1.375rem', { lineHeight: '1.75rem' }],
      },
```

- [ ] **Step 3: Atualizar `colors.brand.orange` (linhas 67-70)**

De:
```ts
        brand: {
          orange: "#FF6B00",
          dark: "#1A1A1A",
        },
```
Para:
```ts
        brand: {
          orange: "#FF6A00",
          dark: "#1A1A1A",
        },
```

- [ ] **Step 4: Corrigir o wrapper de `sidebar.accent` (linhas 71-80)**

De:
```ts
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
```
Para (só a linha `accent` muda — `--sidebar-accent` agora guarda hex/rgba bruto, não HSL-triplet, então não pode ir dentro do wrapper `hsl(...)`):
```ts
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
```

- [ ] **Step 5: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros de TypeScript (o arquivo é `.ts`, então um erro de sintaxe quebra o build imediatamente).

- [ ] **Step 6: Commit**

```bash
cd frontend
git add tailwind.config.ts
git commit -m "feat(design): tipografia Sora/mono, escala de densidade e cores em tailwind.config"
```

---

### Task 4: Remover `lovable-tagger`

**Files:**
- Modify: `frontend/package.json:84` (remover linha `"lovable-tagger": "^1.1.11"` de `devDependencies`)
- Modify: `frontend/vite.config.ts:4` (remover import)
- Modify: `frontend/vite.config.ts:12` (remover uso no array `plugins`)
- Modify: `frontend/package-lock.json` (via `npm install`)

**Interfaces:**
- Consumes: nenhuma.
- Produces: `vite.config.ts` exporta a mesma config, só sem o plugin `componentTagger`.

- [ ] **Step 1: Remover a dependência do `package.json`**

Remover a linha inteira `"lovable-tagger": "^1.1.11",` de dentro de `devDependencies`.

- [ ] **Step 2: Remover o import e uso em `vite.config.ts`**

De:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```
Para:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```
(O parâmetro `mode` do callback some porque não é mais usado em lugar nenhum da função.)

- [ ] **Step 3: Atualizar o lockfile**

Run: `cd frontend && npm install`
Expected: termina sem erro; `package-lock.json` reflete a remoção de `lovable-tagger` (e suas dependências exclusivas, se houver).

- [ ] **Step 4: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros (confirma que remover o plugin não quebrou nada — ele só rodava em `mode === 'development'`, nunca no build de produção).

- [ ] **Step 5: Commit**

```bash
cd frontend
git add package.json package-lock.json vite.config.ts
git commit -m "chore: remove dependencia lovable-tagger"
```

---

### Task 5: Verificação visual final (light + dark)

**Files:**
- Nenhum arquivo novo — só verificação manual do resultado das Tasks 1-4.

**Interfaces:**
- Consumes: todos os tokens/config das Tasks 1-4.
- Produces: confirmação de que nenhuma tela quebrou visualmente antes de considerar este sub-projeto concluído.

- [ ] **Step 1: Subir o dev server**

Run: `cd frontend && npm run dev`
Expected: Vite sobe em `http://localhost:8080` sem erro no terminal.

- [ ] **Step 2: Checar visualmente em modo claro**

Abrir `http://localhost:8080` no navegador, logar, navegar por Dashboard, Clientes (listagem) e um Cliente 360 (`/clients/:id`). Confirmar: botões/links primários e o item ativo do menu lateral aparecem em **laranja** (não mais azul); nenhum texto ilegível (baixo contraste); cards e header não têm mais desfoque de fundo (glass); cantos de card/botão levemente menos arredondados que antes.

- [ ] **Step 3: Checar visualmente em modo escuro**

Clicar no toggle de tema (ícone sol/lua no header) e repetir a checagem do Step 2 em dark mode: laranja continua legível sobre fundo escuro, texto claro com bom contraste, sem elementos com fundo transparente/desfocado sobrando.

- [ ] **Step 4: Checar as páginas fora do escopo do redesign**

Navegar até `/privacity` e `/terms` (ou a página de login `/auth`) e confirmar que ainda renderizam corretamente — usam `text-brand-orange`/`bg-brand-dark` (Task 3, Step 3), não os tokens shadcn, então não devem ter mudado de layout, só o tom exato do laranja (de `#FF6B00` para `#FF6A00`, imperceptível a olho nu).

- [ ] **Step 5: Encerrar o dev server e confirmar working tree limpa**

Run: `git status`
Expected: sem alterações pendentes (tudo já commitado nas Tasks 1-4); só o arquivo `docs/superpowers/specs/2026-07-04-briefing-design-itmizer-vr.md` (corrompido, fora do escopo deste plano, decisão adiada pelo usuário) pode aparecer como modificado.
