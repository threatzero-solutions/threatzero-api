import { IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { ResourceType } from '../entities/resource.entity';
import { ResourceQueryOrderDto } from './resource-query-order.dto';
import { Type } from 'class-transformer';

export class QueryResourceDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @IsOptional()
  category?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResourceQueryOrderDto)
  order: ResourceQueryOrderDto = new ResourceQueryOrderDto();

  protected getSearchFields() {
    return ['title', 'description'];
  }
}
