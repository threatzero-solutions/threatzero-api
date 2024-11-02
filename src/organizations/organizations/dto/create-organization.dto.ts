import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { CreateOrganizationBaseDto } from 'src/organizations/common/dto/create-organization-base.dto';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { CourseEnrollment } from '../entities/course-enrollment.entity';
import { OrganizationTrainingAccessSettingsDto } from './organization-training-access-settings.dto';

export class CreateOrganizationDto extends CreateOrganizationBaseDto {
  @Type(() => CourseEnrollment)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  enrollments: SaveByIdDto<CourseEnrollment>[];

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
}
