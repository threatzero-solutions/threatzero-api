import { Test, TestingModule } from '@nestjs/testing';
import { FormsPdfService } from './forms-pdf.service';

describe('FormsPdfService', () => {
  let service: FormsPdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsPdfService],
    }).compile();

    service = module.get<FormsPdfService>(FormsPdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
