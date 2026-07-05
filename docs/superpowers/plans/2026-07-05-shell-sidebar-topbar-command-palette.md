# Shell — Sidebar, Topbar e Command Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestilizar `DashboardLayout.tsx` (sidebar + topbar) pra direção "Console técnico" e adicionar uma Command Palette (`⌘K`/`Ctrl+K`) alimentada pelos menus reais e permission-aware do usuário.

**Architecture:** Dois componentes novos e isolados (`BrandLogo.tsx`, `CommandPalette.tsx`) consumidos por `DashboardLayout.tsx`, que continua sendo o único lugar que possui o estado do shell (collapse, drawer mobile, menus, tema, e agora também o estado de abertura da palette).

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (tokens já aplicados no sub-projeto 1 — Fundação), shadcn/ui (`Command`/`CommandDialog` já existentes em `components/ui/command.tsx`, usam `cmdk` já instalado), `lucide-react`, React Router.

## Global Constraints

- Só estes arquivos são tocados: `frontend/src/components/BrandLogo.tsx` (novo), `frontend/src/components/CommandPalette.tsx` (novo), `frontend/src/components/DashboardLayout.tsx` (modificado). Nenhum outro arquivo.
- Ícones do menu continuam vindo do campo `icon` de `MenuItem`/`MenuSubitem` (renderizados via o `DynamicIcon` já existente em `DashboardLayout.tsx`) — não se implementa glifo de 2 letras.
- Larguras exatas: sidebar expandida `w-56` (224px), recolhida `w-14` (56px) — **e o padding do conteúdo à direita precisa acompanhar** (`lg:pl-56`/`lg:pl-14`), senão o layout desalinha.
- Tile de ícone: `w-5 h-5 rounded-[5px]`: `bg-primary text-primary-foreground` quando o item está ativo, `bg-muted text-muted-foreground` quando não.
- Linha de item ativo: `border-l-2 border-primary bg-[var(--orange-tint)] text-[var(--brand-text)]` — `--orange-tint`/`--brand-text` guardam valor de cor bruto (não HSL-triplet, decisão do sub-projeto 1 Fundação), então em Tailwind são referenciados como `bg-[var(--orange-tint)]`/`text-[var(--brand-text)]` (arbitrary value), nunca `bg-[hsl(var(--orange-tint))]`.
- Topbar: altura `h-[46px]` (era `h-16`). Toggle de tema: `h-[30px] w-[30px] rounded-[7px]` (era `h-10 w-10 rounded-xl`). Avatar: `w-7 h-7 rounded-[7px]` com iniciais (era círculo com ícone `UserCircle`).
- O bloco de logo mobile que hoje aparece no topbar (`lg:hidden`, dentro do `<header>`) é **removido**, não convertido em `BrandLogo` — a marca já aparece no sidebar/drawer; o topbar mostra o rótulo da seção ativa no lugar. O botão de expandir sidebar colapsada (`isCollapsed && ...PanelLeftOpen`, `hidden lg:flex`) continua existindo, só perde a condição irmã do logo.
- `BrandLogo` substitui exatamente 2 ocorrências (header do sidebar desktop, header do drawer mobile) — não 3.
- Depois de cada task, `cd frontend && npm run build` precisa terminar sem erro antes de commitar.
- **Números de linha em cada "Files:"/step são relativos ao arquivo no início deste plano (antes da Task 1)** — como várias tasks editam o mesmo `DashboardLayout.tsx` em sequência, os números absolutos vão se deslocando a cada edit anterior. A âncora real de cada edit é o bloco de código "De:" mostrado no step (texto exato a ser localizado e substituído) — use os números de linha só como referência aproximada de onde procurar, não como coordenada exata.

---

### Task 1: `BrandLogo.tsx` + trocar a logo no sidebar desktop e no drawer mobile

**Files:**
- Create: `frontend/src/components/BrandLogo.tsx`
- Modify: `frontend/src/components/DashboardLayout.tsx:1` (adicionar import)
- Modify: `frontend/src/components/DashboardLayout.tsx:125-132` (header do sidebar desktop)
- Modify: `frontend/src/components/DashboardLayout.tsx:368-371` (header do drawer mobile)

**Interfaces:**
- Produces: `export function BrandLogo({ showWordmark = true }: { showWordmark?: boolean })` — componente sem estado, sem dependências externas além de `react`.

- [ ] **Step 1: Criar `frontend/src/components/BrandLogo.tsx`**

