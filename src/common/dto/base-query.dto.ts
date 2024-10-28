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
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { Alias } from 'typeorm/query-builder/Alias';

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
      if (!order) return;
      const [_qb, tableAlias, columnName] = this.applyJoins<T>(retQb, sort);
      retQb = _qb.addOrderBy(
        `${tableAlias}.${columnName}`,
        order,
        order === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST',
      );
      if (_qb.alias !== tableAlias) {
        retQb = _qb.addSelect(`${tableAlias}.${columnName}`);
      }
    });

    // Apply where clauses for all remaining fields.
    Object.entries(this).forEach(([fieldName, fieldValue]) => {
      if (fieldValue === undefined) return;
      if (['limit', 'offset', 'order', 'search'].includes(fieldName)) return;
      const [_qb, tableAlias, columnName] = this.applyJoins<T>(
        retQb,
        fieldName,
      );
      const fieldAlias = `${tableAlias}_${columnName}`;

      if (Array.isArray(fieldValue)) {
        retQb = _qb.andWhere(
          `${tableAlias}.${columnName} IN (:...${fieldAlias})`,
          {
            [fieldAlias]: fieldValue,
          },
        );
      } else {
        retQb = _qb.andWhere(`${tableAlias}.${columnName} = :${fieldAlias}`, {
          [fieldAlias]: fieldValue,
        });
      }
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

  protected applyJoins<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    fieldKey: string,
    alias?: Alias,
  ): [SelectQueryBuilder<T>, string, string] {
    const columnMetadata = this.getColumnMetadata(
      fieldKey,
      alias ?? qb.expressionMap.mainAlias,
    );

    if (
      columnMetadata === undefined ||
      columnMetadata.relationMetadata === undefined
    ) {
      return [qb, qb.alias, fieldKey] as const;
    }

    let _qb = qb;

    const relationPath = `${qb.alias}.${columnMetadata.propertyName}`;
    const relationAlias = `${qb.alias}_${columnMetadata.propertyName}`;

    let existinAlias = _qb.expressionMap.aliases.find(
      (a) => a.name === relationAlias || a.name === columnMetadata.propertyName,
    );

    if (!existinAlias) {
      _qb = _qb.leftJoin(relationPath, relationAlias);
      existinAlias = _qb.expressionMap.findAliasByName(relationAlias);
    }

    const nextFieldKey = fieldKey.slice(columnMetadata.propertyName.length + 1);
    return this.applyJoins(_qb, nextFieldKey, existinAlias);
  }

  protected getColumnMetadata(
    fieldKey: string,
    alias: Alias | undefined,
  ): ColumnMetadata | undefined {
    const fields = fieldKey.split('.');

    let columnMetadata: ColumnMetadata | undefined = undefined;
    if (alias) {
      columnMetadata = alias.metadata.findColumnWithPropertyPath(fieldKey);

      if (!columnMetadata) {
        columnMetadata = alias.metadata.findColumnWithPropertyPath(fields[0]);
      }
    }

    return columnMetadata;
  }
}
