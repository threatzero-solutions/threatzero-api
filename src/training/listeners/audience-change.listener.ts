import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Audience } from '../audiences/entities/audience.entity';
import { Repository } from 'typeorm';
import { KeycloakAdminClientService } from 'src/auth/keycloak-admin-client/keycloak-admin-client.service';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { KeycloakConfig } from 'src/config/keycloak.config';
import { AudienceChangeEvent } from '../events/audience-change.event';

export const AUDIENCE_CHANGED_EVENT = 'audience.changed';
export const AUDIENCE_REMOVED_EVENT = 'audience.removed';

@Injectable()
export class AudienceChangeListener {
  private logger = new Logger(AudienceChangeListener.name);

  constructor(
    @InjectRepository(Audience)
    private audiencesRepository: Repository<Audience>,
    private keycloak: KeycloakAdminClientService,
    private config: ConfigService,
  ) {}

  @OnEvent(AUDIENCE_CHANGED_EVENT)
  async handleAudienceChangeEvent(event: AudienceChangeEvent) {
    const audienceParentGroupId =
      this.config.getOrThrow<KeycloakConfig>('keycloak').parentAudiencesGroupId;

    if (!audienceParentGroupId) {
      this.logger.error(
        'Failed to create audience group: Missing parent audiences group id',
      );
      return;
    }

    const audience = await this.audiencesRepository.findOneByOrFail({
      id: event.id,
    });

    const audienceGroup = await this.keycloak.upsertGroup(
      {
        id: audience.groupId ?? undefined,
        name: audience.slug,
        attributes: {
          audience: [audience.slug],
        },
      },
      audienceParentGroupId,
    );

    await this.audiencesRepository.update(
      {
        id: audience.id,
      },
      {
        groupId: audienceGroup.id,
      },
    );
  }

  @OnEvent(AUDIENCE_REMOVED_EVENT)
  async handleAudienceRemoveEvent(event: AudienceChangeEvent) {
    const audience = await this.audiencesRepository.findOneByOrFail({
      id: event.id,
    });

    if (audience.groupId) {
      await this.keycloak.client.groups
        .del({ id: audience.groupId })
        .catch((e) => {
          this.logger.error(
            `Failed to delete audience group ${audience.groupId}`,
            e,
          );
        });
    }
  }
}
