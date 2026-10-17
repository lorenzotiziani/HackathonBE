import { Module } from '@nestjs/common';
import { IniziativaService } from './iniziativa.service';
import { IniziativaController } from './iniziativa.controller';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  controllers: [IniziativaController],
  providers: [IniziativaService],
})
export class IniziativaModule {}
