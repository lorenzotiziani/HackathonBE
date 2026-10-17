import { Module } from '@nestjs/common';
import { SegnalazioneService } from './segnalazione.service';
import { SegnalazioneController } from './segnalazione.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { GeocodingModule } from 'src/geocoding/geocoding.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [PrismaModule, GeocodingModule, StorageModule],
  controllers: [SegnalazioneController],
  providers: [SegnalazioneService],
  exports: [SegnalazioneService],
})
export class SegnalazioneModule {}
