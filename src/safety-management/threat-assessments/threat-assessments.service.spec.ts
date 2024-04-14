import { Test, TestingModule } from '@nestjs/testing';
import { ThreatAssessmentsService } from './threat-assessments.service';

describe('ThreatAssessmentsService', () => {
  let service: ThreatAssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThreatAssessmentsService],
    }).compile();

    service = module.get<ThreatAssessmentsService>(ThreatAssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
