import { Controller, Post, Body } from '@nestjs/common';
import { AuthService, LoginInput, RegisterInput } from './auth.service';
import { Public } from './decorators/public.decorator';

/**
 * Controller de autenticação.
 * POST /auth/login - recebe email e senha, retorna JWT e dados do usuário.
 * POST /auth/register - cria nova conta (role padrão: user).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginInput) {
    return this.authService.login({
      email: body.email,
      password: body.password,
    });
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterInput) {
    return this.authService.register({
      name: body.name,
      email: body.email,
      password: body.password,
    });
  }
}
