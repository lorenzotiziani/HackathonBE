import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createSegnalazioneSchema = z.object({
  titolo: z.string().min(3).max(150),
  descrizione: z.string().min(1).max(2000),
  indirizzo: z.string().max(255).nonoptional(),
});

export class CreateSegnalazioneDto extends createZodDto(
  createSegnalazioneSchema,
) {}
