import { Test, TestingModule } from '@nestjs/testing';
import { AudienceChangeListener } from './audience-change.listener';

describe('AudienceChangeListener', () => {
  let provider: AudienceChangeListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudienceChangeListener],
    }).compile();

    provider = module.get<AudienceChangeListener>(AudienceChangeListener);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
