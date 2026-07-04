import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from '@prisma/client';
import { PermissionType } from '../auth/decorators/permissions.decorator';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async findMyMenus(userRoles: AppRole[]) {
    // Busca todos os menus ativos
    const menus = await this.prisma.menu.findMany({
      where: { isActive: true },
      include: {
        submenus: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Filtra menus e submenus baseados no ACL (roles)
    return menus
      .filter((menu) => this.hasAccess(userRoles, menu.roles))
      .map((menu) => ({
        ...menu,
        // Adiciona informações de permissões granulares
        permissions: {
          canView: this.hasAccess(userRoles, menu.rolesConsulta),
          canEdit: this.hasAccess(userRoles, menu.rolesInclusaoEdicao),
          canSpecial: this.hasAccess(userRoles, menu.rolesEspecial),
        },
        submenus: menu.submenus
          .filter((sub) => this.hasAccess(userRoles, sub.roles))
          .map((sub) => ({
            ...sub,
            permissions: {
              canView: this.hasAccess(userRoles, sub.rolesConsulta),
              canEdit: this.hasAccess(userRoles, sub.rolesInclusaoEdicao),
              canSpecial: this.hasAccess(userRoles, sub.rolesEspecial),
            },
          })),
      }));
  }

  /**
   * Verifica se o usuário tem permissão para acessar uma rota específica
   */
  async checkRoutePermission(
    route: string,
    userRoles: AppRole[],
    permissionType: PermissionType,
  ): Promise<boolean> {
    // Busca menu ou submenu pela rota
    const menu = await this.prisma.menu.findFirst({
      where: { route, isActive: true },
      include: { submenus: true },
    });

    const submenu = await this.prisma.submenu.findFirst({
      where: { route },
    });

    const target = submenu || menu;

    if (!target) {
      throw new NotFoundException(`Rota ${route} não encontrada`);
    }

    // Verifica permissão baseada no tipo
    let requiredRoles: AppRole[];
    switch (permissionType) {
      case PermissionType.CONSULTA:
        requiredRoles = target.rolesConsulta;
        break;
      case PermissionType.INCLUSAO_EDICAO:
        requiredRoles = target.rolesInclusaoEdicao;
        break;
      case PermissionType.ESPECIAL:
        requiredRoles = target.rolesEspecial;
        break;
      default:
        requiredRoles = target.roles;
    }

    return this.hasAccess(userRoles, requiredRoles);
  }

  private hasAccess(userRoles: AppRole[], requiredRoles: AppRole[]): boolean {
    // Se o usuário for admin, tem acesso a tudo (opcional, dependendo da regra de negócio)
    if (userRoles.includes(AppRole.admin)) return true;

    // Verifica se há intersecção entre os papéis do usuário e os papéis permitidos
    return userRoles.some((role) => requiredRoles.includes(role));
  }

  // Admin Methods
  async findAll() {
    return this.prisma.menu.findMany({
      include: { submenus: true },
      orderBy: { order: 'asc' },
    });
  }

  async create(data: any) {
    const { submenus, ...menuData } = data;
    return this.prisma.menu.create({
      data: {
        ...menuData,
        submenus: submenus ? { create: submenus } : undefined,
      },
      include: { submenus: true },
    });
  }

  async update(id: string, data: any) {
    const { submenus, ...menuData } = data;
    
    // Verifica se é um Menu
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (menu) {
      return this.prisma.menu.update({
        where: { id },
        data: menuData,
        include: { submenus: true },
      });
    }

    // Se não for menu, verifica se é um Submenu
    const submenu = await this.prisma.submenu.findUnique({ where: { id } });
    if (submenu) {
      return this.prisma.submenu.update({
        where: { id },
        data: menuData,
      });
    }

    throw new NotFoundException(`Item com ID ${id} não encontrado em Menus ou Submenus`);
  }

  async remove(id: string) {
    return this.prisma.menu.delete({ where: { id } });
  }

  // Submenu Admin Methods
  async createSubmenu(menuId: string, data: any) {
    return this.prisma.submenu.create({
      data: { ...data, menuId },
    });
  }

  async updateSubmenu(submenuId: string, data: any) {
    return this.prisma.submenu.update({
      where: { id: submenuId },
      data,
    });
  }

  async deleteSubmenu(submenuId: string) {
    return this.prisma.submenu.delete({
      where: { id: submenuId },
    });
  }

  async findSubmenusByMenu(menuId: string) {
    return this.prisma.submenu.findMany({
      where: { menuId },
      orderBy: { order: 'asc' },
    });
  }
}
