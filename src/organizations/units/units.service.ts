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
import { getOrganizationLevel } from '../common/organizations.utils';
import { LEVEL } from 'src/auth/permissions';
import { MediaService } from 'src/media/media.service';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

export class UnitsService extends BaseEntityService<Unit> {
  alias = 'unit';

  constructor(
    @InjectRepository(Unit) private unitsRepository: Repository<Unit>,
    private readonly cls: ClsService<CommonClsStore>,
    private eventEmitter: EventEmitter2,
    private media: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.unitsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    let qb = super
      .getQb(query)
      .leftJoinAndSelect('unit.organization', 'organization');

    qb = qb
      .leftJoinAndSelect(`${qb.alias}.safetyContact`, 'safetyContact')
      .leftJoinAndSelect(
        `${qb.alias}.policiesAndProcedures`,
        'policiesAndProcedure',
      );

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        return qb;
      case LEVEL.ORGANIZATION:
        return qb
          .leftJoinAndSelect(`${qb.alias}.organization`, 'org_organization')
          .andWhere('org_organization.slug = :organizationSlug', {
            organizationSlug: user?.organizationSlug,
          });
      default:
        return user?.unitSlug
          ? qb.andWhere('unit.slug IN (:...unitSlug)', {
              unitSlug: [
                ...(user?.unitSlug ? [user?.unitSlug] : []),
                ...(user?.peerUnits ?? []),
              ],
            })
          : qb.where('1 = 0');
    }
  }

  getUserUnit() {
    const user = this.cls.get('user');

    if (!user?.unitSlug) {
      return Promise.resolve(null);
    }

    return this.getRepository().findOneBy({
      slug: user.unitSlug,
    });
  }

  async mapResult(unit: Unit) {
    unit = unit.sign(this.getCloudFrontUrlSigner());
    return unit;
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

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('organization-policies');
  }
}
