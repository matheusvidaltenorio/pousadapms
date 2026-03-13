import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PropertyRole } from '@prisma/client';

/**
 * Controller de usuários. Apenas administradores.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query('propertyId') propertyId: string) {
    if (!propertyId) return [];
    return this.usersService.findAllByProperty(propertyId);
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') userId: string,
    @Body() body: { propertyId: string; role: PropertyRole },
  ) {
    return this.usersService.updateRole(userId, body.propertyId, body.role);
  }

  @Delete(':id')
  async deactivate(
    @Param('id') userId: string,
    @Query('propertyId') propertyId: string,
  ) {
    if (!propertyId) throw new ForbiddenException('propertyId é obrigatório');
    return this.usersService.deactivate(userId);
  }
}