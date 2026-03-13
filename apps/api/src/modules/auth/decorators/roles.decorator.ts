import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator @Roles - restringe rota a usuários com um dos roles informados.
 * Usado com RolesGuard. Exemplo: @Roles('admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
