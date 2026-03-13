import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { GuestsService } from './guests.service';

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  async findAll(
    @Query('propertyId') propertyId: string,
    @Query('search') search?: string,
  ) {
    if (!propertyId) return [];
    return this.guestsService.findAll(propertyId, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.guestsService.findById(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.guestsService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.guestsService.update(id, data);
  }
}
