import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AppRole {
    ADMIN = 'admin',
    SUPERVISAO = 'supervisao',
    USER = 'user',
    SUPPORT = 'support',
    SELLER = 'seller',
    MIGRADOR = 'migrador',
    IMPLANTADOR = 'implantador',
}

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ example: 'John Doe', description: 'User full name', required: false })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiProperty({ enum: AppRole, example: AppRole.USER, description: 'User role', required: false })
    @IsEnum(AppRole)
    @IsOptional()
    role?: AppRole;

    @ApiProperty({ example: 'light', description: 'User theme preference', required: false })
    @IsString()
    @IsOptional()
    theme?: string;
}
