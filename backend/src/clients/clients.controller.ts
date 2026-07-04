import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new client' })
    @ApiResponse({ status: 201, description: 'Client successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    create(@Request() req, @Body() createClientDto: CreateClientDto) {
        return this.clientsService.create(req.user.userId, createClientDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all clients' })
    @ApiResponse({ status: 200, description: 'List of all clients.' })
    findAll() {
        return this.clientsService.findAll();
    }

    @Get('search')
    @ApiOperation({ summary: 'Search clients by name or cnpj snippet' })
    search(@Query('q') q: string) {
        if (!q || q.length < 3) return [];
        return this.clientsService.search(q);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a client by ID' })
    @ApiResponse({ status: 200, description: 'Client found.' })
    @ApiResponse({ status: 404, description: 'Client not found.' })
    findOne(@Param('id') id: string) {
        return this.clientsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a client' })
    @ApiResponse({ status: 200, description: 'Client successfully updated.' })
    @ApiResponse({ status: 404, description: 'Client not found.' })
    update(@Request() req, @Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
        return this.clientsService.update(id, req.user.userId, updateClientDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a client' })
    @ApiResponse({ status: 200, description: 'Client successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Client not found.' })
    remove(@Param('id') id: string) {
        return this.clientsService.remove(id);
    }
}
