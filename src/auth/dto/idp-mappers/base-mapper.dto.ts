import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';
import { IdpProtocol } from '../create-idp.dto';
import { IsOptional, IsString } from 'class-validator';

export class BaseMapperDto {
  @IsString()
  @IsOptional()
  id?: string;

  public build(
    alias: string,
    protocol: IdpProtocol,
  ): IdentityProviderMapperRepresentation {
    return {
      identityProviderAlias: alias,
      config: {
        syncMode: 'INHERIT',
      },
    };
  }

  public parse(mapper: IdentityProviderMapperRepresentation) {
    this.id = mapper.id;
    return this;
  }

  public static mergeMappers(
    mapperA: IdentityProviderMapperRepresentation,
    mapperB: IdentityProviderMapperRepresentation,
  ) {
    const { config: configA, ...restMapperA } = mapperA;
    const { config: configB, ...restMapperB } = mapperB;
    return {
      ...restMapperA,
      ...restMapperB,
      config: {
        ...configA,
        ...configB,
      },
    };
  }
}
