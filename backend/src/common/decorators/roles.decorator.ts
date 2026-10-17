import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'ruolo';
export const Roles = (...ruolo: string[]) => SetMetadata(ROLES_KEY, ruolo);
