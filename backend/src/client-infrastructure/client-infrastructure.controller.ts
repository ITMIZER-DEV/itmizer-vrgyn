import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientInfrastructureService } from './client-infrastructure.service';
import { CreateClientInfrastructureDto } from './dto/create-client-infrastructure.dto';
import { UpdateClientInfrastructureDto } from './dto/update-client-infrastructure.dto';

@ApiTags('client-infrastructure')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('client-infrastructure')
export class ClientInfrastructureController {
  constructor(private readonly service: ClientInfrastructureService) {}

  @Post()
  create(@Body() dto: CreateClientInfrastructureDto) {
    return this.service.create(dto);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientInfrastructureDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
