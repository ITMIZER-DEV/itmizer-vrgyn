import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createWithProfile(createUserDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all users' })
    @ApiResponse({ status: 200, description: 'List of all users.' })
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a user by ID' })
    @ApiResponse({ status: 200, description: 'User found.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a user' })
    @ApiResponse({ status: 200, description: 'User successfully updated.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(':id/toggle-active')
    @ApiOperation({ summary: 'Toggle user active status' })
    @ApiResponse({ status: 200, description: 'Status successfully toggled.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    toggleActive(@Param('id') id: string) {
        return this.usersService.toggleActive(id);
    }

    @Patch(':id/role')
    @ApiOperation({ summary: 'Update a user role directly' })
    @ApiResponse({ status: 200, description: 'User role successfully updated.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.usersService.updateRole(id, role);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    @ApiResponse({ status: 200, description: 'User successfully deleted.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
