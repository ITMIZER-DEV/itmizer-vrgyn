import { IsString, IsOptional, IsObject, IsNotEmpty, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum TipoMigracao {
    PADRAO = 'padrao',
    PLANILHA = 'planilha',
    CONSULTORIA = 'consultoria',
}

enum TipoCobranca {
    HORA = 'hora',
    VALOR_FIXO = 'valor_fixo',
}

export class CreateMigrationDto {
    @ApiProperty({ example: 'uuid-of-client', description: 'Client ID' })
    @IsString()
    @IsNotEmpty()
    clientId: string;

    @ApiProperty({ enum: TipoMigracao, example: TipoMigracao.PADRAO, description: 'Migration type', required: false })
    @IsEnum(TipoMigracao)
    @IsOptional()
    tipoMigracao?: TipoMigracao;

    @ApiProperty({ example: 'uuid-of-user', description: 'Responsible user ID', required: false })
    @IsString()
    @IsOptional()
    responsavelId?: string;

    @ApiProperty({ enum: TipoCobranca, example: TipoCobranca.HORA, description: 'Billing type', required: false })
    @IsEnum(TipoCobranca)
    @IsOptional()
    tipoCobranca?: TipoCobranca;

    @ApiProperty({ example: 150.00, description: 'Hourly rate', required: false })
    @IsNumber()
    @IsOptional()
    valorHora?: number;

    @ApiProperty({ example: 2000.00, description: 'Fixed value', required: false })
    @IsNumber()
    @IsOptional()
    valorFixo?: number;

    @ApiProperty({ example: 'Carlos Silva', description: 'Primary contact name', required: false })
    @IsString()
    @IsOptional()
    nomeContatoChave?: string;

    @ApiProperty({ example: '(11) 98888-7777', description: 'Contact phone', required: false })
    @IsString()
    @IsOptional()
    telefone?: string;

    @ApiProperty({ example: '123 456 789', description: 'AnyDesk ID', required: false })
    @IsString()
    @IsOptional()
    acessoAnydesk?: string;

    @ApiProperty({ example: 'password123', description: 'AnyDesk password', required: false })
    @IsString()
    @IsOptional()
    senhaAnydesk?: string;

    @ApiProperty({ example: 'pendente', description: 'Financial status', required: false })
    @IsString()
    @IsOptional()
    statusFinanceiro?: string;

    @ApiProperty({ example: 'Sistema X', description: 'System name', required: false })
    @IsString()
    @IsOptional()
    nomeSistema?: string;

    @ApiProperty({ example: 'Software House Y', description: 'Software house name', required: false })
    @IsString()
    @IsOptional()
    nomeSoftwareHouse?: string;

    @ApiProperty({ example: 'PostgreSQL', description: 'Database type', required: false })
    @IsString()
    @IsOptional()
    tipoBancoDados?: string;

    @ApiProperty({ example: {}, description: 'Complex JSON structure for migration items', required: false })
    @IsObject()
    @IsOptional()
    items?: any;

    @ApiProperty({ example: 'Needs validation', description: 'Internal observations', required: false })
    @IsString()
    @IsOptional()
    observacoes?: string;

    @ApiProperty({ example: '2025-06-15T00:00:00.000Z', description: 'Expected go-live date', required: false })
    @IsDateString()
    @IsOptional()
    dataPrevistaVirada?: string;

    @ApiProperty({ example: '2025-06-20T00:00:00.000Z', description: 'Actual system go-live date', required: false })
    @IsDateString()
    @IsOptional()
    dataViradaSistema?: string;
}
