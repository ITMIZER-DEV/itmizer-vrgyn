import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Req, UnauthorizedException } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { CreateMigrationDto } from './dto/create-migration.dto';
import { UpdateMigrationDto } from './dto/update-migration.dto';
import { CreateHistoryDto } from './dto/create-history.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('migrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('migrations')
export class MigrationController {
    constructor(
        private readonly migrationService: MigrationService,
        private readonly authService: AuthService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new migration' })
    @ApiResponse({ status: 201, description: 'Migration successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    create(@Request() req, @Body() data: CreateMigrationDto) {
        return this.migrationService.create(data, req.user.userId);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all migrations' })
    @ApiResponse({ status: 200, description: 'List of all migrations.' })
    findAll() {
        return this.migrationService.findAll();
    }

    @Get('client/:clientId')
    @ApiOperation({ summary: 'Get migrations by client ID' })
    @ApiResponse({ status: 200, description: 'List of migrations for the client.' })
    findByClient(@Param('clientId') clientId: string) {
        return this.migrationService.findByClient(clientId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a migration by ID' })
    @ApiResponse({ status: 200, description: 'Migration details.' })
    @ApiResponse({ status: 404, description: 'Migration not found.' })
    findOne(@Param('id') id: string) {
        return this.migrationService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a migration' })
    @ApiResponse({ status: 200, description: 'Migration successfully updated.' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
    @ApiResponse({ status: 404, description: 'Migration not found.' })
    update(@Req() req, @Param('id') id: string, @Body() data: UpdateMigrationDto) {
        const roles = req.user.roles?.map((r: any) => r.role) || [];
        if (roles.includes('migrador') && !roles.includes('admin')) {
            throw new UnauthorizedException('Migradores só podem adicionar lançamentos financeiros.');
        }
        if (roles.includes('implantador') && !roles.includes('admin')) {
            throw new UnauthorizedException('Implantadores só podem adicionar histórico.');
        }
        return this.migrationService.update(id, data, req.user.userId);
    }

    @Post(':id/history')
    @ApiOperation({ summary: 'Add a history record to a migration' })
    @ApiResponse({ status: 201, description: 'History record added.' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
    async addHistory(
        @Param('id') id: string,
        @Body() createHistoryDto: CreateHistoryDto,
        @Req() req: any,
    ) {
        const roles = req.user.roles?.map((r: any) => r.role) || [];
        if (roles.includes('migrador') && !roles.includes('admin')) {
            throw new UnauthorizedException('Acesso negado para Migradores.');
        }
        return this.migrationService.addHistory(id, createHistoryDto, req.user?.userId);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'Get migration history' })
    @ApiResponse({ status: 200, description: 'History entries.' })
    @ApiResponse({ status: 404, description: 'Migration not found.' })
    getHistory(@Param('id') id: string) {
        return this.migrationService.getHistory(id);
    }

    @Post(':id/lancamentos')
    @ApiOperation({ summary: 'Add a financial entry (lançamento) to a migration' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                horas: { type: 'number', example: 5 },
                valor: { type: 'number', example: 750 },
                descricao: { type: 'string', example: 'Migration work' }
            }
        }
    })
    @ApiResponse({ status: 201, description: 'Financial entry added.' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
    async addLancamento(
        @Param('id') id: string,
        @Body() data: any,
        @Req() req: any,
    ) {
        const roles = req.user.roles?.map((r: any) => r.role) || [];
        if (roles.includes('implantador') && !roles.includes('admin')) {
            throw new UnauthorizedException('Acesso negado para Implantadores.');
        }
        return this.migrationService.addLancamento(id, data, req.user?.userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a migration' })
    @ApiResponse({ status: 200, description: 'Migration successfully deleted.' })
    @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
    async remove(@Param('id') id: string, @Req() req: any) {
        const roles = req.user.roles?.map((r: any) => r.role) || [];
        if ((roles.includes('migrador') || roles.includes('implantador')) && !roles.includes('admin')) {
            throw new UnauthorizedException('Permissão insuficiente para excluir migração.');
        }
        return this.migrationService.remove(id);
    }

    @Post(':id/chargeback')
    @ApiOperation({ summary: 'Perform a chargeback (estorno) for a migration' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                password: { type: 'string', example: 'admin-password' },
                reason: { type: 'string', example: 'Billing mistake' }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Chargeback successfully performed.' })
    @ApiResponse({ status: 401, description: 'Invalid password.' })
    @ApiResponse({ status: 403, description: 'Only admins can perform chargebacks.' })
    async chargeback(
        @Param('id') id: string,
        @Body() body: { password: string; reason: string },
        @Req() req: any,
    ) {
        const roles = req.user.roles?.map((r: any) => r.role) || [];
        if (!roles.includes('admin')) {
            throw new UnauthorizedException('Apenas administradores podem realizar estornos.');
        }

        const user = await this.authService.validateUser(req.user.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Senha incorreta. Estorno não autorizado.');
        }

        if (!body.reason || body.reason.trim().length < 5) {
            throw new UnauthorizedException('É obrigatório informar um motivo válido para o estorno.');
        }

        return this.migrationService.chargeback(id, req.user.userId, body.reason, req.user.name);
    }
}
