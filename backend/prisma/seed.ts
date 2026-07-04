import { PrismaClient, AppRole, ServerType, MigrationStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  const dataPath = path.join(__dirname, '../../spreadsheet_data_utf8.json');

  let data: any = { BD_Servidores: [], BD_Terminais: [], BD_Internet: [] };
  if (fs.existsSync(dataPath)) {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    data = JSON.parse(rawData);
  }

  // --- 1. Users, Profiles, and Roles ---
  console.log('Seeding Users, Profiles and Roles...');
  const passwordHash = await bcrypt.hash('Itmizer#2020', 10);

  const usersData = [
    { id: 'user-admin-1', email: 'admin@itmizer.com', fullName: 'Admin User', role: AppRole.admin },
    { id: 'user-support-1', email: 'support@itmizer.com', fullName: 'Support Team', role: AppRole.support },
    { id: 'user-seller-1', email: 'seller@itmizer.com', fullName: 'Sales Representative', role: AppRole.seller },
    { id: 'user-migrador-1', email: 'migrador@itmizer.com', fullName: 'Migration Specialist', role: AppRole.migrador },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        password: passwordHash,
        profile: {
          create: {
            fullName: u.fullName,
            email: u.email,
          }
        },
        roles: {
          create: {
            role: u.role
          }
        }
      }
    });
  }

  // --- 2. Clients ---
  console.log('Seeding Clients...');
  const clientsData = [
    { id: 'client-1', nomeFantasia: 'Empresa Alpha', cnpj: '11111111000111', contatoNome: 'João Silva' },
    { id: 'client-2', nomeFantasia: 'Supermercado Beta', cnpj: '22222222000122', contatoNome: 'Maria Souza' },
  ];

  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { cnpj: c.cnpj },
      update: {},
      create: c
    });
  }

  // --- 3. Assessments ---
  console.log('Seeding Assessments...');
  await prisma.assessment.upsert({
    where: { id: 'assessment-1' },
    update: {},
    create: {
      id: 'assessment-1',
      userId: 'user-admin-1',
      clientId: 'client-1',
      companyName: 'Empresa Alpha',
      cnpj: '11111111000111',
      status: 'completed',
      data: { porte: 'médio', pdvs: 10 }
    }
  });

  // --- 4. Migrations, History and Lancamentos ---
  console.log('Seeding Migrations...');
  const migrationId = 'migration-1';
  await prisma.migration.upsert({
    where: { id: migrationId },
    update: {},
    create: {
      id: migrationId,
      clientId: 'client-1',
      responsavelId: 'user-migrador-1',
      status: MigrationStatus.em_andamento,
      tipoMigracao: 'completa',
      nomeSistema: 'Legado System',
      tipoBancoDados: 'Firebird',
      history: {
        create: [
          { action: 'Migração iniciada', details: 'Migração de Firebird para PostgreSQL', userId: 'user-admin-1' }
        ]
      },
      lancamentos: {
        create: [
          { userId: 'user-migrador-1', horas: 4.5, descricao: 'Análise inicial de dados' }
        ]
      }
    }
  });

  // --- 5. Homologated Peripherals ---
  console.log('Seeding Homologated Peripherals...');
  const peripherals = [
    { id: 'periph-1', category: 'Impressora', brand: 'Epson', model: 'TM-T20' },
    { id: 'periph-2', category: 'Balança', brand: 'Toledo', model: 'Prix 3' },
  ];
  for (const p of peripherals) {
    await prisma.homologatedPeripheral.upsert({
      where: { id: p.id },
      update: {},
      create: p
    });
  }

  // --- 6. Requirements (from JSON) ---
  console.log('Seeding Server Requirements...');
  const servers = data.BD_Servidores.slice(2);
  for (const s of servers) {
    if (!s["BANCO DE DADOS - CONFIGURAÇÕES DE SERVIDORES VR SOFTWARE"]) continue;
    const sId = `server-${s["BANCO DE DADOS - CONFIGURAÇÕES DE SERVIDORES VR SOFTWARE"]}-${s["Unnamed: 3"]}-${s["Unnamed: 4"]}`;
    await prisma.serverRequirement.upsert({
      where: { id: sId },
      update: {},
      create: {
        id: sId,
        role: s["BANCO DE DADOS - CONFIGURAÇÕES DE SERVIDORES VR SOFTWARE"],
        os: s["Unnamed: 1"],
        isRecommended: s["Unnamed: 2"] === "SIM",
        qntPdvsMin: s["Unnamed: 3"] || 0,
        qntPdvsMax: s["Unnamed: 4"] || 999,
        ramGb: s["Unnamed: 6"] || 0,
        cpuCores: s["Unnamed: 7"] || 0,
        cpuModel: s["Unnamed: 8"],
        storageType: s["Unnamed: 9"],
        storageGb: s["Unnamed: 10"] || 0,
        recommendedOs: s["Unnamed: 11"],
        software: s["Unnamed: 12"],
      },
    });
  }

  console.log('Seeding Terminal Requirements...');
  const terminals = data.BD_Terminais.slice(2);
  for (const t of terminals) {
    if (!t["BANCO DE DADOS - TERMINAIS"]) continue;
    const tId = `terminal-${t["BANCO DE DADOS - TERMINAIS"]}-${t["Unnamed: 1"]}-${t["Unnamed: 2"]}`;
    await prisma.terminalRequirement.upsert({
      where: { id: tId },
      update: {},
      create: {
        id: tId,
        terminalType: t["BANCO DE DADOS - TERMINAIS"],
        os: t["Unnamed: 1"],
        application: t["Unnamed: 2"],
        ramGb: t["Unnamed: 3"] || 0,
        cpuModel: t["Unnamed: 4"],
        storageType: t["Unnamed: 5"],
        storageGb: t["Unnamed: 6"] || 0,
        minResolution: t["Unnamed: 7"],
        soDistribution: t["Unnamed: 8"],
        observations: t["Unnamed: 9"],
      },
    });
  }

  console.log('Seeding Internet Requirements...');
  const internet = data.BD_Internet.slice(2);
  for (const i of internet) {
    if (!i["BANCO DE DADOS - REQUISITOS DE INTERNET"]) continue;
    const iId = `internet-${i["BANCO DE DADOS - REQUISITOS DE INTERNET"]}`;
    await prisma.internetRequirement.upsert({
      where: { id: iId },
      update: {},
      create: {
        id: iId,
        linkType: i["BANCO DE DADOS - REQUISITOS DE INTERNET"],
        uploadMb: i["Unnamed: 1"] || 0,
        downloadMb: i["Unnamed: 2"] || 0,
        observations: i["Unnamed: 3"],
      },
    });
  }

  // --- 7. Infrastructure Requirements ---
  console.log('Seeding Basic Infrastructure Requirements...');
  const infraRequirements = [
    { id: 'infra-rede-local', name: 'Rede Local', serverType: ServerType.application, minRamGb: 8, minDiskGb: 100, description: 'Requisitos básicos para rede local' },
    { id: 'infra-db-principal', name: 'Banco de Dados Principal', serverType: ServerType.database, minRamGb: 16, minDiskGb: 500, description: 'Configuração padrão para servidor de DB' }
  ];

  for (const infra of infraRequirements) {
    await prisma.infrastructureRequirement.upsert({
      where: { id: infra.id },
      update: {},
      create: infra
    });
  }

  // --- 8. Dynamic Menus ---
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
      icon: 'Users',
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
      icon: 'Truck',
      route: '/migrations',
      order: 3,
      roles: [AppRole.admin, AppRole.migrador],
    },
    {
      id: 'menu-infra',
      label: 'Infraestrutura',
      icon: 'Server',
      route: '/infrastructure',
      order: 4,
      roles: [AppRole.admin, AppRole.support],
    },
    {
      id: 'menu-admin',
      label: 'Administração',
      icon: 'Settings',
      route: null,
      order: 5,
      roles: [AppRole.admin],
      submenus: [
        { label: 'Usuários', route: '/admin/users', order: 1, roles: [AppRole.admin] },
        { label: 'Menus', route: '/admin/menus', order: 2, roles: [AppRole.admin] },
      ]
    },
  ];

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
        submenus: submenus ? { create: submenus } : undefined,
      }
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
