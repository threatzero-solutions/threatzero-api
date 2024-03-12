import { Test, TestingModule } from '@nestjs/testing';
import { FieldGroupsController } from './field-groups.controller';
import { FieldGroupsService } from './field-groups.service';

describe('FieldGroupsController', () => {
  let controller: FieldGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldGroupsController],
      providers: [FieldGroupsService],
    }).compile();

    controller = module.get<FieldGroupsController>(FieldGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
