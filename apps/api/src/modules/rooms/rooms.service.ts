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

  async createRoom(data: {
    propertyId: string;
    roomTypeId: string;
    number: string;
    floor?: number;
    notes?: string;
  }) {
    return this.prisma.room.create({
      data: {
        propertyId: data.propertyId,
        roomTypeId: data.roomTypeId,
        number: data.number,
        floor: data.floor ?? 1,
        notes: data.notes,
      },
      include: { roomType: true },
    });
  }

  async updateRoom(
    id: string,
    data: {
      number?: string;
      roomTypeId?: string;
      floor?: number;
      notes?: string;
      status?: RoomStatus;
    },
  ) {
    const updateData: any = {};
    if (data.number !== undefined) updateData.number = data.number;
    if (data.roomTypeId !== undefined) updateData.roomTypeId = data.roomTypeId;
    if (data.floor !== undefined) updateData.floor = data.floor;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (Object.keys(updateData).length === 0) {
      return this.prisma.room.findUniqueOrThrow({ where: { id }, include: { roomType: true } });
    }
    return this.prisma.room.update({
      where: { id },
      data: updateData,
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
