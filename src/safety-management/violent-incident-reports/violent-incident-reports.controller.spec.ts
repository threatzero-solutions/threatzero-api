import { Test, TestingModule } from '@nestjs/testing';
import { ViolentIncidentReportsController } from './violent-incident-reports.controller';
import { ViolentIncidentReportsService } from './violent-incident-reports.service';

describe('ViolentIncidentReportsController', () => {
  let controller: ViolentIncidentReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViolentIncidentReportsController],
      providers: [ViolentIncidentReportsService],
    }).compile();

    controller = module.get<ViolentIncidentReportsController>(ViolentIncidentReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
