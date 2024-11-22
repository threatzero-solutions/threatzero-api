import { Expose, plainToInstance, Type } from 'class-transformer';
import {
  Matches,
  Length,
  IsString,
  IsNotEmpty,
  IsIn,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import {
  CreateIdpDto,
  IdpProtocol,
  IdpProtocols,
} from 'src/auth/dto/create-idp.dto';
import { Organization } from '../entities/organization.entity';
import { SyncAttributeDto } from 'src/auth/dto/idp-mappers/sync-attribute.dto';
import { BadRequestException } from '@nestjs/common';
import { SyncGroupFromAttributeDto } from 'src/auth/dto/idp-mappers/sync-group-from-attribute.dto';
import { SyncDefaultAttributeDto } from 'src/auth/dto/idp-mappers/sync-default-attribute.dto';
import { SyncDefaultGroupDto } from 'src/auth/dto/idp-mappers/sync-default-group.dto';
import { RoleGroupMatcherDto } from './role-group-matcher.dto';
import {
  ALLOWED_IMPORTED_ATTRIBUTES,
  AllowedImportedAttribute,
} from '../constants';
import { SyncAttributeFromAttributeDto } from 'src/auth/dto/idp-mappers/sync-attribute-from-attribute.dto';

export class CreateOrganizationIdpDto {
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

  @ValidateNested({ each: true })
  @Type(() => SyncAttributeFromAttributeDto)
  @IsOptional()
  unitMatchers?: SyncAttributeFromAttributeDto[];

  @ValidateNested({ each: true })
  @Type(() => SyncAttributeFromAttributeDto)
  @IsOptional()
  audienceMatchers?: SyncAttributeFromAttributeDto[];

  @ValidateNested({ each: true })
  @Type(() => RoleGroupMatcherDto)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  roleGroupMatchers?: RoleGroupMatcherDto[];

  @ValidateNested()
  @Type(() => SyncAttributeDto)
  @IsOptional()
  syncAttributes?: SyncAttributeDto[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  @Expose({ groups: ['admin'] })
  defaultRoleGroups?: string[];

  @IsString()
  @IsOptional()
  defaultAudience?: string | null;

  @IsObject()
  @IsNotEmpty()
  importedConfig: Record<string, string>;

  public merge(other: CreateOrganizationIdpDto) {
    const originalConfig = this.importedConfig;
    Object.assign(this, other);
    this.importedConfig = { ...originalConfig, ...other.importedConfig };
  }

  public build(organization: Organization): CreateIdpDto {
    const allowedAudiences = organization.allowedAudiences;

    // Prepare default sync attributes.
    const defaultSyncAttributes: SyncAttributeDto[] =
      this.protocol === 'saml'
        ? [
            plainToInstance(SyncAttributeDto, {
              externalName: 'lastname',
              internalName: 'lastName',
            }),
            plainToInstance(SyncAttributeDto, {
              externalName: 'firstname',
              internalName: 'firstName',
            }),
          ]
        : [
            plainToInstance(SyncAttributeDto, {
              externalName: 'picture',
              internalName: 'picture',
            }),
          ];

    // Allow only certain sync attributes.
    const syncAttributes: SyncAttributeDto[] = (
      this.syncAttributes ?? []
    )?.filter((attribute) =>
      ALLOWED_IMPORTED_ATTRIBUTES.includes(
        attribute.internalName as AllowedImportedAttribute,
      ),
    );

    defaultSyncAttributes.forEach((attribute) => {
      if (
        !syncAttributes.find((a) => a.internalName === attribute.internalName)
      ) {
        syncAttributes.push(attribute);
      }
    });

    const syncAttributesFromAttributes: SyncAttributeFromAttributeDto[] = [];

    for (const unitMatcher of this.unitMatchers ?? []) {
      if (
        !unitMatcher.patterns.every(
          ({ value: unitSlug }) =>
            organization.units.findIndex((u) => u.slug === unitSlug) >= 0,
        )
      ) {
        throw new BadRequestException('Invalid unit slugs provided.');
      }

      syncAttributesFromAttributes.push(
        plainToInstance(SyncAttributeFromAttributeDto, {
          ...unitMatcher,
          isMultivalue: false,
          internalName: 'unit',
        } as SyncAttributeFromAttributeDto),
      );

      syncAttributesFromAttributes.push(
        plainToInstance(SyncAttributeFromAttributeDto, {
          ...unitMatcher,
          patterns: unitMatcher.patterns
            .map(({ pattern, value }) => ({
              pattern,
              value: organization.units.find((u) => u.slug === value)?.path,
            }))
            .filter(({ value }) => !!value),
          isMultivalue: false,
          internalName: 'organization_unit_path',
        } as SyncAttributeFromAttributeDto),
      );
    }

    for (const audienceMatcher of this.audienceMatchers ?? []) {
      if (
        !audienceMatcher.patterns.every(({ value: audience }) =>
          allowedAudiences.has(audience),
        )
      ) {
        throw new BadRequestException('Invalid audiences provided.');
      }

      syncAttributesFromAttributes.push(
        plainToInstance(SyncAttributeFromAttributeDto, {
          ...audienceMatcher,
          isMultivalue: false,
          internalName: 'audience',
        } as SyncAttributeFromAttributeDto),
      );
    }

    const syncGroupsFromAttributes: SyncGroupFromAttributeDto[] = [
      ...(this.roleGroupMatchers ?? []).map((roleGroupMatcher) => {
        return plainToInstance(SyncGroupFromAttributeDto, {
          id: roleGroupMatcher.attributeId,
          externalName: roleGroupMatcher.externalName,
          pattern: roleGroupMatcher.pattern,
          groupPath: `/Role Groups/${roleGroupMatcher.roleGroup}`,
        });
      }),
    ];

    const defaultAttributes: SyncDefaultAttributeDto[] = [
      plainToInstance(SyncDefaultAttributeDto, {
        internalName: 'organization',
        value: organization.slug,
      }),
    ];

    const defaultGroups: SyncDefaultGroupDto[] = (
      this.defaultRoleGroups ?? []
    ).map((defaultRoleGroup) =>
      plainToInstance(SyncDefaultGroupDto, {
        groupPath: `/Role Groups/${defaultRoleGroup}`,
      }),
    );

    if (this.defaultAudience && allowedAudiences.has(this.defaultAudience)) {
      defaultGroups.push(
        plainToInstance(SyncDefaultGroupDto, {
          groupPath: `/Audiences/${this.defaultAudience}`,
        }),
      );
    }

    return plainToInstance(CreateIdpDto, {
      slug: this.slug,
      name: this.name,
      protocol: this.protocol,
      domains: this.domains,
      syncAttributes,
      syncAttributesFromAttributes,
      syncGroupsFromAttributes,
      defaultAttributes,
      defaultGroups,
      importedConfig: this.importedConfig,
    } as Partial<CreateIdpDto>);
  }

  public parse(createIdpDto: CreateIdpDto) {
    this.slug = createIdpDto.slug;
    this.name = createIdpDto.name;
    this.protocol = createIdpDto.protocol;
    this.domains = createIdpDto.domains;
    this.syncAttributes = createIdpDto.syncAttributes;
    this.unitMatchers = createIdpDto.syncAttributesFromAttributes.filter(
      (attribute) => attribute.internalName === 'unit',
    );
    this.audienceMatchers = createIdpDto.syncAttributesFromAttributes.filter(
      (attribute) => attribute.internalName === 'audience',
    );
    this.roleGroupMatchers = createIdpDto.syncGroupsFromAttributes
      .filter((attribute) => attribute.groupPath.startsWith('/Role Groups/'))
      .map((attribute) =>
        plainToInstance(RoleGroupMatcherDto, {
          roleGroup: attribute.groupPath.split('/').pop(),
          externalName: attribute.externalName,
          pattern: attribute.pattern,
          attributeId: attribute.id,
        }),
      );
    this.defaultRoleGroups = createIdpDto.defaultGroups
      .filter((defaultGroup) =>
        defaultGroup.groupPath.startsWith('/Role Groups/'),
      )
      .map((defaultGroup) => defaultGroup.groupPath.split('/').pop())
      .filter((v) => !!v) as string[];
    this.defaultAudience = createIdpDto.defaultGroups
      .filter((defaultGroup) =>
        defaultGroup.groupPath.startsWith('/Audiences/'),
      )
      .map((defaultGroup) => defaultGroup.groupPath.split('/').pop())
      .filter((v) => !!v)[0];
    this.importedConfig = createIdpDto.importedConfig;

    return this;
  }
}
