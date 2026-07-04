const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    const assessment = await prisma.assessment.findFirst({
        orderBy: { updatedAt: 'desc' }
    });

    if (assessment) {
        console.log('Assessment ID:', assessment.id);
        console.log('Assessment Data:', JSON.stringify(assessment.data, null, 2));
    } else {
        console.log('No assessments found');
    }
}

debug();
