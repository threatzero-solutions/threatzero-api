import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakAdminClientConfig } from 'src/config/keycloak.config';
import type KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import merge from 'deepmerge';

export const KEYCLOAK_ADMIN_CLIENT = 'keycloak-admin-client';

const refreshAuth = async (
  client: KeycloakAdminClient,
  config: KeycloakAdminClientConfig,
) => {
  client.setConfig({
    realmName: config.config.realmName,
  });

  await client.auth({
    ...config.auth,
  });

  client.setConfig({
    realmName: config.defaultRealm,
  });
};

export async function loadKeycloakAdminClient() {
  try {
    return (await eval("import('@keycloak/keycloak-admin-client')"))
      .default as typeof import('@keycloak/keycloak-admin-client').default;
  } catch (error) {
    return (await import('@keycloak/keycloak-admin-client')).default;
  }
}

export const keycloakAdminClientFactory = async (config: ConfigService) => {
  const adminClientConfig = config.getOrThrow<KeycloakAdminClientConfig>(
    'keycloak.adminClient',
  );

  const KCAdminClient = await loadKeycloakAdminClient();

  const keycloakClient = new KCAdminClient({
    ...adminClientConfig.config,
  });

  await refreshAuth(keycloakClient, adminClientConfig);

  setInterval(
    () => refreshAuth(keycloakClient, adminClientConfig),
    adminClientConfig.refreshIntervalSeconds * 1000,
  );
};

@Injectable()
export class KeycloakAdminClientService {
  constructor(
    @Inject(KEYCLOAK_ADMIN_CLIENT) public readonly client: KeycloakAdminClient,
  ) {}

  async upsertGroup(
    group: GroupRepresentation,
    parentId?: string,
  ): Promise<GroupRepresentation & { id: string }> {
    let newGroup: GroupRepresentation;

    if (group.id) {
      const fetchedGroup = await this.client.groups.findOne({
        id: group.id,
      });

      if (fetchedGroup) {
        newGroup = merge(fetchedGroup, group, {
          arrayMerge: (destinationArray, sourceArray) => sourceArray,
        });

        await this.client.groups.update(
          {
            id: group.id ?? '',
          },
          newGroup,
        );
      } else {
        throw Error(`Failed to find group with ID ${group.id}`);
      }
    } else if (parentId) {
      newGroup = await this.client.groups.createChildGroup(
        {
          id: parentId,
        },
        group,
      );
    } else {
      newGroup = await this.client.groups.create(group);
    }

    return newGroup as GroupRepresentation & { id: string };
  }
}
