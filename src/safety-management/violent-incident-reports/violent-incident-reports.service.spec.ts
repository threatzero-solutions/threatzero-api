import { Test, TestingModule } from '@nestjs/testing';
import { ViolentIncidentReportsService } from './violent-incident-reports.service';

describe('ViolentIncidentReportsService', () => {
  let service: ViolentIncidentReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViolentIncidentReportsService],
    }).compile();

    service = module.get<ViolentIncidentReportsService>(
      ViolentIncidentReportsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
