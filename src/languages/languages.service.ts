import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { Language } from './entities/language.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LanguagesService extends BaseEntityService<Language> {
  constructor(
    @InjectRepository(Language)
    private languagesRepository: Repository<Language>,
  ) {
    super();
  }

  getRepository(): Repository<Language> {
    return this.languagesRepository;
  }
}
