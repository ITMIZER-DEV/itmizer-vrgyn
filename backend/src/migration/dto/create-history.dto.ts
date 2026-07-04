import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHistoryDto {
    @ApiProperty({ example: 'Update Status', description: 'Action performed' })
    @IsString()
    @IsNotEmpty()
    action: string;

    @ApiProperty({ example: 'Status changed from pending to completed', description: 'Additional details about the action', required: false })
    @IsString()
    @IsOptional()
    details?: string;
}
