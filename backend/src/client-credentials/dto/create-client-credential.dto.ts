import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail, ValidateIf } from 'class-validator';
import { ClientCredentialType } from '@prisma/client';

export class CreateClientCredentialDto {
  @ApiProperty({ example: 'uuid', description: 'ID do cliente' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ enum: ClientCredentialType })
  @IsEnum(ClientCredentialType)
  type: ClientCredentialType;

  @ApiProperty({ example: 'Anydesk Servidor Principal' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'a-senha-em-texto-puro-so-nesta-chamada' })
  @IsString()
  @IsNotEmpty()
  secret: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  responsavelNome?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  responsavelTelefone?: string;

  @ApiProperty({ required: false })
  @ValidateIf((o) => !!o.responsavelEmail)
  @IsEmail()
  responsavelEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
