import { Test, TestingModule } from '@nestjs/testing';
import { ThreatAssessmentsController } from './threat-assessments.controller';
import { ThreatAssessmentsService } from './threat-assessments.service';

describe('ThreatAssessmentsController', () => {
  let controller: ThreatAssessmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThreatAssessmentsController],
      providers: [ThreatAssessmentsService],
    }).compile();

    controller = module.get<ThreatAssessmentsController>(
      ThreatAssessmentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
