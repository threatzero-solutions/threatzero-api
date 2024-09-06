import { plainToInstance, Type } from 'class-transformer';
import {
  Matches,
  Length,
  IsString,
  IsNotEmpty,
  IsIn,
  IsObject,
  ValidateNested,
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

export const ALLOWED_DEFAULT_ROLE_GROUPS = ['Training Participant'] as const;
export type AllowedDefaultRoleGroups =
  (typeof ALLOWED_DEFAULT_ROLE_GROUPS)[number];

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

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsIn(ALLOWED_DEFAULT_ROLE_GROUPS, { each: true })
  defaultRoleGroups: string[];

  @IsObject()
  @IsNotEmpty()
  importedConfig: Record<string, string>;

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

    const syncGroupsFromAttributes: SyncGroupFromAttributeDto[] =
      this.unitMatchers.map((unitMatcher) => {
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
      });

    const defaultAttributes: SyncDefaultAttributeDto[] = [
      plainToInstance(SyncDefaultAttributeDto, {
        internalName: 'organization',
        value: organization.slug,
      }),
    ];

    const defaultGroups: SyncDefaultGroupDto[] = this.defaultRoleGroups.map(
      (defaultRoleGroup) =>
        plainToInstance(SyncDefaultGroupDto, {
          groupPath: `/Role Groups/${defaultRoleGroup}`,
        }),
    );

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
    this.defaultRoleGroups = createIdpDto.defaultGroups
      .map((defaultGroup) => defaultGroup.groupPath.split('/').pop())
      .filter((v) => !!v) as string[];
    this.importedConfig = createIdpDto.importedConfig;

    return this;
  }
}
