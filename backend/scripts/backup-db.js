"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = require("fs");
const path = require("path");
// Permite passar URL personalizada via flag --url=... ou usa DIRECT_URL / DATABASE_URL
const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));
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
async function runBackup() {
    console.log('====================================================');
    console.log('📦 ITMIZER-VR: Ferramenta de Backup de Banco de Dados');
    console.log('====================================================');
    console.log(`Conectando em: ${customUrl ? customUrl.replace(/:[^:@]+@/, ':****@') : 'URL padrão do ambiente'}`);
    const startTime = Date.now();
    const backupData = {};
    const report = {};
    try {
        console.log('\nIniciando extração das tabelas...');
        // Lista de todas as entidades do schema
        const extractors = [
            { name: 'users', fetch: () => prisma.user.findMany() },
            { name: 'profiles', fetch: () => prisma.profile.findMany() },
            { name: 'user_roles', fetch: () => prisma.userRole.findMany() },
            { name: 'clients', fetch: () => prisma.client.findMany() },
            { name: 'infrastructure_requirements', fetch: () => prisma.infrastructureRequirement.findMany() },
            { name: 'server_requirements', fetch: () => prisma.serverRequirement.findMany() },
            { name: 'terminal_requirements', fetch: () => prisma.terminalRequirement.findMany() },
            { name: 'internet_requirements', fetch: () => prisma.internetRequirement.findMany() },
            { name: 'homologated_peripherals', fetch: () => prisma.homologatedPeripheral.findMany() },
            { name: 'menus', fetch: () => prisma.menu.findMany() },
            { name: 'submenus', fetch: () => prisma.submenu.findMany() },
            { name: 'assessments', fetch: () => prisma.assessment.findMany() },
            { name: 'assessment_history', fetch: () => prisma.assessmentHistory.findMany() },
            { name: 'deployments', fetch: () => prisma.deployment.findMany() },
            { name: 'deployment_history', fetch: () => prisma.deploymentHistory.findMany() },
            { name: 'migrations', fetch: () => prisma.migration.findMany() },
            { name: 'migration_history', fetch: () => prisma.migrationHistory.findMany() },
            { name: 'migration_lancamentos', fetch: () => prisma.migrationLancamento.findMany() },
            { name: 'recem_vr', fetch: () => prisma.recemVr.findMany() },
            { name: 'recem_vr_acompanhamentos', fetch: () => prisma.recemVrAcompanhamento.findMany() },
            { name: 'recem_vr_history', fetch: () => prisma.recemVrHistory.findMany() },
            { name: 'client_infrastructure', fetch: () => prisma.clientInfrastructure.findMany() },
            { name: 'client_credentials', fetch: () => prisma.clientCredential.findMany() },
            { name: 'client_credential_access_logs', fetch: () => prisma.clientCredentialAccessLog.findMany() },
            { name: 'client_tickets', fetch: () => prisma.clientTicket.findMany() },
            { name: 'critical_cases', fetch: () => prisma.criticalCase.findMany() },
            { name: 'critical_case_acompanhamentos', fetch: () => prisma.criticalCaseAcompanhamento.findMany() },
        ];
        let totalRecords = 0;
        for (const extractor of extractors) {
            try {
                const rows = await extractor.fetch();
                backupData[extractor.name] = rows;
                report[extractor.name] = rows.length;
                totalRecords += rows.length;
                console.log(`  ✓ ${extractor.name.padEnd(32)}: ${rows.length} registros`);
            }
            catch (err) {
                console.warn(`  ⚠️ Aviso ao extrair ${extractor.name}:`, err.message);
                backupData[extractor.name] = [];
                report[extractor.name] = 0;
            }
        }
        // Criar pasta de backups se não existir
        const backupDir = path.resolve(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_itmizer_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);
        const payload = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalRecords,
                version: '1.0.0',
                tablesCount: Object.keys(backupData).length,
                report,
            },
            data: backupData,
        };
        fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf-8');
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n====================================================');
        console.log(`✅ Backup concluído com sucesso em ${elapsed}s!`);
        console.log(`📁 Arquivo salvo em: ${filepath}`);
        console.log(`📊 Total de registros salvos: ${totalRecords}`);
        console.log('====================================================');
    }
    catch (error) {
        console.error('\n❌ Erro fatal durante o backup:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
runBackup();
