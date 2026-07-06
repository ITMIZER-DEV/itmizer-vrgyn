import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { TicketUrgencia } from '@prisma/client';

export class CreateClientTicketDto {
  @ApiProperty({ example: 'uuid', description: 'ID do cliente' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ example: '2026-07-06', description: 'Data do ticket' })
  @IsDateString()
  data: string;

  @ApiProperty({ example: '1001', description: 'Número do ticket no Movidesk' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: 'Erro ao emitir NF-e' })
  @IsString()
  @IsNotEmpty()
  assunto: string;

  @ApiProperty({ enum: TicketUrgencia })
  @IsEnum(TicketUrgencia)
  classificacao: TicketUrgencia;
}
