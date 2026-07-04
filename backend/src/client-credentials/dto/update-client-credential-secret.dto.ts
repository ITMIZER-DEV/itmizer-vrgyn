import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateClientCredentialSecretDto {
  @ApiProperty({ example: 'nova-senha-em-texto-puro' })
  @IsString()
  @IsNotEmpty()
  secret: string;
}
