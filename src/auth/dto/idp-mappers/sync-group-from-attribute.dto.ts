import { IsNotEmpty, IsString } from 'class-validator';
import { SyncDefaultGroupDto } from './sync-default-group.dto';
import { IdpProtocol } from '../create-idp.dto';
import { BaseMapperDto } from './base-mapper.dto';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';

export class SyncGroupFromAttributeDto extends SyncDefaultGroupDto {
  @IsString()
  @IsNotEmpty()
  externalName: string;

  @IsString()
  @IsNotEmpty()
  pattern: string;

  public build(alias: string, protocol: IdpProtocol) {
    const baseMapper = super.build(alias, protocol);
    const attrType = protocol === 'saml' ? 'attribute' : 'claim';
    return BaseMapperDto.mergeMappers(baseMapper, {
      identityProviderMapper: `${protocol}-advanced-group-idp-mapper`,
      name: `${this.externalName} to ${this.groupPath.split('/').pop()} Mapper`,
      config: {
        [`${attrType}s`]: JSON.stringify([
          {
            key: this.externalName,
            value: this.pattern,
          },
        ]),
        [`are.${attrType}.values.regex`]: true,
        group: this.groupPath,
      },
    });
  }

  public parse(mapper: IdentityProviderMapperRepresentation) {
    super.parse(mapper);
    const attrMap = JSON.parse(
      mapper.config.attributes ?? mapper.config.claims ?? '[]',
    )[0];
    this.externalName = attrMap.key;
    this.pattern = attrMap.value;
    return this;
  }
}
