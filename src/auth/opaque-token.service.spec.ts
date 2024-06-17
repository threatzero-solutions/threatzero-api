import { Test, TestingModule } from '@nestjs/testing';
import { OpaqueTokenService } from './opaque-token.service';

describe('OpaqueTokenService', () => {
  let service: OpaqueTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpaqueTokenService],
    }).compile();

    service = module.get<OpaqueTokenService>(OpaqueTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
