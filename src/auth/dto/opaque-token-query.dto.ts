import { IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export class OpaqueTokenQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @IsString()
  type: string;

  applyToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    let retQb = qb.skip(this.offset).take(this.limit);

    // Apply order by clauses.
    Object.entries(this.order).forEach(([sort, order]) => {
      if (['createdOn', 'updatedOn', 'type'].includes(sort)) {
        retQb = retQb.addOrderBy(`${retQb.alias}.${sort}`, order);
      } else {
        retQb = retQb.addOrderBy(`"${retQb.alias}".value->>'${sort}'`, order);
      }
    });

    const query = Object.fromEntries(
      Object.entries(this).filter(
        ([key]) => !['limit', 'offset', 'order', 'type'].includes(key),
      ),
    );
    retQb = retQb.where(`value @> '${JSON.stringify(query)}'::jsonb`);

    if (this.type) {
      retQb = retQb.andWhere({ type: this.type });
    }

    return retQb;
  }
}
