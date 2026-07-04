import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'The ID token returned from Google Sign-In',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY0...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
