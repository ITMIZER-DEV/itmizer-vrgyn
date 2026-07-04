import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateAcompanhamentoDto {
  @ApiProperty({ description: 'Data em que a reunião foi realizada' })
  @IsDateString()
  @IsNotEmpty()
  dataReuniao: string;

  @ApiProperty({ required: false, description: 'Ata da reunião (texto ou link)' })
  @IsString()
  @IsOptional()
  ata?: string;

  @ApiProperty({ required: false, description: 'Observações livres' })
  @IsString()
  @IsOptional()
  observacao?: string;
}
