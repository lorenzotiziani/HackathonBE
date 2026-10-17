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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IniziativaService } from './iniziativa.service';
import { CreateIniziativaDto } from './dto/create-iniziativa.dto';
import { UpdateIniziativaDto } from './dto/update-iniziativa.dto';
import { JwtPayload } from '../auth/entities/auth.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Ruolo } from '@prisma/client';

@ApiTags('Iniziative')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('iniziative')
export class IniziativaController {
  constructor(private readonly iniziativaService: IniziativaService) {}

  @Post()
  @Roles(Ruolo.COMUNE)
  @ApiOperation({ summary: 'Crea una nuova iniziativa' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('immagine', {
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
    @Body(new ZodValidationPipe(CreateIniziativaDto))
    body: CreateIniziativaDto,
    @UploadedFile() immagine: Express.Multer.File | undefined,
    @Req() req: { user: JwtPayload },
  ) {
    const data = await this.iniziativaService.create(
      req.user.userId,
      body,
      immagine,
    );

    return { success: true, data };
  }

  @Get()
  @Roles(Ruolo.CITTADINO, Ruolo.COMUNE)
  @ApiOperation({ summary: 'Recupera tutte le iniziative' })
  async findAll() {
    const data = await this.iniziativaService.findAll();

    return { success: true, data };
  }

  @Get(':id')
  @Roles(Ruolo.CITTADINO, Ruolo.COMUNE)
  @ApiOperation({ summary: 'Recupera un’iniziativa' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.iniziativaService.findOne(id);

    return { success: true, data };
  }

  @Patch(':id')
  @Roles(Ruolo.COMUNE)
  @ApiOperation({ summary: 'Modifica un’iniziativa' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateIniziativaDto))
    dto: UpdateIniziativaDto,
  ) {
    const data = await this.iniziativaService.update(id, dto);

    return { success: true, data };
  }

  @Post(':id/partecipazioni')
  @Roles(Ruolo.CITTADINO)
  @ApiOperation({ summary: 'Partecipa a un’iniziativa' })
  async partecipazione(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: JwtPayload },
  ) {
    const data = await this.iniziativaService.partecipa(id, req.user.userId);

    return { success: true, data };
  }

  @Delete(':id')
  @Roles(Ruolo.COMUNE)
  @ApiOperation({ summary: 'Elimina un’iniziativa' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.iniziativaService.remove(id);

    return {
      success: true,
      data: 'Iniziativa eliminata con successo',
    };
  }
}
