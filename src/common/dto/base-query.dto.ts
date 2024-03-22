import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { BaseQueryOrderDto } from './base-query-order.dto';

const defaultOrder = new BaseQueryOrderDto();
defaultOrder.createdOn = 'DESC';

export class BaseQueryDto {
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
  @Type(() => BaseQueryOrderDto)
  order: BaseQueryOrderDto = defaultOrder;

  @IsOptional()
  @IsString()
  search?: string;

  protected getSearchFields(): string[] {
    return [];
  }

  applyToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    let retQb = qb.skip(this.offset).take(this.limit);

    retQb = this.applySearch<T>(retQb);

    // Apply order by clauses.
    Object.entries(this.order).forEach(([sort, order]) => {
      const [_qb, tableAlias, columnName] = this.applyJoins<T>(retQb, sort);
      retQb = _qb.addOrderBy(`${tableAlias}.${columnName}`, order);
    });

    // Apply where clauses for all remaining fields.
    Object.entries(this).forEach(([fieldName, fieldValue]) => {
      if (['limit', 'offset', 'order', 'search'].includes(fieldName)) return;
      const [_qb, tableAlias, columnName] = this.applyJoins<T>(
        retQb,
        fieldName,
      );
      const fieldAlias = `${tableAlias}_${columnName}`;
      retQb = _qb.andWhere(`${tableAlias}.${columnName} = :${fieldAlias}`, {
        [fieldAlias]: fieldValue,
      });
    });

    return retQb;
  }

  private applySearch<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    const searchFields = this.getSearchFields();

    if (!this.search || !searchFields || !searchFields.length) {
      return qb;
    }

    const vectorInput = searchFields
      ?.map((f) => `coalesce("${qb.alias}"."${f.toString()}", '')`)
      .join(" || ' ' || ");

    const query = this.search
      .split(' ')
      .filter((w) => !!w)
      .map((w) => `${w}:*`)
      .join(' & ');

    return qb.andWhere(
      `to_tsvector('english', ${vectorInput}) @@ to_tsquery('english', :query)`,
      { query },
    );
  }

  private applyJoins<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    fieldKey: string,
  ) {
    const fields = fieldKey.split('.');
    const columnName = fields.pop() ?? fieldKey;
    let _qb = qb;
    let alias = _qb.alias;
    fields.forEach((f) => {
      const parts = [f];
      if (alias) {
        parts.unshift(alias);
      }
      const nextAlias = parts.join('_');
      _qb = _qb.leftJoin(parts.join('.'), nextAlias);
      alias = nextAlias;
    });
    return [_qb, alias, columnName] as const;
  }
}
