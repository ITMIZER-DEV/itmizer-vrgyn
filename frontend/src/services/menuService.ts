import api from './api';
import { MenuPermissions, MenuPermissionsDto, PermissionType, AppRole } from '@/types/permissions';

export interface MenuSubitem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  order: number;
  roles?: AppRole[];
  rolesConsulta?: AppRole[];
  rolesInclusaoEdicao?: AppRole[];
  rolesEspecial?: AppRole[];
  permissions?: MenuPermissions;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  order: number;
  roles?: AppRole[];
  rolesConsulta?: AppRole[];
  rolesInclusaoEdicao?: AppRole[];
  rolesEspecial?: AppRole[];
  permissions?: MenuPermissions;
  isActive?: boolean;
  submenus: MenuSubitem[];
}

export interface CreateMenuDto {
  label: string;
  icon?: string;
  route?: string;
  order?: number;
  isActive?: boolean;
  roles?: AppRole[];
  rolesConsulta?: AppRole[];
  rolesInclusaoEdicao?: AppRole[];
  rolesEspecial?: AppRole[];
}

export const menuService = {
  async getMyMenus(): Promise<MenuItem[]> {
    const response = await api.get<MenuItem[]>('/menus/my');
    return response.data;
  },
  async getAllMenus(): Promise<MenuItem[]> {
    const response = await api.get<MenuItem[]>('/menus');
    return response.data;
  },
  async createMenu(data: CreateMenuDto): Promise<MenuItem> {
    const response = await api.post<MenuItem>('/menus', data);
    return response.data;
  },
  async updateMenu(id: string, data: Partial<CreateMenuDto>): Promise<MenuItem> {
    const response = await api.patch<MenuItem>(`/menus/${id}`, data);
    return response.data;
  },
  async updateMenuPermissions(id: string, permissions: MenuPermissionsDto): Promise<MenuItem> {
    const response = await api.patch<MenuItem>(`/menus/${id}/permissions`, permissions);
    return response.data;
  },
  async checkPermission(route: string, permissionType: PermissionType): Promise<boolean> {
    const response = await api.get<{ hasPermission: boolean }>(
      `/menus/check-permission?route=${encodeURIComponent(route)}&permissionType=${permissionType}`
    );
    return response.data.hasPermission;
  },
  async deleteMenu(id: string): Promise<void> {
    await api.delete(`/menus/${id}`);
  },

  // Submenu methods
  async getSubmenus(menuId: string): Promise<MenuSubitem[]> {
    const response = await api.get<MenuSubitem[]>(`/menus/${menuId}/submenus`);
    return response.data;
  },
  async createSubmenu(menuId: string, data: Partial<MenuSubitem>): Promise<MenuSubitem> {
    const response = await api.post<MenuSubitem>(`/menus/${menuId}/submenus`, data);
    return response.data;
  },
  async updateSubmenu(submenuId: string, data: Partial<MenuSubitem>): Promise<MenuSubitem> {
    const response = await api.patch<MenuSubitem>(`/menus/submenus/${submenuId}`, data);
    return response.data;
  },
  async deleteSubmenu(submenuId: string): Promise<void> {
    await api.delete(`/menus/submenus/${submenuId}`);
  }
};
