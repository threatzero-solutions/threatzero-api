import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { DeepPartial, Repository } from 'typeorm';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseOrganizationChangeEvent } from '../events/base-organization-change.event';
import {
  UNIT_CHANGED_EVENT,
  UNIT_REMOVED_EVENT,
} from '../listeners/organization-change.listener';

@Injectable()
export class UnitsService extends BaseEntityService<Unit> {
  alias = 'unit';

  constructor(
    @InjectRepository(Unit) private unitsRepository: Repository<Unit>,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  getRepository() {
    return this.unitsRepository;
  }

  getQb(query?: BaseQueryDto) {
    return super
      .getQb(query)
      .leftJoinAndSelect('unit.organization', 'organization');
  }

  async afterCreate(unit: Unit) {
    this.eventEmitter.emit(
      UNIT_CHANGED_EVENT,
      BaseOrganizationChangeEvent.forOrganization(unit),
    );
  }

  async afterUpdate(unit: Unit) {
    this.eventEmitter.emit(
      UNIT_CHANGED_EVENT,
      BaseOrganizationChangeEvent.forOrganization(unit),
    );
  }

  async beforeRemove(id: Unit['id']) {
    this.eventEmitter.emit(
      UNIT_REMOVED_EVENT,
      new BaseOrganizationChangeEvent(id),
    );
  }
}
