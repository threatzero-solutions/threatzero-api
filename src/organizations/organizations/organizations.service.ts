import type KeycloakUserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import archiver from 'archiver';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-ioredis-yet';
import { plainToInstance } from 'class-transformer';
import fs from 'fs';
import { ClsService } from 'nestjs-cls';
import path from 'path';
import { IdpProtocol } from 'src/auth/dto/create-idp.dto';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { CustomQueryFilterCondition } from 'src/auth/keycloak-admin-client/types';
import { OpaqueTokenService } from 'src/auth/opaque-token.service';
import { LEVEL } from 'src/auth/permissions';
import { S3Service } from 'src/aws/s3/s3.service';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { ScormVersion } from 'src/common/pipes/scorm-version/scorm-version.pipe';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { S3Config } from 'src/config/aws.config';
import { KeycloakConfig } from 'src/config/keycloak.config';
import { GetPresignedUploadUrlsDto } from 'src/media/dto/get-presigned-upload-urls.dto';
import { MediaService } from 'src/media/media.service';
import { TrainingVisibility } from 'src/training/common/training.types';
import { PassThrough } from 'stream';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  buildUnitPaths,
  generatePolicyUploadUrls,
  getOrganizationLevel,
} from '../common/organizations.utils';
import { BaseOrganizationChangeEvent } from '../events/base-organization-change.event';
import {
  ORGANIZATION_CHANGED_EVENT,
  ORGANIZATION_REMOVED_EVENT,
} from '../listeners/organization-change.listener';
import { TRAINING_PARTICIPANT_ROLE_GROUP_PATH } from './constants';
import { CreateOrganizationIdpDto } from './dto/create-organization-idp.dto';
import { CreateOrganizationUserDto } from './dto/create-organization-user.dto';
import { KeycloakGroupDto } from './dto/keycloak-group.dto';
import { LmsViewershipTokenQueryDto } from './dto/lms-viership-token-query.dto';
import { LmsViewershipTokenValueDto } from './dto/lms-viewership-token-value.dto';
import { OrganizationUserQueryDto } from './dto/organization-user-query.dto';
import { OrganizationUserDto } from './dto/organization-user.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';
import { Organization } from './entities/organization.entity';

const fsp = fs.promises;

