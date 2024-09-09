import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakAdminClientConfig } from 'src/config/keycloak.config';
import type KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import merge from 'deepmerge';
import { CreateIdpDto } from '../dto/create-idp.dto';
import { type NetworkError } from '@keycloak/keycloak-admin-client';

export const KEYCLOAK_ADMIN_CLIENT = 'keycloak-admin-client';
let KCNetworkError: typeof NetworkError | undefined;

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

async function loadKeycloakModule() {
  try {
    return (await eval(
      "import('@keycloak/keycloak-admin-client')",
    )) as typeof import('@keycloak/keycloak-admin-client');
  } catch (error) {
    return await import('@keycloak/keycloak-admin-client');
  }
}

export async function loadKeycloakAdminClient() {
  const { default: KeycloakAdminClient, NetworkError } =
    await loadKeycloakModule();
  KCNetworkError = NetworkError;
  return KeycloakAdminClient;
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

  return keycloakClient;
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

  async createIdentityProvider(createIdpDto: CreateIdpDto) {
    await this.client.identityProviders
      .create(createIdpDto.build())
      .catch((e) => {
        if (e.response) {
          if (e.response.status === 409) {
            throw new BadRequestException(
              `Identity provider already exists with slug ${createIdpDto.slug}`,
            );
          }

          throw new Error(
            `Failed to create IDP [Status ${e.response.status}]: ${e.response.statusText}`,
          );
        }
        throw e;
      });

    try {
      // Create mappers.
      await Promise.all(
        createIdpDto.buildMappers().map(async (mapper) =>
          this.client.identityProviders.createMapper({
            alias: createIdpDto.slug,
            identityProviderMapper: mapper,
          }),
        ),
      );
    } catch (e) {
      // Undo creation of IDP if creating mappers fails.
      await this.client.identityProviders.del({ alias: createIdpDto.slug });
      throw e;
    }

    const newIdp = await this.getIdentityProvider(createIdpDto.slug);

    if (!newIdp) {
      throw new Error('Failed to create IDP');
    }

    return newIdp;
  }

  async updateIdentityProvider(slug: string, updateIdpDto: CreateIdpDto) {
    await this.client.identityProviders
      .update({ alias: slug }, updateIdpDto.build())
      .catch((e) => {
        if (e.response) {
          if (e.response.status === 409) {
            throw new BadRequestException(
              `Identity provider already exists with slug ${updateIdpDto.slug}`,
            );
          } else if (e.response.status === 404) {
            throw new NotFoundException(
              `Identity provider not found with slug ${slug}`,
            );
          }

          throw new Error(
            `Failed to update IDP [Status ${e.response.status}]: ${e.response.statusText}`,
          );
        }
        throw e;
      });

    const existingMappers = await this.client.identityProviders.findMappers({
      alias: updateIdpDto.slug,
    });
    const newMappers = updateIdpDto.buildMappers();
    const toDelete = existingMappers
      .filter(
        (existingMapper) =>
          !newMappers.some((newMapper) => newMapper.id === existingMapper.id),
      )
      .map((mapper) => mapper.id)
      .filter((id) => !!id) as string[];
    const toCreate = newMappers
      .filter(
        (newMapper) =>
          !existingMappers.some(
            (existingMapper) => newMapper.id === existingMapper.id,
          ),
      )
      .map((mapper) => mapper);
    const toUpdate = newMappers
      .filter((newMapper) =>
        existingMappers.some(
          (existingMapper) => newMapper.id === existingMapper.id,
        ),
      )
      .map((mapper) => mapper);

    if (toDelete.length > 0) {
      await Promise.all(
        toDelete.map((id) =>
          this.client.identityProviders.delMapper({ alias: slug, id }),
        ),
      );
    }

    if (toCreate.length > 0) {
      await Promise.all(
        toCreate.map((mapper) =>
          this.client.identityProviders.createMapper({
            alias: slug,
            identityProviderMapper: mapper,
          }),
        ),
      );
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(
          (mapper) =>
            mapper.id &&
            this.client.identityProviders.updateMapper(
              { alias: slug, id: mapper.id },
              mapper,
            ),
        ),
      );
    }

    return await this.getIdentityProvider(updateIdpDto.slug);
  }

  async getIdentityProvider(slug: string) {
    const [newIdp, newMappers] = await Promise.all([
      this.client.identityProviders.findOne({
        alias: slug,
      }),
      this.client.identityProviders.findMappers({ alias: slug }).catch((e) => {
        if (
          KCNetworkError &&
          e instanceof KCNetworkError &&
          e.response.status === 404
        ) {
          return [];
        }
        throw e;
      }),
    ]);

    if (!newIdp) {
      return;
    }

    return new CreateIdpDto().parse(newIdp, newMappers);
  }

  async deleteIdentityProvider(slug: string) {
    await this.client.identityProviders.del({ alias: slug });
  }
}
