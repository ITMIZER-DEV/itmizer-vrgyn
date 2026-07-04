import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'leonardo.alves@itmizer.com.br';
  const newPassword = 'Adm@itmizer';

  console.log(`🔍 Buscando usuário: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true, profile: true }
  });

  if (!user) {
    console.log(`❌ Usuário ${email} não encontrado!`);
    console.log('💡 Por favor, registre este usuário primeiro.');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Usuário encontrado: ${user.email}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.profile?.fullName || 'N/A'}`);
  console.log(`   Ativo: ${user.isActive}`);
  console.log(`   Roles: ${user.roles.map(r => r.role).join(', ')}`);

  console.log(`\n⚙️  Gerando hash da nova senha...`);
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  console.log(`⚙️  Atualizando senha no banco de dados...`);
  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword
    }
  });

  console.log(`✅ Senha redefinida com sucesso!`);
  console.log(`\n📋 Credenciais:`);
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${newPassword}`);

  await prisma.$disconnect();
}

resetPassword()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
