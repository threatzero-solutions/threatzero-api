import { IsOptional, IsIn } from 'class-validator';
import {
  QueryOrderOptions,
  QueryOrder,
} from 'src/common/dto/base-query-order.dto';
import { BaseOrganizationsQueryOrderDto } from 'src/organizations/common/dto/base-organizations-query-order.dto';

export class UnitsQueryOrderDto extends BaseOrganizationsQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['organization.name']: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['parentUnit.name']: QueryOrder;
}
