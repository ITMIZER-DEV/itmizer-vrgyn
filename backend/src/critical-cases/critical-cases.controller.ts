import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CriticalCasesService } from './critical-cases.service';
import { CreateCriticalCaseDto } from './dto/create-critical-case.dto';
import { UpdateCriticalCaseDto } from './dto/update-critical-case.dto';
import { CreateAcompanhamentoDto } from './dto/create-acompanhamento.dto';
import { CriticalCaseCategory, CriticalCaseStatus } from '@prisma/client';

@ApiTags('critical-cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('critical-cases')
export class CriticalCasesController {
  constructor(private readonly service: CriticalCasesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar caso crítico de suporte' })
  create(@Request() req, @Body() dto: CreateCriticalCaseDto) {
    return this.service.create(dto, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar casos críticos com filtros' })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('status') status?: CriticalCaseStatus,
    @Query('category') category?: CriticalCaseCategory,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ clientId, status, category, search });
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Listar casos críticos de um cliente' })
  findByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar detalhes de um caso crítico com acompanhamentos' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar caso crítico' })
  update(@Param('id') id: string, @Body() dto: UpdateCriticalCaseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir caso crítico' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // === EVOLUÇÕES E ACOMPANHAMENTOS ===

  @Post(':id/acompanhamentos')
  @ApiOperation({ summary: 'Adicionar nova evolução / acompanhamento ao caso crítico' })
  addAcompanhamento(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateAcompanhamentoDto,
  ) {
    return this.service.addAcompanhamento(id, dto, req.user?.userId);
  }

  @Get(':id/acompanhamentos')
  @ApiOperation({ summary: 'Listar evoluções de um caso crítico' })
  getAcompanhamentos(@Param('id') id: string) {
    return this.service.getAcompanhamentos(id);
  }

  @Delete('acompanhamentos/:acompanhamentoId')
  @ApiOperation({ summary: 'Excluir uma evolução' })
  deleteAcompanhamento(@Param('acompanhamentoId') acompanhamentoId: string) {
    return this.service.deleteAcompanhamento(acompanhamentoId);
  }
}
