import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2, Settings, ShieldAlert } from 'lucide-react';
import { menuService, MenuItem, MenuSubitem } from '@/services/menuService';
import { AppRole } from '@/types/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';

const ALL_ROLES: AppRole[] = [
  AppRole.admin,
  AppRole.supervisao,
  AppRole.user,
  AppRole.support,
  AppRole.seller,
  AppRole.migrador,
  AppRole.implantador
];

const ROLE_LABELS: Record<AppRole, string> = {
  [AppRole.admin]: 'Admin',
  [AppRole.supervisao]: 'Supervisão',
  [AppRole.user]: 'Usuário',
  [AppRole.support]: 'Suporte',
  [AppRole.seller]: 'Vendedor',
  [AppRole.migrador]: 'Migrador',
  [AppRole.implantador]: 'Implantador',
};

export function MenusManager() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // States for submenus
  const [editingSubmenu, setEditingSubmenu] = useState<MenuSubitem | null>(null);
  const [isAddingSubmenu, setIsAddingSubmenu] = useState<string | null>(null); // holds the parent menuId

  // States for menus
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [isAddingMenu, setIsAddingMenu] = useState(false);

  // Form states matching both Menu and Submenu roughly
  const [formLabel, setFormLabel] = useState('');
  const [formRoute, setFormRoute] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formRoles, setFormRoles] = useState<AppRole[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const data = await menuService.getAllMenus();
      // Sort by order
      data.sort((a, b) => a.order - b.order);
      data.forEach(m => m.submenus?.sort((a, b) => a.order - b.order));
      setMenus(data);
    } catch (error) {
      console.error('Failed to fetch menus', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os menus.', variant: 'destructive' });
    }
  };

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) newExpanded.delete(menuId);
    else newExpanded.add(menuId);
    setExpandedMenus(newExpanded);
  };

  // ==========================
  // SUBMENU ACTIONS
  // ==========================
  const resetForm = () => {
    setFormLabel('');
    setFormRoute('');
    setFormIcon('');
    setFormOrder(0);
    setFormIsActive(true);
    setFormRoles([AppRole.admin]);
  };

  const openAddSubmenuDialog = (menuId: string) => {
    resetForm();
    setIsAddingSubmenu(menuId);
  };

  const openEditSubmenuDialog = (submenu: MenuSubitem) => {
    setEditingSubmenu(submenu);
    setFormLabel(submenu.label);
    setFormRoute(submenu.route || '');
    setFormIcon(submenu.icon || '');
    setFormOrder(submenu.order);
    setFormRoles(submenu.roles || []);
  };

  const handleSaveSubmenu = async () => {
    try {
      setIsSaving(true);
      if (editingSubmenu) {
        await menuService.updateSubmenu(editingSubmenu.id, {
          label: formLabel,
          route: formRoute,
          icon: formIcon,
          order: formOrder,
          roles: formRoles,
        });
        toast({ title: 'Sucesso', description: 'Submenu atualizado.' });
      } else if (isAddingSubmenu) {
        await menuService.createSubmenu(isAddingSubmenu, {
          label: formLabel,
          route: formRoute,
          icon: formIcon,
          order: formOrder,
          roles: formRoles,
        });
        toast({ title: 'Sucesso', description: 'Submenu criado.' });
      }
      setEditingSubmenu(null);
      setIsAddingSubmenu(null);
      fetchMenus();
    } catch (error) {
      console.error('Failed to save submenu', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o submenu.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubmenu = async (id: string) => {
    try {
      await menuService.deleteSubmenu(id);
      toast({ title: 'Sucesso', description: 'Submenu excluído.' });
      fetchMenus();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o submenu.', variant: 'destructive' });
    }
  };

  // ==========================
  // MENU ACTIONS
  // ==========================
  const openAddMenuDialog = () => {
    resetForm();
    setIsAddingMenu(true);
  };

  const openEditMenuDialog = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormLabel(menu.label);
    setFormRoute(menu.route || '');
    setFormIcon(menu.icon || '');
    setFormOrder(menu.order);
    setFormIsActive(menu.isActive ?? true);
    setFormRoles(menu.roles || []);
  };

  const handleSaveMenu = async () => {
    try {
      setIsSaving(true);
      if (editingMenu) {
        await menuService.updateMenu(editingMenu.id, {
          label: formLabel,
          route: formRoute,
          icon: formIcon,
          order: formOrder,
          isActive: formIsActive,
          roles: formRoles,
        });
        toast({ title: 'Sucesso', description: 'Menu atualizado.' });
      } else {
        await menuService.createMenu({
          label: formLabel,
          route: formRoute,
          icon: formIcon,
          order: formOrder,
          isActive: formIsActive,
          roles: formRoles,
        });
        toast({ title: 'Sucesso', description: 'Menu criado.' });
      }
      setEditingMenu(null);
      setIsAddingMenu(false);
      fetchMenus();
    } catch (error) {
      console.error('Failed to save menu', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o menu.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    try {
      await menuService.deleteMenu(id);
      toast({ title: 'Sucesso', description: 'Menu excluído permanentemente.' });
      fetchMenus();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o menu.', variant: 'destructive' });
    }
  };


  const handleRoleToggle = (role: AppRole) => {
    setFormRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const isSubmenuDialogOpen = !!editingSubmenu || !!isAddingSubmenu;
  const isMenuDialogOpen = !!editingMenu || isAddingMenu;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Menus & Navegação</CardTitle>
            <CardDescription>Gerencie a estrutura de menus, submenus e permissões de acesso</CardDescription>
          </div>
          <Button onClick={openAddMenuDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Menu Master
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {menus.map((menu) => (
            <div key={menu.id} className="border rounded-lg overflow-hidden shadow-sm bg-card">
              {/* Menu Principal */}
              <div className="bg-muted/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMenu(menu.id)}>
                    {expandedMenus.has(menu.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </Button>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {menu.label}
                      {!menu.isActive && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded uppercase font-bold">Inativo</span>}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {menu.route || 'Sem rota'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 mr-4 text-xs">
                    <span className="text-muted-foreground">Ordem: {menu.order}</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary font-medium rounded">
                      {menu.submenus?.length || 0} submenus
                    </span>
                  </div>

                  {/* Actions for Menu Master */}
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/menus/${menu.id}`)} className="h-8 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Acessos
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditMenuDialog(menu)} className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Menu Master?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso removerá o menu <b>{menu.label}</b> e todos os seus <b>submenus</b>. Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMenu(menu.id)} className="bg-destructive hover:bg-destructive/90">
                            Sim, Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              {/* Submenus Area */}
              {expandedMenus.has(menu.id) && (
                <div className="p-4 bg-background border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Submenus</h4>
                    <Button variant="secondary" size="sm" onClick={() => openAddSubmenuDialog(menu.id)} className="h-8 gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Adicionar Submenu
                    </Button>
                  </div>

                  {menu.submenus && menu.submenus.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-8">Título</TableHead>
                          <TableHead className="h-8">Rota</TableHead>
                          <TableHead className="h-8">Ordem</TableHead>
                          <TableHead className="h-8">Roles Exibição</TableHead>
                          <TableHead className="h-8 w-24 text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menu.submenus.map((submenu) => (
                          <TableRow key={submenu.id}>
                            <TableCell className="font-medium py-2">{submenu.label}</TableCell>
                            <TableCell className="font-mono text-xs py-2">{submenu.route || '-'}</TableCell>
                            <TableCell className="py-2">{submenu.order}</TableCell>
                            <TableCell className="py-2">
                              <div className="flex gap-1 flex-wrap">
                                {submenu.roles && submenu.roles.length > 0 ? (
                                  submenu.roles.map((role) => (
                                    <span key={role} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded font-medium uppercase tracking-wider">
                                      {ROLE_LABELS[role]}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end gap-1">
                                <Button variant="outline" size="icon" onClick={() => navigate(`/admin/menus/${submenu.id}`)} className="h-7 w-7 border-blue-200 text-blue-600 hover:bg-blue-50">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSubmenuDialog(submenu)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Submenu?</AlertDialogTitle>
                                      <AlertDialogDescription>Remover <b>{submenu.label}</b>?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteSubmenu(submenu.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sim, Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                      Nenhum submenu listado.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {menus.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum menu cadastrado ainda.
            </div>
          )}
        </div>
      </CardContent>

      {/* DIALOG FOR MENU (MASTER) */}
      <Dialog open={isMenuDialogOpen} onOpenChange={(open) => !open && (setEditingMenu(null), setIsAddingMenu(false))}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isAddingMenu ? 'Novo Menu Master' : `Editar Menu - ${formLabel}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Rótulo (Label)</Label>
                <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Ex: Cadastros" />
              </div>
              <div className="grid gap-2">
                <Label>Rota Principal (Opcional)</Label>
                <Input value={formRoute} onChange={(e) => setFormRoute(e.target.value)} placeholder="/cadastros" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome do Ícone (Lucide)</Label>
                <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} placeholder="Database" />
              </div>
              <div className="grid gap-2">
                <Label>Ordem de Exibição</Label>
                <Input type="number" value={formOrder} onChange={(e) => setFormOrder(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Status do Menu</Label>
                <div className="text-sm text-muted-foreground">Menus inativos não são exibidos na navegação.</div>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
            <div className="grid gap-2 mt-2">
              <Label>Exibir para os Seguintes Perfis</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-lg p-4 bg-muted/30">
                {ALL_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox id={`m-role-${role}`} checked={formRoles.includes(role)} onCheckedChange={() => handleRoleToggle(role)} />
                    <label htmlFor={`m-role-${role}`} className="text-sm cursor-pointer">{ROLE_LABELS[role]}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleSaveMenu} disabled={isSaving || !formLabel} className="w-full">
            {isSaving ? 'Salvando...' : 'Salvar Menu Master'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* DIALOG FOR SUBMENU */}
      <Dialog open={isSubmenuDialogOpen} onOpenChange={(open) => !open && (setEditingSubmenu(null), setIsAddingSubmenu(null))}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isAddingSubmenu ? 'Novo Submenu' : `Editar Submenu - ${formLabel}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Rótulo (Label)</Label>
                <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Ex: Clientes" />
              </div>
              <div className="grid gap-2">
                <Label>Rota (Route)</Label>
                <Input value={formRoute} onChange={(e) => setFormRoute(e.target.value)} placeholder="/clients" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ícone (Lucide Icon Name)</Label>
                <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} placeholder="Users" />
              </div>
              <div className="grid gap-2">
                <Label>Ordem de Exibição</Label>
                <Input type="number" value={formOrder} onChange={(e) => setFormOrder(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid gap-2 mt-2">
              <Label>Exibir para os Seguintes Perfis</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-lg p-4 bg-muted/30">
                {ALL_ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox id={`s-role-${role}`} checked={formRoles.includes(role)} onCheckedChange={() => handleRoleToggle(role)} />
                    <label htmlFor={`s-role-${role}`} className="text-sm cursor-pointer">{ROLE_LABELS[role]}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleSaveSubmenu} disabled={isSaving || !formLabel || !formRoute} className="w-full">
            {isSaving ? 'Salvando...' : 'Salvar Submenu'}
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
