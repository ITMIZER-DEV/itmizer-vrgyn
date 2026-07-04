import { IsString, IsOptional, IsInt, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppRole } from '@prisma/client';

export class CreateMenuDto {
  @ApiProperty({ description: 'Label do menu', example: 'Dashboard' })
  @IsString()
  label: string;

  @ApiProperty({ description: 'Ícone do menu (nome do ícone Lucide)', example: 'Home', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: 'Rota do menu', example: '/dashboard', required: false })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiProperty({ description: 'Ordem de exibição', example: 1, required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ description: 'Menu está ativo?', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Roles básicas permitidas (compatibilidade retroativa)',
    enum: AppRole,
    isArray: true,
    example: ['admin', 'user'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  roles?: AppRole[];

  @ApiProperty({
    description: 'Roles permitidos para consulta/visualização',
    enum: AppRole,
    isArray: true,
    example: ['admin', 'user', 'support'],
    required: false,
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
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  rolesInclusaoEdicao?: AppRole[];

  @ApiProperty({
    description: 'Roles permitidos para ações especiais',
    enum: AppRole,
    isArray: true,
    example: ['admin'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AppRole, { each: true })
  rolesEspecial?: AppRole[];
}
