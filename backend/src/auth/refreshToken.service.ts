import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private prisma: PrismaService) {}

  async create(data: { token: string; userId: number; expiresAt: Date }) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId: data.userId },
    });

    return this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
        isRevoked: false,
        createdAt: new Date(),
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async revokeByUserId(userId: number) {
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  async revokeByToken(token: string) {
    return this.prisma.refreshToken.updateMany({
      where: { token },
      data: {
        isRevoked: true,
      },
    });
  }
}
