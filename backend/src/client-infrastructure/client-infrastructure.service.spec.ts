import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientInfrastructureService } from './client-infrastructure.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientInfrastructureService', () => {
  let service: ClientInfrastructureService;
  const prismaMock = {
    clientInfrastructure: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [ClientInfrastructureService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get<ClientInfrastructureService>(ClientInfrastructureService);
  });

  it('creates an infrastructure record scoped to a client', async () => {
    prismaMock.clientInfrastructure.create.mockResolvedValue({ id: '1', clientId: 'c1', nome: 'Servidor 1' });
    const result = await service.create({ clientId: 'c1', type: 'SERVIDOR_BANCO' as any, nome: 'Servidor 1' });
    expect(prismaMock.clientInfrastructure.create).toHaveBeenCalledWith({
      data: { clientId: 'c1', type: 'SERVIDOR_BANCO', nome: 'Servidor 1' },
    });
    expect(result.id).toBe('1');
  });

  it('lists infrastructure filtered by clientId', async () => {
    prismaMock.clientInfrastructure.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findByClient('c1');
    expect(prismaMock.clientInfrastructure.findMany).toHaveBeenCalledWith({
      where: { clientId: 'c1' },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toHaveLength(1);
  });

  it('throws NotFoundException when updating a record that does not exist', async () => {
    prismaMock.clientInfrastructure.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { nome: 'X' } as any)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when removing a record that does not exist', async () => {
    prismaMock.clientInfrastructure.findUnique.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
