import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppRole } from '@prisma/client';

export class MenuPermissionsDto {
  @ApiProperty({
    description: 'Roles permitidos para consulta/visualização',
    enum: AppRole,
    isArray: true,
    example: ['admin', 'user', 'support'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  rolesConsulta?: AppRole[];

  @ApiProperty({
    description: 'Roles permitidos para inclusão e edição',
    enum: AppRole,
    isArray: true,
    example: ['admin', 'support'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  rolesInclusaoEdicao?: AppRole[];

  @ApiProperty({
    description: 'Roles permitidos para ações especiais (aprovar, exportar, etc)',
    enum: AppRole,
    isArray: true,
    example: ['admin'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  rolesEspecial?: AppRole[];
}
