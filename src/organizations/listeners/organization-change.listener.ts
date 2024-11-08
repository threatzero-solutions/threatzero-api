import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from '../units/entities/unit.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { BaseOrganizationChangeEvent } from '../events/base-organization-change.event';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { ConfigService } from '@nestjs/config';
import { KeycloakConfig } from 'src/config/keycloak.config';

export const ORGANIZATION_CHANGED_EVENT = 'organization.changed';
export const ORGANIZATION_REMOVED_EVENT = 'organization.removed';
export const UNIT_CHANGED_EVENT = 'unit.changed';
export const UNIT_REMOVED_EVENT = 'unit.removed';

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

    await this.getOrCreateUnitTatsGroupId(orgGroup.id);

    await this.organizationsRepository.update(
      {
        id: organization.id,
      },
      {
        groupId: orgGroup.id,
        tatGroupId: orgTatGroup.id,
      },
    );
  }

  @OnEvent(ORGANIZATION_REMOVED_EVENT)
  async handleOrganizationRemovedEvent(event: BaseOrganizationChangeEvent) {
    const organization = await this.organizationsRepository.findOneByOrFail({
      id: event.id,
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
    if (!unit.organization.id) {
      return;
    }

    const organizationGroupId = unit.organization.groupId;

    if (!organizationGroupId) {
      return;
    }

    const unitGroup = await this.keycloak.upsertGroup(
      {
        id: unit.groupId ?? undefined,
        name: unit.name,
        attributes: {
          unit: [unit.slug],
        },
      },
      organizationGroupId,
    );

    const unitTatsGroupId =
      await this.getOrCreateUnitTatsGroupId(organizationGroupId);

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
        groupId: unitGroup.id,
        tatGroupId: tatGroup.id,
      },
    );
  }

  @OnEvent(UNIT_REMOVED_EVENT)
  async handleUnitRemovedEvent(event: BaseOrganizationChangeEvent) {
    const unit = await this.unitsRepository.findOneByOrFail({
      id: event.id,
    });

    Promise.all(
      [unit.groupId, unit.tatGroupId]
        .filter((id) => !!id)
        .map((id) =>
          this.keycloak.client.groups.del({ id: id! }).catch((e) => {
            this.logger.error(`Failed to delete unit group ${id}`, e);
          }),
        ),
    );
  }

  private async getOrCreateUnitTatsGroupId(orgGroupId: string) {
    const unitTatsGroup = await this.keycloak.client.groups
      .listSubGroups({ parentId: orgGroupId, max: 100 })
      .then((groups) => groups.find((g) => g.name === 'Unit TATs'));

    if (unitTatsGroup) {
      return unitTatsGroup.id;
    }

    const createResponse = await this.keycloak.client.groups.createChildGroup(
      {
        id: orgGroupId,
      },
      {
        name: 'Unit TATs',
      },
    );

    return createResponse.id;
  }
}
