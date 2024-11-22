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
import {
  getOrganizationLevel,
  getUserUnitPredicate,
} from '../common/organizations.utils';
import { LEVEL } from 'src/auth/permissions';
import { MediaService } from 'src/media/media.service';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { DEFAULT_UNIT_SLUG } from '../common/constants';

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
      .andWhere({ isDefault: false })
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
        return qb.andWhere(getUserUnitPredicate(user));
    }
  }

  getQbSingle(id: string) {
    const user = this.cls.get('user');

    let retQb = super.getQbSingle(id);

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        retQb = retQb.leftJoinAndSelect(
          `${retQb.alias}.parentUnit`,
          'parentUnit',
        );
        break;
      default:
        break;
    }

    return retQb;
  }

  getUserUnit() {
    const user = this.cls.get('user');

    if (!user?.unitSlug || user.unitSlug === DEFAULT_UNIT_SLUG) {
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

  async isUniqueSlug(organizationId: Unit['organizationId'], slug: string) {
    return this.getRepository()
      .createQueryBuilder()
      .where({
        organizationId: organizationId,
        slug: slug,
      })
      .getExists()
      .then((exists) => !exists);
  }

  // TODO: This doesn't restrict access and is not suitable to public API exposure.
  // Validate the need for this or remove.
  // async getSubUnits({ id, slug }: { id?: Unit['id']; slug?: string }) {
  //   if (!id && !slug) {
  //     return [];
  //   }
  //   const subunits = await getRecursiveSubUnitsQb(
  //     super.getQb().andWhere({ id, slug }),
  //   ).getMany();

  //   return buildUnitPaths(subunits);
  // }

  // async getUnitUsers(id: Unit['id']) {
  //   return;
  // }

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('organization-policies');
  }
}
