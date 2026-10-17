import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const iniziativaBaseSchema = z.object({
  titolo: z.string().min(3).max(150),
  descrizione: z.string().min(1).max(2000),
  luogo: z.string().max(255).optional(),
  dataInizio: z.iso.datetime().optional(),
  dataFine: z.iso.datetime().optional(),
});

export const dateCoerenti = (d: { dataInizio?: string; dataFine?: string }) =>
  !d.dataInizio ||
  !d.dataFine ||
  new Date(d.dataFine) >= new Date(d.dataInizio);

export const createIniziativaSchema = iniziativaBaseSchema.refine(
  dateCoerenti,
  {
    message: 'dataFine non può essere precedente a dataInizio',
    path: ['dataFine'],
  },
);

export class CreateIniziativaDto extends createZodDto(createIniziativaSchema) {}
