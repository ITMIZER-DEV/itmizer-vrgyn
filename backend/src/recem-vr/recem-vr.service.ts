import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecemVrDto } from './dto/create-recem-vr.dto';
import { UpdatePlanejamentoDto } from './dto/update-planejamento.dto';
import { CreateAcompanhamentoDto } from './dto/create-acompanhamento.dto';
import { RecemVrStatus } from '@prisma/client';

const USER_SELECT = {
  select: {
    id: true,
    email: true,
    profile: { select: { fullName: true } },
  },
};

@Injectable()
export class RecemVrService {
  constructor(private prisma: PrismaService) {}

  // =========================================================
  // ETAPA 1: Criação da Solicitação (Time de Implantação)
  // =========================================================
  async create(data: CreateRecemVrDto, userId?: string) {
    const recemVr = await this.prisma.recemVr.create({
      data: {
        clientId: data.clientId,
        deploymentId: data.deploymentId,
        mv067: data.mv067,
        criticidade: data.criticidade ?? 'BAIXA',
        resumo: data.resumo,
        solicitanteId: userId,
      },
      include: {
        client: { select: { id: true, nomeFantasia: true, cnpj: true } },
        solicitante: USER_SELECT,
      },
    });

    await this.prisma.recemVrHistory.create({
      data: {
        recemVrId: recemVr.id,
        userId,
        action: 'Criação',
        details: `Recém VR criado. Criticidade: ${recemVr.criticidade}. Resumo: ${recemVr.resumo}`,
        newStatus: recemVr.status,
      },
    });

    return recemVr;
  }

  // =========================================================
  // LISTAGEM
  // =========================================================
  async findAll() {
    return this.prisma.recemVr.findMany({
      include: {
        client: { select: { id: true, nomeFantasia: true, cnpj: true } },
        solicitante: USER_SELECT,
        analista: USER_SELECT,
        acompanhamentos: {
          orderBy: { dataReuniao: 'desc' },
          take: 1,
        },
        _count: { select: { acompanhamentos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================================================
  // DETALHE
  // =========================================================
  async findOne(id: string) {
    const recemVr = await this.prisma.recemVr.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, nomeFantasia: true, cnpj: true, contatoNome: true, contatoEmail: true } },
        deployment: { select: { id: true, status: true } },
        solicitante: USER_SELECT,
        analista: USER_SELECT,
        acompanhamentos: {
          orderBy: { dataReuniao: 'desc' },
          include: { user: USER_SELECT },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: { user: USER_SELECT },
        },
      },
    });
    if (!recemVr) throw new NotFoundException('Recém VR não encontrado.');
    return recemVr;
  }

  // =========================================================
  // ETAPA 2: Atualização do Planejamento (Suporte)
  // =========================================================
  async updatePlanejamento(id: string, data: UpdatePlanejamentoDto, userId?: string) {
    const current = await this.findOne(id);

    const updated = await this.prisma.recemVr.update({
      where: { id },
      data: {
        status: data.status,
        analistaId: data.analistaId,
        criticidade: data.criticidade,
        mv067: data.mv067,
        dataPrimeiraReuniao: data.dataPrimeiraReuniao
          ? new Date(data.dataPrimeiraReuniao)
          : undefined,
        datasAcompanhamento: data.datasAcompanhamento
          ? data.datasAcompanhamento.map((d) => new Date(d))
          : undefined,
      },
      include: {
        client: { select: { id: true, nomeFantasia: true } },
        analista: USER_SELECT,
      },
    });

    // Registrar histórico de todas as mudanças
    const changes: string[] = [];
    if (data.status && current.status !== data.status) {
      changes.push(`Status: ${current.status} → ${data.status}`);
    }
    if (data.criticidade && current.criticidade !== data.criticidade) {
      changes.push(`Criticidade: ${current.criticidade} → ${data.criticidade}`);
    }
    if (data.mv067 !== undefined && current.mv067 !== data.mv067) {
      changes.push('Link MV067 (Termo de Encerramento) atualizado');
    }
    if (data.analistaId && current.analistaId !== data.analistaId) {
      changes.push('Analista responsável atualizado');
    }
    if (data.dataPrimeiraReuniao) {
      changes.push(`1ª Reunião definida: ${data.dataPrimeiraReuniao}`);
    }
    if (data.datasAcompanhamento) {
      changes.push(`${data.datasAcompanhamento.length} datas de acompanhamento atualizadas`);
    }

    if (changes.length > 0 && userId) {
      await this.prisma.recemVrHistory.create({
        data: {
          recemVrId: id,
          userId,
          action: 'Registro Atualizado',
          details: changes.join('; '),
          oldStatus: current.status,
          newStatus: updated.status,
        },
      });
    }

    return updated;
  }

  // =========================================================
  // ETAPA 3: Registrar Acompanhamento/Reunião
  // =========================================================
  async createAcompanhamento(id: string, data: CreateAcompanhamentoDto, userId?: string) {
    await this.findOne(id); // valida existência

    const acompanhamento = await this.prisma.recemVrAcompanhamento.create({
      data: {
        recemVrId: id,
        userId,
        dataReuniao: new Date(data.dataReuniao),
        ata: data.ata,
        observacao: data.observacao,
      },
      include: { user: USER_SELECT },
    });

    await this.prisma.recemVrHistory.create({
      data: {
        recemVrId: id,
        userId,
        action: 'Reunião Registrada',
        details: `Reunião em ${data.dataReuniao}${data.observacao ? ': ' + data.observacao : ''}`,
      },
    });

    return acompanhamento;
  }

  // =========================================================
  // HISTÓRICO
  // =========================================================
  async getHistory(id: string) {
    await this.findOne(id);
    return this.prisma.recemVrHistory.findMany({
      where: { recemVrId: id },
      orderBy: { createdAt: 'desc' },
      include: { user: USER_SELECT },
    });
  }

  // =========================================================
  // REMOVER ACOMPANHAMENTO
  // =========================================================
  async removeAcompanhamento(recemVrId: string, acompanhamentoId: string) {
    await this.findOne(recemVrId);
    return this.prisma.recemVrAcompanhamento.delete({ where: { id: acompanhamentoId } });
  }

  // =========================================================
  // [ADMIN] CANCELAR
  // =========================================================
  async cancelar(id: string, userId?: string) {
    const current = await this.findOne(id);

    const updated = await this.prisma.recemVr.update({
      where: { id },
      data: { status: 'CANCELADA' as any },
    });

    await this.prisma.recemVrHistory.create({
      data: {
        recemVrId: id,
        userId,
        action: 'Cancelado',
        details: 'Recém VR cancelado pelo administrador.',
        oldStatus: current.status,
        newStatus: 'CANCELADA',
      },
    });

    return updated;
  }

  // =========================================================
  // [ADMIN] EXCLUIR PERMANENTEMENTE
  // =========================================================
  async remove(id: string, userId?: string) {
    await this.findOne(id);
    // History e acompanhamentos são apagados em cascata
    return this.prisma.recemVr.delete({ where: { id } });
  }
}
