import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  IsString,
  IsIn,
} from 'class-validator';
import { CustomQueryFilter } from 'src/auth/keycloak-admin-client/types';
import {
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';

export class OrganizationUserQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  firstName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  lastName?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  email?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  unit?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  audience?: QueryOrder;

  public asKeycloakOrder(): string {
    const orders: string[] = [];
    for (const key in this) {
      if (this[key]) {
        orders.push(`${this[key] === 'DESC' ? '-' : ''}${key}`);
      }
    }
    return orders.join(',');
  }
}

export class OrganizationUserQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationUserQueryOrderDto)
  order: OrganizationUserQueryOrderDto = new OrganizationUserQueryOrderDto();

  @IsOptional()
  @IsString({ each: true })
  unit?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  audience?: string | string[];

  @IsOptional()
  @IsString()
  search?: string;

  public asFilterConditions() {
    const qs: CustomQueryFilter[] = [];

    const filterKeys = ['unit', 'audience'] as const;
    for (const filterKey of filterKeys) {
      if (this[filterKey]) {
        if (typeof this[filterKey] === 'string') {
          qs.push({ q: { key: filterKey, value: this[filterKey]! } });
        } else {
          qs.push({
            q: { key: filterKey, value: this[filterKey]!, op: 'in' },
          });
        }
      }
    }

    const searchFields = ['email', 'firstName', 'lastName'] as const;
    if (this.search) {
      qs.push({
        OR: searchFields.map((f) => ({
          q: { key: f, value: this.search!, op: 'contains' },
        })),
      });
    }

    return qs;
  }
}
