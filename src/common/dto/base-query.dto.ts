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
    const thisAlias = alias ?? qb.expressionMap.mainAlias;
    const { columnMetadata } = this.getColumnMetadata(fieldKey, thisAlias);

    const aliasName = thisAlias?.name ?? qb.alias;

    if (
      !fieldKey.includes('.') ||
      columnMetadata === undefined ||
      columnMetadata.relationMetadata === undefined
    ) {
      return [qb, aliasName, fieldKey] as const;
    }

    let _qb = qb;

    const propertyName = columnMetadata.relationMetadata.propertyName;

    const relationPath = `${aliasName}.${propertyName}`;
    const relationAlias = `${aliasName}_${propertyName}`;

    let existingAlias = _qb.expressionMap.aliases.find(
      (a) => a.name === relationAlias || a.name === propertyName,
    );

    if (!existingAlias) {
      _qb = _qb.leftJoin(relationPath, relationAlias);
      existingAlias = _qb.expressionMap.findAliasByName(relationAlias);
    }

    const nextFieldKey = fieldKey.slice(
      columnMetadata.relationMetadata.propertyPath.length + 1,
    );
    return this.applyJoins(_qb, nextFieldKey, existingAlias);
  }

  protected getColumnMetadata(
    fieldKey: string,
    alias: Alias | undefined,
  ): Partial<{ propertyPath: string; columnMetadata: ColumnMetadata }> {
    const fields = fieldKey.split('.');

    let propertyPath: string | undefined = undefined;
    let columnMetadata: ColumnMetadata | undefined = undefined;
    if (alias) {
      propertyPath = fieldKey;
      columnMetadata = alias.metadata.findColumnWithPropertyPath(propertyPath);

      if (!columnMetadata) {
        propertyPath = fields[0];
        columnMetadata =
          alias.metadata.findColumnWithPropertyPath(propertyPath);
      }
    }

    return {
      propertyPath,
      columnMetadata,
    };
  }
}
