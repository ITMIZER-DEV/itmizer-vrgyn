import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientTicketsService } from './client-tickets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientTicketsService', () => {
  let service: ClientTicketsService;
  const prismaMock = {
    clientTicket: {
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
      providers: [ClientTicketsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get<ClientTicketsService>(ClientTicketsService);
  });

  it('creates a ticket scoped to a client', async () => {
    prismaMock.clientTicket.create.mockResolvedValue({ id: '1', clientId: 'c1', numero: '1001' });
    const result = await service.create({
      clientId: 'c1',
      data: '2026-07-06',
      numero: '1001',
      assunto: 'Erro ao emitir NF-e',
      classificacao: 'ALTA' as any,
    });
    expect(prismaMock.clientTicket.create).toHaveBeenCalledWith({
      data: { clientId: 'c1', data: '2026-07-06', numero: '1001', assunto: 'Erro ao emitir NF-e', classificacao: 'ALTA' },
    });
    expect(result.id).toBe('1');
  });

  it('lists tickets filtered by clientId ordered by data desc', async () => {
    prismaMock.clientTicket.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findByClient('c1');
    expect(prismaMock.clientTicket.findMany).toHaveBeenCalledWith({
      where: { clientId: 'c1' },
      orderBy: { data: 'desc' },
    });
    expect(result).toHaveLength(1);
  });

  it('throws NotFoundException when updating a ticket that does not exist', async () => {
    prismaMock.clientTicket.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { numero: '9999' } as any)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when removing a ticket that does not exist', async () => {
    prismaMock.clientTicket.findUnique.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
