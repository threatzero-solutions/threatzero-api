import { type ConnectionConfig } from '@keycloak/keycloak-admin-client/lib/client';
import { type Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { validate } from './env.validation';

class KeycloakAdminClientConnectionConfig implements ConnectionConfig {
  @IsString()
  @IsOptional()
  realmName: string = 'master';

  @IsString()
  @IsOptional()
  baseUrl: string = 'https://auth.staging.threatzero.org';
}

class KeycloakAdminClientAuthConfig implements Credentials {
  @IsIn(['client_credentials'])
  @IsOptional()
  grantType: 'client_credentials' = 'client_credentials';

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;
}

export class KeycloakAdminClientConfig {
  @ValidateNested()
  @Type(() => KeycloakAdminClientConnectionConfig)
  @IsNotEmpty()
  config: KeycloakAdminClientConnectionConfig;

  @ValidateNested()
  @Type(() => KeycloakAdminClientAuthConfig)
  @IsNotEmpty()
  auth: KeycloakAdminClientAuthConfig;

  @IsString()
  @IsOptional()
  defaultRealm: string = 'threatzero';

  @IsNumber()
  @IsOptional()
  refreshIntervalSeconds: number = 58;
}

export class KeycloakConfig {
  @ValidateNested()
  @Type(() => KeycloakAdminClientConfig)
  @IsNotEmpty()
  adminClient: KeycloakAdminClientConfig;

  @IsString()
  @IsNotEmpty()
  parentOrganizationsGroupId: string;
}

export default registerAs('keycloak', () =>
  validate(KeycloakConfig, {
    adminClient: {
      config: {
        realmName: process.env.KEYCLOAK_ADMIN_CLIENT_REALM,
        baseUrl: process.env.KEYCLOAK_ADMIN_CLIENT_BASE_URL,
      },
      auth: {
        grantType: 'client_credentials',
        clientId: process.env.KEYCLOAK_ADMIN_CLIENT_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_CLIENT_SECRET,
      },
      defaultRealm: process.env.KEYCLOAK_ADMIN_CLIENT_DEFAULT_REALM,
      refreshIntervalSeconds:
        process.env.KEYCLOAK_ADMIN_CLIENT_REFRESH_INTERVAL_SECONDS,
    },
    parentOrganizationsGroupId:
      process.env.KEYCLOAK_PARENT_ORGANIZATIONS_GROUP_ID,
  }),
);
