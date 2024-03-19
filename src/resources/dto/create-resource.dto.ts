import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
} from 'class-validator';
import { ResourceType } from '../entities/resource.entity';
import { Type } from 'class-transformer';
import { SaveByIdDto } from 'src/common/dto.utils';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';

export class CreateResourceDto {
  @IsOptional()
  @IsString()
  fileKey?: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vimeoUrl?: string;

  @Type(() => SaveByIdDto<Organization>)
  @IsOptional()
  organizations: SaveByIdDto<Organization>[];

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string | null;

  @IsEnum(ResourceType)
  type: ResourceType;

  @IsNotEmpty()
  @IsString()
  category: string;
}
