import { BaseQueryOrganizationsDto } from 'src/organizations/common/dto/base-query-organizations';
import { UnitsQueryOrderDto } from './units-query-order.dto';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

export class QueryUnitsDto extends BaseQueryOrganizationsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UnitsQueryOrderDto)
  order: UnitsQueryOrderDto = new UnitsQueryOrderDto();
}
