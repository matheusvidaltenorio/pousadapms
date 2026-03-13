import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomStatus } from '@prisma/client';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async findAllRooms(@Query('propertyId') propertyId?: string) {
    return this.roomsService.findAllRooms(propertyId);
  }

  @Get('types')
  async findAllRoomTypes(@Query('propertyId') propertyId?: string) {
    return this.roomsService.findAllRoomTypes(propertyId);
  }

  @Post()
  async createRoom(
    @Body()
    data: {
      propertyId: string;
      roomTypeId: string;
      number: string;
      floor?: number;
      notes?: string;
    },
  ) {
    return this.roomsService.createRoom(data);
  }

  @Put(':id')
  async updateRoom(
    @Param('id') id: string,
    @Body()
    data: {
      number?: string;
      roomTypeId?: string;
      floor?: number;
      notes?: string;
      status?: RoomStatus;
    },
  ) {
    return this.roomsService.updateRoom(id, data);
  }

  @Put(':id/status')
  async updateRoomStatus(@Param('id') id: string, @Body() body: { status: RoomStatus }) {
    return this.roomsService.updateRoomStatus(id, body.status);
  }

  @Post('types')
  async createRoomType(
    @Body()
    data: {
      propertyId: string;
      name: string;
      description?: string;
      maxGuests?: number;
      basePrice: number;
    },
  ) {
    return this.roomsService.createRoomType(data);
  }
}
