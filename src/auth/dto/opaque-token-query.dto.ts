import { IsOptional, IsNumber, Min } from 'class-validator';
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

  applyToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    let retQb = qb.skip(this.offset).take(this.limit);

    // Apply order by clauses.
    Object.entries(this.order).forEach(([sort, order]) => {
      if (['createdOn', 'updatedOn'].includes(sort)) {
        retQb = retQb.addOrderBy(`${retQb.alias}.${sort}`, order);
      } else {
        retQb = retQb.addOrderBy(`"${retQb.alias}".value->>'${sort}'`, order);
      }
    });

    const query = Object.fromEntries(
      Object.entries(this).filter(
        ([key, value]) => !['limit', 'offset', 'order'].includes(key),
      ),
    );
    retQb = retQb.where(`value @> '${JSON.stringify(query)}'::jsonb`);

    return retQb;
  }
}
