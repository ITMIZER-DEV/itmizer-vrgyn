import { useState, useEffect } from 'react';
import { menuService } from '@/services/menuService';
import { PermissionType } from '@/types/permissions';

/**
 * Hook para verificar permissões granulares do usuário em rotas específicas
 *
 * @example
 * const { canView, canEdit, canSpecial, loading } = usePermissions('/clients');
 *
 * if (canEdit) {
 *   // Mostrar botão de editar
 * }
 */
export function usePermissions(route: string) {
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canSpecial, setCanSpecial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setLoading(true);
        const [viewPermission, editPermission, specialPermission] = await Promise.all([
          menuService.checkPermission(route, PermissionType.CONSULTA),
          menuService.checkPermission(route, PermissionType.INCLUSAO_EDICAO),
          menuService.checkPermission(route, PermissionType.ESPECIAL),
        ]);

        setCanView(viewPermission);
        setCanEdit(editPermission);
        setCanSpecial(specialPermission);
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        // Em caso de erro, nega todas as permissões
        setCanView(false);
        setCanEdit(false);
        setCanSpecial(false);
      } finally {
        setLoading(false);
      }
    };

    if (route) {
      checkPermissions();
    }
  }, [route]);

  return {
    canView,
    canEdit,
    canSpecial,
    loading,
  };
}

/**
 * Hook simplificado para verificar um tipo específico de permissão
 *
 * @example
 * const { hasPermission, loading } = usePermission('/clients', PermissionType.INCLUSAO_EDICAO);
 */
export function usePermission(route: string, permissionType: PermissionType) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const permission = await menuService.checkPermission(route, permissionType);
        setHasPermission(permission);
      } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    if (route) {
      checkPermission();
    }
  }, [route, permissionType]);

  return {
    hasPermission,
    loading,
  };
}
