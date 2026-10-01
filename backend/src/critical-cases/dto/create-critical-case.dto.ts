import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { CriticalCaseStatus, CriticalCaseCategory } from '@prisma/client';

export class CreateCriticalCaseDto {
  @ApiProperty({ example: 'uuid', description: 'ID do cliente' })
  @IsString()
  @IsNotEmpty({ message: 'O cliente é obrigatório.' })
  clientId: string;

  @ApiProperty({
    enum: CriticalCaseCategory,
    isArray: true,
    description: 'Categorias/tipos do caso de múltipla escolha',
    example: ['CHAMADO', 'RECLAMACAO'],
    required: false,
  })
  @IsArray()
  @IsEnum(CriticalCaseCategory, { each: true })
  @IsOptional()
  categories?: CriticalCaseCategory[];

  @ApiProperty({ required: false, description: 'Participantes envolvidos no caso' })
  @IsString()
  @IsOptional()
  participantes?: string;

  @ApiProperty({ required: false, description: 'Observações do caso' })
  @IsString()
  @IsOptional()
  observacoes?: string;

  @ApiProperty({ required: false, description: 'Próximos passos e ações' })
  @IsString()
  @IsOptional()
  proximosPassos?: string;

  @ApiProperty({ enum: CriticalCaseStatus, default: CriticalCaseStatus.ABERTO, required: false })
  @IsEnum(CriticalCaseStatus)
  @IsOptional()
  status?: CriticalCaseStatus;

  @ApiProperty({ required: false, description: 'ID do usuário responsável' })
  @IsString()
  @IsOptional()
  responsavelId?: string;
}
