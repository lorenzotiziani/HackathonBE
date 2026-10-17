import { createZodDto } from 'nestjs-zod';
import { createSegnalazioneSchema } from './create-segnalazione.dto';
import { StatoSegnalazione, TipoVoto } from '@prisma/client';
import { z } from 'zod';

export const updateSegnalazioneSchema = createSegnalazioneSchema
  .pick({ titolo: true, descrizione: true })
  .partial();

export const updateStatoSegnalazioneSchema = z.object({
  stato: z.enum(StatoSegnalazione).nonoptional(),
});

export const votazioneSegnalazioneSchema = z.object({
  tipo: z.enum(TipoVoto).nonoptional(),
});

export const propostaSegnalazioneSchema = z.object({
  descrizione: z.string().nonoptional(),
});

export class UpdateSegnalazioneDto extends createZodDto(
  updateSegnalazioneSchema,
) {}
export class UpdateStatoSegnalazioneDto extends createZodDto(
  updateStatoSegnalazioneSchema,
) {}
export class VotazioneSegnalazioneDto extends createZodDto(
  votazioneSegnalazioneSchema,
) {}
export class PropostaSegnalazioneDto extends createZodDto(
  propostaSegnalazioneSchema,
) {}
