import { Inject, Injectable, Scope } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { Repository } from 'typeorm';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseOrganizationChangeEvent } from '../events/base-organization-change.event';
import {
  UNIT_CHANGED_EVENT,
  UNIT_REMOVED_EVENT,
} from '../listeners/organization-change.listener';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { getOrganizationLevel } from '../common/organizations.utils';
import { LEVEL } from 'src/auth/permissions';

@Injectable({ scope: Scope.REQUEST })
export class UnitsService extends BaseEntityService<Unit> {
  alias = 'unit';

  constructor(
    @InjectRepository(Unit) private unitsRepository: Repository<Unit>,
    @Inject(REQUEST) private request: Request,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  getRepository() {
    return this.unitsRepository;
  }

  getQb(query?: BaseQueryDto) {
    let qb = super
      .getQb(query)
      .leftJoinAndSelect('unit.organization', 'organization');

    switch (getOrganizationLevel(this.request)) {
      case LEVEL.ADMIN:
        return qb;
      case LEVEL.UNIT:
        return qb.andWhere('unit.slug = :unitSlug', {
          unitSlug: this.request.user?.unitSlug,
        });
      case LEVEL.ORGANIZATION:
        return qb
          .leftJoinAndSelect(`${qb.alias}.organization`, 'org_organization')
          .andWhere('org_organization.slug = :organizationSlug', {
            organizationSlug: this.request.user?.organizationSlug,
          });
      default:
        return qb.where('1 = 0');
    }
  }

  getUserUnit() {
    if (!this.request.user?.unitSlug) {
      return Promise.resolve(null);
    }

    return this.getRepository().findOneBy({
      slug: this.request.user.unitSlug,
    });
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
