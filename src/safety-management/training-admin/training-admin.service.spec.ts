import { Test, TestingModule } from '@nestjs/testing';
import { TrainingAdminService } from './training-admin.service';

describe('TrainingAdminService', () => {
  let service: TrainingAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingAdminService],
    }).compile();

    service = module.get<TrainingAdminService>(TrainingAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
