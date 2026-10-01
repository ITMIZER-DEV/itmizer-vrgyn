import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CriticalCaseStatus } from '@prisma/client';

export class CreateAcompanhamentoDto {
  @ApiProperty({ description: 'Data da evolução / acompanhamento', required: false })
  @IsDateString()
  @IsOptional()
  data?: string;

  @ApiProperty({
    description: 'Tipo da evolução',
    example: 'REUNIAO',
    default: 'ACOMPANHAMENTO',
    required: false,
  })
  @IsString()
  @IsOptional()
  tipo?: string;

  @ApiProperty({ description: 'Detalhamento da evolução do caso' })
  @IsString()
  @IsNotEmpty({ message: 'A descrição da evolução é obrigatória.' })
  descricao: string;

  @ApiProperty({ description: 'Próximos passos decorrentes deste acompanhamento', required: false })
  @IsString()
  @IsOptional()
  proximosPassos?: string;

  @ApiProperty({
    enum: CriticalCaseStatus,
    description: 'Se preenchido, atualiza o status do caso',
    required: false,
  })
  @IsEnum(CriticalCaseStatus)
  @IsOptional()
  statusNovo?: CriticalCaseStatus;
}
