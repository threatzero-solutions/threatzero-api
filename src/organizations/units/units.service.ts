import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UnitsService extends BaseEntityService<Unit> {
  constructor(
    @InjectRepository(Unit) private unitsRepository: Repository<Unit>,
  ) {
    super();
  }

  getRepository() {
    return this.unitsRepository;
  }
}
