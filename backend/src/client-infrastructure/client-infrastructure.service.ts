import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientInfrastructureDto } from './dto/create-client-infrastructure.dto';
import { UpdateClientInfrastructureDto } from './dto/update-client-infrastructure.dto';

@Injectable()
export class ClientInfrastructureService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateClientInfrastructureDto) {
    return this.prisma.clientInfrastructure.create({ data });
  }

  findByClient(clientId: string) {
    return this.prisma.clientInfrastructure.findMany({
      where: { clientId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.clientInfrastructure.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Registro de infraestrutura não encontrado');
    return item;
  }

  async update(id: string, data: UpdateClientInfrastructureDto) {
    await this.findOne(id);
    return this.prisma.clientInfrastructure.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.clientInfrastructure.delete({ where: { id } });
  }
}
