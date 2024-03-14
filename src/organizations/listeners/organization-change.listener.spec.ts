import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationChangeListener } from './organization-change.listener';

describe('OrganizationChangeListener', () => {
  let provider: OrganizationChangeListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationChangeListener],
    }).compile();

    provider = module.get<OrganizationChangeListener>(OrganizationChangeListener);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
