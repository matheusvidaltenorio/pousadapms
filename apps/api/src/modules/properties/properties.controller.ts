import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { Property } from '@prisma/client';

/**
 * Controller de propriedades.
 * Rotas: GET /properties, GET /properties/:id, POST /properties, PUT /properties/:id
 */
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll(): Promise<Property[]> {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Post()
  async create(@Body() data: Partial<Property>) {
    return this.propertiesService.create(data as any);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Property>) {
    return this.propertiesService.update(id, data as any);
  }
}
