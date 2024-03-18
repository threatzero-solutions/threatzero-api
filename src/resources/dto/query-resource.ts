import { IsOptional, IsEnum } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { ResourceType } from '../entities/resource.entity';

export class QueryResourceDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @IsOptional()
  category?: string;
}
