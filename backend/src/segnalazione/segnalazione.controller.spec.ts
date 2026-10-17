import { Test, TestingModule } from '@nestjs/testing';
import { SegnalazioneController } from './segnalazione.controller';
import { SegnalazioneService } from './segnalazione.service';

describe('SegnalazioneController', () => {
  let controller: SegnalazioneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SegnalazioneController],
      providers: [SegnalazioneService],
    }).compile();

    controller = module.get<SegnalazioneController>(SegnalazioneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
