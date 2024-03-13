import { Injectable } from '@nestjs/common';
import Field from './entities/field.entity';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FieldsService extends BaseEntityService<Field> {
  constructor(
    @InjectRepository(Field) private fieldsRepository: Repository<Field>,
  ) {
    super();
  }

  getRepository() {
    return this.fieldsRepository;
  }

  // Add additional field validation.
}
