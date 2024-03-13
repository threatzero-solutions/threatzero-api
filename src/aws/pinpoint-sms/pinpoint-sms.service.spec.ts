import { Test, TestingModule } from '@nestjs/testing';
import { PinpointSmsService } from './pinpoint-sms.service';

describe('PinpointSmsService', () => {
  let service: PinpointSmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PinpointSmsService],
    }).compile();

    service = module.get<PinpointSmsService>(PinpointSmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
