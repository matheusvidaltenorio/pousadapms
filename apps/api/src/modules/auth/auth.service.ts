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
    currentPropertyId?: string;
  };
  currentProperty?: {
    id: string;
    name: string;
  };
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

    const firstProperty = user.propertyUsers[0]?.property;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currentPropertyId: firstProperty?.id,
      },
      currentProperty: firstProperty
        ? { id: firstProperty.id, name: firstProperty.name }
        : undefined,
    };
  }
}
