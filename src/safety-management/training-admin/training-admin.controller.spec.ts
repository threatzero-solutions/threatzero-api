import { Test, TestingModule } from '@nestjs/testing';
import { TrainingAdminController } from './training-admin.controller';

describe('TrainingAdminController', () => {
  let controller: TrainingAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingAdminController],
    }).compile();

    controller = module.get<TrainingAdminController>(TrainingAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
