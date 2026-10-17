import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Delete,
  Req,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'nestjs-zod';

import { SegnalazioneService } from './segnalazione.service';
import { CreateSegnalazioneDto } from './dto/create-segnalazione.dto';
import {
  PropostaSegnalazioneDto,
  UpdateSegnalazioneDto,
  UpdateStatoSegnalazioneDto,
  VotazioneSegnalazioneDto,
} from './dto/update-segnalazione.dto';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtPayload } from '../auth/entities/auth.entity';
import { Ruolo } from '@prisma/client';

@ApiTags('Segnalazioni')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('segnalazioni')
export class SegnalazioneController {
  constructor(private readonly segnalazioneService: SegnalazioneService) {}

  @Post()
  @Roles(Ruolo.CITTADINO)
  @ApiOperation({ summary: 'Crea una segnalazione' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('immagini', 5, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
          return cb(
            new BadRequestException('Sono ammessi solo JPEG, PNG o WebP'),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async create(
    @Body(new ZodValidationPipe(CreateSegnalazioneDto))
    body: CreateSegnalazioneDto,
    @UploadedFiles() immagini: Express.Multer.File[] = [],
    @Req() req: { user: JwtPayload },
  ) {
    const data = await this.segnalazioneService.create(
      req.user.userId,
      body,
      immagini,
    );

    return { success: true, data };
  }

  @Get()
  @Roles(Ruolo.CITTADINO, Ruolo.COMUNE)
  @ApiOperation({ summary: 'Recupera tutte le segnalazioni' })
  async findAll() {
    const data = await this.segnalazioneService.findAll();

    return { success: true, data };
  }

  @Get(':id')
  @Roles(Ruolo.CITTADINO, Ruolo.COMUNE)
  @ApiOperation({ summary: 'Recupera una segnalazione' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.segnalazioneService.findOne(id);

    return { success: true, data };
  }

  @Patch(':id')
  @Roles(Ruolo.CITTADINO, Ruolo.COMUNE)
  @ApiOperation({ summary: 'Modifica una segnalazione' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateSegnalazioneDto))
    dto: UpdateSegnalazioneDto,
  ) {
    const data = await this.segnalazioneService.update(id, dto);

    return { success: true, data };
  }

  @Patch(':id/stato')
  @Roles(Ruolo.COMUNE)
  @ApiOperation({ summary: 'Aggiorna lo stato di una segnalazione' })
  async updateStato(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateStatoSegnalazioneDto))
    dto: UpdateStatoSegnalazioneDto,
    @Req() req: { user: JwtPayload },
  ) {
    const data = await this.segnalazioneService.updateStato(
      id,
      dto.stato,
      req.user.ruolo as Ruolo,
    );

    return { success: true, data };
  }

  @Post(':id/votazione')
  @Roles(Ruolo.CITTADINO)
  @ApiOperation({ summary: 'Inserisce o aggiorna un voto' })
  async votazione(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(VotazioneSegnalazioneDto))
    dto: VotazioneSegnalazioneDto,
    @Req() req: { user: JwtPayload },
  ) {
    const data = await this.segnalazioneService.votazioneUpdate(
      id,
      req.user.userId,
      dto.tipo,
    );

    return { success: true, data };
  }

  @Post(':id/proposta')
  @Roles(Ruolo.CITTADINO)
  @ApiOperation({ summary: 'aggiunge una proposta alla segnalazione' })
  async proposta(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(PropostaSegnalazioneDto))
    dto: PropostaSegnalazioneDto,
    @Req() req: { user: JwtPayload },
  ) {
    const data = await this.segnalazioneService.propostaSegnalazione(
      id,
      req.user.userId,
      dto.descrizione,
    );

    return { success: true, data };
  }

  @Delete(':id')
  @Roles(Ruolo.CITTADINO, Ruolo.COMUNE)
  @ApiOperation({ summary: 'Elimina una segnalazione' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.segnalazioneService.remove(id);

    return {
      success: true,
      data: 'Segnalazione eliminata con successo',
    };
  }
}
