import { Test, TestingModule } from '@nestjs/testing';
import { POCFilesController } from './poc-files.controller';
import { POCFilesService } from './poc-files.service';

describe('POCFilesController', () => {
  let controller: POCFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [POCFilesController],
      providers: [POCFilesService],
    }).compile();

    controller = module.get<POCFilesController>(POCFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
