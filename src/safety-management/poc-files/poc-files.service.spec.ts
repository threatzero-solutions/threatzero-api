import { Test, TestingModule } from '@nestjs/testing';
import { POCFilesService } from './poc-files.service';

describe('POCFilesService', () => {
  let service: POCFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [POCFilesService],
    }).compile();

    service = module.get<POCFilesService>(POCFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
