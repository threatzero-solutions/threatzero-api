import { type ConnectionConfig } from '@keycloak/keycloak-admin-client/lib/client';
import {
  type Credentials,
  type GrantTypes,
} from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsString, ValidateNested } from 'class-validator';

class KeycloakAdminClientConnectionConfig implements ConnectionConfig {
  @IsString()
  realmName: string;

  @IsString()
  baseUrl: string;
}

class KeycloakAdminClientAuthConfig implements Credentials {
  @IsIn(['client_credentials'])
  grantType: 'client_credentials';

  @IsString()
  clientId: string;

  @IsString()
  clientSecret: string;
}

class KeycloakAdminClientConfig {
  @ValidateNested()
  @Type(() => KeycloakAdminClientConnectionConfig)
  config: KeycloakAdminClientConnectionConfig;

  @ValidateNested()
  @Type(() => KeycloakAdminClientAuthConfig)
  auth: KeycloakAdminClientAuthConfig;

  @IsString()
  defaultRealm: string;

  @IsNumber()
  refreshIntervalSeconds: number;
}

export class KeycloakConfig {
  @ValidateNested()
  @Type(() => KeycloakAdminClientConfig)
  adminClient: KeycloakAdminClientConfig;

  parentOrganizationsGroupId?: string;
}

export default registerAs('keycloak', () => ({
  adminClient: {
    config: {
      realmName: process.env.KEYCLOAK_ADMIN_CLIENT_REALM ?? 'master',
      baseUrl:
        process.env.KEYCLOAK_ADMIN_CLIENT_BASE_URL ??
        'https://auth.staging.threatzero.org',
    },
    auth: {
      grantType: 'client_credentials',
      clientId: process.env.KEYCLOAK_ADMIN_CLIENT_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_CLIENT_SECRET,
    },
    defaultRealm:
      process.env.KEYCLOAK_ADMIN_CLIENT_DEFAULT_REALM ?? 'threatzero',
    refreshIntervalSeconds:
      parseInt(
        process.env.KEYCLOAK_ADMIN_CLIENT_REFRESH_INTERVAL_SECONDS ?? '58',
      ) ?? 58,
  },
  parentOrganizationsGroupId:
    process.env.KEYCLOAK_PARENT_ORGANIZATIONS_GROUP_ID,
}));