```tsx
interface BrandLogoProps {
  showWordmark?: boolean;
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
        <span className="font-display font-bold text-xl text-foreground whitespace-nowrap tracking-wide">
          <span style={{ color: '#FF6A00' }}>IT</span>MIZER
        </span>
      )}
    </div>
  );
}
```

(`text-xl` na nova escala de densidade do sub-projeto 1 é 14px — bate com o `font:700 14px Sora` do protótipo.)

- [ ] **Step 2: Importar `BrandLogo` em `DashboardLayout.tsx`**

Adicionar logo após a linha 19 (`import { Button } from '@/components/ui/button';`):

```tsx
import { BrandLogo } from '@/components/BrandLogo';
```

- [ ] **Step 3: Trocar o header do sidebar desktop (linhas 125-132)**

De:
```tsx
                    <Link to="/" className="flex items-center gap-2 overflow-hidden shrink-0">
                        <img src="/logo.png" alt="VRGYN Logo" className="h-9 w-auto object-contain shrink-0" />
                        {!isCollapsed && (
                            <span className="font-display font-bold text-lg text-orange-600 transition-all duration-300 tracking-wider">
                                VRGYN
                            </span>
                        )}
                    </Link>
```
Para:
```tsx
                    <Link to="/" className="flex items-center gap-2 overflow-hidden shrink-0">
                        <BrandLogo showWordmark={!isCollapsed} />
                    </Link>
```

- [ ] **Step 4: Trocar o header do drawer mobile (linhas 368-371)**

De:
```tsx
                    <div className="flex items-center gap-2">
                        <img src="/logo_mobile.png" alt="VRGYN Logo" className="h-10 w-auto object-contain" />
                        <span className="font-display font-bold text-lg text-orange-600">VRGYN</span>
                    </div>
```
Para:
```tsx
                    <BrandLogo />
```

- [ ] **Step 5: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros de TypeScript (import resolvido, JSX válido).

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/components/BrandLogo.tsx src/components/DashboardLayout.tsx
git commit -m "feat(shell): adiciona BrandLogo e substitui a logo raster no sidebar/drawer"
```

---

### Task 2: Sidebar — largura, tiles de ícone, linha ativa, badge VRGYN

**Files:**
- Modify: `frontend/src/components/DashboardLayout.tsx:117-233` (aside desktop) e `:239` (padding do conteúdo)

**Interfaces:**
- Consumes: `isCollapsed`, `standardMenus`, `isActive`, `DynamicIcon`, `expandedMenus`, `toggleSubmenu` (todos já existentes no componente).
- Produces: nenhuma interface nova — só classes/estrutura JSX.

- [ ] **Step 1: Larguras do sidebar e do padding do conteúdo**

Em `frontend/src/components/DashboardLayout.tsx:117-122`, trocar:
```tsx
                    isCollapsed ? "w-20" : "w-64"
```
por:
```tsx
                    isCollapsed ? "w-14" : "w-56"
```

Em `frontend/src/components/DashboardLayout.tsx:239` (dentro do wrapper "Layout Direito"), trocar:
```tsx
                    isCollapsed ? "lg:pl-20" : "lg:pl-64"
```
por:
```tsx
                    isCollapsed ? "lg:pl-14" : "lg:pl-56"
