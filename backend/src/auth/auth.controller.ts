import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import z from 'zod';
import { RegisterUserDto } from 'src/user/dto/create-user.dto';
import { ZodValidationPipe } from 'nestjs-zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

@ApiTags('auth')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterUserDto) {
    const registerResult = await this.authService.register(dto);
    return { success: true, data: registerResult };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  @ApiBody({ schema: { example: { email: 'user@example.com', password: 'Password1!' } } })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: z.infer<typeof LoginSchema>,
  ) {
    const loginResult = await this.authService.login(body.email, body.password);
    return { success: true, data: loginResult };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    const refreshResult = await this.authService.refreshToken(refreshToken);
    return { success: true, data: refreshResult };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Revoke refresh token and logout' })
  async logout(@Body('refreshToken') refreshToken: string) {
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    return { success: true, message: 'Logout effettuato con successo' };
  }
}
