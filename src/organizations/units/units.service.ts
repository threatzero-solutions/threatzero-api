import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { LEVEL } from 'src/auth/permissions';
import { S3Service } from 'src/aws/s3/s3.service';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { S3Config } from 'src/config/aws.config';
import { GetPresignedUploadUrlsDto } from 'src/media/dto/get-presigned-upload-urls.dto';
import { MediaService } from 'src/media/media.service';
import { Repository } from 'typeorm';
import { DEFAULT_UNIT_SLUG } from '../common/constants';
import {
  buildUnitPaths,
  generatePolicyUploadUrls,
  getOrganizationLevel,
  getUserUnitPredicate,
} from '../common/organizations.utils';
import { BaseOrganizationChangeEvent } from '../events/base-organization-change.event';
import {
  UNIT_CHANGED_EVENT,
  UNIT_REMOVED_EVENT,
} from '../listeners/organization-change.listener';
import { Unit } from './entities/unit.entity';

export class UnitsService extends BaseEntityService<Unit> {
  alias = 'unit';

  constructor(
    @InjectRepository(Unit) private unitsRepository: Repository<Unit>,
    private readonly cls: ClsService<CommonClsStore>,
    private eventEmitter: EventEmitter2,
    private media: MediaService,
    private readonly config: ConfigService,
    private s3: S3Service,
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
      )
      .leftJoinAndSelect(`${qb.alias}.parentUnit`, 'parentUnit');

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

  async mapResults(units: Unit[]) {
    return buildUnitPaths(
      await Promise.all(units.map((u) => this.mapResult(u))),
    );
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

  async generatePolicyUploadUrls(
    id: Unit['id'],
    getPresignedUploadUrlsDto: GetPresignedUploadUrlsDto,
  ) {
    const unit = await this.getQbSingle(id).getOneOrFail();

    return generatePolicyUploadUrls(
      `${unit.organization.slug}/${unit.slug}`,
      getPresignedUploadUrlsDto,
      this.config.getOrThrow<S3Config>('aws.s3').buckets.appFiles.name,
      this.s3.client,
      this.getCloudFrontUrlSigner(),
    );
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
