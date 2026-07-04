import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MenuPermissionsEditor } from '@/components/Admin/MenuPermissionsEditor';
import { menuService, MenuItem } from '@/services/menuService';
import { AppRole } from '@/types/permissions';

export default function MenuPermissions() {
  const { id: menuId } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta área.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    const loadMenu = async () => {
      if (!menuId) return;

      try {
        setLoading(true);
        const menus = await menuService.getAllMenus();
        let foundItem: any = null;

        for (const menu of menus) {
          if (menu.id === menuId) {
            foundItem = menu;
            break;
          }
          if (menu.submenus && menu.submenus.length > 0) {
            const sub = menu.submenus.find(s => s.id === menuId);
            if (sub) {
              foundItem = sub;
              break;
            }
          }
        }

        if (foundItem) {
          setMenu(foundItem);
        } else {
          toast({
            title: 'Menu não encontrado',
            description: 'O menu solicitado não existe.',
            variant: 'destructive',
          });
          navigate('/admin');
        }
      } catch (error) {
        console.error('Erro ao carregar menu:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do menu.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadMenu();
    }
  }, [menuId, isAdmin, navigate, toast]);

  const handleSave = async (
    menuId: string,
    permissions: {
      rolesConsulta: AppRole[];
      rolesInclusaoEdicao: AppRole[];
      rolesEspecial: AppRole[];
    }
  ) => {
    try {
      setSaving(true);
      await menuService.updateMenuPermissions(menuId, permissions);

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso.',
      });

      navigate('/admin?tab=menus');
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as permissões.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!menu) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin?tab=menus')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Admin
          </Button>
        </div>

        <MenuPermissionsEditor
          menuId={menu.id}
          menuLabel={menu.label}
          currentRolesConsulta={menu.rolesConsulta}
          currentRolesInclusaoEdicao={menu.rolesInclusaoEdicao}
          currentRolesEspecial={menu.rolesEspecial}
          onSave={handleSave}
          onCancel={() => navigate('/admin?tab=menus')}
        />
      </div>
    </div>
  );
}
