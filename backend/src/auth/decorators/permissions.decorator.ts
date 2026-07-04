import { SetMetadata } from '@nestjs/common';
import { AppRole } from '@prisma/client';

export enum PermissionType {
  CONSULTA = 'CONSULTA',
  INCLUSAO_EDICAO = 'INCLUSAO_EDICAO',
  ESPECIAL = 'ESPECIAL',
}

export interface RoutePermissions {
  type: PermissionType;
  roles: AppRole[];
}

/**
 * Decorator para definir permissões granulares em rotas
 * @param type - Tipo de permissão (CONSULTA, INCLUSAO_EDICAO, ESPECIAL)
 * @param roles - Array de roles permitidas (opcional, se não informado usa as roles do menu)
 *
 * @example
 * @Permissions(PermissionType.CONSULTA, [AppRole.admin, AppRole.user])
 * @Get()
 * findAll() { ... }
 *
 * @Permissions(PermissionType.INCLUSAO_EDICAO)
 * @Post()
 * create() { ... }
 *
 * @Permissions(PermissionType.ESPECIAL, [AppRole.admin])
 * @Post('approve')
 * approve() { ... }
 */
export const Permissions = (type: PermissionType, roles?: AppRole[]) =>
  SetMetadata('permissions', { type, roles });

/**
 * Decorator simplificado para permissão de consulta
 */
export const RequiresConsulta = (roles?: AppRole[]) =>
  Permissions(PermissionType.CONSULTA, roles);

/**
 * Decorator simplificado para permissão de inclusão/edição
 */
export const RequiresInclusaoEdicao = (roles?: AppRole[]) =>
  Permissions(PermissionType.INCLUSAO_EDICAO, roles);

/**
 * Decorator simplificado para permissão especial
 */
export const RequiresEspecial = (roles?: AppRole[]) =>
  Permissions(PermissionType.ESPECIAL, roles);
