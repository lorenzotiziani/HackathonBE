import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.utente.create({
        data: {
          ...createUserDto,
          ruolo: 'CITTADINO',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.utente.findMany();
    return users.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ password, ...userWithoutPassword }) => userWithoutPassword,
    );
  }

  async findOne(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.utente.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utente con ID ${id} non trovato`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPsw } = user;

    return userWithoutPsw;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.utente.findFirst({
      where: { email: email.toLowerCase() },
    });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'> | null> {
    try {
      const updated = await this.prisma.utente.update({
        where: { id },
        data: updateUserDto,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPsw } = updated;

      return userWithoutPsw;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Utente con ID ${id} non trovato`);
        }
      }
      throw new InternalServerErrorException(
        'Errore nell’aggiornamento utente',
      );
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.utente.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Utente ${id} eliminato`,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Impossibile eliminare: Utente ${id} non trovato`,
          );
        }
      }

      throw new InternalServerErrorException(
        'Errore nella cancellazione utente',
      );
    }
  }
}
