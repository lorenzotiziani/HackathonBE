import { Injectable } from '@nestjs/common';
import { CreateSegnalazioneDto } from './dto/create-segnalazione.dto';
import { UpdateSegnalazioneDto } from './dto/update-segnalazione.dto';
import { PrismaService } from 'prisma/prisma.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import {
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Ruolo, StatoSegnalazione, TipoVoto } from '@prisma/client';
import { StorageService } from 'src/storage/storage.service';

const TRANSIZIONI: Record<
  StatoSegnalazione,
  { a: StatoSegnalazione; ruoli: Ruolo[] }[]
> = {
  SEGNALATO: [
    { a: 'IN_APPROVAZIONE', ruoli: ['COMUNE'] },
    { a: 'ANNULLATO', ruoli: ['COMUNE'] },
  ],
  IN_APPROVAZIONE: [
    { a: 'IN_LAVORAZIONE', ruoli: ['COMUNE'] },
    { a: 'ANNULLATO', ruoli: ['COMUNE'] },
  ],
  IN_LAVORAZIONE: [
    { a: 'RISOLTO', ruoli: ['COMUNE'] },
    { a: 'ANNULLATO', ruoli: ['COMUNE'] },
  ],
  RISOLTO: [], // stato finale
  ANNULLATO: [], // stato finale
};

@Injectable()
export class SegnalazioneService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
    private storage: StorageService,
  ) {}

  async create(
    userId: number,
    dto: CreateSegnalazioneDto,
    files: Express.Multer.File[],
  ) {
    const { latitudine, longitudine } = await this.geocoding.geocode(
      dto.indirizzo,
    );
    const urls = await Promise.all(
      files.map((f) => this.storage.uploadImmagine(f)),
    );

    return this.prisma.segnalazione.create({
      data: {
        titolo: dto.titolo,
        descrizione: dto.descrizione,
        indirizzo: dto.indirizzo,
        latitudine,
        longitudine,
        autoreId: userId,
        immagini: { create: urls.map((url) => ({ url })) },
      },
      include: { immagini: true },
    });
  }

  async findAll() {
    return await this.prisma.segnalazione.findMany({
      include: { immagini: true },
      orderBy: { voti: { _count: 'desc' } },
    });
  }

  async findOne(id: number) {
    return await this.prisma.segnalazione.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateSegnalazioneDto: UpdateSegnalazioneDto) {
    const segnalazione = await this.prisma.segnalazione.findFirst({
      where: { id },
    });

    if (!segnalazione) {
      throw new NotFoundException(`segnalazione con id ${id} non presente`);
    }

    return await this.prisma.segnalazione.update({
      where: { id },
      data: updateSegnalazioneDto,
    });
  }

  async updateStato(id: number, nuovoStato: StatoSegnalazione, ruolo: Ruolo) {
    const segnalazione = await this.prisma.segnalazione.findUnique({
      where: { id },
      select: { stato: true, autoreId: true },
    });
    if (!segnalazione) throw new NotFoundException('Segnalazione non trovata');

    const transizione = TRANSIZIONI[segnalazione.stato].find(
      (t) => t.a === nuovoStato,
    );
    if (!transizione) {
      throw new UnprocessableEntityException(
        `Transizione non consentita: ${segnalazione.stato} → ${nuovoStato}`,
      );
    }

    const haRuolo = transizione.ruoli.includes(ruolo);
    if (!haRuolo) {
      throw new ForbiddenException('Non puoi eseguire questa transizione');
    }

    // Aggiorna solo se lo stato è ancora quello letto: evita race condition
    // (es. due operatori che cambiano stato nello stesso momento)
    const { count } = await this.prisma.segnalazione.updateMany({
      where: { id, stato: segnalazione.stato },
      data: { stato: nuovoStato },
    });
    if (count === 0) {
      throw new ConflictException('Lo stato è cambiato nel frattempo, riprova');
    }

    return this.prisma.segnalazione.findUnique({
      where: { id },
      include: { immagini: true },
    });
  }

  async remove(id: number) {
    const segnalazione = await this.prisma.segnalazione.findFirst({
      where: { id },
    });

    if (!segnalazione) {
      throw new NotFoundException(`segnalazione con id ${id} non presente`);
    }

    return await this.prisma.segnalazione.delete({
      where: { id },
    });
  }

  async votazioneUpdate(
    idSegnalazione: number,
    userId: number,
    tipo: TipoVoto,
  ) {
    const segnalazione = await this.prisma.segnalazione.findFirst({
      where: { id: idSegnalazione },
    });

    if (!segnalazione) {
      throw new NotFoundException(
        `segnalazione con id ${idSegnalazione} non presente`,
      );
    }

    const votazione = await this.prisma.votoSegnalazione.findFirst({
      where: {
        utenteId: userId,
        segnalazioneId: idSegnalazione,
      },
    });

    if (votazione) {
      throw new ConflictException(
        'votazione già effettuata con questo utente per questa segnalazione',
      );
    }

    return await this.prisma.votoSegnalazione.create({
      data: {
        segnalazioneId: idSegnalazione,
        utenteId: userId,
        tipo: tipo,
      },
    });
  }

  async propostaSegnalazione(
    segnalazioneId: number,
    userId: number,
    descrizione: string,
  ) {
    const segnalazione = await this.prisma.segnalazione.findFirst({
      where: { id: segnalazioneId },
    });

    if (!segnalazione) {
      throw new NotFoundException(
        `segnalazione con id ${segnalazioneId} non presente`,
      );
    }

    const proposta = await this.prisma.propostaSegnalazione.findFirst({
      where: {
        segnalazioneId,
        autoreId: userId,
      },
    });

    if (proposta) {
      throw new ConflictException(
        'proposta già effettuata con questo utente per questa segnalazione',
      );
    }

    return this.prisma.propostaSegnalazione.create({
      data: {
        segnalazioneId,
        autoreId: userId,
        descrizione,
      },
    });
  }
}
