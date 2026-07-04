import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createClientDto: CreateClientDto) {
        const { assessments, history, ...cleanData } = createClientDto as any;
        return this.prisma.client.create({
            data: {
                ...cleanData,
                history: {
                    create: {
                        userId,
                        action: 'Cliente cadastrado',
                    }
                }
            },
        });
    }

    async findAll() {
        return this.prisma.client.findMany({
            orderBy: { nomeFantasia: 'asc' },
        });
    }

    async search(query: string) {
        return this.prisma.client.findMany({
            where: {
                OR: [
                    { nomeFantasia: { contains: query, mode: 'insensitive' } },
                    { cnpj: { contains: query, mode: 'insensitive' } },
                ]
            },
            select: { id: true, nomeFantasia: true, cnpj: true },
            take: 20, // Limitar resultados para performance
        });
    }

    async findOne(id: string) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                assessments: true,
                history: {
                    include: { user: { select: { email: true, profile: { select: { fullName: true } } } } },
                    orderBy: { createdAt: 'desc' },
                }
            },
        });
        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }
        return client;
    }

    async update(id: string, userId: string, updateClientDto: UpdateClientDto) {
        const existing = await this.prisma.client.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Cliente não encontrado');
        }
        const { assessments, history, id: _id, createdAt, updatedAt, ...cleanData } = updateClientDto as any;

        // Calcula diff: somente campos que realmente mudaram
        const changes: Record<string, { de: any; para: any }> = {};
        for (const key of Object.keys(cleanData)) {
            const oldVal = (existing as any)[key];
            const newVal = cleanData[key];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changes[key] = { de: oldVal, para: newVal };
            }
        }

        const hasChanges = Object.keys(changes).length > 0;

        return this.prisma.client.update({
            where: { id },
            data: {
                ...cleanData,
                history: hasChanges ? {
                    create: {
                        userId,
                        action: 'Cliente atualizado',
                        details: JSON.stringify(changes),
                    }
                } : undefined
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.client.delete({
            where: { id },
        });
    }
}
