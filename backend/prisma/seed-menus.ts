import { PrismaClient, AppRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dynamic Menus...');
  const menusData = [
    {
      id: 'menu-dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      route: '/dashboard',
      order: 0,
      roles: [AppRole.admin, AppRole.user, AppRole.support, AppRole.seller, AppRole.migrador, AppRole.implantador],
    },
    {
      id: 'menu-clientes',
      label: 'Clientes',
      icon: 'Building2',
      route: '/clients',
      order: 1,
      roles: [AppRole.admin, AppRole.seller, AppRole.support],
    },
    {
      id: 'menu-validacao',
      label: 'Validação',
      icon: 'CheckSquare',
      route: '/assessments',
      order: 2,
      roles: [AppRole.admin, AppRole.support],
    },
    {
      id: 'menu-migracao',
      label: 'Migração',
      icon: 'FileText',
      route: null,
      order: 3,
      roles: [AppRole.admin, AppRole.migrador],
      submenus: [
        { label: 'Controle de Migrações', icon: 'FileText', route: '/migration', order: 1, roles: [AppRole.admin, AppRole.migrador] },
        { label: 'Faturamento', icon: 'Wallet', route: '/migration/billing', order: 2, roles: [AppRole.admin] },
        { label: 'Relatórios', icon: 'BarChart3', route: '/migration/reports', order: 3, roles: [AppRole.admin, AppRole.migrador] },
      ]
    },
    {
      id: 'menu-admin',
      label: 'Painel Administrativo',
      icon: 'Shield',
      route: null,
      order: 4,
      roles: [AppRole.admin],
      submenus: [
        { label: 'Infraestrutura', icon: 'HardDrive', route: '/infrastructure', order: 1, roles: [AppRole.admin] },
        { label: 'Usuários', icon: 'Users', route: '/admin/users', order: 2, roles: [AppRole.admin] },
        { label: 'Menus', icon: 'Menu', route: '/admin/menus', order: 3, roles: [AppRole.admin] },
      ]
    },
  ];

  // Clean up old menu-infra if it exists
  await prisma.menu.deleteMany({
    where: { id: 'menu-infra' }
  });

  for (const m of menusData) {
    const { submenus, ...menuFields } = m;
    await prisma.menu.upsert({
      where: { id: m.id },
      update: {
        roles: m.roles,
        order: m.order,
        label: m.label,
        icon: m.icon,
        route: m.route,
      },
      create: {
        ...menuFields,
        submenus: submenus ? {
          create: submenus
        } : undefined,
      }
    });

    if (submenus) {
        console.log(`Seeded submenus for ${m.label}`);
        for (const sub of submenus) {
            // Note: Upsert for submenus would need a unique ID or label within menu, 
            // but for a clean seed of submenus we just ensure they exist.
            // Simplified: we rely on onDelete: Cascade if re-running or manual cleanup if needed.
        }
    }
  }

  console.log('Menu seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
