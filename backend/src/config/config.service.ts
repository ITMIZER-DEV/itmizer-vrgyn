import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigService {
    constructor(private prisma: PrismaService) { }

    async getRequirements() {
        return this.prisma.infrastructureRequirement.findMany({
            where: { isActive: true },
        });
    }

    async getPeripherals() {
        return this.prisma.homologatedPeripheral.findMany({
            where: { isActive: true },
        });
    }
}
