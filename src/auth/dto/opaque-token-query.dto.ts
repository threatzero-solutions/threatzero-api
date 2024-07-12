import { IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { In, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export class OpaqueTokenQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsUUID('4', { each: true })
  id?: string | string[];

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  getValueFields(): string[] {
    return [];
  }

  applyToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    console.debug(this);
    let retQb = qb.skip(this.offset).take(this.limit);

    const VALUE_FIELDS = this.getValueFields();
    // const META_FIELDS = ['limit', 'offset', 'order', 'search'];
    const COLUMN_FIELDS = [
      'id',
      'createdOn',
      'updatedOn',
      'key',
      'type',
      'batchId',
    ];

    // Apply order by clauses.
    Object.entries(this.order).forEach(([sort, order]) => {
      if (VALUE_FIELDS.includes(sort)) {
        retQb = retQb.addOrderBy(`"${retQb.alias}".value->>'${sort}'`, order);
      } else if (COLUMN_FIELDS.includes(sort)) {
        retQb = retQb.addOrderBy(`${retQb.alias}.${sort}`, order);
      }
    });

    const containmentQuery: Record<string, any> = {};
    const containsKeyQueries: [string, any[]][] = [];

    for (const [key, value] of Object.entries(this)) {
      if (VALUE_FIELDS.includes(key)) {
        if (Array.isArray(value)) {
          containsKeyQueries.push([key, value]);
        } else {
          containmentQuery[key] = value;
        }
      }
    }

    retQb = retQb.where(
      `value @> '${JSON.stringify(containmentQuery)}'::jsonb`,
    );
    for (const [key, value] of containsKeyQueries) {
      retQb = retQb.andWhere(
        `value -> '${key}' ?| ARRAY(SELECT jsonb_array_elements_text('${JSON.stringify(value)}'))`,
      );
    }

    const fieldClause = Object.fromEntries(
      Object.entries(this)
        .filter(([key, value]) => COLUMN_FIELDS.includes(key) && !!value)
        .map(([key, value]) => [key, Array.isArray(value) ? In(value) : value]),
    );

    if (Object.keys(fieldClause).length > 0) {
      retQb = retQb.andWhere(fieldClause);
    }

    return retQb;
  }
}
