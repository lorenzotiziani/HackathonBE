import { Test, TestingModule } from '@nestjs/testing';
import { IniziativaController } from './iniziativa.controller';
import { IniziativaService } from './iniziativa.service';

describe('IniziativaController', () => {
  let controller: IniziativaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IniziativaController],
      providers: [IniziativaService],
    }).compile();

    controller = module.get<IniziativaController>(IniziativaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
