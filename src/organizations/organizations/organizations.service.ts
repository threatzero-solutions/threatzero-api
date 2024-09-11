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
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { getOrganizationLevel } from '../common/organizations.utils';
import { LEVEL } from 'src/auth/permissions';
import { MediaService } from 'src/media/media.service';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { IdpProtocol } from 'src/auth/dto/create-idp.dto';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { CreateOrganizationIdpDto } from './dto/create-organization-idp.dto';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakConfig } from 'src/config/keycloak.config';

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
    const user = this.cls.get('user');
    let qb = super.getQbSingle(id);

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        return qb
          .leftJoinAndSelect(`${qb.alias}.courses`, 'course')
          .leftJoinAndSelect(`course.audiences`, 'audience')
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
    const organization = await this.getForIdp(id);

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

    return new CreateOrganizationIdpDto().parse(newIdp, organization);
  }

  async updateIdp(
    id: Organization['id'],
    idpSlug: string,
    updateOrganizationIdpDto: CreateOrganizationIdpDto,
  ) {
    const organization = await this.getForIdp(id);
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
          organization,
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

  async getIdp(id: Organization['id'], idpSlug: string) {
    const organization = await this.getForIdp(id);

    // IMPORTANT: This protects users from accessing IDPs they don't have access to.
    if (organization.idpSlugs?.includes(idpSlug)) {
      const idp = await this.keycloakClient.getIdentityProvider(idpSlug);

      if (idp) {
        return new CreateOrganizationIdpDto().parse(idp, organization);
      }
    }

    throw new NotFoundException(`Identity provider ${idpSlug} not found`);
  }

  async deleteIdp(id: Organization['id'], idpSlug: string) {
    const organization = await this.getForIdp(id);
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

    if (getOrganizationLevel(user) === LEVEL.ADMIN) {
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

      return await this.keycloakClient.client.groups
        .listSubGroups({ parentId: parentRoleGroupsGroupId })
        .then((subgroups) =>
          subgroups.map((subgroup) => subgroup.name ?? 'Unknown'),
        );
    }

    const organization = await this.getForIdp(id);
    return organization.allowedRoleGroups ?? [];
  }

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('organization-policies');
  }

  private async getForIdp(id: Organization['id']) {
    const qb = this.getQbSingle(id);
    return await qb
      .leftJoinAndSelect(`${qb.alias}.units`, 'unit')
      .getOneOrFail();
  }
}
