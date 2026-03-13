import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/database/prisma.service';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    currentPropertyId?: string;
  };
  currentProperty?: {
    id: string;
    name: string;
  };
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Serviço de autenticação.
 * - valida credenciais (email + senha)
 * - gera JWT
 * - não expõe password_hash na resposta
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<LoginOutput> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase(), isActive: true },
      include: {
        propertyUsers: {
          where: { isActive: true },
          include: { property: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualiza lastLoginAt (opcional, pode ser assíncrono)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    const firstPropertyUser = user.propertyUsers[0];
    const firstProperty = firstPropertyUser?.property;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: firstPropertyUser?.role,
        currentPropertyId: firstProperty?.id,
      },
      currentProperty: firstProperty
        ? { id: firstProperty.id, name: firstProperty.name }
        : undefined,
    };
  }

  /**
   * Registro de novo usuário.
   * - email único
   * - senha com hash bcrypt
   * - vinculado à primeira propriedade com role 'user'
   */
  async register(input: RegisterInput): Promise<{ message: string }> {
    const email = input.email.toLowerCase().trim();
    if (!input.name?.trim()) {
      throw new UnauthorizedException('Nome é obrigatório');
    }
    if (!input.password || input.password.length < 6) {
      throw new UnauthorizedException('Senha deve ter pelo menos 6 caracteres');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new UnauthorizedException('Este e-mail já está cadastrado');
    }

    const property = await this.prisma.property.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!property) {
      throw new UnauthorizedException('Sistema ainda não configurado. Entre em contato com o suporte.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: input.name.trim(),
          isActive: true,
        },
      });
      await tx.propertyUser.create({
        data: {
          propertyId: property.id,
          userId: user.id,
          role: 'user',
          isActive: true,
        },
      });
    });

    return { message: 'Conta criada com sucesso. Faça login para continuar.' };
  }
}
