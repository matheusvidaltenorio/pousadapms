import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { PropertyRole } from '@prisma/client';

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  isActive: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista usuários da propriedade. Apenas admin.
   */
  async findAllByProperty(propertyId: string): Promise<UserListItem[]> {
    const list = await this.prisma.propertyUser.findMany({
      where: { propertyId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((pu) => ({
      id: pu.user.id,
      name: pu.user.name,
      email: pu.user.email,
      role: pu.role,
      createdAt: pu.user.createdAt,
      isActive: pu.user.isActive && pu.isActive,
    }));
  }

  /**
   * Atualiza o papel do usuário na propriedade. Apenas admin.
   */
  async updateRole(
    userId: string,
    propertyId: string,
    role: PropertyRole,
  ): Promise<void> {
    if (!['user', 'receptionist', 'admin'].includes(role)) {
      throw new ForbiddenException('Papel inválido');
    }
    const pu = await this.prisma.propertyUser.findUnique({
      where: {
        propertyId_userId: { propertyId, userId },
      },
    });
    if (!pu) throw new ForbiddenException('Usuário não vinculado a esta propriedade');
    await this.prisma.propertyUser.update({
      where: { id: pu.id },
      data: { role },
    });
  }

  /**
   * Desativa usuário (soft delete). Apenas admin.
   */
  async deactivate(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
}
