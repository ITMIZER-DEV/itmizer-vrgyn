import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ClientInfraType } from '@prisma/client';

export class CreateClientInfrastructureDto {
  @ApiProperty({ example: 'uuid', description: 'ID do cliente' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ enum: ClientInfraType })
  @IsEnum(ClientInfraType)
  type: ClientInfraType;

  @ApiProperty({ example: 'Servidor Principal' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  hostname?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  operatingSystem?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cpuModel?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  ramGb?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  storageGb?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  storageType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
