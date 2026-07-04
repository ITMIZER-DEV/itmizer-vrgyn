import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    password: string;

    @ApiProperty({ example: 'John Doe', description: 'User full name' })
    fullName: string;
}
