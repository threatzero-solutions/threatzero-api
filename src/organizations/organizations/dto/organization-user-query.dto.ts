import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomQueryFilter } from 'src/auth/keycloak-admin-client/types';
import {
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import { asArray } from 'src/common/utils';

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
  id?: string | string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString({ each: true })
  unit?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  audience?: string | string[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString({ each: true })
  ['groups.ids']?: string | string[];

  @IsOptional()
  @IsIn(['any', 'all', 'none'])
  ['groups.op']?: 'any' | 'all' | 'none';

  public asFilterConditions() {
    const qs: CustomQueryFilter[] = [];

    const filterKeys = ['id', 'unit', 'audience', 'enabled'] as const;
    for (const filterKey of filterKeys) {
      if (this[filterKey]) {
        if (!Array.isArray(this[filterKey])) {
          qs.push({ q: { key: filterKey, value: this[filterKey]! } });
        } else {
          qs.push({
            q: { key: filterKey, value: this[filterKey]!, op: 'in' },
          });
        }
      }
    }

    if (this['groups.ids']) {
      qs.push({
        groupQ: {
          key: 'id',
          groups: asArray(this['groups.ids']),
          op: this['groups.op'] || 'all',
        },
      });
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
