import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMigrationDto } from './dto/create-migration.dto';
import { UpdateMigrationDto } from './dto/update-migration.dto';
import { CreateHistoryDto } from './dto/create-history.dto';

@Injectable()
export class MigrationService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.migration.findMany({
            include: {
                client: true,
                responsavel: { include: { profile: true } },
                lancamentos: true,
                _count: { select: { history: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findByClient(clientId: string) {
        return this.prisma.migration.findMany({
            where: { clientId },
            include: {
                client: true,
                responsavel: { include: { profile: true } },
                lancamentos: true,
                _count: { select: { history: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const migration = await this.prisma.migration.findUnique({
            where: { id },
            include: {
                client: true,
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
                lancamentos: {
                    include: {
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
                    },
                    orderBy: { data: 'desc' },
                },
            },
        });
        if (!migration) throw new NotFoundException('Migração não encontrada');
        return migration;
    }

    async create(data: CreateMigrationDto, userId?: string) {
        const migration = await this.prisma.migration.create({
            data: {
                clientId: data.clientId,
                tipoMigracao: data.tipoMigracao || 'padrao',
                responsavelId: data.responsavelId,
                tipoCobranca: data.tipoCobranca || 'hora',
                valorHora: data.valorHora,
                valorFixo: data.valorFixo,
                nomeContatoChave: data.nomeContatoChave,
                telefone: data.telefone,
                acessoAnydesk: data.acessoAnydesk,
                senhaAnydesk: data.senhaAnydesk,
                nomeSistema: data.nomeSistema,
                nomeSoftwareHouse: data.nomeSoftwareHouse,
                tipoBancoDados: data.tipoBancoDados,
                items: data.items || {},
                observacoes: data.observacoes,
                dataPrevistaVirada: data.dataPrevistaVirada ? new Date(data.dataPrevistaVirada.split('T')[0] + 'T12:00:00.000Z') : undefined,
                dataViradaSistema: data.dataViradaSistema ? new Date(data.dataViradaSistema.split('T')[0] + 'T12:00:00.000Z') : undefined,
                history: {
                    create: {
                        action: 'Migração criada',
                        details: 'Migração de dados iniciada',
                        userId,
                    },
                },
            },
            include: { client: true, history: true, responsavel: { include: { profile: true } } },
        });
        return migration;
    }

    async update(id: string, data: UpdateMigrationDto, userId?: string) {
        const existing = await this.findOne(id);

        // Campos a comparar para diff
        const fieldsToCompare = [
            'tipoMigracao', 'responsavelId', 'tipoCobranca', 'valorHora', 'valorFixo',
            'nomeContatoChave', 'telefone', 'acessoAnydesk', 'senhaAnydesk',
            'nomeSistema', 'nomeSoftwareHouse', 'tipoBancoDados', 'items',
            'observacoes', 'statusFinanceiro', 'status',
            'dataPrevistaVirada', 'dataViradaSistema',
        ];

        const changes: Record<string, { de: any; para: any }> = {};
        for (const key of fieldsToCompare) {
            if ((data as any)[key] !== undefined) {
                const oldVal = (existing as any)[key];
                const newVal = (data as any)[key];

                // Skip large JSON objects to avoid history bloat
                if (key === 'items') {
                    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                        changes[key] = { de: '(Itens atualizados)', para: '(Novos itens salvos)' };
                    }
                    continue;
                }

                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    changes[key] = { de: oldVal, para: newVal };
                }
            }
        }

        const hasChanges = Object.keys(changes).length > 0;

        // Monta action legível
        let action = 'Dados atualizados';
        if (changes.status) {
            action = `Status alterado de "${changes.status.de}" para "${changes.status.para}"`;
        }

        return this.prisma.migration.update({
            where: { id },
            data: {
                ...(data.tipoMigracao !== undefined && { tipoMigracao: data.tipoMigracao as any }),
                ...(data.responsavelId !== undefined && { responsavelId: data.responsavelId || null }),
                ...(data.tipoCobranca !== undefined && { tipoCobranca: data.tipoCobranca as any }),
                ...(data.valorHora !== undefined && { valorHora: data.valorHora }),
                ...(data.valorFixo !== undefined && { valorFixo: data.valorFixo }),
                ...(data.nomeContatoChave !== undefined && { nomeContatoChave: data.nomeContatoChave }),
                ...(data.telefone !== undefined && { telefone: data.telefone }),
                ...(data.acessoAnydesk !== undefined && { acessoAnydesk: data.acessoAnydesk }),
                ...(data.senhaAnydesk !== undefined && { senhaAnydesk: data.senhaAnydesk }),
                ...(data.nomeSistema !== undefined && { nomeSistema: data.nomeSistema }),
                ...(data.nomeSoftwareHouse !== undefined && { nomeSoftwareHouse: data.nomeSoftwareHouse }),
                ...(data.tipoBancoDados !== undefined && { tipoBancoDados: data.tipoBancoDados }),
                ...(data.items !== undefined && { items: data.items }),
                ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
                ...(data.statusFinanceiro !== undefined && { statusFinanceiro: data.statusFinanceiro }),
                ...(data.status !== undefined && { status: data.status as any }),
                ...(data.dataPrevistaVirada !== undefined && { dataPrevistaVirada: data.dataPrevistaVirada ? new Date(data.dataPrevistaVirada.split('T')[0] + 'T12:00:00.000Z') : null }),
                ...(data.dataViradaSistema !== undefined && { dataViradaSistema: data.dataViradaSistema ? new Date(data.dataViradaSistema.split('T')[0] + 'T12:00:00.000Z') : null }),
                ...(hasChanges && {
                    history: {
                        create: {
                            action,
                            details: JSON.stringify(changes),
                            oldStatus: changes.status?.de,
                            newStatus: changes.status?.para,
                            userId,
                        },
                    },
                }),
            },
            include: { client: true, responsavel: { include: { profile: true } } },
        });
    }

    async addHistory(migrationId: string, data: CreateHistoryDto, userId?: string) {
        await this.findOne(migrationId);
        return this.prisma.migrationHistory.create({
            data: {
                migrationId,
                action: data.action,
                details: data.details,
                userId,
            },
        });
    }

    async getHistory(id: string) {
        return this.prisma.migrationHistory.findMany({
            where: { migrationId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { fullName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async addLancamento(migrationId: string, data: any, userId: string) {
        await this.findOne(migrationId);
        return this.prisma.migrationLancamento.create({
            data: {
                migrationId,
                userId,
                data: data.data ? new Date(data.data) : new Date(),
                horas: data.horas,
                valor: data.valor,
                descricao: data.descricao,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { fullName: true } },
                    },
                },
            },
        });
    }


    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.migration.delete({ where: { id } });
    }

    async chargeback(id: string, userId: string, reason: string, adminName: string) {
        await this.findOne(id);

        // 1. Atualizar status financeiro para pendente
        const migration = await this.prisma.migration.update({
            where: { id },
            data: { statusFinanceiro: 'pendente' },
        });

        // 2. Registrar no histórico financeiro (Lançamentos)
        await this.prisma.migrationLancamento.create({
            data: {
                migrationId: id,
                userId,
                data: new Date(),
                horas: 0,
                valor: 0,
                descricao: `ESTORNO DE PAGAMENTO - Motivo: ${reason} - Autor: ${adminName || 'Admin'}`,
            },
        });

        return migration;
    }
}
