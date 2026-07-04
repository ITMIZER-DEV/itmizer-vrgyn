import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Load .env manually to be sure
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
    console.log('Testing RAW connection to the LATEST Prisma Accelerate URL...');
    try {
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log(`✅ RAW SUCCESS! Proxy reached database. Result:`, result);
    } catch (error) {
        console.error('❌ RAW Connection failed:', error);
    }
}

main();
