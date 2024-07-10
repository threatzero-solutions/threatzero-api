import { Test, TestingModule } from '@nestjs/testing';
import { TrainingAdminTasks } from './training-admin-tasks';

describe('TrainingAdminTasks', () => {
  let provider: TrainingAdminTasks;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingAdminTasks],
    }).compile();

    provider = module.get<TrainingAdminTasks>(TrainingAdminTasks);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
