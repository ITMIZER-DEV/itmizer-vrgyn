import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

async function main() {
    const dataPath = path.join(__dirname, 'local_db_dump.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data dump file not found!');
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log('--- Starting Migration Seed ---');

    // 1. Users
    console.log(`Seeding ${data.users.length} users...`);
    for (const u of data.users) {
        await prisma.user.upsert({
            where: { id: u.id }, // Using ID from dump to keep consistency
            update: {},
            create: {
                id: u.id,
                email: u.email,
                password: u.password,
                isActive: u.is_active,
                createdAt: new Date(u.createdAt),
                updatedAt: new Date(u.updatedAt),
            },
        });
    }

    // 2. Profiles
    console.log(`Seeding ${data.profiles.length} profiles...`);
    for (const p of data.profiles) {
        await prisma.profile.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                fullName: p.full_name,
                email: p.email,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
            },
        });
    }

    // 3. User Roles
    console.log(`Seeding ${data.user_roles.length} user roles...`);
    for (const r of data.user_roles) {
        await prisma.userRole.upsert({
            where: { id: r.id },
            update: {},
            create: {
                id: r.id,
                userId: r.user_id,
                role: r.role,
                createdAt: new Date(r.created_at),
            },
        });
    }

    // 4. Clients
    console.log(`Seeding ${data.clients.length} clients...`);
    for (const c of data.clients) {
        await prisma.client.upsert({
            where: { id: c.id },
            update: {},
            create: {
                id: c.id,
                nomeFantasia: c.nome_fantasia,
                razaoSocial: c.razao_social,
                cnpj: c.cnpj,
                endereco: c.endereco,
                contatoNome: c.contato_nome,
                contatoEmail: c.contato_email,
                contatoTelefone: c.contato_telefone,
                createdAt: new Date(c.created_at),
                updatedAt: new Date(c.updated_at),
            },
        });
    }

    // 5. Assessments
    console.log(`Seeding ${data.assessments.length} assessments...`);
    for (const a of data.assessments) {
        await prisma.assessment.upsert({
            where: { id: a.id },
            update: {},
            create: {
                id: a.id,
                userId: a.user_id,
                clientId: a.client_id,
                companyName: a.company_name,
                cnpj: a.cnpj,
                statusFinanceiro: a.statusFinanceiro,
                status: a.status,
                porte: a.porte,
                data: a.data,
                validationResults: a.validation_results,
                createdAt: new Date(a.created_at),
                updatedAt: new Date(a.updated_at),
            },
        });
    }

    // 6. Migrations
    console.log(`Seeding ${data.migrations.length} migrations...`);
    for (const m of data.migrations) {
        await prisma.migration.upsert({
            where: { id: m.id },
            update: {},
            create: {
                id: m.id,
                clientId: m.client_id,
                status: m.status,
                tipoMigracao: m.tipo_migracao,
                responsavelId: m.responsavel_id,
                tipoCobranca: m.tipo_cobranca,
                valorHora: m.valor_hora,
                valorFixo: m.valor_fixo,
                nomeContatoChave: m.nome_contato_chave,
                telefone: m.telefone,
                acessoAnydesk: m.acesso_anydesk,
                senhaAnydesk: m.senha_anydesk,
                nomeSistema: m.nome_sistema,
                nomeSoftwareHouse: m.nome_software_house,
                tipoBancoDados: m.tipo_banco_dados,
                items: m.items,
                statusFinanceiro: m.statusFinanceiro,
                observacoes: m.observacoes,
                createdAt: new Date(m.created_at),
                updatedAt: new Date(m.updated_at),
            },
        });
    }

    // 7. Migration History
    console.log(`Seeding ${data.migration_history.length} history records...`);
    for (const h of data.migration_history) {
        await prisma.migrationHistory.upsert({
            where: { id: h.id },
            update: {},
            create: {
                id: h.id,
                migrationId: h.migration_id,
                userId: h.user_id,
                action: h.action,
                details: h.details,
                oldStatus: h.old_status,
                newStatus: h.new_status,
                createdAt: new Date(h.created_at),
            },
        });
    }

    // 8. Migration Lancamentos
    console.log(`Seeding ${data.migration_lancamentos.length} lancamentos...`);
    for (const l of data.migration_lancamentos) {
        await prisma.migrationLancamento.upsert({
            where: { id: l.id },
            update: {},
            create: {
                id: l.id,
                migrationId: l.migration_id,
                userId: l.user_id,
                data: new Date(l.data),
                horas: l.horas,
                valor: l.valor,
                descricao: l.descricao,
                createdAt: new Date(l.created_at),
            },
        });
    }

    // 9. Peripherals
    console.log(`Seeding ${data.homologated_peripherals.length} peripherals...`);
    for (const p of data.homologated_peripherals) {
        await prisma.homologatedPeripheral.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                category: p.category,
                brand: p.brand,
                model: p.model,
                isActive: p.is_active,
                createdAt: new Date(p.created_at),
            },
        });
    }

    // 10. Infrastructure Requirements
    console.log(`Seeding ${data.infrastructure_requirements.length} infra requirements...`);
    for (const ir of data.infrastructure_requirements) {
        await prisma.infrastructureRequirement.upsert({
            where: { id: ir.id },
            update: {},
            create: {
                id: ir.id,
                name: ir.name,
                serverType: ir.server_type,
                minProcessor: ir.min_processor,
                minRamGb: ir.min_ram_gb,
                minDiskGb: ir.min_disk_gb,
                minFreeDiskGb: ir.min_free_disk_gb,
                supportedOs: ir.supported_os,
                description: ir.description,
                isActive: ir.is_active,
                createdAt: new Date(ir.created_at),
                updatedAt: new Date(ir.updated_at),
            },
        });
    }

    // 11. Server Requirements
    console.log(`Seeding ${data.server_requirements.length} server requirements...`);
    for (const sr of data.server_requirements) {
        await prisma.serverRequirement.upsert({
            where: { id: sr.id },
            update: {},
            create: {
                id: sr.id,
                role: sr.role,
                os: sr.os,
                isRecommended: sr.is_recommended,
                qntPdvsMin: sr.qnt_pdvs_min,
                qntPdvsMax: sr.qnt_pdvs_max,
                ramGb: sr.ram_gb,
                cpuCores: sr.cpu_cores,
                cpuModel: sr.cpu_model,
                storageType: sr.storage_type,
                storageGb: sr.storage_gb,
                recommendedOs: sr.recommended_os,
                software: sr.software,
                createdAt: new Date(sr.created_at),
                updatedAt: new Date(sr.updated_at),
            },
        });
    }

    // 12. Terminal Requirements
    console.log(`Seeding ${data.terminal_requirements.length} terminal requirements...`);
    for (const tr of data.terminal_requirements) {
        await prisma.terminalRequirement.upsert({
            where: { id: tr.id },
            update: {},
            create: {
                id: tr.id,
                terminalType: tr.terminal_type,
                os: tr.os,
                application: tr.application,
                ramGb: tr.ram_gb,
                cpuModel: tr.cpu_model,
                storageType: tr.storage_type,
                storageGb: tr.storage_gb,
                minResolution: tr.min_resolution,
                soDistribution: tr.so_distribution,
                observations: tr.observations,
                createdAt: new Date(tr.created_at),
                updatedAt: new Date(tr.updated_at),
            },
        });
    }

    // 13. Internet Requirements
    console.log(`Seeding ${data.internet_requirements.length} internet requirements...`);
    for (const i of data.internet_requirements) {
        await prisma.internetRequirement.upsert({
            where: { id: i.id },
            update: {},
            create: {
                id: i.id,
                linkType: i.link_type,
                uploadMb: i.upload_mb,
                downloadMb: i.download_mb,
                observations: i.observations,
                createdAt: new Date(i.created_at),
                updatedAt: new Date(i.updated_at),
            },
        });
    }

    console.log('--- Migration Seed Finished Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
