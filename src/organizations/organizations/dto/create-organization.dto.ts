import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { CreateOrganizationBaseDto } from 'src/organizations/common/dto/create-organization-base.dto';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { OrganizationStatus } from '../entities/organization.entity';
import { CreateCourseEnrollmentDto } from './create-course-enrollment.dto';
import { OrganizationNotificationSettingsDto } from './organization-notification-settings.dto';
import { OrganizationTrainingAccessSettingsDto } from './organization-training-access-settings.dto';

export class CreateOrganizationDto extends CreateOrganizationBaseDto {
  @IsEnum(OrganizationStatus)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  status: OrganizationStatus;

  @Type(() => CreateCourseEnrollmentDto)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  enrollments: CreateCourseEnrollmentDto[];

  @Type(() => SaveByIdDto<ResourceItem>)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  resources: SaveByIdDto<ResourceItem>[];

  @IsString({ each: true })
  @IsOptional()
  @Expose({ groups: ['admin'] })
  idpSlugs?: string[];

  @IsString({ each: true })
  @IsOptional()
  @Expose({ groups: ['admin'] })
  allowedRoleGroups?: string[];

  @Type(() => OrganizationTrainingAccessSettingsDto)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  @ValidateNested()
  trainingAccessSettings?: OrganizationTrainingAccessSettingsDto;

  @Type(() => OrganizationNotificationSettingsDto)
  @IsOptional()
  @ValidateNested()
  notificationSettings?: OrganizationNotificationSettingsDto;
}
