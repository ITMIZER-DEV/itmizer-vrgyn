import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Load .env manually to be sure
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
    console.log('Inspecting SHEMAS and TABLES via Accelerate...');
    try {
        const schemas: any = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata`;
        console.log('Available schemas:', schemas.map((s: any) => s.schema_name).join(', '));

        const tables: any = await prisma.$queryRaw`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')`;
        console.log('Visible tables:', tables);
    } catch (error) {
        console.error('❌ Inspection failed:', error);
    }
}

main();
