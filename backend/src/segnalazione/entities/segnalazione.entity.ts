import { StatoSegnalazione, TipoVoto } from '@prisma/client';

export interface SegnalazioneImmagine {
  id: number;
  url: string;
}

export interface Segnalazione {
  id: number;
  titolo: string;
  descrizione: string;
  stato: StatoSegnalazione;
  latitudine: number;
  longitudine: number;
  indirizzo: string | null;
  autoreId: number;
  createdAt: Date;
  updatedAt: Date;
  immagini: SegnalazioneImmagine[];
}

export interface SegnalazioneConVoti extends Segnalazione {
  upVote: number;
  downVote: number;
  mioVoto: TipoVoto | null;
}
