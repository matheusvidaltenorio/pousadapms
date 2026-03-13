import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard que verifica se o usuário tem um dos roles permitidos na propriedade atual.
 * propertyId deve vir em query ou body da requisição.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.propertyUsers) throw new ForbiddenException('Acesso negado');

    const propertyId = request.query?.propertyId || request.body?.propertyId;
    if (!propertyId) throw new ForbiddenException('propertyId é obrigatório');

    const pu = user.propertyUsers.find(
      (p: { propertyId: string; role: string }) => p.propertyId === propertyId,
    );
    if (!pu || !requiredRoles.includes(pu.role)) {
      throw new ForbiddenException('Acesso restrito a administradores');
    }
    return true;
  }
}
