import { ConflictException, Injectable } from '@nestjs/common';
import { CreateIniziativaDto } from './dto/create-iniziativa.dto';
import { UpdateIniziativaDto } from './dto/update-iniziativa.dto';
import { PrismaService } from 'prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class IniziativaService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async create(
    userId: number,
    dto: CreateIniziativaDto,
    file?: Express.Multer.File,
  ) {
    const immagineUrl = file
      ? await this.storage.uploadImmagine(file)
      : undefined;

    return this.prisma.iniziativa.create({
      data: {
        titolo: dto.titolo,
        descrizione: dto.descrizione,
        luogo: dto.luogo,
        dataInizio: dto.dataInizio,
        dataFine: dto.dataFine,
        immagineUrl,
        creatoreId: userId,
      },
    });
  }

  async findAll() {
    return await this.prisma.iniziativa.findMany({
      include: { partecipanti: true },
    });
  }

  async findOne(id: number) {
    return await this.prisma.iniziativa.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateIniziativaDto: UpdateIniziativaDto) {
    const iniziativa = await this.prisma.iniziativa.findFirst({
      where: { id },
    });

    if (!iniziativa) {
      throw new NotFoundException(`segnalazione con id ${id} non presente`);
    }

    return await this.prisma.iniziativa.update({
      where: { id },
      data: updateIniziativaDto,
    });
  }

  async remove(id: number) {
    const iniziativa = await this.prisma.iniziativa.findFirst({
      where: { id },
    });

    if (!iniziativa) {
      throw new NotFoundException(`segnalazione con id ${id} non presente`);
    }

    return await this.prisma.iniziativa.delete({
      where: { id },
    });
  }

  async partecipa(id: number, userId: number) {
    const iniziativa = await this.prisma.partecipazioneIniziativa.findFirst({
      where: {
        iniziativaId: id,
        utenteId: userId,
      },
    });

    if (iniziativa) {
      throw new ConflictException(`segnalazione con id ${id} non presente`);
    }

    return this.prisma.partecipazioneIniziativa.create({
      data: {
        iniziativaId: id,
        utenteId: userId,
      },
    });
  }
}
