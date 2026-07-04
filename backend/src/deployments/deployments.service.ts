import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeploymentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDeploymentDto, userId?: string) {
    const deployment = await this.prisma.deployment.create({
      data: {
        ...data,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        dataPrevisao: data.dataPrevisao ? new Date(data.dataPrevisao) : null,
      },
      include: { client: true },
    });

    if (userId) {
      await this.prisma.deploymentHistory.create({
        data: {
          deploymentId: deployment.id,
          userId,
          action: 'Criação',
          details: 'Implantação criada.',
          newStatus: deployment.status,
        },
      });
    }

    return deployment;
  }

  async findAll() {
    return this.prisma.deployment.findMany({
      include: {
        client: {
          select: { id: true, nomeFantasia: true, cnpj: true, driveLink: true },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, profile: { select: { fullName: true } } } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.deployment.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id },
      include: { 
        client: true,
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, profile: { select: { fullName: true } } } }
          }
        }
      },
    });
    if (!deployment) throw new NotFoundException('Implantação não encontrada');
    return deployment;
  }

  async update(id: string, updateData: UpdateDeploymentDto, userId?: string) {
    const deployment = await this.findOne(id);
    
    const updated = await this.prisma.deployment.update({
      where: { id },
      data: {
        ...updateData,
        dataInicio: updateData.dataInicio ? new Date(updateData.dataInicio) : undefined,
        dataPrevisao: updateData.dataPrevisao ? new Date(updateData.dataPrevisao) : undefined,
      },
      include: { client: true },
    });

    if (userId) {
      let details: string[] = [];
      if (deployment.status !== updated.status) {
        details.push(`Status alterado de ${deployment.status} para ${updated.status}`);
      }
      if (updateData.implantador && deployment.implantador !== updateData.implantador) {
        details.push(`Implantador alterado para ${updateData.implantador}`);
      }
      
      if (details.length > 0) {
        await this.prisma.deploymentHistory.create({
          data: {
            deploymentId: id,
            userId,
            action: 'Atualização',
            details: details.join(', '),
            oldStatus: deployment.status,
            newStatus: updated.status,
          },
        });
      }
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const deployment = await this.findOne(id);
    // Historico é apagado em cascata
    return this.prisma.deployment.delete({ where: { id } });
  }

  async addHistory(id: string, data: { action: string; details?: string }, userId?: string) {
    const deployment = await this.findOne(id);

    return this.prisma.deploymentHistory.create({
      data: {
        deploymentId: id,
        userId,
        action: data.action,
        details: data.details,
        newStatus: deployment.status,
      },
      include: {
        user: { select: { id: true, email: true, profile: { select: { fullName: true } } } }
      }
    });
  }
}
