import { Inject, Injectable, Scope } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Repository } from 'typeorm';
import {
  ORGANIZATION_CHANGED_EVENT,
  ORGANIZATION_REMOVED_EVENT,
} from '../listeners/organization-change.listener';
import { BaseOrganizationChangeEvent } from '../events/base-organization-change.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { getOrganizationLevel } from '../common/organizations.utils';
import { LEVEL } from 'src/auth/permissions';
import { MediaService } from 'src/media/media.service';

@Injectable({ scope: Scope.REQUEST })
export class OrganizationsService extends BaseEntityService<Organization> {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @Inject(REQUEST) private request: Request,
    private eventEmitter: EventEmitter2,
    private media: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.organizationsRepository;
  }

  getQb(query?: BaseQueryDto) {
    let qb = super.getQb(query);

    qb = qb
      .leftJoinAndSelect(`${qb.alias}.safetyContact`, 'safetyContact')
      .leftJoinAndSelect(
        `${qb.alias}.workplaceViolencePreventionPlan`,
        'workplaceViolencePreventionPlan',
      );

    switch (getOrganizationLevel(this.request)) {
      case LEVEL.ADMIN:
        return qb;
      default:
        return this.request.user?.organizationSlug
          ? qb.andWhere(`${qb.alias}.slug = :organizationSlug`, {
              organizationSlug: this.request.user.organizationSlug,
            })
          : qb.where('1 = 0');
    }
  }

  getQbSingle(id: string) {
    let qb = super.getQbSingle(id);

    switch (getOrganizationLevel(this.request)) {
      case LEVEL.ADMIN:
        return qb
          .leftJoinAndSelect(`${qb.alias}.courses`, 'course')
          .leftJoinAndSelect(`${qb.alias}.resources`, 'resource');
      default:
        return qb;
    }
  }

  async mapResult(organization: Organization) {
    organization = organization.sign(this.getCloudFrontUrlSigner());
    return organization;
  }

  async afterCreate(organization: Organization) {
    this.eventEmitter.emit(
      ORGANIZATION_CHANGED_EVENT,
      BaseOrganizationChangeEvent.forOrganization(organization),
    );
  }

  async afterUpdate(organization: Organization) {
    this.eventEmitter.emit(
      ORGANIZATION_CHANGED_EVENT,
      BaseOrganizationChangeEvent.forOrganization(organization),
    );
  }

  async beforeRemove(id: Organization['id']) {
    this.eventEmitter.emit(
      ORGANIZATION_REMOVED_EVENT,
      new BaseOrganizationChangeEvent(id),
    );
  }

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('wvp-plans');
  }
}