```

- [ ] **Step 2: Tile de ícone + linha ativa no botão de submenu (linhas 156-173)**

De:
```tsx
                                        <button
                                            onClick={() => toggleSubmenu(item.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                                active && !isCollapsed
                                                    ? "bg-primary/5 text-primary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                                                isCollapsed ? "justify-center" : ""
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.icon && <DynamicIcon name={item.icon} className="w-5 h-5 shrink-0" />}
                                                {!isCollapsed && <span>{item.label}</span>}
                                            </div>
                                            {!isCollapsed && (
                                                isExpanded ? <ChevronUp className="w-4 h-4 opacity-75" /> : <ChevronDown className="w-4 h-4 opacity-75" />
                                            )}
                                        </button>
```
Para:
```tsx
                                        <button
                                            onClick={() => toggleSubmenu(item.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                                active && !isCollapsed
                                                    ? "border-l-2 border-primary bg-[var(--orange-tint)] text-[var(--brand-text)]"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                                                isCollapsed ? "justify-center" : ""
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {item.icon && (
                                                    <span
                                                        className={cn(
                                                            "flex items-center justify-center shrink-0 w-5 h-5 rounded-[5px]",
                                                            active && !isCollapsed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                        )}
                                                    >
                                                        <DynamicIcon name={item.icon} className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                                {!isCollapsed && <span>{item.label}</span>}
                                            </div>
                                            {!isCollapsed && (
                                                isExpanded ? <ChevronUp className="w-4 h-4 opacity-75" /> : <ChevronDown className="w-4 h-4 opacity-75" />
                                            )}
                                        </button>
```

- [ ] **Step 3: Tile de ícone + linha ativa no item simples (linhas 199-213)**

De:
```tsx
                                ) : (
                                    <Link to={item.route || '#'}>
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                                active
                                                    ? "gradient-premium-active font-semibold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                                                isCollapsed ? "justify-center" : ""
                                            )}
                                        >
                                            {item.icon && <DynamicIcon name={item.icon} className="w-5 h-5 shrink-0" />}
                                            {!isCollapsed && <span>{item.label}</span>}
                                        </div>
                                    </Link>
                                )}
```
Para:
```tsx
                                ) : (
                                    <Link to={item.route || '#'}>
                                        <div
                                            className={cn(
                                                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                                active
                                                    ? "border-l-2 border-primary bg-[var(--orange-tint)] text-[var(--brand-text)] font-semibold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                                                isCollapsed ? "justify-center" : ""
                                            )}
                                        >
                                            {item.icon && (
                                                <span
                                                    className={cn(
                                                        "flex items-center justify-center shrink-0 w-5 h-5 rounded-[5px]",
                                                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    <DynamicIcon name={item.icon} className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                            {!isCollapsed && <span>{item.label}</span>}
                                        </div>
                                    </Link>
                                )}
```

- [ ] **Step 4: Badge "Vinculado ao VRGYN"**

Inserir depois do `</nav>` (linha 218) e antes do bloco `{/* Sidebar Footer (Desktop Collapse Button if Collapsed) */}` (linha 220):

```tsx
                {/* Badge VRGYN */}
                <div
                    className={cn(
                        "mx-2 mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2",
                        isCollapsed ? "justify-center" : ""
                    )}
                >
                    <span className="w-2 h-2 rounded-sm bg-success shrink-0" />
                    {!isCollapsed && (
                        <span className="text-2xs text-muted-foreground whitespace-nowrap">
                            Vinculado ao <span className="font-display font-bold text-primary">VRGYN</span>
                        </span>
                    )}
                </div>
```

- [ ] **Step 5: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/components/DashboardLayout.tsx
git commit -m "feat(shell): sidebar mais compacta, tiles de icone, linha ativa laranja e badge VRGYN"
```

---

### Task 3: Topbar — altura, rótulo de seção, gatilho de busca, tema, avatar

**Files:**
- Modify: `frontend/src/components/DashboardLayout.tsx` (imports, novo estado, `activeSectionLabel`, header, ações do lado direito)

**Interfaces:**
- Produces: estado `paletteOpen`/`setPaletteOpen` (usado pela Task 4), `activeSectionLabel: string | undefined`, função `getInitials(nameOrEmail: string): string`.
- Consumes: `standardMenus`, `isActive`, `user`.

- [ ] **Step 1: Adicionar `Search` ao import de `lucide-react`**

Em `frontend/src/components/DashboardLayout.tsx:4-18`, adicionar `Search` à lista (por exemplo, depois de `Moon`):

```tsx
import {
    ChevronDown,
    ChevronUp,
    LogOut,
    Menu as MenuIcon,
    Shield,
    X,
    UserCircle,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Search
} from 'lucide-react';
```

- [ ] **Step 2: Função `getInitials` (módulo, antes do componente)**

Adicionar logo antes de `export function DashboardLayout` (linha 33):

```tsx
function getInitials(nameOrEmail: string): string {
    const base = nameOrEmail.split('@')[0].trim();
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0]?.[0] || '?').toUpperCase();
}
```

- [ ] **Step 3: Estado `paletteOpen`**

Em `frontend/src/components/DashboardLayout.tsx:41`, logo após `const [adminMenu, setAdminMenu] = useState<ApiMenuItem | null>(null);`, adicionar:

```tsx
    const [paletteOpen, setPaletteOpen] = useState(false);
```

- [ ] **Step 4: `activeSectionLabel`**

Em `frontend/src/components/DashboardLayout.tsx`, logo após a função `isActive` (depois da linha 99, antes de `const toggleSubmenu = ...`), adicionar:

```tsx
    const activeSectionLabel = standardMenus.find(isActive)?.label;
```

- [ ] **Step 5: Altura do header**

Em `frontend/src/components/DashboardLayout.tsx:243`, trocar:
```tsx
                <header className="glass-header h-16 border-b border-border/30 shrink-0">
```
por:
```tsx
                <header className="glass-header h-[46px] border-b border-border/30 shrink-0">
```

- [ ] **Step 6: Lado esquerdo do header — remover logo mobile, manter botão de expandir, adicionar rótulo de seção (linhas 246-263)**

De:
```tsx
                        <div className="flex items-center gap-4">
                            {!isCollapsed && (
                                <div className="lg:hidden flex items-center gap-2">
                                    <img src="/logo.png" alt="VRGYN Logo" className="h-9 w-auto object-contain" />
                                    <span className="font-display font-bold text-lg text-orange-600">VRGYN</span>
                                </div>
                            )}
                            {isCollapsed && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hidden lg:flex h-9 w-9 rounded-xl hover:bg-muted"
                                    onClick={() => setIsCollapsed(false)}
                                >
                                    <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
```
Para:
```tsx
                        <div className="flex items-center gap-4">
                            {isCollapsed && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hidden lg:flex h-9 w-9 rounded-xl hover:bg-muted"
                                    onClick={() => setIsCollapsed(false)}
                                >
                                    <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            )}
                            {activeSectionLabel && (
                                <span className="text-sm text-muted-foreground whitespace-nowrap">{activeSectionLabel}</span>
                            )}
                        </div>
```

- [ ] **Step 7: Gatilho de busca (Command Palette)**

Em `frontend/src/components/DashboardLayout.tsx:266`, logo após `<div className="flex items-center gap-3 ml-auto">`, adicionar (antes do bloco `{isSuperAdmin && adminMenu && (`):

```tsx
                            <button
                                type="button"
                                onClick={() => setPaletteOpen(true)}
                                className="hidden sm:flex items-center gap-2 rounded-[7px] border border-input bg-background px-2.5 py-1 text-sm text-muted-foreground min-w-[200px]"
                            >
                                <Search className="w-3.5 h-3.5 shrink-0" />
                                <span className="flex-1 text-left">Buscar telas…</span>
                                <span className="text-2xs font-semibold border border-border rounded-sm px-1 bg-card">⌘K</span>
                            </button>

```

- [ ] **Step 8: Redimensionar o toggle de tema (linhas 297-306)**

De:
```tsx
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl h-10 w-10 hover:bg-muted text-muted-foreground hover:text-foreground relative"
                                onClick={handleThemeToggle}
                            >
```
Para:
```tsx
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-[7px] h-[30px] w-[30px] hover:bg-muted text-muted-foreground hover:text-foreground relative"
                                onClick={handleThemeToggle}
                            >
```

- [ ] **Step 9: Avatar com iniciais (linhas 313-316)**

De:
```tsx
                                    <Button variant="ghost" className="gap-2.5 pl-2 pr-4 h-10 border border-border/30 bg-background/40 backdrop-blur rounded-xl hover:bg-muted/50">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                            <UserCircle className="w-4 h-4" />
                                        </div>
```
Para:
```tsx
                                    <Button variant="ghost" className="gap-2.5 pl-2 pr-4 h-10 border border-border/30 bg-background/40 backdrop-blur rounded-xl hover:bg-muted/50">
                                        <div className="w-7 h-7 rounded-[7px] bg-foreground text-background flex items-center justify-center text-2xs font-semibold shrink-0">
                                            {getInitials(user?.profile?.fullName || user?.email || '')}
                                        </div>
```

- [ ] **Step 10: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 11: Commit**

```bash
cd frontend
git add src/components/DashboardLayout.tsx
git commit -m "feat(shell): topbar mais fina, rotulo de secao, gatilho de busca e avatar com iniciais"
```

---

### Task 4: `CommandPalette.tsx` + atalho `⌘K`/`Ctrl+K`

**Files:**
- Create: `frontend/src/components/CommandPalette.tsx`
- Modify: `frontend/src/components/DashboardLayout.tsx` (import, `useEffect` do atalho, `paletteItems`, render do componente)

**Interfaces:**
- Consumes: `paletteOpen`/`setPaletteOpen` (Task 3), `standardMenus` (já existente).
- Produces: `export interface CommandPaletteItem { id: string; label: string; route: string; icon?: string; kind: 'Página' | 'Ação'; }`, `export function CommandPalette({ open, onOpenChange, items }: { open: boolean; onOpenChange: (open: boolean) => void; items: CommandPaletteItem[] })`.

- [ ] **Step 1: Criar `frontend/src/components/CommandPalette.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

export interface CommandPaletteItem {
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

function PaletteIcon({ name }: { name?: string }) {
    const IconComponent = name ? (LucideIcons as any)[name] : null;
    return (
        <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-[5px] bg-muted text-muted-foreground mr-2">
            {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
        </span>
    );
}

export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
    const navigate = useNavigate();

    const handleSelect = (route: string) => {
        onOpenChange(false);
        navigate(route);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Buscar telas…" />
            <CommandList>
                <CommandEmpty>Nada encontrado.</CommandEmpty>
                <CommandGroup>
                    {items.map((item) => (
                        <CommandItem key={item.id} value={item.label} onSelect={() => handleSelect(item.route)}>
                            <PaletteIcon name={item.icon} />
                            <span className="flex-1">{item.label}</span>
                            <span className="text-2xs uppercase text-muted-foreground ml-auto">{item.kind}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
```

- [ ] **Step 2: Importar em `DashboardLayout.tsx`**

Logo após o import de `BrandLogo` (adicionado na Task 1):

```tsx
import { CommandPalette, CommandPaletteItem } from '@/components/CommandPalette';
```

- [ ] **Step 3: Atalho de teclado global**

Adicionar um novo `useEffect`, logo após o `useEffect` que busca os menus (depois da linha 81 `}, []);` do `fetchMenus`):

```tsx
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
```

- [ ] **Step 4: Lista achatada de itens**

Adicionar logo após `const activeSectionLabel = standardMenus.find(isActive)?.label;` (Task 3, Step 4):

```tsx
    const paletteItems: CommandPaletteItem[] = standardMenus.flatMap((item) => {
        const entries: CommandPaletteItem[] = [];
        if (item.route) {
            entries.push({ id: item.id, label: item.label, route: item.route, icon: item.icon, kind: 'Página' });
        }
        item.submenus?.forEach((sub) => {
            if (sub.route) {
                entries.push({ id: sub.id, label: sub.label, route: sub.route, icon: sub.icon, kind: 'Página' });
            }
        });
        return entries;
    });
```

- [ ] **Step 5: Renderizar o componente**

Adicionar logo antes do fechamento final do componente — depois do `</aside>` do drawer mobile (linha 460) e antes do `</div>` final (linha 461):

```tsx
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={paletteItems} />
```

- [ ] **Step 6: Build de verificação**

Run: `cd frontend && npm run build`
Expected: build termina sem erros.

- [ ] **Step 7: Commit**

```bash
cd frontend
git add src/components/CommandPalette.tsx src/components/DashboardLayout.tsx
git commit -m "feat(shell): adiciona Command Palette com atalho cmd+k/ctrl+k"
```

---

### Task 5: Verificação final

**Files:**
- Nenhum arquivo novo — só verificação do resultado das Tasks 1-4.

- [ ] **Step 1: Grep por classes antigas remanescentes**

Run: `cd frontend && grep -rn "w-20\"\|lg:pl-20\|h-16 border-b border-border/30 shrink-0\|logo_mobile.png\|logo.png" src/components/DashboardLayout.tsx`
Expected: nenhuma ocorrência (a busca não deve retornar nada — todas essas classes/strings foram substituídas nas Tasks 1-3). Se `grep` não achar nada, ele retorna exit code 1, o que é o resultado esperado aqui.

- [ ] **Step 2: Build de verificação final**

Run: `cd frontend && npm run build`
Expected: build termina sem erros, sem warnings de import não usado (ex: se `UserCircle` ficou órfão — não deve, continua usado nos itens "Meu Perfil").

- [ ] **Step 3: Checar visualmente (sidebar, topbar, command palette)**

Rodar `npm run dev`, abrir no navegador, logar, e confirmar: sidebar com largura nova (mais estreita), item ativo com fundo laranja claro e borda esquerda, ícones dentro de tiles quadrados, badge "Vinculado ao VRGYN" no rodapé; topbar mais fina (46px) com o rótulo da seção à esquerda e o campo "Buscar telas… ⌘K" à direita; apertar `Ctrl+K` (ou `Cmd+K` no Mac) abre a Command Palette, digitar filtra por label, Enter/clique navega e fecha; `Esc` fecha. Repetir em modo escuro. Testar em telas colapsada/expandida do sidebar e no drawer mobile.

Esta etapa não pode ser automatizada nesta sessão (sem acesso a navegador conectado nem credenciais de login) — registrar como pendência se quem executar o plano também não tiver acesso interativo.
