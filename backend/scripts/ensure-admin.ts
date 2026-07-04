import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureAdminRole() {
  const email = 'leonardo.alves@itmizer.com.br';

  console.log(`🔍 Buscando usuário: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true }
  });

  if (!user) {
    console.log(`❌ Usuário ${email} não encontrado!`);
    console.log('💡 Por favor, registre este usuário primeiro.');
    return;
  }

  console.log(`✅ Usuário encontrado: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Ativo: ${user.isActive}`);
  console.log(`   Roles atuais: ${user.roles.map(r => r.role).join(', ')}`);

  const hasAdminRole = user.roles.some(r => r.role === 'admin');

  if (hasAdminRole) {
    console.log(`✅ Usuário já possui role ADMIN`);
  } else {
    console.log(`⚙️  Adicionando role ADMIN...`);

    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: 'admin'
      }
    });

    console.log(`✅ Role ADMIN adicionada com sucesso!`);
  }

  // Verificar novamente
  const updatedUser = await prisma.user.findUnique({
    where: { email },
    include: { roles: true }
  });

  console.log(`\n📋 Roles finais: ${updatedUser?.roles.map(r => r.role).join(', ')}`);

  await prisma.$disconnect();
}

ensureAdminRole()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
