"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));
const fileArg = args.find((a) => a.startsWith('--file='));
const customUrl = urlArg ? urlArg.split('=')[1] : process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new client_1.PrismaClient({
    datasources: customUrl
        ? {
            db: {
                url: customUrl,
            },
        }
        : undefined,
});
async function runRestore() {
    console.log('====================================================');
    console.log('📥 ITMIZER-VR: Ferramenta de Restore de Banco de Dados');
    console.log('====================================================');
    console.log(`Conectando em: ${customUrl ? customUrl.replace(/:[^:@]+@/, ':****@') : 'URL padrão do ambiente'}`);
    // Detectar diretório de backups de forma flexível (Local ou Docker Container)
    const possibleDirs = [
        path.resolve(process.cwd(), 'backups'),
        path.resolve(__dirname, '../backups'),
        path.resolve(__dirname, '../../backups'),
        '/app/backups',
    ];
    const backupDir = possibleDirs.find((d) => fs.existsSync(d)) || possibleDirs[0];
    let targetFilePath = '';
    if (fileArg) {
        const rawPath = fileArg.split('=')[1];
        if (fs.existsSync(rawPath)) {
            targetFilePath = path.resolve(rawPath);
        }
        else if (fs.existsSync(path.resolve(process.cwd(), rawPath))) {
            targetFilePath = path.resolve(process.cwd(), rawPath);
        }
        else if (fs.existsSync(path.join(backupDir, path.basename(rawPath)))) {
            targetFilePath = path.join(backupDir, path.basename(rawPath));
        }
        else {
            targetFilePath = path.resolve(process.cwd(), rawPath);
        }
    }
    else {
        if (!fs.existsSync(backupDir)) {
            console.error(`❌ Diretório de backups não encontrado! (verificados: ${possibleDirs.join(', ')})`);
            process.exit(1);
        }
        const files = fs
            .readdirSync(backupDir)
            .filter((f) => f.endsWith('.json'))
            .sort()
            .reverse();
        if (files.length === 0) {
            console.error(`❌ Nenhum arquivo de backup encontrado em ${backupDir} !`);
            process.exit(1);
        }
        targetFilePath = path.join(backupDir, files[0]);
    }
    if (!fs.existsSync(targetFilePath)) {
        console.error(`❌ Arquivo de backup não existe: ${targetFilePath}`);
        process.exit(1);
    }
    console.log(`\nLendo dados de: ${targetFilePath}`);
    const fileContent = fs.readFileSync(targetFilePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    const data = parsed.data || parsed; // Compatibilidade caso seja dump antigo
    const startTime = Date.now();
    let restoredCount = 0;
    try {
        console.log('\nIniciando restauração sequencial (ordem de integridade referencial)...');
        // 1. Users
        if (data.users?.length) {
            console.log(`  Restaurando ${data.users.length} usuários...`);
            for (const u of data.users) {
                await prisma.user.upsert({
                    where: { id: u.id },
                    update: {},
                    create: {
                        id: u.id,
                        email: u.email,
                        password: u.password,
                        googleId: u.googleId || u.google_id || null,
                        isActive: u.isActive !== undefined ? u.isActive : u.is_active,
                        createdAt: new Date(u.createdAt || u.created_at),
                        updatedAt: new Date(u.updatedAt || u.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        // 2. Profiles
        if (data.profiles?.length) {
            console.log(`  Restaurando ${data.profiles.length} perfis...`);
            for (const p of data.profiles) {
                await prisma.profile.upsert({
                    where: { id: p.id },
                    update: {},
                    create: {
                        id: p.id,
                        fullName: p.fullName || p.full_name,
                        email: p.email,
                        theme: p.theme || 'light',
                        createdAt: new Date(p.createdAt || p.created_at),
                        updatedAt: new Date(p.updatedAt || p.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        // 3. User Roles
        if (data.user_roles?.length) {
            console.log(`  Restaurando ${data.user_roles.length} permissões/roles de usuários...`);
            for (const r of data.user_roles) {
                await prisma.userRole.upsert({
                    where: { id: r.id },
                    update: {},
                    create: {
                        id: r.id,
                        userId: r.userId || r.user_id,
                        role: r.role,
                        createdAt: new Date(r.createdAt || r.created_at),
                    },
                });
                restoredCount++;
            }
        }
        // 4. Clients
        if (data.clients?.length) {
            console.log(`  Restaurando ${data.clients.length} clientes...`);
            for (const c of data.clients) {
                await prisma.client.upsert({
                    where: { id: c.id },
                    update: {},
                    create: {
                        id: c.id,
                        nomeFantasia: c.nomeFantasia || c.nome_fantasia,
                        razaoSocial: c.razaoSocial || c.razao_social,
                        cnpj: c.cnpj,
                        endereco: c.endereco,
                        contatoNome: c.contatoNome || c.contato_nome,
                        contatoEmail: c.contatoEmail || c.contato_email,
                        contatoTelefone: c.contatoTelefone || c.contato_telefone,
                        driveLink: c.driveLink || c.drive_link,
                        createdAt: new Date(c.createdAt || c.created_at),
                        updatedAt: new Date(c.updatedAt || c.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        // 5. Requirements & Catalogos
        if (data.infrastructure_requirements?.length) {
            console.log(`  Restaurando ${data.infrastructure_requirements.length} requisitos de infraestrutura...`);
            for (const ir of data.infrastructure_requirements) {
                await prisma.infrastructureRequirement.upsert({
                    where: { id: ir.id },
                    update: {},
                    create: {
                        id: ir.id,
                        name: ir.name,
                        serverType: ir.serverType || ir.server_type,
                        minProcessor: ir.minProcessor || ir.min_processor,
                        minRamGb: ir.minRamGb ?? ir.min_ram_gb ?? 4,
                        minDiskGb: ir.minDiskGb ?? ir.min_disk_gb ?? 100,
                        minFreeDiskGb: ir.minFreeDiskGb ?? ir.min_free_disk_gb ?? 20,
                        supportedOs: ir.supportedOs || ir.supported_os,
                        description: ir.description,
                        isActive: ir.isActive !== undefined ? ir.isActive : ir.is_active,
                        createdAt: new Date(ir.createdAt || ir.created_at),
                        updatedAt: new Date(ir.updatedAt || ir.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.server_requirements?.length) {
            console.log(`  Restaurando ${data.server_requirements.length} requisitos de servidor...`);
            for (const sr of data.server_requirements) {
                await prisma.serverRequirement.upsert({
                    where: { id: sr.id },
                    update: {},
                    create: {
                        id: sr.id,
                        role: sr.role,
                        os: sr.os,
                        isRecommended: sr.isRecommended !== undefined ? sr.isRecommended : (sr.is_recommended !== undefined ? sr.is_recommended : false),
                        qntPdvsMin: sr.qntPdvsMin ?? sr.qnt_pdvs_min ?? 0,
                        qntPdvsMax: sr.qntPdvsMax ?? sr.qnt_pdvs_max ?? 999,
                        ramGb: sr.ramGb ?? sr.ram_gb ?? 0,
                        cpuCores: sr.cpuCores ?? sr.cpu_cores ?? null,
                        cpuModel: sr.cpuModel || sr.cpu_model || '',
                        storageType: sr.storageType || sr.storage_type || '',
                        storageGb: sr.storageGb ?? sr.storage_gb ?? 0,
                        recommendedOs: sr.recommendedOs || sr.recommended_os || null,
                        software: sr.software || null,
                        createdAt: new Date(sr.createdAt || sr.created_at),
                        updatedAt: new Date(sr.updatedAt || sr.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.terminal_requirements?.length) {
            console.log(`  Restaurando ${data.terminal_requirements.length} requisitos de terminal...`);
            for (const tr of data.terminal_requirements) {
                await prisma.terminalRequirement.upsert({
                    where: { id: tr.id },
                    update: {},
                    create: {
                        id: tr.id,
                        terminalType: tr.terminalType || tr.terminal_type,
                        os: tr.os,
                        application: tr.application,
                        ramGb: tr.ramGb ?? tr.ram_gb ?? 0,
                        cpuModel: tr.cpuModel || tr.cpu_model,
                        storageType: tr.storageType || tr.storage_type,
                        storageGb: tr.storageGb ?? tr.storage_gb ?? 0,
                        minResolution: tr.minResolution || tr.min_resolution,
                        soDistribution: tr.soDistribution || tr.so_distribution,
                        observations: tr.observations,
                        createdAt: new Date(tr.createdAt || tr.created_at),
                        updatedAt: new Date(tr.updatedAt || tr.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.internet_requirements?.length) {
            console.log(`  Restaurando ${data.internet_requirements.length} requisitos de internet...`);
            for (const ir of data.internet_requirements) {
                await prisma.internetRequirement.upsert({
                    where: { id: ir.id },
                    update: {},
                    create: {
                        id: ir.id,
                        linkType: ir.linkType || ir.link_type,
                        uploadMb: ir.uploadMb ?? ir.upload_mb ?? 0,
                        downloadMb: ir.downloadMb ?? ir.download_mb ?? 0,
                        observations: ir.observations,
                        createdAt: new Date(ir.createdAt || ir.created_at),
                        updatedAt: new Date(ir.updatedAt || ir.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.homologated_peripherals?.length) {
            console.log(`  Restaurando ${data.homologated_peripherals.length} periféricos homologados...`);
            for (const hp of data.homologated_peripherals) {
                await prisma.homologatedPeripheral.upsert({
                    where: { id: hp.id },
                    update: {},
                    create: {
                        id: hp.id,
                        category: hp.category,
                        brand: hp.brand,
                        model: hp.model,
                        isActive: hp.isActive !== undefined ? hp.isActive : hp.is_active,
                        createdAt: new Date(hp.createdAt || hp.created_at),
                    },
                });
                restoredCount++;
            }
        }
        // 6. Menus e Submenus
        if (data.menus?.length) {
            console.log(`  Restaurando ${data.menus.length} menus...`);
            for (const m of data.menus) {
                await prisma.menu.upsert({
                    where: { id: m.id },
                    update: {},
                    create: {
                        id: m.id,
                        label: m.label,
                        icon: m.icon,
                        route: m.route,
                        order: m.order,
                        isActive: m.isActive !== undefined ? m.isActive : m.is_active,
                        roles: m.roles,
                        rolesConsulta: m.rolesConsulta || m.roles_consulta || ['admin'],
                        rolesInclusaoEdicao: m.rolesInclusaoEdicao || m.roles_inclusao_edicao || ['admin'],
                        rolesEspecial: m.rolesEspecial || m.roles_especial || ['admin'],
                        createdAt: new Date(m.createdAt || m.created_at),
                        updatedAt: new Date(m.updatedAt || m.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.submenus?.length) {
            console.log(`  Restaurando ${data.submenus.length} submenus...`);
            for (const sm of data.submenus) {
                await prisma.submenu.upsert({
                    where: { id: sm.id },
                    update: {},
                    create: {
                        id: sm.id,
                        menuId: sm.menuId || sm.menu_id,
                        label: sm.label,
                        icon: sm.icon,
                        route: sm.route,
                        order: sm.order,
                        roles: sm.roles,
                        rolesConsulta: sm.rolesConsulta || sm.roles_consulta || ['admin'],
                        rolesInclusaoEdicao: sm.rolesInclusaoEdicao || sm.roles_inclusao_edicao || ['admin'],
                        rolesEspecial: sm.rolesEspecial || sm.roles_especial || ['admin'],
                        createdAt: new Date(sm.createdAt || sm.created_at),
                        updatedAt: new Date(sm.updatedAt || sm.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        // 7. Assessments & History
        if (data.assessments?.length) {
            console.log(`  Restaurando ${data.assessments.length} assessments...`);
            for (const a of data.assessments) {
                await prisma.assessment.upsert({
                    where: { id: a.id },
                    update: {},
                    create: {
                        id: a.id,
                        userId: a.userId || a.user_id,
                        clientId: a.clientId || a.client_id,
                        companyName: a.companyName || a.company_name,
                        cnpj: a.cnpj,
                        statusFinanceiro: a.statusFinanceiro,
                        status: a.status,
                        porte: a.porte,
                        data: a.data,
                        validationResults: a.validationResults || a.validation_results,
                        projetoQuantidadeHoras: a.projetoQuantidadeHoras || a.projeto_quantidade_horas,
                        projetoEscopoImplantacao: a.projetoEscopoImplantacao || a.projeto_escopo_implantacao,
                        migracaoTipo: a.migracaoTipo || a.migracao_tipo,
                        migracaoAcessos: a.migracaoAcessos || a.migracao_acessos,
                        migracaoProdutoPeriodo: a.migracaoProdutoPeriodo || a.migracao_produto_periodo,
                        migracaoVendasPeriodo: a.migracaoVendasPeriodo || a.migracao_vendas_periodo,
                        createdAt: new Date(a.createdAt || a.created_at),
                        updatedAt: new Date(a.updatedAt || a.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.assessment_history?.length) {
            console.log(`  Restaurando ${data.assessment_history.length} históricos de assessment...`);
            for (const ah of data.assessment_history) {
                await prisma.assessmentHistory.upsert({
                    where: { id: ah.id },
                    update: {},
                    create: {
                        id: ah.id,
                        assessmentId: ah.assessmentId || ah.assessment_id,
                        userId: ah.userId || ah.user_id,
                        action: ah.action,
                        details: ah.details,
                        createdAt: new Date(ah.createdAt || ah.created_at),
                    },
                });
                restoredCount++;
            }
        }
        // 8. Deployments & History
        if (data.deployments?.length) {
            console.log(`  Restaurando ${data.deployments.length} implantações (deployments)...`);
            for (const d of data.deployments) {
                await prisma.deployment.upsert({
                    where: { id: d.id },
                    update: {},
                    create: {
                        id: d.id,
                        clientId: d.clientId || d.client_id,
                        implantador: d.implantador,
                        dataInicio: d.dataInicio || d.data_inicio ? new Date(d.dataInicio || d.data_inicio) : null,
                        dataPrevisao: d.dataPrevisao || d.data_previsao ? new Date(d.dataPrevisao || d.data_previsao) : null,
                        driveDocumentacao: d.driveDocumentacao || d.drive_documentacao,
                        observacao: d.observacao,
                        status: d.status,
                        createdAt: new Date(d.createdAt || d.created_at),
                        updatedAt: new Date(d.updatedAt || d.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.deployment_history?.length) {
            console.log(`  Restaurando ${data.deployment_history.length} históricos de implantação...`);
            for (const dh of data.deployment_history) {
                await prisma.deploymentHistory.upsert({
                    where: { id: dh.id },
                    update: {},
                    create: {
                        id: dh.id,
                        deploymentId: dh.deploymentId || dh.deployment_id,
                        userId: dh.userId || dh.user_id,
                        action: dh.action,
                        details: dh.details,
                        oldStatus: dh.oldStatus || dh.old_status,
                        newStatus: dh.newStatus || dh.new_status,
                        createdAt: new Date(dh.createdAt || dh.created_at),
                    },
                });
                restoredCount++;
            }
        }
        // 9. Migrations, History & Lancamentos
        if (data.migrations?.length) {
            console.log(`  Restaurando ${data.migrations.length} migrações...`);
            for (const m of data.migrations) {
                await prisma.migration.upsert({
                    where: { id: m.id },
                    update: {},
                    create: {
                        id: m.id,
                        clientId: m.clientId || m.client_id,
                        status: m.status,
                        tipoMigracao: m.tipoMigracao || m.tipo_migracao,
                        responsavelId: m.responsavelId || m.responsavel_id,
                        tipoCobranca: m.tipoCobranca || m.tipo_cobranca,
                        valorHora: m.valorHora || m.valor_hora,
                        valorFixo: m.valorFixo || m.valor_fixo,
                        nomeContatoChave: m.nomeContatoChave || m.nome_contato_chave,
                        telefone: m.telefone,
                        acessoAnydesk: m.acessoAnydesk || m.acesso_anydesk,
                        senhaAnydesk: m.senhaAnydesk || m.senha_anydesk,
                        nomeSistema: m.nomeSistema || m.nome_sistema,
                        nomeSoftwareHouse: m.nomeSoftwareHouse || m.nome_software_house,
                        tipoBancoDados: m.tipoBancoDados || m.tipo_banco_dados,
                        items: m.items,
                        statusFinanceiro: m.statusFinanceiro,
                        observacoes: m.observacoes,
                        dataPrevistaVirada: m.dataPrevistaVirada || m.data_prevista_virada ? new Date(m.dataPrevistaVirada || m.data_prevista_virada) : null,
                        dataViradaSistema: m.dataViradaSistema || m.data_virada_sistema ? new Date(m.dataViradaSistema || m.data_virada_sistema) : null,
                        createdAt: new Date(m.createdAt || m.created_at),
                        updatedAt: new Date(m.updatedAt || m.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.migration_history?.length) {
            console.log(`  Restaurando ${data.migration_history.length} históricos de migração...`);
            for (const mh of data.migration_history) {
                await prisma.migrationHistory.upsert({
                    where: { id: mh.id },
                    update: {},
                    create: {
                        id: mh.id,
                        migrationId: mh.migrationId || mh.migration_id,
                        userId: mh.userId || mh.user_id,
                        action: mh.action,
                        details: mh.details,
                        oldStatus: mh.oldStatus || mh.old_status,
                        newStatus: mh.newStatus || mh.new_status,
                        createdAt: new Date(mh.createdAt || mh.created_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.migration_lancamentos?.length) {
            console.log(`  Restaurando ${data.migration_lancamentos.length} lançamentos de migração...`);
            for (const ml of data.migration_lancamentos) {
                await prisma.migrationLancamento.upsert({
                    where: { id: ml.id },
                    update: {},
                    create: {
                        id: ml.id,
                        migrationId: ml.migrationId || ml.migration_id,
                        userId: ml.userId || ml.user_id,
                        data: new Date(ml.data),
                        horas: ml.horas,
                        valor: ml.valor,
                        descricao: ml.descricao,
                        createdAt: new Date(ml.createdAt || ml.created_at),
                    },
                });
                restoredCount++;
            }
        }
        // 10. Recém VR
        if (data.recem_vr?.length) {
            console.log(`  Restaurando ${data.recem_vr.length} processos Recém VR...`);
            for (const r of data.recem_vr) {
                await prisma.recemVr.upsert({
                    where: { id: r.id },
                    update: {},
                    create: {
                        id: r.id,
                        clientId: r.clientId || r.client_id,
                        deploymentId: r.deploymentId || r.deployment_id,
                        mv067: r.mv067,
                        criticidade: r.criticidade,
                        resumo: r.resumo,
                        solicitanteId: r.solicitanteId || r.solicitante_id,
                        status: r.status,
                        analistaId: r.analistaId || r.analista_id,
                        dataPrimeiraReuniao: r.dataPrimeiraReuniao || r.data_primeira_reuniao ? new Date(r.dataPrimeiraReuniao || r.data_primeira_reuniao) : null,
                        datasAcompanhamento: (r.datasAcompanhamento || r.datas_acompanhamento || []).map((d) => new Date(d)),
                        createdAt: new Date(r.createdAt || r.created_at),
                        updatedAt: new Date(r.updatedAt || r.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.recem_vr_acompanhamentos?.length) {
            console.log(`  Restaurando ${data.recem_vr_acompanhamentos.length} acompanhamentos Recém VR...`);
            for (const ra of data.recem_vr_acompanhamentos) {
                await prisma.recemVrAcompanhamento.upsert({
                    where: { id: ra.id },
                    update: {},
                    create: {
                        id: ra.id,
                        recemVrId: ra.recemVrId || ra.recem_vr_id,
                        userId: ra.userId || ra.user_id,
                        dataReuniao: new Date(ra.dataReuniao || ra.data_reuniao),
                        ata: ra.ata,
                        observacao: ra.observacao,
                        createdAt: new Date(ra.createdAt || ra.created_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.recem_vr_history?.length) {
            console.log(`  Restaurando ${data.recem_vr_history.length} históricos Recém VR...`);
            for (const rh of data.recem_vr_history) {
                await prisma.recemVrHistory.upsert({
                    where: { id: rh.id },
                    update: {},
                    create: {
                        id: rh.id,
                        recemVrId: rh.recemVrId || rh.recem_vr_id,
                        userId: rh.userId || rh.user_id,
                        action: rh.action,
                        details: rh.details,
                        oldStatus: rh.oldStatus || rh.old_status,
                        newStatus: rh.newStatus || rh.new_status,
                        createdAt: new Date(rh.createdAt || rh.created_at),
                    },
                });
                restoredCount++;
            }
        }
        // 11. Client Infrastructure, Credentials & Tickets
        if (data.client_infrastructure?.length) {
            console.log(`  Restaurando ${data.client_infrastructure.length} infraestruturas de clientes...`);
            for (const ci of data.client_infrastructure) {
                await prisma.clientInfrastructure.upsert({
                    where: { id: ci.id },
                    update: {},
                    create: {
                        id: ci.id,
                        clientId: ci.clientId || ci.client_id,
                        type: ci.type,
                        nome: ci.nome,
                        hostname: ci.hostname,
                        ipAddress: ci.ipAddress || ci.ip_address,
                        operatingSystem: ci.operatingSystem || ci.operating_system,
                        cpuModel: ci.cpuModel || ci.cpu_model,
                        ramGb: ci.ramGb || ci.ram_gb,
                        storageGb: ci.storageGb || ci.storage_gb,
                        storageType: ci.storageType || ci.storage_type,
                        observacoes: ci.observacoes,
                        isActive: ci.isActive !== undefined ? ci.isActive : ci.is_active,
                        createdAt: new Date(ci.createdAt || ci.created_at),
                        updatedAt: new Date(ci.updatedAt || ci.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.client_credentials?.length) {
            console.log(`  Restaurando ${data.client_credentials.length} credenciais seguras de clientes...`);
            for (const cc of data.client_credentials) {
                await prisma.clientCredential.upsert({
                    where: { id: cc.id },
                    update: {},
                    create: {
                        id: cc.id,
                        clientId: cc.clientId || cc.client_id,
                        type: cc.type,
                        label: cc.label,
                        username: cc.username,
                        secretCiphertext: cc.secretCiphertext || cc.secret_ciphertext,
                        secretIv: cc.secretIv || cc.secret_iv,
                        secretAuthTag: cc.secretAuthTag || cc.secret_auth_tag,
                        responsavelNome: cc.responsavelNome || cc.responsavel_nome,
                        responsavelTelefone: cc.responsavelTelefone || cc.responsavel_telefone,
                        responsavelEmail: cc.responsavelEmail || cc.responsavel_email,
                        notes: cc.notes,
                        isActive: cc.isActive !== undefined ? cc.isActive : cc.is_active,
                        createdById: cc.createdById || cc.created_by_id,
                        createdAt: new Date(cc.createdAt || cc.created_at),
                        updatedAt: new Date(cc.updatedAt || cc.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.client_credential_access_logs?.length) {
            console.log(`  Restaurando ${data.client_credential_access_logs.length} logs de acesso a credenciais...`);
            for (const cal of data.client_credential_access_logs) {
                await prisma.clientCredentialAccessLog.upsert({
                    where: { id: cal.id },
                    update: {},
                    create: {
                        id: cal.id,
                        credentialId: cal.credentialId || cal.credential_id,
                        userId: cal.userId || cal.user_id,
                        action: cal.action,
                        createdAt: new Date(cal.createdAt || cal.created_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.client_tickets?.length) {
            console.log(`  Restaurando ${data.client_tickets.length} tickets de clientes...`);
            for (const ct of data.client_tickets) {
                await prisma.clientTicket.upsert({
                    where: { id: ct.id },
                    update: {},
                    create: {
                        id: ct.id,
                        clientId: ct.clientId || ct.client_id,
                        data: new Date(ct.data),
                        numero: ct.numero,
                        assunto: ct.assunto,
                        classificacao: ct.classificacao,
                        createdAt: new Date(ct.createdAt || ct.created_at),
                        updatedAt: new Date(ct.updatedAt || ct.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        // 12. Critical Cases & Acompanhamentos
        if (data.critical_cases?.length) {
            console.log(`  Restaurando ${data.critical_cases.length} casos críticos...`);
            for (const cc of data.critical_cases) {
                await prisma.criticalCase.upsert({
                    where: { id: cc.id },
                    update: {},
                    create: {
                        id: cc.id,
                        clientId: cc.clientId || cc.client_id,
                        categories: cc.categories || [],
                        participantes: cc.participantes,
                        observacoes: cc.observacoes,
                        proximosPassos: cc.proximosPassos || cc.proximos_passos,
                        status: cc.status,
                        responsavelId: cc.responsavelId || cc.responsavel_id,
                        createdAt: new Date(cc.createdAt || cc.created_at),
                        updatedAt: new Date(cc.updatedAt || cc.updated_at),
                    },
                });
                restoredCount++;
            }
        }
        if (data.critical_case_acompanhamentos?.length) {
            console.log(`  Restaurando ${data.critical_case_acompanhamentos.length} acompanhamentos de casos críticos...`);
            for (const cca of data.critical_case_acompanhamentos) {
                await prisma.criticalCaseAcompanhamento.upsert({
                    where: { id: cca.id },
                    update: {},
                    create: {
                        id: cca.id,
                        criticalCaseId: cca.criticalCaseId || cca.critical_case_id,
                        userId: cca.userId || cca.user_id,
                        data: new Date(cca.data),
                        tipo: cca.tipo || 'ACOMPANHAMENTO',
                        descricao: cca.descricao,
                        proximosPassos: cca.proximosPassos || cca.proximos_passos,
                        statusNovo: cca.statusNovo || cca.status_novo,
                        createdAt: new Date(cca.createdAt || cca.created_at),
                    },
                });
                restoredCount++;
            }
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n====================================================');
        console.log(`✅ Restauração concluída com sucesso em ${elapsed}s!`);
        console.log(`📊 Total de registros processados/restaurados: ${restoredCount}`);
        console.log('====================================================');
    }
    catch (error) {
        console.error('\n❌ Erro durante a restauração dos dados:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
runRestore();
