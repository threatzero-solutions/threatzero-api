import { Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Form } from './entities/form.entity';

@Injectable()
export class FormsService extends BaseEntityService<Form> {
  constructor(
    @InjectRepository(Form) private formsRepository: Repository<Form>,
  ) {
    super();
  }

  getRepository() {
    return this.formsRepository;
  }
}
