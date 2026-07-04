import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Load .env manually to be sure
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
    console.log('Testing connection to the LATEST Prisma Accelerate URL...');
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ SUCCESS! Connection established. Total users: ${userCount}`);

        const tables: any = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables visible via Accelerate:', tables.map((t: any) => t.table_name).join(', '));
    } catch (error) {
        console.error('❌ Connection failed with latest URL:', error);
    } finally {
        // Avoid prisma disconnect issues in some environments during fast tests
    }
}

main();
