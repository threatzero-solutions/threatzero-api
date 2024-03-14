import { IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
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

  applyToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    let retQb = qb.limit(this.limit).offset(this.offset);

    // Apply order by clauses.
    Object.entries(this.order).forEach(([sort, order]) => {
      const [_qb, tableAlias, columnName] = this.applyJoins<T>(retQb, sort);
      retQb = _qb.addOrderBy(`${tableAlias}.${columnName}`, order);
    });

    // Apply where clauses for all remaining fields.
    Object.entries(this).forEach(([fieldName, fieldValue]) => {
      if (['limit', 'offset', 'order'].includes(fieldName)) return;
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
