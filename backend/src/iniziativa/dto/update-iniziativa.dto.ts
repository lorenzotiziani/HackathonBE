import { createZodDto } from 'nestjs-zod';
import { iniziativaBaseSchema, dateCoerenti } from './create-iniziativa.dto';

export const UpdateIniziativaSchema = iniziativaBaseSchema
  .partial()
  .refine(dateCoerenti, {
    message: 'dataFine non può essere precedente a dataInizio',
    path: ['dataFine'],
  });

export class UpdateIniziativaDto extends createZodDto(UpdateIniziativaSchema) {}
