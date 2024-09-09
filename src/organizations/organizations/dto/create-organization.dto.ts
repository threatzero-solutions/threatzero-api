import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { CreateOrganizationBaseDto } from 'src/organizations/common/dto/create-organization-base.dto';
import { ResourceItem } from 'src/resources/entities/resource.entity';
import { TrainingCourse } from 'src/training/courses/entities/course.entity';

export class CreateOrganizationDto extends CreateOrganizationBaseDto {
  @Type(() => SaveByIdDto<TrainingCourse>)
  @IsOptional()
  @Expose({ groups: ['admin'] })
  courses: SaveByIdDto<TrainingCourse>[];

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
}
