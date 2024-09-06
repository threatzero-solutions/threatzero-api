import { IsNotEmpty, IsString } from 'class-validator';
import { BaseMapperDto } from './base-mapper.dto';
import { IdpProtocol } from '../create-idp.dto';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';

export class SyncDefaultAttributeDto extends BaseMapperDto {
  @IsString()
  @IsNotEmpty()
  internalName: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  public build(alias: string, protocol: IdpProtocol) {
    const baseMapper = super.build(alias, protocol);
    return BaseMapperDto.mergeMappers(baseMapper, {
      // Same for both saml and oidc
      identityProviderMapper: 'hardcoded-attribute-idp-mapper',
      name: `Default ${this.internalName} as ${this.value} Mapper`,
      config: {
        attribute: this.internalName,
        ['attribute.value']: this.value,
      },
    });
  }

  public parse(mapper: IdentityProviderMapperRepresentation) {
    super.parse(mapper);
    this.internalName = mapper.config.attribute;
    this.value = mapper.config['attribute.value'];
    return this;
  }
}
