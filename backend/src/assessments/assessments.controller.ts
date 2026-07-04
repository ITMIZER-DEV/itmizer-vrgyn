import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentsController {
    constructor(private readonly assessmentsService: AssessmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new assessment' })
    @ApiResponse({ status: 201, description: 'Assessment successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    create(@Request() req, @Body() createAssessmentDto: CreateAssessmentDto) {
        return this.assessmentsService.create(req.user.userId, createAssessmentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all assessments' })
    @ApiResponse({ status: 200, description: 'List of assessments.' })
    findAll() {
        return this.assessmentsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an assessment by ID' })
    @ApiResponse({ status: 200, description: 'Assessment found.' })
    @ApiResponse({ status: 404, description: 'Assessment not found.' })
    findOne(@Param('id') id: string) {
        return this.assessmentsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an assessment' })
    @ApiResponse({ status: 200, description: 'Assessment successfully updated.' })
    @ApiResponse({ status: 404, description: 'Assessment not found.' })
    update(@Request() req, @Param('id') id: string, @Body() updateAssessmentDto: UpdateAssessmentDto) {
        return this.assessmentsService.update(id, req.user.userId, updateAssessmentDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an assessment' })
    @ApiResponse({ status: 200, description: 'Assessment successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Assessment not found.' })
    remove(@Request() req, @Param('id') id: string) {
        return this.assessmentsService.remove(id, req.user.userId);
    }

    @Get(':id/validate')
    @ApiOperation({ summary: 'Validate an assessment' })
    @ApiResponse({ status: 200, description: 'Validation results.' })
    @ApiResponse({ status: 404, description: 'Assessment not found.' })
    validate(@Request() req, @Param('id') id: string) {
        return this.assessmentsService.validateAssessment(id, req.user.userId);
    }

    @Post(':id/release')
    @ApiOperation({ summary: 'Toggle release status for a specific item/field in an assessment' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                itemId: { type: 'string', example: 'item-123' },
                field: { type: 'string', example: 'status' }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Release status toggled successfully.' })
    toggleRelease(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { itemId: string; field: string }
    ) {
        const userName = req.user.name || req.user.email || 'Usuário';
        return this.assessmentsService.toggleRelease(id, req.user.userId, body.itemId, body.field, userName);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'Get assessment history' })
    @ApiResponse({ status: 200, description: 'History entries.' })
    @ApiResponse({ status: 404, description: 'Assessment not found.' })
    getHistory(@Param('id') id: string) {
        return this.assessmentsService.getHistory(id);
    }
}
