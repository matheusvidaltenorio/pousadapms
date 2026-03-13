import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/jwt-auth.guard';

/**
 * Decorator @Public() - marca rota como pública (não exige JWT).
 * Exemplo: POST /auth/login deve ser pública.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
