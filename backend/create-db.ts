import { Client } from 'pg';

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '',
    port: 5432,
});

async function createDb() {
    try {
        await client.connect();
        await client.query('CREATE DATABASE itmizervrgyn');
        console.log('Database created successfully');
    } catch (err: any) {
        if (err.code === '42P04') {
            console.log('Database already exists');
        } else {
            console.error('Error creating database:', err);
            process.exit(1);
        }
    } finally {
        await client.end();
    }
}

createDb();
