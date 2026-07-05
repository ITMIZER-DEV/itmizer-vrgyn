# Shell — Sidebar, Topbar e Command Palette

Sub-projeto 2 de 6 do redesign "ITmizer Console" (direção 1b "Console técnico"), continuação do Sub-projeto 1 — Fundação de Design Tokens (`docs/superpowers/specs/2026-07-05-fundacao-design-tokens.md`, já implementado nesta mesma branch/worktree, ainda não mesclado em `master`). Ordem completa: 1) Fundação → **2) Shell** → 3) Cliente 360 → 4) Clientes/listagem → 5) Demais módulos → 6) Formulários.

## Objetivo

Reestilizar o shell do app (`DashboardLayout.tsx`) para a direção 1b — sidebar mais compacta com nova logo, item ativo laranja, badge "Vinculado ao VRGYN"; topbar mais fina com rótulo de seção e avatar quadrado — e adicionar uma funcionalidade nova: busca de rotas via `⌘K`/`Ctrl+K` (Command Palette), alimentada pelos menus reais do usuário (permissão-aware), não por uma lista fixa.

## Decisões de escopo (confirmadas com o usuário)

- **Ícones do menu:** mantém os ícones Lucide que o admin já escolhe em `/admin/menus` (campo `icon` de `MenuItem`/`MenuSubitem`) — só o container visual vira um "tile" quadrado 20×20. Não se implementa o glifo de 2 letras do protótipo.
- **Logo:** troca `logo.png`/`logo_mobile.png` pelo SVG de hexágono outline laranja + wordmark "ITMIZER" do protótipo.
- **Drawer mobile:** estrutura mantida como está hoje (herda as cores/radius novos automaticamente, já aplicados no sub-projeto 1); não é redesenhado nesta rodada.
- **Breadcrumb:** vira um rótulo de uma seção só (o item de menu ativo, mesma lógica de `isActive()` que já existe), não um rastro multi-nível. O protótipo mostra dois níveis (`Clientes › Supermercado Andrade`) só na tela de Cliente 360 — isso é responsabilidade do sub-projeto 3 (Cliente 360), que pode estender o rótulo nessa página específica quando for implementado.
- **Dropdowns de Admin/Perfil:** sem mudança estrutural, só herdam os tokens (já aplicado).

## Arquivos

- Criar: `frontend/src/components/BrandLogo.tsx` — SVG do hexágono + wordmark, com prop pra controlar se mostra o wordmark (sidebar expandida mostra os dois; colapsada e o drawer mobile mostram só o hexágono, ou o wordmark sempre no mobile — ver seção 1).
- Criar: `frontend/src/components/CommandPalette.tsx` — modal de busca de rotas.
- Modificar: `frontend/src/components/DashboardLayout.tsx` — sidebar (largura, header, itens de nav, badge VRGYN), topbar (altura, rótulo de seção, campo de busca, avatar), remoção das duas `<img>` de logo em favor de `<BrandLogo>`.

Nenhum outro arquivo (`menuService.ts`, backend, páginas de conteúdo) é tocado.

## 1. `BrandLogo.tsx`

```tsx
interface BrandLogoProps {
  showWordmark?: boolean; // default true
}

export function BrandLogo({ showWordmark = true }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2 shrink-0 overflow-hidden">
      <svg width="20" height="22" viewBox="0 0 20 22" className="shrink-0">
        <polygon
          points="10,0 19,5.5 19,16.5 10,22 1,16.5 1,5.5"
          fill="none"
          stroke="#FF6A00"
          strokeWidth="2"
        />
      </svg>
      {showWordmark && (
        <span className="font-display font-bold text-sm text-foreground whitespace-nowrap tracking-wide">
          <span style={{ color: '#FF6A00' }}>IT</span>MIZER
        </span>
      )}
    </div>
  );
}
```

Uso: sidebar desktop expandida (`showWordmark`), sidebar desktop colapsada (`showWordmark={false}`), drawer mobile (`showWordmark`). Substitui as três ocorrências atuais de `<img src="/logo.png">`/`<img src="/logo_mobile.png">` mais o `<span className="text-orange-600">VRGYN</span>` que ficava ao lado.

## 2. Sidebar (`DashboardLayout.tsx`, `<aside>` desktop)

- Largura: `isCollapsed ? 'w-14' : 'w-56'` (56px / 224px — `w-14`=3.5rem=56px, `w-56`=14rem=224px; hoje é `w-20`/`w-64`).
- Header do sidebar (`h-16` atual): trocar o conteúdo por `<BrandLogo showWordmark={!isCollapsed} />` + botão de colapsar (mantém o `PanelLeftClose`/`PanelLeftOpen` já existente, só herda os tokens novos).
- Item de menu (`nav` do sidebar): estrutura atual (`Link`/`button` com `DynamicIcon`) mantida, só o wrapper do ícone vira um tile:
  ```tsx
  <span
    className={cn(
      "flex items-center justify-center shrink-0 w-5 h-5 rounded-[5px]",
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    )}
  >
    {item.icon && <DynamicIcon name={item.icon} className="w-3.5 h-3.5" />}
  </span>
  ```
  (`w-5 h-5` = 20px, `rounded-[5px]` = 5px, batendo com o protótipo. `bg-muted` aqui é o `--track`/`--muted` neutro já definido no sub-projeto 1 — não um novo token.)
