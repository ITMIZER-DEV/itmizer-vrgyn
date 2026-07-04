import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '@prisma/client';
import { PermissionType, RoutePermissions } from '../decorators/permissions.decorator';

/**
 * Guard para validar permissões granulares em rotas
 *
 * Este guard verifica se o usuário possui a permissão necessária (CONSULTA, INCLUSAO_EDICAO, ESPECIAL)
 * baseado nas roles definidas no decorator @Permissions
 *
 * O guard pode ser usado de duas formas:
 * 1. Com roles explícitas no decorator
 * 2. Verificando dinamicamente as permissões do menu (implementação futura)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<RoutePermissions>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!permissions) {
      // Se não há permissões definidas, permite acesso
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('Usuário não autenticado ou sem roles');
    }

    // Admin tem acesso a tudo
    if (user.roles.includes(AppRole.admin)) {
      return true;
    }

    // Se roles específicas foram definidas no decorator, usa elas
    if (permissions.roles && permissions.roles.length > 0) {
      const hasPermission = permissions.roles.some((role) =>
        user.roles.includes(role),
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permissão negada. Tipo de permissão requerida: ${permissions.type}`,
        );
      }

      return true;
    }

    // TODO: Implementar busca dinâmica de permissões do menu/submenu pelo route
    // Por enquanto, se não tem roles explícitas, permite (compatibilidade)
    return true;
  }

  /**
   * Verifica se o usuário tem a permissão necessária
   */
  private hasPermission(
    userRoles: AppRole[],
    requiredRoles: AppRole[],
  ): boolean {
    return userRoles.some((role) => requiredRoles.includes(role));
  }
}
