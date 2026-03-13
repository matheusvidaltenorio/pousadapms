import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(
    @Query('propertyId') propertyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
  ) {
    if (!propertyId) return [];
    return this.expensesService.findAll(propertyId, {
      startDate,
      endDate,
      category,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Post()
  async create(
    @Body()
    data: {
      propertyId: string;
      category: string;
      description?: string;
      amount: number;
      expenseDate: string;
      paymentMethod?: string;
    },
  ) {
    return this.expensesService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      category?: string;
      description?: string;
      amount?: number;
      expenseDate?: string;
      paymentMethod?: string;
    },
  ) {
    return this.expensesService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }
}
