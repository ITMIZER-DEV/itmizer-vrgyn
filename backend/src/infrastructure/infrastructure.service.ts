import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InfrastructureService {
    constructor(private prisma: PrismaService) { }

    async findAllServers() {
        return this.prisma.serverRequirement.findMany({
            orderBy: { role: 'asc' },
        });
    }

    async findAllTerminals() {
        return this.prisma.terminalRequirement.findMany({
            orderBy: { terminalType: 'asc' },
        });
    }

    async findAllInternet() {
        return this.prisma.internetRequirement.findMany({
            orderBy: { linkType: 'asc' },
        });
    }

    async updateServer(id: string, data: any) {
        return this.prisma.serverRequirement.update({
            where: { id },
            data,
        });
    }

    async updateTerminal(id: string, data: any) {
        return this.prisma.terminalRequirement.update({
            where: { id },
            data,
        });
    }

    async updateInternet(id: string, data: any) {
        return this.prisma.internetRequirement.update({
            where: { id },
            data,
        });
    }
}
