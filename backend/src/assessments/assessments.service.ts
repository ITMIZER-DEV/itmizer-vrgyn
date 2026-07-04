import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Injectable()
export class AssessmentsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createAssessmentDto: CreateAssessmentDto) {
        const { clientId, ...rest } = createAssessmentDto;
        return this.prisma.assessment.create({
            data: {
                userId,
                clientId, // Add clientId
                ...rest,
                history: {
                    create: {
                        userId,
                        action: 'Assessment criado',
                        details: null,
                    }
                }
            },
            include: { client: true },
        });
    }

    async findAll() {
        return this.prisma.assessment.findMany({
            select: {
                id: true,
                userId: true,
                companyName: true,
                cnpj: true,
                status: true,
                statusFinanceiro: true,
                porte: true,
                updatedAt: true,
                createdAt: true,
                clientId: true,
                client: true,
                data: true,
                validationResults: true
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const assessment = await this.prisma.assessment.findFirst({
            where: { id },
            include: { 
                client: true,
            },
        });
        if (!assessment) {
            throw new NotFoundException('Assessment não encontrado');
        }
        return assessment;
    }

    async update(id: string, userId: string, updateAssessmentDto: UpdateAssessmentDto) {
        const { history, client, ...cleanData } = updateAssessmentDto as any;

        // Busca registro puro para comparação (única query extra)
        const existing = await this.prisma.assessment.findFirst({ where: { id } });
        if (!existing) throw new NotFoundException('Assessment não encontrado');

        // Calcula diff: somente campos escalares que realmente mudaram
        const changes: Record<string, { de: any; para: any }> = {};
        for (const key of Object.keys(cleanData)) {
            if (key === 'data' || key === 'validationResults') continue; // campos grandes: não armazena diff
            const oldVal = (existing as any)?.[key];
            const newVal = cleanData[key];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changes[key] = { de: oldVal, para: newVal };
            }
        }

        const hasChanges = Object.keys(changes).length > 0;

        const updated = await this.prisma.assessment.update({
            where: { id },
            data: {
                ...cleanData,
                history: hasChanges ? {
                    create: {
                        userId,
                        action: 'Validação atualizada',
                        details: JSON.stringify(changes),
                    }
                } : undefined
            },
            include: { client: true },
        });

        // Sincroniza Migration apenas quando campos de migração realmente mudaram
        const migracaoChanged =
            cleanData.migracaoTipo !== existing.migracaoTipo ||
            JSON.stringify(cleanData.migracaoAcessos) !== JSON.stringify(existing.migracaoAcessos);

        if (migracaoChanged && cleanData.migracaoTipo && updated.clientId) {
            await this.syncMigrationData(updated);
        }

        return updated;
    }

    private async syncMigrationData(assessment: any) {
        // Check if migration already exists for this client
        const existingMigration = await this.prisma.migration.findFirst({
            where: {
                clientId: assessment.clientId,
                // Optionally check if it's linked to this assessment
            }
        });

        const migracaoAcessos = assessment.migracaoAcessos as any || {};
        const assessmentData = assessment.data as any || {};

        // Extract system information from assessment data
        const systemInfo = assessmentData.systems || {};
        const migracaoInfo = assessmentData.migracao || {};
        const migracaoAcessosData = migracaoInfo.acessos || {};

        const initialItems = existingMigration?.items as any;
        const existingItems = (!initialItems || Object.keys(initialItems).length === 0) ? {
            cadastroProduto: { migrar: false, tempoEstimado: '6 horas', observacoes: '' },
            mercadologico: { migrar: false, tempoEstimado: '2 horas', observacoes: '' },
            familiaProdutos: { migrar: false, tempoEstimado: '1 hora', observacoes: '' },
            produtoFornecedor: { migrar: false, tempoEstimado: '1 hora', observacoes: '' },
            balanca: { migrar: false, tempoEstimado: '1 hora', observacoes: '' },
            fornecedor: { migrar: false, tempoEstimado: '2 horas', observacoes: '' },
            clientePreferencial: { migrar: false, tempoEstimado: '2 horas', observacoes: '' },
            convenio: { migrar: false, tempoEstimado: '4 horas', observacoes: '' },
            cheque: { migrar: false, tempoEstimado: '4 horas', observacoes: '' },
            creditoRotativo: { migrar: false, tempoEstimado: '4 horas', observacoes: '' },
            contasPagar: { migrar: false, tempoEstimado: '4 horas', observacoes: '' },
            contasReceberFornecedor: { migrar: false, tempoEstimado: '4 horas', observacoes: '' },
            outrasDespesas: { migrar: false, tempoEstimado: '4 horas', observacoes: '' },
            historicoVendas: { migrar: false, tempoEstimado: '8 horas', observacoes: '' },
            mapaTributacao: { migrar: false, tempoEstimado: '2 horas', observacoes: '' },
        } : initialItems;

        const updateItemInfo = (key: string, val: boolean | undefined) => {
            const current = existingItems[key] || { migrar: false };
            return {
                ...current,
                migrar: val !== undefined ? val : current.migrar,
            };
        };

        const updatedItems = {
            ...existingItems,
            produtoPeriodo: assessment.migracaoProdutoPeriodo || migracaoInfo.produtoPeriodo || existingItems.produtoPeriodo || 1,
            vendasPeriodo: assessment.migracaoVendasPeriodo || migracaoInfo.vendasPeriodo || existingItems.vendasPeriodo || 1,

            cadastroProduto: updateItemInfo('cadastroProduto', migracaoInfo.produto?.cadastroProduto),
            mercadologico: updateItemInfo('mercadologico', migracaoInfo.produto?.mercadologico),
            familiaProdutos: updateItemInfo('familiaProdutos', migracaoInfo.produto?.familiaProdutos),
            produtoFornecedor: updateItemInfo('produtoFornecedor', migracaoInfo.produto?.produtoFornecedor),
            balanca: updateItemInfo('balanca', migracaoInfo.produto?.balanca),

            mapaTributacao: {
                ...updateItemInfo('mapaTributacao', migracaoInfo.fiscal?.mapaTributacao),
                empresaResponsavel: migracaoInfo.fiscal?.empresaResponsavelRevisao || existingItems.mapaTributacao?.empresaResponsavel || ''
            },

            fornecedor: updateItemInfo('fornecedor', migracaoInfo.fornecedorCliente?.cadastroFornecedor),
            clientePreferencial: updateItemInfo('clientePreferencial', migracaoInfo.fornecedorCliente?.cadastroClientePreferencial),
            convenio: updateItemInfo('convenio', migracaoInfo.fornecedorCliente?.cadastroConvenio),

            cheque: updateItemInfo('cheque', migracaoInfo.financeiro?.cheque),
            creditoRotativo: updateItemInfo('creditoRotativo', migracaoInfo.financeiro?.creditoRotativo),
            contasPagar: updateItemInfo('contasPagar', migracaoInfo.financeiro?.contasPagar),
            contasReceberFornecedor: updateItemInfo('contasReceberFornecedor', migracaoInfo.financeiro?.contasReceber),
            outrasDespesas: updateItemInfo('outrasDespesas', migracaoInfo.financeiro?.outrasDespesas),
        };

        let tipoMigracaoAss = assessment.migracaoTipo || migracaoInfo.tipo || 'padrao';
        if (tipoMigracaoAss === 'padrao_bd') tipoMigracaoAss = 'padrao';
        if (tipoMigracaoAss === 'planilhas') tipoMigracaoAss = 'planilha';

        const toDate = (val: any) => val ? new Date(String(val).split('T')[0] + 'T12:00:00.000Z') : null;

        const migrationData = {
            clientId: assessment.clientId,
            tipoMigracao: tipoMigracaoAss,

            // Contact and Access Information - Priority: top-level > migracao.acessos > systems
            nomeContatoChave: migracaoAcessos.nomeContatoChave || migracaoAcessosData.nomeContatoChave || null,
            telefone: migracaoAcessos.telefone || migracaoAcessosData.telefone || null,
            acessoAnydesk: migracaoAcessos.acessoAnydesk || migracaoAcessosData.acessoAnydesk || null,
            senhaAnydesk: migracaoAcessos.senhaAnydesk || migracaoAcessosData.senhaAnydesk || null,

            // System Information - Priority: migracao.acessos > systems > top-level
            nomeSistema: migracaoAcessosData.nomeSistema || systemInfo.sistemaPdvAtual || null,
            nomeSoftwareHouse: migracaoAcessosData.nomeSoftwareHouse || null,
            tipoBancoDados: migracaoAcessosData.tipoBancoDados || systemInfo.bancoTipo || null,

            // Migration Items
            items: updatedItems,

            // Keep existing observations without stacking redundant notes
            observacoes: existingMigration?.observacoes || migracaoInfo.financeiro?.observacao || '',

            // Datas de virada — somente atualiza se vierem preenchidas na assessment
            ...(migracaoInfo.dataPrevistaVirada && {
                dataPrevistaVirada: toDate(migracaoInfo.dataPrevistaVirada),
            }),
            ...(migracaoInfo.dataViradaSistema && {
                dataViradaSistema: toDate(migracaoInfo.dataViradaSistema),
            }),
        };

        if (existingMigration) {
            // Update existing migration
            await this.prisma.migration.update({
                where: { id: existingMigration.id },
                data: migrationData,
            });

            // Add history entry for the update
            await this.prisma.migrationHistory.create({
                data: {
                    migrationId: existingMigration.id,
                    userId: assessment.userId,
                    action: 'Atualização via Validação',
                    details: `Dados sincronizados automaticamente a partir da validação ${assessment.id}`,
                    oldStatus: existingMigration.status,
                    newStatus: existingMigration.status,
                },
            });
        } else {
            // Create new migration
            const newMigration = await this.prisma.migration.create({
                data: {
                    ...migrationData,
                    status: 'pendente',
                },
            });

            // Add history entry for creation
            await this.prisma.migrationHistory.create({
                data: {
                    migrationId: newMigration.id,
                    userId: assessment.userId,
                    action: 'Criação automática',
                    details: `Migração criada automaticamente a partir da validação ${assessment.id}`,
                    newStatus: 'pendente',
                },
            });
        }
    }

    async remove(id: string, userId: string) {
        await this.findOne(id); // Verify existence
        return this.prisma.assessment.delete({
            where: { id },
        });
    }

    private parseNumber(val: any): number {
        if (typeof val === 'number') return val;
        if (!val || typeof val !== 'string') return 0;
        const match = val.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    async toggleRelease(id: string, userId: string, itemId: string, field: string, userName: string) {
        const assessment = await this.findOne(id);
        const data = assessment.data as any;

        if (!data.approvals) {
            data.approvals = {};
        }

        const key = `${itemId}-${field}`;

        if (data.approvals[key]) {
            delete data.approvals[key];
        } else {
            data.approvals[key] = {
                user: userName,
                date: new Date().toISOString()
            };
        }

        return this.prisma.assessment.update({
            where: { id },
            data: { data }
        });
    }

    async validateAssessment(id: string, userId: string) {
        const assessment = await this.findOne(id);
        const data = assessment.data as any;
        const approvals = data.approvals || {};

        // Fetch all requirements
        const [serverReqs, terminalReqs, internetReqs] = await Promise.all([
            this.prisma.serverRequirement.findMany(),
            this.prisma.terminalRequirement.findMany(),
            this.prisma.internetRequirement.findMany(),
        ]);

        const pdvCount = data.pdvs?.length || 0;
        const results = {
            servers: [] as any[],
            terminals: [] as any[],
            internet: [] as any[],
            summary: {
                totalIssues: 0,
                status: 'ok'
            }
        };

        const mandatoryRoles = [
            { id: 'database', label: 'Banco de Dados', search: ['banco', 'database'] },
            { id: 'application', label: 'Aplicação', search: ['aplicativo', 'aplicacao', 'application'] },
            { id: 'service_manager', label: 'Service Manager', search: ['service manager', 'servico'] }
        ];

        // 1. Validate ALL Registered Servers
        const currentServers = data.servers || [];
        const checkedTypes = new Set<string>();

        for (const server of currentServers) {
            checkedTypes.add(server.tipo);

            // Find matching requirement based on role and PDV range
            const mandatoryRole = mandatoryRoles.find(m => m.id === server.tipo);
            const searchTerms = mandatoryRole ? mandatoryRole.search : [server.tipo.toLowerCase().replace('_', ' ')];

            const requirement = serverReqs.find(r => {
                const roleLower = r.role.toLowerCase();
                return searchTerms.some(term => roleLower.includes(term)) &&
                    pdvCount >= r.qntPdvsMin &&
                    pdvCount <= r.qntPdvsMax;
            });

            if (requirement) {
                const cpuCurrent = this.parseNumber(server.processador);
                const ramCurrent = this.parseNumber(server.memoriaRam);
                const storageCurrent = this.parseNumber(server.discoTotal);

                let cpuStatus = cpuCurrent >= (requirement.cpuCores || 0) ? 'ok' : 'error';
                let ramStatus = ramCurrent >= requirement.ramGb ? 'ok' : 'error';
                let storageStatus = storageCurrent >= requirement.storageGb ? 'ok' : 'error';

                // Apply manual approvals
                const cpuApproval = approvals[`${server.id}-cpu`];
                const ramApproval = approvals[`${server.id}-ram`];
                const storageApproval = approvals[`${server.id}-storage`];

                if (cpuApproval) cpuStatus = 'ok';
                if (ramApproval) ramStatus = 'ok';
                if (storageApproval) storageStatus = 'ok';

                if (cpuStatus === 'error' || ramStatus === 'error' || storageStatus === 'error') {
                    results.summary.totalIssues++;
                }

                results.servers.push({
                    id: server.id,
                    tipo: server.tipo,
                    label: mandatoryRole?.label || server.tipo.toUpperCase(),
                    status: 'present',
                    current: {
                        cpu: cpuCurrent,
                        processor: server.processador, // Raw string
                        ram: ramCurrent,
                        storage: storageCurrent,
                        os: server.sistemaOperacional // Registered OS
                    },
                    required: { cpu: requirement.cpuCores, processor: requirement.cpuModel, ram: requirement.ramGb, storage: requirement.storageGb, os: requirement.recommendedOs },
                    comparison: { cpu: cpuStatus, ram: ramStatus, storage: storageStatus },
                    approvals: { cpu: cpuApproval, ram: ramApproval, storage: storageApproval }
                });
            } else if (mandatoryRole) {
                // Listed even if requirement not found
                results.servers.push({
                    id: server.id,
                    tipo: server.tipo,
                    label: mandatoryRole.label,
                    status: 'present',
                    current: {
                        cpu: this.parseNumber(server.processador),
                        processor: server.processador,
                        ram: this.parseNumber(server.memoriaRam),
                        storage: this.parseNumber(server.discoTotal),
                        os: server.sistemaOperacional
                    },
                    required: { cpu: 0, processor: 'N/A', ram: 0, storage: 0, os: 'N/A' },
                    comparison: { cpu: 'warning', ram: 'warning', storage: 'warning' }
                });
            }
        }

        // 2. Identify Missing Mandatory Servers
        for (const role of mandatoryRoles) {
            if (!checkedTypes.has(role.id)) {
                results.summary.totalIssues++;
                const requirement = serverReqs.find(r => {
                    const roleLower = r.role.toLowerCase();
                    return role.search.some(term => roleLower.includes(term)) &&
                        pdvCount >= r.qntPdvsMin &&
                        pdvCount <= r.qntPdvsMax;
                });

                results.servers.push({
                    tipo: role.id,
                    status: 'missing',
                    label: role.label,
                    required: requirement ?
                        { cpu: requirement.cpuCores, processor: requirement.cpuModel, ram: requirement.ramGb, storage: requirement.storageGb, os: requirement.recommendedOs } :
                        { cpu: 0, processor: 'N/A', ram: 0, storage: 0, os: 'N/A' }
                });
            }
        }

        // 3. Validate Terminals (PDVs and Retaguarda)
        if (data.pdvs && Array.isArray(data.pdvs)) {
            const pdvRequirement = terminalReqs.find(r => r.terminalType === 'PDV');
            if (pdvRequirement) {
                for (const pdv of data.pdvs) {
                    const ramCurrent = this.parseNumber(pdv.memoriaRam);
                    let ramStatus = ramCurrent >= pdvRequirement.ramGb ? 'ok' : 'error';
                    const storageCurrent = this.parseNumber(pdv.disco);
                    let storageStatus = (pdvRequirement.storageGb && storageCurrent < pdvRequirement.storageGb) ? 'error' : 'ok';

                    // Processor comparison (relaxed match)
                    const cpuCurrentStr = (pdv.processador || '').toLowerCase();
                    let cpuStatus = (cpuCurrentStr.includes('i3') || cpuCurrentStr.includes('i5') || cpuCurrentStr.includes('i7') || cpuCurrentStr.includes('i9')) ? 'ok' : 'warning';

                    // OS comparison
                    const osCurrentStr = (pdv.sistemaOperacional || '').toLowerCase();
                    let osStatus = osCurrentStr.includes('windows') ? 'ok' : 'warning';

                    // Apply manual approvals
                    const ramApproval = approvals[`${pdv.id}-ram`];
                    const storageApproval = approvals[`${pdv.id}-storage`];
                    const cpuApproval = approvals[`${pdv.id}-cpu`];
                    const osApproval = approvals[`${pdv.id}-os`];

                    if (ramApproval) ramStatus = 'ok';
                    if (storageApproval) storageStatus = 'ok';
                    if (cpuApproval) cpuStatus = 'ok';
                    if (osApproval) osStatus = 'ok';

                    // Consider quantity for issue counting (if one config has error, count all instances)
                    const quantidade = pdv.quantidade || 1;
                    if (ramStatus === 'error' || storageStatus === 'error') {
                        results.summary.totalIssues += quantidade;
                    }

                    results.terminals.push({
                        id: pdv.id,
                        tipo: 'PDV',
                        quantidade: quantidade,
                        current: { ram: ramCurrent, cpu: pdv.processador, storage: storageCurrent, os: pdv.sistemaOperacional },
                        required: { ram: pdvRequirement.ramGb, cpu: pdvRequirement.cpuModel, storage: pdvRequirement.storageGb, os: pdvRequirement.os },
                        status: { ram: ramStatus, cpu: cpuStatus, storage: storageStatus, os: osStatus },
                        approvals: { ram: ramApproval, storage: storageApproval, cpu: cpuApproval, os: osApproval }
                    });
                }
            }
        }

        if (data.backoffice && Array.isArray(data.backoffice)) {
            const backRequirement = terminalReqs.find(r => r.terminalType === 'Retaguarda');
            if (backRequirement) {
                for (const back of data.backoffice) {
                    const ramCurrent = this.parseNumber(back.memoriaRam);
                    let ramStatus = ramCurrent >= backRequirement.ramGb ? 'ok' : 'error';
                    const storageCurrent = this.parseNumber(back.disco);
                    let storageStatus = (backRequirement.storageGb && storageCurrent < backRequirement.storageGb) ? 'error' : 'ok';

                    const cpuCurrentStr = (back.processador || '').toLowerCase();
                    let cpuStatus = (cpuCurrentStr.includes('i3') || cpuCurrentStr.includes('i5') || cpuCurrentStr.includes('i7') || cpuCurrentStr.includes('i9')) ? 'ok' : 'warning';

                    const osCurrentStr = (back.sistemaOperacional || '').toLowerCase();
                    let osStatus = osCurrentStr.includes('windows') ? 'ok' : 'warning';

                    // Apply manual approvals
                    const ramApproval = approvals[`${back.id}-ram`];
                    const storageApproval = approvals[`${back.id}-storage`];
                    const cpuApproval = approvals[`${back.id}-cpu`];
                    const osApproval = approvals[`${back.id}-os`];

                    if (ramApproval) ramStatus = 'ok';
                    if (storageApproval) storageStatus = 'ok';
                    if (cpuApproval) cpuStatus = 'ok';
                    if (osApproval) osStatus = 'ok';

                    // Consider quantity for issue counting (if one config has error, count all instances)
                    const quantidade = back.quantidade || 1;
                    if (ramStatus === 'error' || storageStatus === 'error') {
                        results.summary.totalIssues += quantidade;
                    }

                    results.terminals.push({
                        id: back.id,
                        tipo: 'Retaguarda',
                        funcao: back.funcao,
                        quantidade: quantidade,
                        current: { ram: ramCurrent, cpu: back.processador, storage: storageCurrent, os: back.sistemaOperacional },
                        required: { ram: backRequirement.ramGb, cpu: backRequirement.cpuModel, storage: backRequirement.storageGb, os: backRequirement.os },
                        status: { ram: ramStatus, cpu: cpuStatus, storage: storageStatus, os: osStatus },
                        approvals: { ram: ramApproval, storage: storageApproval, cpu: cpuApproval, os: osApproval }
                    });
                }
            }
        }

        // 4. Validate Internet
        if (data.network?.links && data.network.links.length > 0) {
            for (const link of data.network.links) {
                const currentSpeed = parseInt(link.velocidade) || 0;
                // Match requirement based on link type if possible, otherwise take default
                const requirement = internetReqs.find(r =>
                    link.provedor?.toLowerCase().includes(r.linkType.toLowerCase())
                ) || internetReqs[0];

                if (requirement) {
                    const status = currentSpeed >= requirement.downloadMb ? 'ok' : 'warning';
                    if (status === 'warning') results.summary.totalIssues++;
                    results.internet.push({
                        provedor: link.provedor,
                        current: currentSpeed,
                        required: requirement.downloadMb,
                        status
                    });
                }
            }
        }

        results.summary.status = results.summary.totalIssues === 0 ? 'ok' : (results.summary.totalIssues > 3 ? 'error' : 'warning');

        return results;
    }

    async getHistory(id: string) {
        return this.prisma.assessmentHistory.findMany({
            where: { assessmentId: id },
            include: { user: { select: { email: true, profile: { select: { fullName: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
    }
}
