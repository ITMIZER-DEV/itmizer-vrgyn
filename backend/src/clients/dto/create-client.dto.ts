import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
    @ApiProperty({ example: 'VR Software', description: 'Client fantasy name' })
    @IsString()
    @IsNotEmpty()
    nomeFantasia: string;

    @ApiProperty({ example: 'VR SOFTWARE LTDA', description: 'Client company name', required: false })
    @IsString()
    @IsOptional()
    razaoSocial?: string;

    @ApiProperty({ example: '12.345.678/0001-90', description: 'Client CNPJ' })
    @IsString()
    @IsNotEmpty()
    cnpj: string;

    @ApiProperty({ example: 'Rua Exemplo, 123', description: 'Client address', required: false })
    @IsString()
    @IsOptional()
    endereco?: string;

    @ApiProperty({ example: 'João Silva', description: 'Contact person name', required: false })
    @IsString()
    @IsOptional()
    contatoNome?: string;

    @ApiProperty({ example: 'joao@cliente.com', description: 'Contact person email', required: false })
    @IsEmail()
    @IsOptional()
    contatoEmail?: string;

    @ApiProperty({ example: '(11) 99999-8888', description: 'Contact person phone', required: false })
    @IsString()
    @IsOptional()
    contatoTelefone?: string;

    @ApiProperty({ example: 'https://drive.google.com/drive/folders/XX', description: 'Drive documentation folder link', required: false })
    @IsString()
    @IsOptional()
    driveLink?: string;
}
