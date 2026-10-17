import { Test, TestingModule } from '@nestjs/testing';
import { IniziativaService } from './iniziativa.service';

describe('IniziativaService', () => {
  let service: IniziativaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IniziativaService],
    }).compile();

    service = module.get<IniziativaService>(IniziativaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
