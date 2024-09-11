import { IsNotEmpty, IsString } from 'class-validator';
import { BaseMapperDto } from './base-mapper.dto';
import { IdpProtocol } from '../create-idp.dto';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';

export class SyncDefaultGroupDto extends BaseMapperDto {
  @IsString()
  @IsNotEmpty()
  groupPath: string;

  public build(alias: string, protocol: IdpProtocol) {
    const baseMapper = super.build(alias, protocol);
    return BaseMapperDto.mergeMappers(baseMapper, {
      // Same for both saml and oidc
      identityProviderMapper: 'oidc-hardcoded-group-idp-mapper',
      name: `Default Group ${this.groupPath.replace(/\//g, ' ')} Mapper`,
      config: {
        group: this.groupPath,
      },
    });
  }

  public parse(mapper: IdentityProviderMapperRepresentation) {
    super.parse(mapper);
    this.groupPath = mapper.config.group;
    return this;
  }
}
