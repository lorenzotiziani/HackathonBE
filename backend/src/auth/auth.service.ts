import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RefreshTokenService } from './refreshToken.service';
import { JwtPayload } from './entities/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async register(dto: RegisterUserDto) {
    const userExists = await this.userService.findByEmail(dto.email);
    if (userExists) {
      throw new ConflictException('email già registrata');
    }

    const hashedPsw = await bcrypt.hash(dto.password, 10);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...dataToSave } = dto;

    const user = await this.userService.create({
      ...dataToSave,
      password: hashedPsw,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Registrazione completata.',
      user: userWithoutPassword,
    };
  }

  async login(email: string, pass: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenziali errate');
    }

    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Credenziali errate');
    }

    await this.refreshTokenService.revokeByUserId(user.id);

    const { accessToken, refreshToken } = await this.generateTokens(user);

    await this.refreshTokenService.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    const storedToken = await this.refreshTokenService.findByToken(token);

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token non valido');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.refreshTokenService.revokeByToken(token);
      throw new UnauthorizedException('Refresh token scaduto');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET as string,
      });
    } catch (err) {
      await this.refreshTokenService.revokeByToken(token);
      throw new UnauthorizedException('Refresh token non valido: ' + err);
    }

    const user = await this.userService.findOne(payload.userId);

    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }

    await this.refreshTokenService.revokeByToken(token);

    const { accessToken, refreshToken } = await this.generateTokens(user);

    await this.refreshTokenService.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const storedToken =
      await this.refreshTokenService.findByToken(refreshToken);

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token non valido');
    }

    await this.refreshTokenService.revokeByToken(refreshToken);
  }

  async generateTokens(user: {
    id: number;
    email: string;
    ruolo?: string | null;
  }) {
    const payload = {
      userId: user.id,
      email: user.email,
      ruolo: user.ruolo ?? '',
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }
}
