import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsIn,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IdpProtocol } from '../create-idp.dto';
import { BaseMapperDto } from './base-mapper.dto';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';

export const PatternTypes = ['exact', 'regex', 'glob'] as const;
export type PatternType = (typeof PatternTypes)[number];

export class SyncAttributeFromAttributeDto extends BaseMapperDto {
  @IsString()
  @IsNotEmpty()
  externalName: string;

  @ValidateNested({ each: true })
  @Type(() => AttributePatternsDto)
  patterns: AttributePatternsDto[];

  @IsString()
  @IsIn(PatternTypes)
  patternType: PatternType;

  @IsString()
  @IsOptional()
  defaultValue?: string;

  @IsString()
  @IsNotEmpty()
  internalName: string;

  @IsBoolean()
  @IsOptional()
  isMultivalue: boolean = false;

  public build(alias: string, protocol: IdpProtocol) {
    const baseMapper = super.build(alias, protocol);
    return BaseMapperDto.mergeMappers(baseMapper, {
      identityProviderMapper: `${protocol}-advanced-attribute-idp-mapper`,
      name: `${this.externalName} Pattern Match to ${this.internalName} Mapper`,
      config: {
        ['attribute.name']: this.externalName,
        ['patterns']: JSON.stringify(
          this.patterns.map(({ pattern: key, value }) => ({ key, value })),
        ),
        ['default.value']: this.defaultValue,
        ['pattern.type']: this.patternType,
        ['user.attribute']: this.internalName,
        ['is.multivalue']: this.isMultivalue,
      },
    });
  }

  public parse(mapper: IdentityProviderMapperRepresentation) {
    super.parse(mapper);
    this.externalName = mapper.config['attribute.name'];
    this.patterns = JSON.parse(mapper.config.patterns).map(
      ({ key: pattern, value }: { key: string; value: string }) => ({
        pattern,
        value,
      }),
    );
    this.defaultValue = mapper.config['default.value'];
    this.patternType = mapper.config['pattern.type'];
    this.internalName = mapper.config['user.attribute'];
    this.isMultivalue = mapper.config['is.multivalue'];
    return this;
  }
}

export class AttributePatternsDto {
  @IsString()
  @IsNotEmpty()
  pattern: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}