- Item ativo (linha inteira, não só o tile): `bg-[--orange-tint] border-l-2 border-primary text-[--brand-text]` no lugar do atual `gradient-premium-active`. Como `--orange-tint`/`--brand-text` guardam valor bruto (não HSL-triplet, decisão do sub-projeto 1), usar `style={{ backgroundColor: 'var(--orange-tint)', color: 'var(--brand-text)' }}` em vez de classe Tailwind (Tailwind não tem esses nomes mapeados em `colors`, de propósito — ver spec da Fundação).
- Badge "Vinculado ao VRGYN" no rodapé do sidebar (abaixo do `<nav>`, antes do botão de colapsar): dot `bg-[--dot-ok]` (ou `bg-success` — mesmo valor) + texto `Vinculado ao` em `text-muted-foreground` + `VRGYN` em `font-display font-bold` cor `text-primary`. Some quando colapsado (`!isCollapsed &&`), igual ao wordmark.

## 3. Topbar (`DashboardLayout.tsx`, `<header>`)

- Altura: `h-16` (64px) → `h-[46px]`.
- Lado esquerdo: em vez do bloco de logo mobile condicional, mostrar o rótulo da seção ativa: `standardMenus.find(isActive)?.label` (mesma função `isActive` já existente), em `text-xs text-muted-foreground`, sem link/clique (o protótipo tem `crumbGo` mas não há "nível acima" real pra navegar nesta tela — só exibe).
- Campo de busca (novo): botão que abre a `CommandPalette`, com ícone de lupa (`Search` do lucide), texto `Buscar telas…`, badge `⌘K` à direita (`kbd`-like `<span>` com borda). Estilo: `border border-input rounded-[7px] px-2.5 py-1 text-xs text-muted-foreground bg-background`, `min-width: 200px`, posicionado com `ml-auto` antes do toggle de tema.
- Toggle de tema: mantém o componente atual (`Sun`/`Moon`), só ajustar tamanho pra `h-[30px] w-[30px] rounded-[7px]` (era `h-10 w-10 rounded-xl`).
- Avatar: substituir o ícone `UserCircle` genérico dentro do `DropdownMenuTrigger` por um quadrado `w-7 h-7 rounded-[7px] bg-foreground text-background flex items-center justify-center text-[10px] font-semibold` com as iniciais do usuário (função `getInitials(name: string)`: pega a primeira letra de cada uma das duas primeiras palavras, maiúsculas; se só uma palavra, as duas primeiras letras dela; fonte do nome: `user?.profile?.fullName || user?.email`).

## 4. `CommandPalette.tsx`

```tsx
interface CommandPaletteItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  kind: 'Página' | 'Ação';
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
}
```

- Implementado com `Dialog` + `Command`/`CommandInput`/`CommandList`/`CommandEmpty`/`CommandGroup`/`CommandItem` (já em `@/components/ui/command`, `@/components/ui/dialog`; `cmdk` já é dependência do projeto).
- `items` é construído em `DashboardLayout.tsx` a partir de `standardMenus` (já buscado via `menuService.getMyMenus()`): achata cada `MenuItem` (`kind: 'Página'`) e seus `submenus` (`kind: 'Página'`) em uma lista plana `{id, label, route, icon}[]`, filtrando entradas sem `route`. Não inclui `adminMenu` (fica de fora do palette por enquanto — é um menu à parte, condicional a super-admin).
- Filtro: `CommandInput` com busca por substring em `label` (o componente `Command` do cmdk já faz filtragem incremental por texto — usar o comportamento padrão, sem lógica de filtro manual).
- Cada `CommandItem`: tile do ícone igual ao da sidebar (`DynamicIcon` dentro do wrapper 20×20) + label + `kind` em caps à direita (`text-[10px] uppercase text-muted-foreground ml-auto`).
- `onSelect`: `navigate(item.route)` + fecha o modal (`onOpenChange(false)`).
- Atalho global: `DashboardLayout.tsx` registra um `useEffect` com listener de `keydown` (`(e.metaKey || e.ctrlKey) && e.key === 'k'`) que chama `e.preventDefault()` e abre o palette — igual ao padrão usual do cmdk (exemplo na doc do shadcn `CommandDialog`). Fecha com `ESC` (o próprio `Dialog` do Radix já fecha com Escape por padrão) ou clique no backdrop (idem).

## Fora de escopo / riscos aceitos

- Drawer mobile não reestruturado (só cores/radius, já herdados).
- Nenhuma mudança em `menuService`, permissões, ou dado de backend.
- Rótulo de seção no topbar é de nível único; breadcrumb de dois níveis (`Clientes › Nome do Cliente`) fica para o sub-projeto 3 (Cliente 360), se aplicável.
- Verificação: `npm run build` sem erros em cada tarefa; verificação visual logada (sidebar expandida/colapsada, item ativo, command palette abrindo/fechando/navegando, em claro e escuro) precisa ser feita por um humano com navegador — a IA não tem acesso a extensão de navegador conectada nem pode inserir credenciais de login neste ambiente (mesma limitação registrada no sub-projeto 1).
