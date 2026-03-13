import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../shared/database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Estratégia JWT para proteger rotas.
 * O token é extraído do header Authorization: Bearer <token>
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      include: {
        propertyUsers: {
          where: { isActive: true },
          include: { property: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
