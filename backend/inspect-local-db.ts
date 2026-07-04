import { Client } from 'pg';

async function main() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'itmizervrgyn',
        password: 'itmizer',
        port: 5434,
    });

    try {
        console.log('Connecting to local source database...');
        await client.connect();
        console.log('Connected successfully!');

        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in local database:', res.rows.map(r => r.table_name).join(', '));

        for (const table of res.rows) {
            const countRes = await client.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
            console.log(`Table ${table.table_name}: ${countRes.rows[0].count} records`);
        }

    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await client.end();
    }
}

main();
