import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'f1a888d3-d7a9-4741-9251-5276158b244a';
    const assessment = await prisma.assessment.findUnique({
        where: { id }
    });

    if (!assessment) {
        console.log('Assessment not found');
        return;
    }

    console.log('Current Data:', JSON.stringify(assessment.data, null, 2));
    console.log('Current Status:', assessment.status);
    console.log('Current Validation Results:', JSON.stringify(assessment.validationResults, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
