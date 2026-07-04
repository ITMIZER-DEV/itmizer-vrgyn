import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsUUID, IsUrl } from 'class-validator';
import { RecemVrStatus, RecemVrCriticidade } from '@prisma/client';

export class UpdatePlanejamentoDto {
  @ApiProperty({ required: false, description: 'Data da primeira reunião com o cliente' })
  @IsDateString()
  @IsOptional()
  dataPrimeiraReuniao?: string;

  @ApiProperty({ required: false, isArray: true, description: 'Datas das reuniões de acompanhamento planejadas' })
  @IsArray()
  @IsDateString({}, { each: true })
  @IsOptional()
  datasAcompanhamento?: string[];

  @ApiProperty({ enum: RecemVrStatus, required: false })
  @IsEnum(RecemVrStatus)
  @IsOptional()
  status?: RecemVrStatus;

  @ApiProperty({ required: false, description: 'ID do analista de suporte responsável' })
  @IsUUID()
  @IsOptional()
  analistaId?: string;

  @ApiProperty({ enum: RecemVrCriticidade, required: false })
  @IsEnum(RecemVrCriticidade)
  @IsOptional()
  criticidade?: RecemVrCriticidade;

  @ApiProperty({ required: false, description: 'Link do Termo de Encerramento MV067 no Drive' })
  @IsString()
  @IsOptional()
  mv067?: string;
}
