import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { SyncAttributeDto } from './idp-mappers/sync-attribute.dto';
import { Type } from 'class-transformer';
import { SyncGroupFromAttributeDto } from './idp-mappers/sync-group-from-attribute.dto';
import { SyncDefaultGroupDto } from './idp-mappers/sync-default-group.dto';
import { SyncDefaultAttributeDto } from './idp-mappers/sync-default-attribute.dto';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';

export const IdpProtocols = ['oidc', 'saml'] as const;
export type IdpProtocol = (typeof IdpProtocols)[number];

export class CreateIdpDto {
  @Matches(/^[a-z0-9-]+$/)
  @Length(4, 64)
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(IdpProtocols)
  protocol: IdpProtocol;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  domains: string[];

  @ValidateNested()
  @Type(() => SyncAttributeDto)
  syncAttributes: SyncAttributeDto[];

  @ValidateNested()
  @Type(() => SyncGroupFromAttributeDto)
  syncGroupsFromAttributes: SyncGroupFromAttributeDto[];

  @ValidateNested()
  @Type(() => SyncDefaultAttributeDto)
  defaultAttributes: SyncDefaultAttributeDto[];

  @ValidateNested()
  @Type(() => SyncDefaultGroupDto)
  defaultGroups: SyncDefaultGroupDto[];

  @IsObject()
  @IsNotEmpty()
  importedConfig: Record<string, string>;

  public build(): IdentityProviderRepresentation {
    return {
      alias: this.slug,
      displayName: this.name,
      providerId: this.protocol,
      enabled: true,
      trustEmail: true,
      firstBrokerLoginFlowAlias: 'create or update user',
      config: {
        ...this.importedConfig,
        // Imported config overrides
        loginHint: 'true',
        ['home.idp.discovery.domains']: this.domains.join('##'),
        syncMode: 'FORCE',
        hideOnLoginPage: true,
      },
    };
  }

  public parse(
    provider: IdentityProviderRepresentation,
    mappers?: IdentityProviderMapperRepresentation[],
  ) {
    this.slug = provider.alias ?? '';
    this.name = provider.displayName ?? '';
    this.protocol = (
      provider.providerId &&
      IdpProtocols.includes(provider.providerId as IdpProtocol)
        ? provider.providerId
        : 'saml'
    ) as IdpProtocol;
    this.domains =
      provider.config?.['home.idp.discovery.domains']?.split('##') ?? [];
    this.importedConfig = provider.config ?? {};

    if (mappers) {
      this.parseMappers(mappers);
    }

    return this;
  }

  public buildMappers(): IdentityProviderMapperRepresentation[] {
    return [
      ...this.syncAttributes,
      ...this.syncGroupsFromAttributes,
      ...this.defaultAttributes,
      ...this.defaultGroups,
    ].map((attribute) => attribute.build(this.slug, this.protocol));
  }

  public parseMappers(mappers: IdentityProviderMapperRepresentation[]) {
    this.syncAttributes = mappers
      .filter(
        (m) =>
          m.identityProviderMapper &&
          [
            'saml-user-attribute-idp-mapper',
            'oidc-user-attribute-idp-mapper',
          ].includes(m.identityProviderMapper),
      )
      .map((m) => new SyncAttributeDto().parse(m));

    this.syncGroupsFromAttributes = mappers
      .filter(
        (m) =>
          m.identityProviderMapper &&
          [
            'saml-advanced-group-idp-mapper',
            'oidc-advanced-group-idp-mapper',
          ].includes(m.identityProviderMapper),
      )
      .map((m) => new SyncGroupFromAttributeDto().parse(m));

    this.defaultAttributes = mappers
      .filter(
        (m) => m.identityProviderMapper === 'hardcoded-attribute-idp-mapper',
      )
      .map((m) => new SyncDefaultAttributeDto().parse(m));

    this.defaultGroups = mappers
      .filter(
        (m) => m.identityProviderMapper === 'oidc-hardcoded-group-idp-mapper',
      )
      .map((m) => new SyncDefaultGroupDto().parse(m));
  }
}
