import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientTicketDto } from './dto/create-client-ticket.dto';
import { UpdateClientTicketDto } from './dto/update-client-ticket.dto';

@Injectable()
export class ClientTicketsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateClientTicketDto) {
    return this.prisma.clientTicket.create({ data });
  }

  findByClient(clientId: string) {
    return this.prisma.clientTicket.findMany({
      where: { clientId },
      orderBy: { data: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.clientTicket.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Ticket não encontrado');
    return item;
  }

  async update(id: string, data: UpdateClientTicketDto) {
    await this.findOne(id);
    return this.prisma.clientTicket.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.clientTicket.delete({ where: { id } });
  }
}
