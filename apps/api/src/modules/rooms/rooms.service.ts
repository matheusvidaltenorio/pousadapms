import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Room, RoomType, RoomStatus } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllRooms(propertyId?: string) {
    const where = propertyId ? { propertyId, deletedAt: null } : { deletedAt: null };
    return this.prisma.room.findMany({
      where,
      include: { roomType: true },
      orderBy: [{ sortOrder: 'asc' }, { number: 'asc' }],
    });
  }

  async findAllRoomTypes(propertyId?: string) {
    const where = propertyId ? { propertyId, deletedAt: null } : { deletedAt: null };
    return this.prisma.roomType.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createRoom(data: { propertyId: string; roomTypeId: string; number: string; floor?: number }) {
    return this.prisma.room.create({
      data: {
        ...data,
        floor: data.floor ?? 1,
      },
      include: { roomType: true },
    });
  }

  async updateRoomStatus(id: string, status: RoomStatus) {
    return this.prisma.room.update({
      where: { id },
      data: { status },
    });
  }

  async createRoomType(data: {
    propertyId: string;
    name: string;
    description?: string;
    maxGuests?: number;
    basePrice: number;
  }) {
    return this.prisma.roomType.create({
      data: {
        ...data,
        maxGuests: data.maxGuests ?? 2,
      },
    });
  }
}
