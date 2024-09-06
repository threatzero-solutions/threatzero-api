import { IsNotEmpty, IsString } from 'class-validator';
import { BaseMapperDto } from './base-mapper.dto';
import { IdpProtocol } from '../create-idp.dto';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';

export class SyncAttributeDto extends BaseMapperDto {
  @IsString()
  @IsNotEmpty()
  externalName: string;

  @IsString()
  @IsNotEmpty()
  internalName: string;

  public build(alias: string, protocol: IdpProtocol) {
    const baseMapper = super.build(alias, protocol);
    return BaseMapperDto.mergeMappers(baseMapper, {
      identityProviderMapper: `${protocol}-user-attribute-idp-mapper`,
      name: `${this.externalName} to ${this.internalName} Mapper`,
      config:
        protocol === 'saml'
          ? {
              ['user.attribute']: this.internalName,
              ['attribute.name.format']: 'ATTRIBUTE_FORMAT_BASIC',
              ['attribute.name']: this.externalName,
            }
          : {
              ['user.attribute']: this.internalName,
              claim: this.externalName,
            },
    });
  }

  public parse(mapper: IdentityProviderMapperRepresentation) {
    super.parse(mapper);
    this.externalName = mapper.config['attribute.name'] ?? mapper.config.claim;
    this.internalName = mapper.config['user.attribute'];
    return this;
  }
}
