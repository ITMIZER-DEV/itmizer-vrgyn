import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
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
    Search,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';
import { CommandPalette, CommandPaletteItem } from '@/components/CommandPalette';
import { ReleaseNotesDialog } from '@/components/ReleaseNotesDialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { menuService, MenuItem as ApiMenuItem } from '@/services/menuService';
import { useTheme } from 'next-themes';
import { userService } from '@/services/userService';
import { APP_VERSION, APP_BUILD } from '@/config/version';

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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        return saved === 'true';
    });
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
    const [standardMenus, setStandardMenus] = useState<ApiMenuItem[]>([]);
    const [adminMenu, setAdminMenu] = useState<ApiMenuItem | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
    const { user, isAdmin, signOut } = useAuth();
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        if (user?.profile?.theme) {
            setTheme(user.profile.theme);
        }
    }, [user, setTheme]);

    const handleThemeToggle = async () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        if (user?.id) {
            try {
                await userService.update(user.id, { theme: nextTheme });
            } catch (err) {
                console.error("Falha ao salvar preferência de tema no perfil", err);
            }
        }
    };

    const isSuperAdmin = user?.email === 'leonardo.alves@itmizer.com.br';

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const data = await menuService.getMyMenus();
                setStandardMenus(data.filter(m => m.id !== 'menu-admin'));
                setAdminMenu(data.find(m => m.id === 'menu-admin') || null);
            } catch (error) {
                console.error("Failed to fetch menus", error);
            }
        };
        fetchMenus();
    }, []);

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

    const handleSignOut = () => {
        signOut();
    };

    const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
        const IconComponent = (LucideIcons as any)[name];
        if (!IconComponent) return null;
        return <IconComponent className={className} />;
    };

    const isActive = (item: ApiMenuItem) => {
        if (item.route === location.pathname) return true;
        if (item.submenus) {
            return item.submenus.some(sub => sub.route === location.pathname);
        }
        return false;
    };

    const activeSectionLabel = standardMenus.find(isActive)?.label;

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

    const toggleSubmenu = (menuId: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setExpandedMenus(prev => ({ ...prev, [menuId]: true }));
        } else {
            setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
        }
    };

    return (
        <div className="min-h-screen bg-background flex relative overflow-hidden">
            {/* Efeitos de Luz de Fundo Deslumbrantes (Glow) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[130px] -mr-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[130px] -ml-40 -mb-40 pointer-events-none" />

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col border-r border-border/30 glass-card-premium fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out select-none",
                    isCollapsed ? "w-14" : "w-56"
                )}
            >
                {/* Sidebar Header */}
                <div
                    className={cn(
                        "flex items-center border-b border-border/30 px-3",
                        isCollapsed ? "flex-col gap-2 py-3" : "h-16 justify-between"
                    )}
                >
                    <Link to="/" className="flex items-center gap-1.5 overflow-hidden shrink-0">
                        <BrandLogo showWordmark={!isCollapsed} />
                        {!isCollapsed && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                v{APP_VERSION}
                            </span>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Sidebar Menu Items */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
                    {standardMenus.map((item) => {
                        const active = isActive(item);
                        const hasSubmenus = item.submenus && item.submenus.length > 0;
                        const isExpanded = expandedMenus[item.id] || false;

                        return (
                            <div key={item.id} className="space-y-1">
                                {hasSubmenus ? (
                                    <>
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

                                        {/* Submenus Acordeão */}
                                        {!isCollapsed && isExpanded && (
                                            <div className="pl-6 pt-1.5 pb-1 space-y-1 border-l border-border/40 ml-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {item.submenus!.map(sub => {
                                                    const subActive = location.pathname === sub.route;
                                                    return (
                                                        <Link
                                                            key={sub.id}
                                                            to={sub.route || '#'}
                                                            className={cn(
                                                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                                                subActive
                                                                    ? "bg-primary/10 text-primary font-semibold"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                                            )}
                                                        >
                                                            {sub.icon && <DynamicIcon name={sub.icon} className="w-4 h-4 shrink-0" />}
                                                            <span>{sub.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
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
                            </div>
                        );
                    })}
                </nav>

                {/* Badge VRGYN & Versão Interativo */}
                <button
                    type="button"
                    onClick={() => setReleaseNotesOpen(true)}
                    title="Clique para ver o histórico e novidades de releases"
                    className={cn(
                        "mx-2 mb-2 flex flex-col gap-1 rounded-md border border-border bg-background/80 hover:bg-muted/60 hover:border-primary/40 transition-all duration-200 backdrop-blur px-2.5 py-2 text-left group cursor-pointer",
                        isCollapsed ? "items-center" : ""
                    )}
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm bg-success shrink-0" />
                            {!isCollapsed && (
                                <span className="text-2xs text-muted-foreground whitespace-nowrap">
                                    Vinculado ao <span className="font-display font-bold text-primary">VRGYN</span>
                                </span>
                            )}
                        </div>
                        {!isCollapsed && (
                            <Sparkles className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="text-[10px] text-muted-foreground/70 group-hover:text-foreground/90 font-mono flex items-center justify-between border-t border-border/40 pt-1 mt-0.5 w-full transition-colors">
                            <span>v{APP_VERSION}</span>
                            <span className="text-2xs underline underline-offset-2 decoration-primary/40 group-hover:decoration-primary">build #{APP_BUILD}</span>
                        </div>
                    )}
                </button>

            </aside>

            {/* Layout Direito (Header + Main) */}
            <div
                className={cn(
                    "flex-1 min-h-screen flex flex-col transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:pl-14" : "lg:pl-56"
                )}
            >
                {/* Top Compact Header */}
                <header className="glass-header h-[46px] border-b border-border/30 shrink-0">
                    <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {activeSectionLabel && (
                                <span className="text-sm text-muted-foreground whitespace-nowrap">{activeSectionLabel}</span>
                            )}
                        </div>

                        {/* Ações do Lado Direito */}
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={() => setPaletteOpen(true)}
                                className="hidden sm:flex items-center gap-2 rounded-[7px] border border-input bg-background px-2.5 py-1 text-sm text-muted-foreground min-w-[200px]"
                            >
                                <Search className="w-3.5 h-3.5 shrink-0" />
                                <span className="flex-1 text-left">Buscar telas…</span>
                                <span className="text-2xs font-semibold border border-border rounded-sm px-1 bg-card">⌘K</span>
                            </button>

                            {isSuperAdmin && adminMenu && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-10 px-4 nav-btn-premium gap-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 font-semibold"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Admin
                                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 mt-1.5 glass-card-premium">
                                        <div className="px-2.5 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Painel Administrativo
                                        </div>
                                        <DropdownMenuSeparator className="bg-border/40" />
                                        {adminMenu.submenus?.map(sub => (
                                            <DropdownMenuItem key={sub.id} asChild className="rounded-lg">
                                                <Link to={sub.route || '#'} className="flex items-center gap-3 w-full cursor-pointer py-2 px-2.5 font-medium text-sm text-muted-foreground hover:text-foreground">
                                                    {sub.icon && <DynamicIcon name={sub.icon} className="w-4 h-4" />}
                                                    {sub.label}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Theme Toggle Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-[7px] h-[30px] w-[30px] hover:bg-muted text-muted-foreground hover:text-foreground relative"
                                onClick={handleThemeToggle}
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
                                <span className="sr-only">Alternar tema</span>
                            </Button>

                            <div className="h-6 w-[1px] bg-border/40 mx-1 hidden lg:block" />

                            {/* Profile Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2.5 pl-2 pr-4 h-10 border border-border/30 bg-background/40 backdrop-blur rounded-xl hover:bg-muted/50">
                                        <div className="w-7 h-7 rounded-[7px] bg-foreground text-background flex items-center justify-center text-2xs font-semibold shrink-0">
                                            {getInitials(user?.profile?.fullName || user?.email || '')}
                                        </div>
                                        <span className="text-sm font-semibold text-foreground/90">{user?.profile?.fullName || user?.email?.split('@')[0]}</span>
                                        <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-55" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 mt-1.5 glass-card-premium">
                                    <div className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Minha Conta</div>
                                    <DropdownMenuSeparator className="bg-border/40" />
                                    <DropdownMenuItem asChild className="rounded-lg">
                                        <Link to="/profile" className="flex items-center cursor-pointer w-full text-muted-foreground hover:text-foreground py-2 px-2.5">
                                            <UserCircle className="w-4 h-4 mr-2" />
                                            Meu Perfil
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setReleaseNotesOpen(true)} className="rounded-lg cursor-pointer py-2 px-2.5 text-muted-foreground hover:text-foreground">
                                        <Sparkles className="w-4 h-4 mr-2 text-primary" />
                                        <span>Novidades da Versão</span>
                                        <span className="ml-auto text-2xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{APP_VERSION}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/40" />
                                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer group rounded-lg py-2 px-2.5">
                                        <LogOut className="w-4 h-4 mr-2 group-hover:text-destructive" />
                                        <span className="group-hover:text-destructive font-semibold">Sair</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Mobile Menu Toggle */}
                            <Button variant="ghost" size="icon" className="lg:hidden rounded-xl h-10 w-10 hover:bg-muted" onClick={() => setIsSidebarOpen(true)}>
                                <MenuIcon className="w-5 h-5 text-foreground" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 overflow-auto animate-in fade-in duration-300">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Drawer Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-[51] w-72 bg-card border-r border-border transition-transform duration-300 transform lg:hidden shadow-xl overflow-y-auto",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <BrandLogo />
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="rounded-xl">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <nav className="p-4 space-y-2">
                    {standardMenus.map((item) => (
                        <div key={item.id} className="space-y-1">
                            {item.submenus && item.submenus.length > 0 ? (
                                <>
                                    <div className="px-4 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                        {item.icon && <DynamicIcon name={item.icon} className="w-4 h-4" />}
                                        {item.label}
                                    </div>
                                    <div className="ml-4 border-l border-border pl-2 space-y-1">
                                        {item.submenus.map(sub => (
                                            <Link
                                                key={sub.id}
                                                to={sub.route || '#'}
                                                onClick={() => setIsSidebarOpen(false)}
                                            >
                                                <Button
                                                    variant={location.pathname === sub.route ? "secondary" : "ghost"}
                                                    className="w-full justify-start gap-3 h-10 text-sm rounded-lg"
                                                >
                                                    {sub.icon && <DynamicIcon name={sub.icon} className="w-4 h-4" />}
                                                    {sub.label}
                                                </Button>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <Link
                                    to={item.route || '#'}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <Button
                                        variant={location.pathname === item.route ? "secondary" : "ghost"}
                                        className="w-full justify-start gap-3 h-11 rounded-xl"
                                    >
                                        {item.icon && <DynamicIcon name={item.icon} className="w-4 h-4" />}
                                        {item.label}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ))}

                    {isSuperAdmin && adminMenu && (
                        <div className="pt-4 mt-4 border-t border-border">
                            <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Administração
                            </div>
                            <div className="space-y-1 mt-1">
                                {adminMenu.submenus?.map(sub => (
                                    <Link
                                        key={sub.id}
                                        to={sub.route || '#'}
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <Button
                                            variant={location.pathname === sub.route ? "secondary" : "ghost"}
                                            className="w-full justify-start gap-3 h-10 text-sm rounded-lg"
                                        >
                                            {sub.icon && <DynamicIcon name={sub.icon} className="w-4 h-4" />}
                                            {sub.label}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-border bg-muted/30 flex flex-col gap-2">
                    <Button variant="outline" className="w-full gap-2 rounded-xl justify-start" onClick={() => { setIsSidebarOpen(false); setReleaseNotesOpen(true); }}>
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Novidades da Versão (v{APP_VERSION})</span>
                    </Button>
                    <Link to="/profile" onClick={() => setIsSidebarOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 rounded-xl justify-start">
                            <UserCircle className="w-4 h-4" />
                            Meu Perfil
                        </Button>
                    </Link>
                    <Button variant="ghost" className="w-full gap-2 text-destructive hover:bg-destructive/10 rounded-xl font-semibold justify-start" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4" />
                        Sair do Sistema
                    </Button>
                </div>
            </aside>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={paletteItems} />
            <ReleaseNotesDialog open={releaseNotesOpen} onOpenChange={setReleaseNotesOpen} />
        </div>
    );
}
