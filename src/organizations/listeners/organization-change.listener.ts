import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { KeycloakConfig } from 'src/config/keycloak.config';
import { Repository } from 'typeorm';
import {
  DEFAULT_UNIT_NAME,
  DEFAULT_UNIT_SLUG,
  UNIT_TATS_GROUP_NAME,
} from '../common/constants';
import {
  ORGANIZATION_CHANGED_EVENT,
  ORGANIZATION_REMOVED_EVENT,
  UNIT_CHANGED_EVENT,
  UNIT_REMOVED_EVENT,
} from '../common/events';
import { BaseOrganizationChangeEvent } from '../events/base-organization-change.event';
import { Organization } from '../organizations/entities/organization.entity';
import { Unit } from '../units/entities/unit.entity';

@Injectable()
export class OrganizationChangeListener {
  private logger = new Logger(OrganizationChangeListener.name);

  constructor(
    @InjectRepository(Unit) private unitsRepository: Repository<Unit>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    private keycloak: KeycloakAdminClientService,
    private config: ConfigService,
  ) {}

  @OnEvent(ORGANIZATION_CHANGED_EVENT)
  async handleOrganizationChangedEvent(event: BaseOrganizationChangeEvent) {
    const organizationParentGroupId =
      this.config.getOrThrow<KeycloakConfig>(
        'keycloak',
      ).parentOrganizationsGroupId;

    if (!organizationParentGroupId) {
      this.logger.error(
        'Failed to create organization: Missing parent organization group id',
      );
      return;
    }

    const organization = await this.organizationsRepository.findOneByOrFail({
      id: event.id,
    });

    // Make sure the organization has a default unit.
    if (
      !(await this.unitsRepository.existsBy({
        organization: { id: organization.id },
        isDefault: true,
      }))
    ) {
      await this.unitsRepository.insert({
        organization: { id: organization.id },
        isDefault: true,
        name: DEFAULT_UNIT_NAME,
        slug: DEFAULT_UNIT_SLUG,
      });
    }

    const orgGroup = await this.keycloak.upsertGroup(
      {
        id: organization.groupId ?? undefined,
        name: organization.name,
        attributes: {
          organization: [organization.slug],
        },
      },
      organizationParentGroupId,
    );

    const orgTatGroup = await this.keycloak.upsertGroup(
      {
        id: organization.tatGroupId ?? undefined,
        name: `${organization.name} Organization TAT`,
      },
      orgGroup.id,
    );

    await this.getOrCreateGroupByName(orgGroup.id, UNIT_TATS_GROUP_NAME);

    await this.organizationsRepository.update(
      {
        id: organization.id,
      },
      {
        tatGroupId: orgTatGroup.id,
      },
    );
  }

  @OnEvent(ORGANIZATION_REMOVED_EVENT)
  async handleOrganizationRemovedEvent(event: BaseOrganizationChangeEvent) {
    const organization = await this.organizationsRepository.findOneByOrFail({
      id: event.id,
    });

    await this.unitsRepository.delete({
      organization: { id: organization.id },
      isDefault: true,
      name: DEFAULT_UNIT_NAME,
      slug: DEFAULT_UNIT_SLUG,
    });

    if (organization.groupId) {
      this.keycloak.client.groups
        .del({ id: organization.groupId })
        .catch((e) => {
          this.logger.error(
            `Failed to delete organization group ${organization.groupId}`,
            e,
          );
        });
    }
  }

  @OnEvent(UNIT_CHANGED_EVENT)
  async handleUnitChangedEvent(event: BaseOrganizationChangeEvent) {
    const unit = await this.unitsRepository.findOneOrFail({
      where: { id: event.id },
      relations: { organization: true },
    });
    if (!unit.organization.id || unit.isDefault) {
      return;
    }

    const organizationGroupId = unit.organization.groupId;

    if (!organizationGroupId) {
      return;
    }

    const unitTatsGroupId = await this.getOrCreateGroupByName(
      organizationGroupId,
      UNIT_TATS_GROUP_NAME,
    );

    const tatGroup = await this.keycloak.upsertGroup(
      {
        id: unit.tatGroupId ?? undefined,
        name: `${unit.name} TAT`,
        attributes: {
          peerUnit: [unit.slug],
        },
      },
      unitTatsGroupId,
    );

    await this.unitsRepository.update(
      {
        id: unit.id,
      },
      {
        tatGroupId: tatGroup.id,
      },
    );
  }

  @OnEvent(UNIT_REMOVED_EVENT)
  async handleUnitRemovedEvent(event: BaseOrganizationChangeEvent) {
    const unit = await this.unitsRepository.findOneByOrFail({
      id: event.id,
    });

    if (unit.isDefault) {
      return;
    }

    Promise.all(
      [unit.tatGroupId]
        .filter((id) => !!id)
        .map((id) =>
          this.keycloak.client.groups.del({ id: id! }).catch((e) => {
            this.logger.error(`Failed to delete unit group ${id}`, e);
          }),
        ),
    );
  }

  private async getOrCreateGroupByName(parentGroupId: string, name: string) {
    const foundGroup = await this.keycloak.client.groups
      .listSubGroups({ parentId: parentGroupId, max: 500 })
      .then((groups) => groups.find((g) => g.name === name));

    if (foundGroup) {
      return foundGroup.id;
    }

    const createResponse = await this.keycloak.client.groups.createChildGroup(
      {
        id: parentGroupId,
      },
      {
        name: name,
      },
    );

    return createResponse.id;
  }
}
