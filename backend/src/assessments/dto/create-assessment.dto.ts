import { ApiProperty } from '@nestjs/swagger';

export class CreateAssessmentDto {
    @ApiProperty({ example: 'uuid-of-client', description: 'Client ID associated with the assessment', required: false })
    clientId?: string;

    @ApiProperty({ example: 'Client Name', description: 'Company name for the assessment', required: false })
    companyName?: string;

    @ApiProperty({ example: '12.345.678/0001-90', description: 'CNPJ for the assessment', required: false })
    cnpj?: string;

    @ApiProperty({ example: 'draft', description: 'Assessment status', required: false })
    status?: string;

    @ApiProperty({ example: 'Médio', description: 'Company size/porte', required: false })
    porte?: string;

    @ApiProperty({ example: {}, description: 'Complex JSON structure containing assessment data' })
    data: any;

    @ApiProperty({ example: {}, description: 'Validation results JSON', required: false })
    validationResults?: any;

    // Projeto fields
    @ApiProperty({ example: 40, description: 'Project hours quantity', required: false })
    projetoQuantidadeHoras?: number;

    @ApiProperty({ example: 'Escopo da implantação...', description: 'Implementation scope', required: false })
    projetoEscopoImplantacao?: string;

    // Migration fields
    @ApiProperty({ example: 'padrao_bd', description: 'Migration type', required: false })
    migracaoTipo?: string;

    @ApiProperty({ example: {}, description: 'Migration access credentials', required: false })
    migracaoAcessos?: any;

    @ApiProperty({ example: 3, description: 'Product data period in months', required: false })
    migracaoProdutoPeriodo?: number;

    @ApiProperty({ example: 2, description: 'Sales history period in months', required: false })
    migracaoVendasPeriodo?: number;
}
