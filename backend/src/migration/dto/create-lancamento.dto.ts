import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLancamentoDto {
    @ApiProperty({ example: '2024-03-20T10:00:00Z', description: 'Date of the entry', required: false })
    @IsDateString()
    @IsOptional()
    data?: string;

    @ApiProperty({ example: 4.5, description: 'Number of hours worked', required: false })
    @IsNumber()
    @IsOptional()
    horas?: number;

    @ApiProperty({ example: 675.00, description: 'Financial value', required: false })
    @IsNumber()
    @IsOptional()
    valor?: number;

    @ApiProperty({ example: 'Database migration work', description: 'Description of the work', required: false })
    @IsString()
    @IsOptional()
    descricao?: string;
}
