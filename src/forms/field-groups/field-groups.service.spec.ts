import { Test, TestingModule } from '@nestjs/testing';
import { FieldGroupsService } from './field-groups.service';

describe('FieldGroupsService', () => {
  let service: FieldGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FieldGroupsService],
    }).compile();

    service = module.get<FieldGroupsService>(FieldGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
