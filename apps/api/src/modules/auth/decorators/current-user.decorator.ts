import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator @CurrentUser() - injeta o usuário autenticado no parâmetro.
 * Requer JwtAuthGuard na rota.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
