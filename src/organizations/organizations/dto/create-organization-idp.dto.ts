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
import { UnitMatcherDto } from './unit-matcher.dto';
import { Organization } from '../entities/organization.entity';
import { SyncAttributeDto } from 'src/auth/dto/idp-mappers/sync-attribute.dto';
import { BadRequestException } from '@nestjs/common';
import { SyncGroupFromAttributeDto } from 'src/auth/dto/idp-mappers/sync-group-from-attribute.dto';
import { SyncDefaultAttributeDto } from 'src/auth/dto/idp-mappers/sync-default-attribute.dto';
import { SyncDefaultGroupDto } from 'src/auth/dto/idp-mappers/sync-default-group.dto';
import { AudienceMatcherDto } from './audience-matcher.dto';
import { RoleGroupMatcherDto } from './role-group-matcher.dto';

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

  @ValidateNested()
  @Type(() => UnitMatcherDto)
  unitMatchers: UnitMatcherDto[];

  @ValidateNested()
  @Type(() => AudienceMatcherDto)
  audienceMatchers: AudienceMatcherDto[];

  @ValidateNested()
  @Type(() => RoleGroupMatcherDto)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  roleGroupMatchers?: RoleGroupMatcherDto[];

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
    const syncAttributes: SyncAttributeDto[] = [];
    if (this.protocol === 'saml') {
      syncAttributes.push(
        plainToInstance(SyncAttributeDto, {
          externalName: 'lastname',
          internalName: 'lastName',
        }),
      );
      syncAttributes.push(
        plainToInstance(SyncAttributeDto, {
          externalName: 'firstname',
          internalName: 'firstName',
        }),
      );
    } else {
      syncAttributes.push(
        plainToInstance(SyncAttributeDto, {
          externalName: 'picture',
          internalName: 'picture',
        }),
      );
    }

    const allowedAudiences = organization.allowedAudiences;
    const syncGroupsFromAttributes: SyncGroupFromAttributeDto[] = [
      ...this.unitMatchers.map((unitMatcher) => {
        const unit = organization.units.find(
          (u) => u.slug === unitMatcher.unitSlug,
        );

        if (!unit) {
          throw new BadRequestException('Invalid unit slug');
        }

        // Build mapper to map pattern to unit group.
        return plainToInstance(SyncGroupFromAttributeDto, {
          id: unitMatcher.attributeId,
          externalName: unitMatcher.externalName,
          pattern: unitMatcher.pattern,
          groupPath: `/Organizations/${organization.name}/${unit.name}`,
        });
      }),
      ...this.audienceMatchers
        .filter((audienceMatcher) =>
          allowedAudiences.has(audienceMatcher.audience),
        )
        .map((audienceMatcher) => {
          return plainToInstance(SyncGroupFromAttributeDto, {
            id: audienceMatcher.attributeId,
            externalName: audienceMatcher.externalName,
            pattern: audienceMatcher.pattern,
            groupPath: `/Audiences/${audienceMatcher.audience}`,
          });
        }),
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
      syncGroupsFromAttributes,
      defaultAttributes,
      defaultGroups,
      importedConfig: this.importedConfig,
    });
  }

  public parse(createIdpDto: CreateIdpDto, organization: Organization) {
    this.slug = createIdpDto.slug;
    this.name = createIdpDto.name;
    this.protocol = createIdpDto.protocol;
    this.domains = createIdpDto.domains;
    this.unitMatchers = createIdpDto.syncGroupsFromAttributes
      .filter((attribute) => attribute.groupPath.startsWith('/Organizations/'))
      .map((attribute) => {
        const unit = organization.units.find(
          (u) => u.name === attribute.groupPath.split('/').pop(),
        );

        if (unit) {
          return plainToInstance(UnitMatcherDto, {
            unitSlug: unit.slug,
            externalName: attribute.externalName,
            pattern: attribute.pattern,
            attributeId: attribute.id,
          });
        }
      })
      .filter((v) => !!v) as UnitMatcherDto[];
    this.audienceMatchers = createIdpDto.syncGroupsFromAttributes
      .filter((attribute) => attribute.groupPath.startsWith('/Audiences/'))
      .map((attribute) =>
        plainToInstance(AudienceMatcherDto, {
          audience: attribute.groupPath.split('/').pop(),
          externalName: attribute.externalName,
          pattern: attribute.pattern,
          attributeId: attribute.id,
        }),
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
