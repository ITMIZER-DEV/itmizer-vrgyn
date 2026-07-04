import { Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.googleClient = new OAuth2Client(
            this.configService.get<string>('GOOGLE_CLIENT_ID')
        );
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
            include: { profile: true, roles: true }
        });

        if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Usuário inativo. Entre em contato com o administrador.');
        }

        const payload = {
            email: user.email,
            sub: user.id,
            roles: user.roles.map((r) => r.role),
            name: user.profile?.fullName || user.email.split('@')[0]
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                roles: user.roles.map((r) => r.role),
                profile: user.profile,
                isActive: user.isActive,
            },
        };
    }

    async register(registerDto: RegisterDto) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                profile: {
                    create: {
                        fullName: registerDto.fullName,
                        email: registerDto.email,
                    },
                },
                roles: {
                    create: { role: 'user' },
                },
            },
            include: { profile: true, roles: true }
        });

        const payload = {
            email: user.email,
            sub: user.id,
            roles: user.roles.map((r) => r.role),
            name: user.profile?.fullName || registerDto.fullName
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                roles: user.roles.map((r) => r.role),
                profile: user.profile,
                isActive: user.isActive,
            },
        };
    }

    async loginWithGoogle(googleLoginDto: GoogleLoginDto) {
        const { token } = googleLoginDto;
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

        let googleId = '';
        let email = '';
        let fullName = '';

        try {
            // Tentar validar como ID Token primeiro (padrão do componente GoogleLogin)
            try {
                const ticket = await this.googleClient.verifyIdToken({
                    idToken: token,
                    audience: clientId,
                });
                const payload = ticket.getPayload();
                if (payload) {
                    googleId = payload.sub || '';
                    email = payload.email || '';
                    fullName = payload.name || '';
                    console.log(`Google ID Token validado para: ${email}`);
                }
            } catch (e) {
                console.log('Falha ao validar como ID Token, tentando Access Token...', e.message);
                // Se falhar, tentar validar como Access Token (padrão do useGoogleLogin/SSO Button)
                const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
                if (response.ok) {
                    const data = await response.json();
                    googleId = data.sub;
                    email = data.email;
                    fullName = data.name;
                    console.log(`Google Access Token validado para: ${email}`);
                } else {
                    console.error('Falha ao validar Access Token:', await response.text());
                    throw new UnauthorizedException('Token inválido ou expirado');
                }
            }

            if (!email) {
                throw new UnauthorizedException('Dados do usuário não obtidos do Google');
            }

            // Validar domínios permitidos
            const allowedDomainsString = this.configService.get<string>('ALLOWED_DOMAINS', 'itmizer.com.br,vrgoiania.com,vrsoft.com.br,gmail.com');
            const allowedDomains = allowedDomainsString ? allowedDomainsString.split(',').map(d => d.trim()) : [];
            
            // Garantir que vrsoft.com.br esteja sempre na lista se não estiver no ENV
            if (!allowedDomains.includes('vrsoft.com.br')) {
                allowedDomains.push('vrsoft.com.br');
            }
            
            const userDomain = email.split('@')[1];

            if (allowedDomains.length > 0 && !allowedDomains.includes(userDomain)) {
                throw new UnauthorizedException(`O domínio ${userDomain} não tem permissão para acessar este sistema.`);
            }

            // 1. Tentar encontrar por googleId
            let user = await this.prisma.user.findUnique({
                where: { googleId },
                include: { profile: true, roles: true }
            });

            // 2. Se não encontrar, tentar por email
            if (!user) {
                user = await this.prisma.user.findUnique({
                    where: { email },
                    include: { profile: true, roles: true }
                });

                // Se encontrou por email, vincular googleId
                if (user) {
                    user = await this.prisma.user.update({
                        where: { id: user.id },
                        data: { googleId },
                        include: { profile: true, roles: true }
                    });
                }
            }

            // 3. Se ainda não existir, NÃO criar automaticamente.
            // Apenas usuários pré-cadastrados podem logar.
            if (!user) {
                throw new UnauthorizedException('Sua conta não possui permissão de acesso. Por favor, solicite o cadastro ao administrador.');
            }

            if (!user.isActive) {
                throw new UnauthorizedException('Usuário inativo. Entre em contato com o administrador.');
            }

            const jwtPayload = {
                email: user.email,
                sub: user.id,
                roles: user.roles.map((r) => r.role),
                name: user.profile?.fullName || user.email.split('@')[0]
            };

            return {
                access_token: this.jwtService.sign(jwtPayload),
                user: {
                    id: user.id,
                    email: user.email,
                    roles: user.roles.map((r) => r.role),
                    profile: user.profile,
                    isActive: user.isActive,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            console.error('Google Auth Error:', error);
            throw new UnauthorizedException('Falha na autenticação com o Google');
        }
    }
}