export class OrganizationsService extends BaseEntityService<Organization> {
  private logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    private readonly cls: ClsService<CommonClsStore>,
    private readonly eventEmitter: EventEmitter2,
    private readonly media: MediaService,
    private readonly keycloakClient: KeycloakAdminClientService,
    private readonly config: ConfigService,
    private opaqueTokenService: OpaqueTokenService,
    private s3: S3Service,
    @Inject(CACHE_MANAGER) private cache: Cache<RedisStore>,
  ) {
    super();
  }

  getRepository() {
    return this.organizationsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    let qb = super.getQb(query);

    qb = qb
      .leftJoinAndSelect(`${qb.alias}.safetyContact`, 'safetyContact')
      .leftJoinAndSelect(
        `${qb.alias}.policiesAndProcedures`,
        'policyOrProcedure',
      );

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        return qb;
      default:
        return user?.organizationSlug
          ? qb.andWhere(`${qb.alias}.slug = :organizationSlug`, {
              organizationSlug: user.organizationSlug,
            })
          : qb.where('1 = 0');
    }
  }

  getQbSingle(id: string) {
    return this.prepareQbSingle(super.getQbSingle(id));
  }

  prepareQbSingle(qb: SelectQueryBuilder<Organization>) {
    const user = this.cls.get('user');

    let retQb = qb;

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        retQb = retQb.leftJoinAndSelect(
          `${qb.alias}.enrollments`,
          'enrollment',
        );
        break;
      default:
        retQb = retQb.leftJoinAndSelect(
          `${qb.alias}.enrollments`,
          'enrollment',
          'enrollment.visibility = :visibility::TEXT::public.course_enrollment_visibility_enum',
          { visibility: TrainingVisibility.VISIBLE },
        );
        break;
    }

    return retQb
      .leftJoinAndSelect(`enrollment.course`, 'course')
      .leftJoinAndSelect(`course.audiences`, 'audience')
      .leftJoinAndSelect(`course.presentableBy`, 'presentableBy')
      .leftJoinAndSelect(`${qb.alias}.resources`, 'resource');
  }

  async mapResult(organization: Organization) {
    organization = organization.sign(this.getCloudFrontUrlSigner());
    return organization;
  }

  async findOneBySlug(
    slug: Organization['slug'],
    mod: (
      qb: SelectQueryBuilder<Organization>,
    ) => SelectQueryBuilder<Organization> = (qb) => qb,
  ) {
    const r = await mod(
      this.prepareQbSingle(this.getQb().andWhere({ slug })),
    ).getOneOrFail();

    return await this.mapResult(r);
  }

  async findMyOrganization() {
    const user = this.cls.get('user');
    if (!user || !user.organizationSlug) {
      return;
    }
    return await this.findOneBySlug(user.organizationSlug);
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

  async isUniqueSlug(slug: string) {
    return this.getRepository()
      .createQueryBuilder()
      .where({
        slug,
      })
      .getExists()
      .then((exists) => !exists);
  }

  async createLmsToken(
    id: Organization['id'],
    value: LmsViewershipTokenValueDto,
    expiresOn?: Date,
  ) {
    // Ensure the organization, unit, and enrollment are valid.
    let qb = this.getQb();
    qb = qb
      .andWhere({ id })
      .leftJoin(`${qb.alias}.enrollments`, 'enrollment')
      .andWhere('"enrollment"."id" = :enrollmentId', {
        enrollmentId: value.enrollmentId,
      });

    if (value.unitId) {
      qb = qb.andWhere('"unitId" = :unitId', {
        unitId: value.unitId,
      });
    }

    const organization = await qb.getOne();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    value.organizationId = organization.id;

    return this.opaqueTokenService.create(value, {
      valueClass: LmsViewershipTokenValueDto,
      type: 'lms-training',
      expiresOn,
    });
  }

  async findLmsTokens(
    id: Organization['id'],
    lmsViewershipTokenQueryDto: LmsViewershipTokenQueryDto,
  ) {
    const organization = await this.verifyLmsOrganization(id);

    lmsViewershipTokenQueryDto['value.organizationId'] = organization.id;

    return this.opaqueTokenService.findAll(lmsViewershipTokenQueryDto);
  }

  async setLmsTokenExpiration(
    id: Organization['id'],
    lmsViewershipTokenQueryDto: LmsViewershipTokenQueryDto,
    expiration: Date | null,
  ) {
    const organization = await this.verifyLmsOrganization(id);

    lmsViewershipTokenQueryDto['value.organizationId'] = organization.id;

    return this.opaqueTokenService.setExpiration(
      lmsViewershipTokenQueryDto,
      expiration,
    );
  }

  async downloadScormPackage(
    id: Organization['id'],
    tokenKey: string,
    scormVersion: ScormVersion = '1.2',
  ) {
    await this.verifyLmsOrganization(id);
    const tokenValue = await this.opaqueTokenService.validate(
      tokenKey,
      LmsViewershipTokenValueDto,
      'lms-training',
    );

    if (!tokenValue) {
      throw new NotFoundException('Token not found');
    }

    const scormDir = path.join(__dirname, '../../assets/scorm/training-item');
    const manifestTemplate = await fsp.readFile(
      path.join(scormDir, `imsmanifest_${scormVersion}.xml`),
      'utf8',
    );

    const manifest = manifestTemplate
      .replace('__TRAINING_ITEM_ID__', tokenValue.trainingItemId)
      .replace('__ENROLLMENT_ID__', tokenValue.enrollmentId);

    const videoHtmlTemplate = await fsp.readFile(
      path.join(scormDir, 'video.html'),
      'utf8',
    );
    const videoHtml = videoHtmlTemplate
      .replace(
        '__API_BASE_URL__',
        this.config.get('general.apiHost') ?? 'https://api.threatzero.org/api',
      )
      .replace('__TRAINING_ITEM_ID__', tokenValue.trainingItemId)
      .replace('__TRAINING_TOKEN__', tokenKey);

    const outStream = new PassThrough();

    const zip = archiver('zip');
    zip.on('error', (err) => {
      outStream.emit('error', err);
    });
    zip.pipe(outStream);

    zip.file(path.join(scormDir, 'index.html'), { name: 'index.html' });
    zip.append(videoHtml, { name: 'video.html' });
    zip.append(manifest, { name: 'imsmanifest.xml' });

    zip.finalize();

    return outStream;
  }

  private async verifyLmsOrganization(id: Organization['id']) {
    const organization = await this.getQb().where({ id }).getOne();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async importIdpConfig(
    input:
      | FormData
      | {
          fromUrl: string;
          providerId: IdpProtocol;
        },
  ) {
    return await this.keycloakClient.client.identityProviders.importFromUrl(
      input,
    );
  }

  async createIdp(
    id: Organization['id'],
    createOrganizationIdpDto: CreateOrganizationIdpDto,
  ) {
    const organization = await this.getWithUnits(id);

    if (organization.idpSlugs?.includes(createOrganizationIdpDto.slug)) {
      throw new BadRequestException(
        `Identity provider already exists with slug ${createOrganizationIdpDto.slug}`,
      );
    }

    const newIdp = await this.keycloakClient.createIdentityProvider(
      createOrganizationIdpDto.build(organization),
    );

    await this.update(id, {
      idpSlugs: [...(organization.idpSlugs ?? []), newIdp.slug],
    });

    return new CreateOrganizationIdpDto().parse(newIdp);
  }

  async updateIdp(
    id: Organization['id'],
    idpSlug: string,
    updateOrganizationIdpDto: CreateOrganizationIdpDto,
  ) {
    const organization = await this.getWithUnits(id);
    const existingIdp = await this.getIdp(id, idpSlug);

    existingIdp.merge(updateOrganizationIdpDto);

    // IMPORTANT: This protects users from accessing IDPs they don't have access to.
    if (organization.idpSlugs?.includes(idpSlug)) {
      const updatedIdp = await this.keycloakClient.updateIdentityProvider(
        idpSlug,
        existingIdp.build(organization),
      );

      if (updatedIdp) {
        const newlyUpdatedIdp = new CreateOrganizationIdpDto().parse(
          updatedIdp,
        );

        await this.update(id, {
          idpSlugs: [
            ...(organization.idpSlugs ?? []).filter((slug) => slug !== idpSlug),
            newlyUpdatedIdp.slug,
          ],
        });

        return newlyUpdatedIdp;
      }
    }

    throw new NotFoundException(`Identity provider ${idpSlug} not found`);
  }

  async isUniqueIdpAlias(alias: string) {
    return this.keycloakClient.client.identityProviders
      .findOne({
        alias,
      })
      .then((idp) => !idp);
  }

  async getIdp(id: Organization['id'], idpSlug: string) {
    const organization = await this.getWithUnits(id);

    // IMPORTANT: This protects users from accessing IDPs they don't have access to.
    if (organization.idpSlugs?.includes(idpSlug)) {
      const idp = await this.keycloakClient.getIdentityProvider(idpSlug);

      if (idp) {
        return new CreateOrganizationIdpDto().parse(idp);
      }
    }

    throw new NotFoundException(`Identity provider ${idpSlug} not found`);
  }

  async deleteIdp(id: Organization['id'], idpSlug: string) {
    const organization = await this.getWithUnits(id);
    if (organization.idpSlugs?.includes(idpSlug)) {
      await this.keycloakClient.deleteIdentityProvider(idpSlug);
      await this.update(id, {
        idpSlugs: (organization.idpSlugs ?? []).filter(
          (slug) => slug !== idpSlug,
        ),
      });
      return;
    }

    throw new NotFoundException(`Identity provider ${idpSlug} not found`);
  }

  async getRoleGroups(id: Organization['id']) {
    const user = this.cls.get('user');
    if (!user) {
      return [];
    }

    const parentRoleGroupsGroupId =
      this.config.getOrThrow<KeycloakConfig>(
        'keycloak',
      ).parentRoleGroupsGroupId;

    if (!parentRoleGroupsGroupId) {
      this.logger.error(
        'Failed to find Role Groups parent group: Missing parent role groups group id',
      );
      return [];
    }

    return await this.getWithUnits(id).then((organization) =>
      this.keycloakClient.client.groups
        .listSubGroups({ parentId: parentRoleGroupsGroupId })
        .then((subgroups) =>
          getOrganizationLevel(user) === LEVEL.ADMIN
            ? subgroups
            : subgroups.filter(
                (subgroup) =>
                  subgroup.id &&
                  organization.allowedRoleGroups?.includes(subgroup.id),
              ),
        )
        .then((subgroups) =>
          subgroups.map((group) =>
            plainToInstance(KeycloakGroupDto, group, {
              excludeExtraneousValues: true,
            }),
          ),
        ),
    );
  }

  async getOrganizationUsers(
    id: Organization['id'],
    query: OrganizationUserQueryDto,
  ) {
    const organization = await this.getQbSingle(id).getOneOrFail();
    return this.findOrganizationUsers(organization, query);
  }

  async createOrganizationUser(
    id: Organization['id'],
    dto: CreateOrganizationUserDto,
  ) {
    const organization = await this.getWithUnits(id);

    const { canAccessTraining, ...rest } = dto;
    const user: KeycloakUserRepresentation & CreateOrganizationUserDto = {
      ...rest,
    };

    // Validate user unit.
    this.validateUserChanges(organization, user);

    // Always enable new users.
    user.enabled = true;

    const { id: userId } = await this.keycloakClient.client.users
      .create(user)
      .catch((e) => {
        if (e && typeof e === 'object' && 'response' in e) {
          if (e.response.status === 409) {
            throw new ConflictException(`User ${user.email} already exists.`);
          }
        }
        throw e;
      });

    if (canAccessTraining) {
      await this.assignUserToRoleGroup(
        id,
        userId,
        undefined,
        TRAINING_PARTICIPANT_ROLE_GROUP_PATH,
      );
    }

    return this.keycloakClient.client.users
      .findOne({ id: userId })
      .then((user) =>
        plainToInstance(OrganizationUserDto, user, {
          excludeExtraneousValues: true,
        }),
      );
  }

  async updateOrganizationUser(
    id: Organization['id'],
    userId: string,
    dto: UpdateOrganizationUserDto,
  ) {
    const { canAccessTraining: shouldAccessTraining, ...updatedUser } = dto;
    const { organization, user: existingUser } =
      await this.getOrganizationUserContext(id, userId);

    if (!existingUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const canAccessTraining = !!existingUser.groups?.includes(
      TRAINING_PARTICIPANT_ROLE_GROUP_PATH,
    );

    if (canAccessTraining !== shouldAccessTraining) {
      if (shouldAccessTraining) {
        await this.assignUserToRoleGroup(
          id,
          userId,
          undefined,
          TRAINING_PARTICIPANT_ROLE_GROUP_PATH,
        );
      } else {
        await this.revokeUserFromRoleGroup(
          id,
          userId,
          undefined,
          TRAINING_PARTICIPANT_ROLE_GROUP_PATH,
        );
      }
    }

    const user: KeycloakUserRepresentation = {
      ...existingUser,
      ...updatedUser,
      // Merge new attributes with existing attributes. The new attributes should only
      // contain what is specified in `CreateOrganizationUserDto`. As of now, it only
      // permits updating the `unit` and `audience` attributes.
      attributes: {
        ...existingUser.attributes,
        ...(updatedUser.attributes ?? {}),
      },
    };

    // Validate user unit.
    this.validateUserChanges(organization, user);

    await this.keycloakClient.client.users
      .update({ id: userId }, user)
      .catch((e) => {
        throw e;
      });

    return this.keycloakClient.client.users
      .findOne({ id: userId })
      .then((user) =>
        plainToInstance(OrganizationUserDto, user, {
          excludeExtraneousValues: true,
        }),
      );
  }

  async deleteOrganizationUser(id: Organization['id'], userId: string) {
    return this.getOrganizationUserContext(id, userId).then(({ user }) =>
      this.keycloakClient.client.users.del({ id: user.id }),
    );
  }

  async assignUserToRoleGroup(
    id: Organization['id'],
    userId: string,
    groupId?: string,
    groupPath?: string,
  ) {
    const parentRoleGroupsGroupId =
      this.config.getOrThrow<KeycloakConfig>(
        'keycloak',
      ).parentRoleGroupsGroupId;

    const { keycloakUser, group } = await this.validateUserAndGroup(
      id,
      userId,
      groupId,
      groupPath,
      parentRoleGroupsGroupId,
    );

    this.keycloakClient.client.users.addToGroup({
      id: keycloakUser.id,
      groupId: group.id,
    });
  }

  async revokeUserFromRoleGroup(
    id: Organization['id'],
    userId: string,
    groupId?: string,
    groupPath?: string,
  ) {
    const parentRoleGroupsGroupId =
      this.config.getOrThrow<KeycloakConfig>(
        'keycloak',
      ).parentRoleGroupsGroupId;

    const { keycloakUser, group } = await this.validateUserAndGroup(
      id,
      userId,
      groupId,
      groupPath,
      parentRoleGroupsGroupId,
    );

    this.keycloakClient.client.users.delFromGroup({
      id: keycloakUser.id,
      groupId: group.id,
    });
  }

  async generatePolicyUploadUrls(
    id: Organization['id'],
    getPresignedUploadUrlsDto: GetPresignedUploadUrlsDto,
  ) {
    const organization = await this.getQbSingle(id).getOneOrFail();

    return generatePolicyUploadUrls(
      organization.slug,
      getPresignedUploadUrlsDto,
      this.config.getOrThrow<S3Config>('aws.s3').buckets.appFiles.name,
      this.s3.client,
      this.getCloudFrontUrlSigner(),
    );
  }

  public async getValidOrganizationId(
    organizationId?: string,
  ): Promise<string | null>;
  public async getValidOrganizationId(
    options?: ValidateOrganizationIdOptions,
  ): Promise<string | null>;
  public async getValidOrganizationId(
    organizationId?: string,
    options?: ValidateOrganizationIdOptions,
  ): Promise<string | null>;
  public async getValidOrganizationId(
    orgIdOrOptions?: string | ValidateOrganizationIdOptions,
    options?: ValidateOrganizationIdOptions,
  ) {
    const orgId =
      typeof orgIdOrOptions === 'string' ? orgIdOrOptions : undefined;
    const opts =
      (typeof orgIdOrOptions === 'object' ? orgIdOrOptions : options) ??
      ({} as ValidateOrganizationIdOptions);

    if (!opts.type) {
      opts.type = 'idToId';
    }

    const noConvert = opts.type === 'idToId' || opts.type === 'slugToSlug';
    const returnSlug = opts.type === 'idToSlug' || opts.type === 'slugToSlug';

    const user = this.cls.get('user');

    if (!user) {
      return null;
    }

    const convertId = async (id: string, to: 'slug' | 'id') => {
      const cacheKey = `organization-${to === 'slug' ? 'slug-by-id' : 'id-by-slug'}:${user.organizationSlug}`;
      const cachedOrganizationId = await this.cache.get<string>(cacheKey);

      if (cachedOrganizationId) {
        return cachedOrganizationId;
      }
      const organization = await this.organizationsRepository.findOne({
        where: {
          [to === 'slug' ? 'id' : 'slug']: id,
        },
      });

      if (organization) {
        await this.cache.set(
          cacheKey,
          organization.id,
          1000 * 60 * 60 * 24, // 24 hours
        );
        return organization.id;
      }
    };

    if (orgId && user.hasPermission(LEVEL.ADMIN)) {
      if (noConvert) {
        return orgId;
      }

      return await convertId(orgId, returnSlug ? 'slug' : 'id');
    }

    if (user.organizationSlug) {
      if (returnSlug) {
        return user.organizationSlug;
      }

      return await convertId(user.organizationSlug, 'id');
    }

    return null;
  }

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('organization-policies');
  }

  private async getWithUnits(id: Organization['id']) {
    const qb = this.getQbSingle(id);
    const org = await qb
      .leftJoinAndSelect(`${qb.alias}.units`, 'unit')
      .getOneOrFail();

    org.units = buildUnitPaths(org.units, org.slug);

    return org;
  }

  private async findOrganizationUsers(
    organization: Organization,
    query: OrganizationUserQueryDto,
  ) {
    const DEFAULT = {
      results: [] as OrganizationUserDto[],
      count: 0,
      offset: 0,
      limit: 0,
      pageCount: 0,
    };

    const user = this.cls.get('user');

    if (!user) {
      return DEFAULT;
    }

    const { offset, limit } = query;

    const qs: CustomQueryFilterCondition[] = [
      {
        key: 'organization',
        value: organization.slug,
      },
    ];

    const level = getOrganizationLevel(user);
    if (!level || ![LEVEL.ADMIN, LEVEL.ORGANIZATION].includes(level)) {
      if (!user.organizationUnitPath) {
        return DEFAULT;
      }

      qs.push({
        key: 'organization_unit_path',
        op: 'starts',
        value: user.organizationUnitPath,
      });
    }

    return this.keycloakClient
      .findUsersByAttribute({
        filter: {
          AND: [...qs.map((q) => ({ q })), ...query.asFilterConditions()],
        },
        order: query.order.asKeycloakOrder() || 'createdTimestamp',
        limit,
        offset,
      })
      .then(({ results, limit: pageCount, ...rest }) => ({
        ...rest,
        limit,
        pageCount,
        results: results.map((user) =>
          plainToInstance(OrganizationUserDto, user, {
            excludeExtraneousValues: true,
          }),
        ),
      }));
  }

  private validateUserChanges(
    organization: Organization,
    user: KeycloakUserRepresentation,
  ) {
    if (user.attributes) {
      user.attributes.organization = [organization.slug];

      if (user.attributes.unit?.length) {
        [user.attributes.unit, user.attributes.organization_unit_path] =
          this.validateUnitAttribute(organization, user.attributes.unit);
      }

      if (user.attributes.audience) {
        user.attributes.audience = this.validateAudienceAttribute(
          organization,
          user.attributes.audience,
        );
      }
    }

    return user;
  }

  private validateUnitAttribute(
    organization: Organization,
    unitAttribute: string | string[] | undefined | null,
  ) {
    const DEFAULT_RETURN = [[], []] as readonly [
      readonly string[],
      readonly string[],
    ];

    if (!unitAttribute || !organization.units) {
      return DEFAULT_RETURN;
    }

    const unitArr = Array.isArray(unitAttribute)
      ? unitAttribute
      : [unitAttribute];

    return organization.units
      .filter((unit) => unitArr.includes(unit.slug))
      .map((unit) => ({ slug: unit.slug, path: unit.path }))
      .slice(0, 1)
      .reduce(
        (_acc, { slug, path }) => [[slug], path ? [path] : []] as const,
        DEFAULT_RETURN,
      );
  }

  private validateAudienceAttribute(
    organization: Organization,
    audienceAttribute: string | string[] | undefined | null,
  ) {
    if (!audienceAttribute || !organization.allowedAudiences) {
      return [];
    }

    const audiencesArr = Array.isArray(audienceAttribute)
      ? audienceAttribute
      : [audienceAttribute];

    return audiencesArr.filter((audienceSlug) =>
      organization.allowedAudiences.has(audienceSlug),
    );
  }

  private async getOrganizationUserContext(
    id: Organization['id'],
    userId: string,
  ) {
    const organization = await this.getWithUnits(id);
    // Make sure user exists and is accessible in this context.
    const existingUser = await this.findOrganizationUsers(
      organization,
      plainToInstance(OrganizationUserQueryDto, { id: userId, limit: 1 }),
    ).then((users) => users.results.find((u) => u));

    if (!existingUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return { organization, user: existingUser };
  }

  private async validateUserAndGroup(
    id: Organization['id'],
    userId: string,
    groupId?: string,
    groupPath?: string,
    ancestorId?: string,
  ) {
    const user = this.cls.get('user');
    if (!user) {
      throw new UnauthorizedException();
    }

    const { organization, user: keycloakUser } =
      await this.getOrganizationUserContext(id, userId);
    const group = await this.keycloakClient.findGroup({
      id: groupId,
      path: groupPath,
      ancestorId,
    });

    if (!group?.id) {
      throw new NotFoundException(`Group not found`);
    }

    if (getOrganizationLevel(user) !== LEVEL.ADMIN) {
      if (!organization.allowedRoleGroups?.includes(group.id)) {
        throw new ForbiddenException(
          `User does not have permission to assign user to group ${group.name}`,
        );
      }
    }

    return {
      organization,
      keycloakUser,
      group: group as typeof group & { id: string },
    };
  }
}

interface ValidateOrganizationIdOptions {
  type: 'slugToId' | 'idToSlug' | 'idToId' | 'slugToSlug';
}
