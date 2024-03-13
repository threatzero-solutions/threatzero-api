import { Test, TestingModule } from '@nestjs/testing';
import { SubmitTipListener } from './submit-tip.listener';

describe('SubmitTipListener', () => {
  let provider: SubmitTipListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubmitTipListener],
    }).compile();

    provider = module.get<SubmitTipListener>(SubmitTipListener);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
