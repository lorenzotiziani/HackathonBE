import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface Coordinate {
  latitudine: number;
  longitudine: number;
}

@Injectable()
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  async geocode(indirizzo: string): Promise<Coordinate> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('q', indirizzo);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'it');

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          // obbligatorio per la policy di Nominatim: identifica la tua app
          'User-Agent': 'HackathonBE/1.0 (tua-email@esempio.it)',
          'Accept-Language': 'it',
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Servizio di geocodifica non raggiungibile',
      );
    }

    if (!res.ok) {
      throw new ServiceUnavailableException(
        'Errore nel servizio di geocodifica',
      );
    }

    const risultati = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (risultati.length === 0) {
      throw new BadRequestException('Indirizzo non trovato');
    }

    return {
      latitudine: parseFloat(risultati[0].lat),
      longitudine: parseFloat(risultati[0].lon),
    };
  }
}
