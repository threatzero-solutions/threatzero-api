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
  type?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  applyToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    let retQb = qb.skip(this.offset).take(this.limit);

    // Apply order by clauses.
    Object.entries(this.order).forEach(([sort, order]) => {
      if (['createdOn', 'updatedOn', 'type', 'batchId'].includes(sort)) {
        retQb = retQb.addOrderBy(`${retQb.alias}.${sort}`, order);
      } else {
        retQb = retQb.addOrderBy(`"${retQb.alias}".value->>'${sort}'`, order);
      }
    });

    const query = Object.fromEntries(
      Object.entries(this).filter(
        ([key]) =>
          !['limit', 'offset', 'order', 'type', 'batchId'].includes(key),
      ),
    );
    retQb = retQb.where(`value @> '${JSON.stringify(query)}'::jsonb`);

    const fieldClause = Object.fromEntries(
      Object.entries({ type: this.type, batchId: this.batchId }).filter(
        ([key, value]) => !!value,
      ),
    );

    if (Object.keys(fieldClause).length > 0) {
      retQb = retQb.andWhere(fieldClause);
    }

    return retQb;
  }
}
