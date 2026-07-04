import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecemVrService } from './recem-vr.service';
import { CreateRecemVrDto } from './dto/create-recem-vr.dto';
import { UpdatePlanejamentoDto } from './dto/update-planejamento.dto';
import { CreateAcompanhamentoDto } from './dto/create-acompanhamento.dto';

@ApiTags('recem-vr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recem-vr')
export class RecemVrController {
  constructor(private readonly recemVrService: RecemVrService) {}

  // ETAPA 1: Solicitação
  @Post()
  @ApiOperation({ summary: 'Criar solicitação de Recém VR (Time de Implantação)' })
  create(@Request() req, @Body() dto: CreateRecemVrDto) {
    return this.recemVrService.create(dto, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os Recém VR' })
  findAll() {
    return this.recemVrService.findAll();
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Listar Recém VR de um cliente' })
  findByClient(@Param('clientId') clientId: string) {
    return this.recemVrService.findByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um Recém VR' })
  findOne(@Param('id') id: string) {
    return this.recemVrService.findOne(id);
  }

  // ETAPA 2: Planejamento
  @Patch(':id/planejamento')
  @ApiOperation({ summary: 'Atualizar planejamento (Time de Suporte)' })
  updatePlanejamento(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePlanejamentoDto,
  ) {
    return this.recemVrService.updatePlanejamento(id, dto, req.user?.userId);
  }

  // ETAPA 3: Acompanhamento
  @Post(':id/acompanhamento')
  @ApiOperation({ summary: 'Registrar reunião de acompanhamento' })
  createAcompanhamento(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateAcompanhamentoDto,
  ) {
    return this.recemVrService.createAcompanhamento(id, dto, req.user?.userId);
  }

  @Delete(':id/acompanhamento/:acompId')
  @ApiOperation({ summary: 'Remover um acompanhamento' })
  removeAcompanhamento(
    @Param('id') id: string,
    @Param('acompId') acompId: string,
  ) {
    return this.recemVrService.removeAcompanhamento(id, acompId);
  }

  // Histórico
  @Get(':id/history')
  @ApiOperation({ summary: 'Histórico de alterações do Recém VR' })
  getHistory(@Param('id') id: string) {
    return this.recemVrService.getHistory(id);
  }

  // ===== AÇÕES EXCLUSIVAS DE ADMIN =====

  @Patch(':id/cancelar')
  @ApiOperation({ summary: '[ADMIN] Cancelar um Recém VR' })
  cancelar(@Request() req, @Param('id') id: string) {
    if (!req.user?.roles?.includes('admin')) {
      throw new ForbiddenException('Apenas administradores podem cancelar um Recém VR.');
    }
    return this.recemVrService.cancelar(id, req.user?.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[ADMIN] Excluir permanentemente um Recém VR' })
  remove(@Request() req, @Param('id') id: string) {
    if (!req.user?.roles?.includes('admin')) {
      throw new ForbiddenException('Apenas administradores podem excluir um Recém VR.');
    }
    return this.recemVrService.remove(id, req.user?.userId);
  }
}
