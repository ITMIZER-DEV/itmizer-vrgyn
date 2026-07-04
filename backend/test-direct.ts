import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

async function main() {
    console.log('Auditing database tables...');
    try {
        const tableNames = [
            'User', 'Profile', 'UserRole', 'InfrastructureRequirement',
            'Assessment', 'Client', 'HomologatedPeripheral',
            'ServerRequirement', 'TerminalRequirement', 'InternetRequirement',
            'Migration', 'MigrationHistory', 'MigrationLancamento'
        ];

        for (const name of tableNames) {
            const count = await (prisma as any)[name.charAt(0).toLowerCase() + name.slice(1)].count();
            console.log(`${name}: ${count} records`);
        }

    } catch (error) {
        console.error('Audit failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
