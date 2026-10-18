# MyC BE

Backend REST per una piattaforma di partecipazione civica: i cittadini inviano **segnalazioni** geolocalizzate (con foto), le votano e partecipano alle **iniziative** pubblicate dal Comune.

## Stack

| Ambito | Tecnologia |
|---|---|
| Framework | [NestJS](https://nestjs.com) |
| Database | PostgreSQL su [Neon](https://neon.tech) |
| ORM | [Prisma 7](https://www.prisma.io) (driver adapter `pg`) |
| Validazione | [Zod](https://zod.dev) + [nestjs-zod](https://github.com/BenLorantfy/nestjs-zod) |
| Autenticazione | JWT (`@nestjs/passport`) con refresh token |
| Upload immagini | [Cloudinary](https://cloudinary.com) (via Multer) |
| Geocodifica | [Nominatim](https://nominatim.org) (OpenStreetMap) |
| Documentazione API | Swagger (`@nestjs/swagger`) |

## Funzionalità

- **Autenticazione**: registrazione, login, refresh token, ruoli (`CITTADINO`, `COMUNE`).
- **Segnalazioni**
  - Creazione con titolo, descrizione, indirizzo e fino a 5 immagini.
  - L'indirizzo viene convertito in latitudine/longitudine dal backend (geocodifica).
  - Le immagini vengono caricate su Cloudinary e nel DB si salvano solo gli URL.
  - Voti positivi/negativi (un voto per utente per segnalazione).
  - Ciclo di vita gestito da una macchina a stati, con permessi per ruolo.
  - Modifica (solo titolo e descrizione) ed eliminazione riservate all'autore.
- **Iniziative**: creazione riservata al ruolo `COMUNE`, con immagine, luogo e date; partecipazione degli utenti.

### Stati di una segnalazione

```
SEGNALATO ──► IN_APPROVAZIONE ──► IN_LAVORAZIONE ──► RISOLTO
    │                │                   │
    └────────────────┴───────────────────┴──► ANNULLATO
```

`RISOLTO` e `ANNULLATO` sono stati finali. Le transizioni consentite e i ruoli abilitati sono definiti in `TRANSIZIONI` (`src/segnalazione/segnalazione.service.ts`). Un cambio di stato non valido risponde `422`, uno non permesso al ruolo `403`.

## Struttura del progetto

```
.
├── prisma/
│   ├── schema.prisma        # modelli ed enum
│   └── migrations/          # storico migrazioni (da committare)
├── generated/prisma/        # client Prisma generato (non committare)
├── prisma.config.ts         # configurazione CLI Prisma (URL del DB)
└── src/
    ├── auth/                # login, registrazione, JWT, refresh token
    ├── segnalazione/        # controller, service, DTO, entity
    ├── iniziativa/          # controller, service, DTO
    ├── geocoding/           # indirizzo → coordinate
    ├── storage/             # upload immagini su Cloudinary
    └── common/              # guard dei ruoli, decorator
```

## Modello dati

Tabelle principali (nomi SQL in `snake_case`, mappati con `@@map`):

- `utenti`, `refresh_tokens`
- `segnalazioni`, `segnalazione_immagini`, `voti_segnalazione`, `proposte_segnalazione`
- `iniziative`, `partecipazioni_iniziativa`

Scelte da sapere:

- I voti sono righe in `voti_segnalazione` con chiave composta `[utenteId, segnalazioneId]`: i contatori si calcolano con `count`/`groupBy`, quindi non possono desincronizzarsi.
- Nel DB non si salvano file, solo URL.
- Latitudine e longitudine sono `Float`; per query "entro X km" servirebbero Haversine o PostGIS.

## Requisiti

- Node.js 20 o superiore
- Un database PostgreSQL (qui Neon)
- Un account Cloudinary (il piano gratuito basta)

## Installazione

```bash
git clone <url-del-repo>
cd HackathonBE
npm install
```

## Variabili d'ambiente

Crea un file `.env` nella root:

```env
# Neon: stringa "pooled" (host con -pooler), usata dall'app
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Neon: stringa diretta (senza -pooler), usata da Prisma per le migrazioni
DIRECT_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# JWT (adatta i nomi a quelli usati nel modulo auth)
JWT_SECRET=""
```

Non committare mai il `.env`.

## Database

Il progetto usa **Prisma 7**: l'URL del database non sta nello schema ma in `prisma.config.ts`, e per le migrazioni si usa la stringa diretta (`DIRECT_URL`).

```bash
# Applica le migrazioni al DB (sviluppo) e crea quella nuova se hai cambiato lo schema
npx prisma migrate dev --name <descrizione_modifica>

# Rigenera il client dopo ogni modifica allo schema
npx prisma generate

# Interfaccia per ispezionare i dati
npx prisma studio
```

In produzione o CI:

```bash
npx prisma migrate deploy
```

Note:

- Con Prisma 7 `migrate dev` **non** lancia `generate` in automatico: va eseguito a mano.
- Le **rinomine** di campi o tabelle vengono interpretate come "elimina e ricrea". Per non perdere dati usa `npx prisma migrate dev --create-only`, modifica l'SQL con un `ALTER TABLE ... RENAME` e poi rilancia il comando.
- Per un prototipo senza storico puoi usare `npx prisma db push`.
- Il progetto è pensato per **Prisma 7**. La 8 (in release candidate) ha una CLI diversa, senza `migrate`: non aggiornare.

## Avvio

```bash
# sviluppo (watch)
npm run start:dev

# produzione
npm run build
npm run start:prod
```

Il server parte su `http://localhost:3000`. Se Swagger è abilitato in `main.ts`, la documentazione interattiva è disponibile sul percorso configurato (tipicamente `/api`).

## API

Tutte le rotte richiedono `Authorization: Bearer <token>`, tranne quelle di autenticazione. Le risposte hanno il formato:

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": "messaggio" }
```

### Segnalazioni (`/segnalazione`)

| Metodo | Rotta | Descrizione | Permessi |
|---|---|---|---|
| `POST` | `/segnalazione` | Crea una segnalazione (`multipart/form-data`) | utente autenticato |
| `GET` | `/segnalazione` | Elenco segnalazioni | utente autenticato |
| `GET` | `/segnalazione/:id` | Dettaglio | utente autenticato |
| `PATCH` | `/segnalazione/:id` | Modifica titolo e/o descrizione | solo l'autore |
| `PATCH` | `/segnalazione/:id/stato` | Cambia stato | secondo `TRANSIZIONI` |
| `DELETE` | `/segnalazione/:id` | Elimina | autore o `COMUNE` |

**Creazione** (`multipart/form-data`):

| Campo | Tipo | Note |
|---|---|---|
| `titolo` | testo | 3–150 caratteri |
| `descrizione` | testo | 1–2000 caratteri |
| `indirizzo` | testo | convertito in coordinate dal backend |
| `immagini` | file | opzionale, fino a 5 file; stessa chiave ripetuta |

`autoreId` si ricava dal token e lo `stato` iniziale è sempre `SEGNALATO`.

**Cambio stato** (JSON):

```json
{ "stato": "IN_APPROVAZIONE" }
```

### Iniziative (`/iniziative`)

| Metodo | Rotta | Descrizione | Permessi |
|---|---|---|---|
| `POST` | `/iniziative` | Crea un'iniziativa (`multipart/form-data`) | `COMUNE` |

**Creazione** (`multipart/form-data`):

| Campo | Tipo | Note |
|---|---|---|
| `titolo` | testo | 3–150 caratteri |
| `descrizione` | testo | 1–2000 caratteri |
| `luogo` | testo | opzionale |
| `dataInizio` | data ISO | opzionale, es. `2026-10-17T09:00:00Z` |
| `dataFine` | data ISO | opzionale, non può precedere `dataInizio` |
| `immagine` | file | opzionale, un solo file (chiave al singolare) |

### Upload di immagini

- Formati ammessi: JPEG, PNG, WebP. Dimensione massima: 5 MB per file.
- Il client invia i file nel `multipart/form-data`; il backend li carica su Cloudinary e salva gli URL.
- Non impostare a mano l'header `Content-Type`: il client deve generare il `boundary`.
- Le date vanno inviate in formato ISO-8601 con orario e `Z` (`2026-10-17T09:00:00Z`). I campi vuoti vanno omessi, non inviati come stringa vuota.

### Provare con Postman

1. `Authorization` → *Bearer Token* con il JWT (per le iniziative serve un utente `COMUNE`).
2. `Body` → *form-data*.
3. Per un file cambia il tipo della riga da *Text* a *File* (menu a tendina sulla cella della chiave).
4. Per più immagini ripeti la riga con la stessa chiave `immagini`.

## Codici di errore frequenti

| Codice | Causa |
|---|---|
| `400` | Validazione Zod fallita, formato file non ammesso, indirizzo non trovato |
| `401` | Token mancante o scaduto |
| `403` | Ruolo non autorizzato, o non sei l'autore |
| `404` | Risorsa non trovata |
| `409` | Lo stato è cambiato nel frattempo (aggiornamento concorrente) |
| `422` | Transizione di stato non consentita |
| `503` | Servizio di geocodifica non raggiungibile |

## Limiti noti

- **Geocodifica**: Nominatim consente al massimo 1 richiesta al secondo e non è pensato per uso intensivo. In produzione passare a Google Geocoding, Mapbox o LocationIQ cambiando solo `GeocodingService`. Il campo `User-Agent` nella richiesta va personalizzato con un contatto reale.
- **Immagini orfane**: se la scrittura nel DB fallisce dopo l'upload, il file resta su Cloudinary.
- **Controllo del tipo di file**: si basa sul mimetype dichiarato dal client. In produzione verificare i magic bytes (libreria `file-type`).
- **Ordinamento per voti**: l'ordinamento per punteggio (UP − DOWN) avviene in memoria. Con molti dati conviene un campo `score` aggiornato in transazione a ogni voto.

## Contribuire

1. Crea un branch dal `main`.
2. Se modifichi `schema.prisma`, crea la migrazione e committa la cartella `prisma/migrations`.
3. Apri una pull request.
