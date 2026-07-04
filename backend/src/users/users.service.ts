import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(data.password, salt);

        return this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });
    }

    async createWithProfile(data: CreateUserDto): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(data.password, salt);

        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                profile: {
                    create: {
                        fullName: data.fullName
                    }
                },
                roles: {
                    create: [{ role: data.role || 'seller' }]
                }
            },
            include: { profile: true, roles: true }
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            include: { profile: true, roles: true },
            orderBy: { email: 'asc' }
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { profile: true, roles: true },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { profile: true, roles: true },
        });
    }

    async update(id: string, data: UpdateUserDto) {
        const user = await this.findById(id);
        if (!user) throw new NotFoundException('Usuário não encontrado');

        const updateData: any = {};
        if (data.email) updateData.email = data.email;
        if (data.password) {
            const salt = await bcrypt.genSalt();
            updateData.password = await bcrypt.hash(data.password, salt);
        }

        // Handle profile
        if (data.fullName !== undefined || data.theme !== undefined) {
            const profileUpdate: any = {};
            if (data.fullName !== undefined) profileUpdate.fullName = data.fullName;
            if (data.theme !== undefined) profileUpdate.theme = data.theme;
            updateData.profile = {
                upsert: {
                    create: profileUpdate,
                    update: profileUpdate
                }
            };
        }

        // Handle role (single role)
        if (data.role) {
            await this.prisma.userRole.deleteMany({ where: { userId: id } });
            updateData.roles = {
                create: [{ role: data.role }]
            };
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData,
            include: { profile: true, roles: true }
        });
    }

    async toggleActive(id: string) {
        const user = await this.findById(id);
        if (!user) throw new NotFoundException('Usuário não encontrado');

        return this.prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            include: { profile: true, roles: true }
        });
    }

    async updateRole(id: string, role: string) {
        const user = await this.findById(id);
        if (!user) throw new NotFoundException('Usuário não encontrado');

        // Remove a(s) role(s) antigas do usuário e insere a nova
        await this.prisma.userRole.deleteMany({ where: { userId: id } });
        
        return this.prisma.user.update({
            where: { id },
            data: {
                roles: {
                    create: [{ role: role as any }]
                }
            },
            include: { profile: true, roles: true }
        });
    }

    async remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}
