import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Guest, Prisma } from '@prisma/client';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string, search?: string) {
    const where: Prisma.GuestWhereInput = { propertyId, deletedAt: null };
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.guest.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.guest.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Prisma.GuestCreateInput) {
    return this.prisma.guest.create({ data });
  }

  async update(id: string, data: Prisma.GuestUpdateInput) {
    return this.prisma.guest.update({
      where: { id },
      data,
    });
  }
}
