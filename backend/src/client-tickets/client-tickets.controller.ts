import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientTicketsService } from './client-tickets.service';
import { CreateClientTicketDto } from './dto/create-client-ticket.dto';
import { UpdateClientTicketDto } from './dto/update-client-ticket.dto';

@ApiTags('client-tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('client-tickets')
export class ClientTicketsController {
  constructor(private readonly service: ClientTicketsService) {}

  @Post()
  create(@Body() dto: CreateClientTicketDto) {
    return this.service.create(dto);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientTicketDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
