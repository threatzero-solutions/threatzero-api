import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Repository } from 'typeorm';
import { FieldGroup } from './entities/field-group.entity';

@Injectable()
export class FieldGroupsService extends BaseEntityService<FieldGroup> {
  constructor(
    @InjectRepository(FieldGroup)
    private fieldGroupsRepository: Repository<FieldGroup>,
  ) {
    super();
  }

  getRepository() {
    return this.fieldGroupsRepository;
  }
}
