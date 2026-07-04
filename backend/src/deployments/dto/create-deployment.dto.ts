import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl, IsDateString } from 'class-validator';
import { DeploymentStatus } from '@prisma/client';

export class CreateDeploymentDto {
    @ApiProperty({ example: 'uuid', description: 'ID do cliente' })
    @IsString()
    @IsNotEmpty()
    clientId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    implantador?: string;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    dataInicio?: string | Date;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    dataPrevisao?: string | Date;

    @ApiProperty({ required: false })
    @IsUrl()
    @IsOptional()
    driveDocumentacao?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    observacao?: string;

    @ApiProperty({ enum: DeploymentStatus, required: false })
    @IsEnum(DeploymentStatus)
    @IsOptional()
    status?: DeploymentStatus;
}
