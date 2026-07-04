import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('infrastructure')
@Controller('infrastructure')
export class InfrastructureController {
    constructor(private readonly infrastructureService: InfrastructureService) { }

    @Get('servers')
    @ApiOperation({ summary: 'Retrieve all server infrastructure requirements' })
    @ApiResponse({ status: 200, description: 'List of server requirements.' })
    findAllServers() {
        return this.infrastructureService.findAllServers();
    }

    @Patch('servers/:id')
    @ApiOperation({ summary: 'Update a server infrastructure requirement' })
    @ApiBody({ schema: { type: 'object', description: 'Server requirement data' } })
    @ApiResponse({ status: 200, description: 'Server requirement updated.' })
    @ApiResponse({ status: 404, description: 'Server requirement not found.' })
    updateServer(@Param('id') id: string, @Body() data: any) {
        return this.infrastructureService.updateServer(id, data);
    }

    @Get('terminals')
    @ApiOperation({ summary: 'Retrieve all terminal infrastructure requirements' })
    @ApiResponse({ status: 200, description: 'List of terminal requirements.' })
    findAllTerminals() {
        return this.infrastructureService.findAllTerminals();
    }

    @Patch('terminals/:id')
    @ApiOperation({ summary: 'Update a terminal infrastructure requirement' })
    @ApiBody({ schema: { type: 'object', description: 'Terminal requirement data' } })
    @ApiResponse({ status: 200, description: 'Terminal requirement updated.' })
    @ApiResponse({ status: 404, description: 'Terminal requirement not found.' })
    updateTerminal(@Param('id') id: string, @Body() data: any) {
        return this.infrastructureService.updateTerminal(id, data);
    }

    @Get('internet')
    @ApiOperation({ summary: 'Retrieve all internet infrastructure requirements' })
    @ApiResponse({ status: 200, description: 'List of internet requirements.' })
    findAllInternet() {
        return this.infrastructureService.findAllInternet();
    }

    @Patch('internet/:id')
    @ApiOperation({ summary: 'Update an internet infrastructure requirement' })
    @ApiBody({ schema: { type: 'object', description: 'Internet requirement data' } })
    @ApiResponse({ status: 200, description: 'Internet requirement updated.' })
    @ApiResponse({ status: 404, description: 'Internet requirement not found.' })
    updateInternet(@Param('id') id: string, @Body() data: any) {
        return this.infrastructureService.updateInternet(id, data);
    }
}
