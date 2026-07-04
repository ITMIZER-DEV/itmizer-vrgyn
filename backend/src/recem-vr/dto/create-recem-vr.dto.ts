import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { RecemVrCriticidade } from '@prisma/client';

export class CreateRecemVrDto {
  @ApiProperty({ example: 'uuid', description: 'ID do cliente' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ required: false, description: 'ID do deployment vinculado (status RECEM_VR)' })
  @IsUUID()
  @IsOptional()
  deploymentId?: string;

  @ApiProperty({ required: false, description: 'Link/referência do Termo de Encerramento (MV067) no Drive' })
  @IsString()
  @IsOptional()
  mv067?: string;

  @ApiProperty({ enum: RecemVrCriticidade, default: RecemVrCriticidade.BAIXA })
  @IsEnum(RecemVrCriticidade)
  @IsOptional()
  criticidade?: RecemVrCriticidade;

  @ApiProperty({ description: 'Resumo da situação do cliente (obrigatório)' })
  @IsString()
  @IsNotEmpty({ message: 'O resumo é obrigatório para criar um Recém VR.' })
  resumo: string;
}
