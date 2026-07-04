import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
    console.log('Testing connection to Prisma Accelerate with raw query...');
    try {
        const tables: any = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables visible via Accelerate:', tables);

        const userCount = await prisma.user.count();
        console.log(`Connection successful! Total users: ${userCount}`);
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        // await prisma.$disconnect(); // Extension might not support disconnect the same way or it's not needed for this test
    }
}

main();
