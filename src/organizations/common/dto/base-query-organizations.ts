import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { BaseOrganizationsQueryOrderDto } from './base-organizations-query-order.dto';

export class BaseQueryOrganizationsDto extends BaseQueryDto {
  @IsOptional()
  @IsString({ each: true })
  slug?: string | string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BaseOrganizationsQueryOrderDto)
  order: BaseOrganizationsQueryOrderDto = new BaseOrganizationsQueryOrderDto();

  protected getSearchFields() {
    return ['name', 'slug', 'address'];
  }
}
