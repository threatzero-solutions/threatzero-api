import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Audience } from './entities/audience.entity';
import { Repository } from 'typeorm';
import { BaseEntityService } from 'src/common/base-entity.service';

@Injectable()
export class AudiencesService extends BaseEntityService<Audience> {
  constructor(
    @InjectRepository(Audience)
    private audiencesRepository: Repository<Audience>,
  ) {
    super();
  }

  getRepository() {
    return this.audiencesRepository;
  }
}
