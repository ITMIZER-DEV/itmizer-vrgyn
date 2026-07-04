import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Authenticate user and return JWT token' })
    @ApiResponse({ status: 200, description: 'Successfully authenticated.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('google')
    @ApiOperation({ summary: 'Authenticate user using Google ID token' })
    @ApiResponse({ status: 200, description: 'Successfully authenticated.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
        return this.authService.loginWithGoogle(googleLoginDto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Returns user profile data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getProfile(@Request() req) {
        return req.user;
    }
}
