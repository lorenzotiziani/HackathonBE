import { Test, TestingModule } from '@nestjs/testing';
import { SegnalazioneService } from './segnalazione.service';

describe('SegnalazioneService', () => {
  let service: SegnalazioneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SegnalazioneService],
    }).compile();

    service = module.get<SegnalazioneService>(SegnalazioneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
