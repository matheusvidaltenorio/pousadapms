import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    propertyId: string,
    params?: { startDate?: string; endDate?: string; category?: string },
  ) {
    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (params?.category) where.category = params.category;
    if (params?.startDate && params?.endDate) {
      where.expenseDate = {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate),
      };
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: {
    propertyId: string;
    category: string;
    description?: string;
    amount: number;
    expenseDate: string;
    paymentMethod?: string;
  }) {
    return this.prisma.expense.create({
      data: {
        propertyId: data.propertyId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        expenseDate: new Date(data.expenseDate),
        paymentMethod: data.paymentMethod,
      },
    });
  }

  async update(
    id: string,
    data: {
      category?: string;
      description?: string;
      amount?: number;
      expenseDate?: string;
      paymentMethod?: string;
    },
  ) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.category && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.expenseDate && { expenseDate: new Date(data.expenseDate) }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
