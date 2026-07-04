export enum PermissionType {
  CONSULTA = 'CONSULTA',
  INCLUSAO_EDICAO = 'INCLUSAO_EDICAO',
  ESPECIAL = 'ESPECIAL',
}

export enum AppRole {
  admin = 'admin',
  supervisao = 'supervisao',
  user = 'user',
  support = 'support',
  seller = 'seller',
  migrador = 'migrador',
  implantador = 'implantador',
}

export interface MenuPermissions {
  canView: boolean;
  canEdit: boolean;
  canSpecial: boolean;
}

export interface MenuPermissionsDto {
  rolesConsulta?: AppRole[];
  rolesInclusaoEdicao?: AppRole[];
  rolesEspecial?: AppRole[];
}
