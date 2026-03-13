import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Property, Prisma } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Property | null> {
    return this.prisma.property.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Prisma.PropertyCreateInput): Promise<Property> {
    return this.prisma.property.create({
      data,
    });
  }

  async update(id: string, data: Prisma.PropertyUpdateInput): Promise<Property> {
    return this.prisma.property.update({
      where: { id },
      data,
    });
  }
}
