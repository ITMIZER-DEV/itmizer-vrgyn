import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriticalCaseDto } from './dto/create-critical-case.dto';
import { UpdateCriticalCaseDto } from './dto/update-critical-case.dto';
import { CreateAcompanhamentoDto } from './dto/create-acompanhamento.dto';
import { CriticalCaseCategory, CriticalCaseStatus, Prisma } from '@prisma/client';

const ACOMPANHAMENTO_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          fullName: true,
        },
      },
    },
  },
};

@Injectable()
export class CriticalCasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCriticalCaseDto, currentUserId?: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.criticalCase.create({
      data: {
        clientId: dto.clientId,
        categories: dto.categories || [],
        participantes: dto.participantes,
        observacoes: dto.observacoes,
        proximosPassos: dto.proximosPassos,
        status: dto.status || CriticalCaseStatus.ABERTO,
        responsavelId: dto.responsavelId || currentUserId,
      },
      include: {
        client: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            cnpj: true,
            driveLink: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        acompanhamentos: {
          orderBy: { createdAt: 'desc' },
          include: ACOMPANHAMENTO_INCLUDE,
        },
      },
    });
  }

  async findAll(params?: {
    clientId?: string;
    status?: CriticalCaseStatus;
    category?: CriticalCaseCategory;
    search?: string;
  }) {
    const where: Prisma.CriticalCaseWhereInput = {};

    if (params?.clientId) {
      where.clientId = params.clientId;
    }

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.category) {
      where.categories = {
        has: params.category,
      };
    }

    if (params?.search) {
      const search = params.search;
      where.OR = [
        { client: { nomeFantasia: { contains: search, mode: 'insensitive' } } },
        { client: { cnpj: { contains: search } } },
        { participantes: { contains: search, mode: 'insensitive' } },
        { observacoes: { contains: search, mode: 'insensitive' } },
        { proximosPassos: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.criticalCase.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            cnpj: true,
            driveLink: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        acompanhamentos: {
          orderBy: { createdAt: 'desc' },
          include: ACOMPANHAMENTO_INCLUDE,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByClient(clientId: string) {
    return this.findAll({ clientId });
  }

  async findOne(id: string) {
    const item = await this.prisma.criticalCase.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            cnpj: true,
            driveLink: true,
            credentials: {
              where: { isActive: true },
              select: {
                id: true,
                type: true,
                label: true,
                username: true,
                responsavelNome: true,
                responsavelTelefone: true,
                responsavelEmail: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        },
        responsavel: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        acompanhamentos: {
          orderBy: { createdAt: 'desc' },
          include: ACOMPANHAMENTO_INCLUDE,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Caso crítico não encontrado.');
    }

    return item;
  }

  async update(id: string, dto: UpdateCriticalCaseDto) {
    await this.findOne(id);

    return this.prisma.criticalCase.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        categories: dto.categories,
        participantes: dto.participantes,
        observacoes: dto.observacoes,
        proximosPassos: dto.proximosPassos,
        status: dto.status,
        responsavelId: dto.responsavelId,
      },
      include: {
        client: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            cnpj: true,
            driveLink: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        acompanhamentos: {
          orderBy: { createdAt: 'desc' },
          include: ACOMPANHAMENTO_INCLUDE,
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.criticalCase.delete({
      where: { id },
    });
  }

  // === EVOLUÇÃO E ACOMPANHAMENTOS ===

  async addAcompanhamento(criticalCaseId: string, dto: CreateAcompanhamentoDto, userId?: string) {
    const criticalCase = await this.findOne(criticalCaseId);

    const acompanhamento = await this.prisma.criticalCaseAcompanhamento.create({
      data: {
        criticalCaseId,
        userId,
        data: dto.data ? new Date(dto.data) : new Date(),
        tipo: dto.tipo || 'ACOMPANHAMENTO',
        descricao: dto.descricao,
        proximosPassos: dto.proximosPassos,
        statusNovo: dto.statusNovo,
      },
      include: ACOMPANHAMENTO_INCLUDE,
    });

    // Se a evolução definiu um novo status para o caso, atualiza o caso crítico
    if (dto.statusNovo && dto.statusNovo !== criticalCase.status) {
      await this.prisma.criticalCase.update({
        where: { id: criticalCaseId },
        data: { status: dto.statusNovo },
      });
    }

    return acompanhamento;
  }

  async getAcompanhamentos(criticalCaseId: string) {
    await this.findOne(criticalCaseId);
    return this.prisma.criticalCaseAcompanhamento.findMany({
      where: { criticalCaseId },
      orderBy: { createdAt: 'desc' },
      include: ACOMPANHAMENTO_INCLUDE,
    });
  }

  async deleteAcompanhamento(acompanhamentoId: string) {
    return this.prisma.criticalCaseAcompanhamento.delete({
      where: { id: acompanhamentoId },
    });
  }
}
