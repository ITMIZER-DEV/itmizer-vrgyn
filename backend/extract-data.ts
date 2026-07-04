import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'itmizervrgyn',
        password: 'itmizer',
        port: 5434,
    });

    try {
        console.log('Starting data extraction from local database...');
        await client.connect();

        const tables = [
            'users',
            'profiles',
            'user_roles',
            'clients',
            'assessments',
            'migrations',
            'migration_history',
            'migration_lancamentos',
            'homologated_peripherals',
            'infrastructure_requirements',
            'server_requirements',
            'terminal_requirements',
            'internet_requirements'
        ];

        const extractedData: any = {};

        for (const table of tables) {
            console.log(`Extracting ${table}...`);
            const res = await client.query(`SELECT * FROM "${table}"`);
            extractedData[table] = res.rows;
        }

        const outputPath = path.join(__dirname, 'local_db_dump.json');
        fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
        console.log(`Extraction complete! Data saved to ${outputPath}`);

    } catch (err) {
        console.error('Extraction failed:', err);
    } finally {
        await client.end();
    }
}

main();
