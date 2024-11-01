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

interface ContainsJsonKeyQuery {
  tableAlias: string;
  columnName: string;
  key: string;
  value: any[];
}

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
    retQb = this.applyOrdering<T>(retQb);
    retQb = this.applyFilters<T>(retQb);

    return retQb;
  }

  protected applySearch<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    const searchFields = this.getSearchFields();

    if (!this.search || !searchFields || !searchFields.length) {
      return qb;
    }

    const vectorInput = searchFields
      ?.map((f) => {
        const { tableAlias, columnName, isJsonb } = this.applyJoins<T>(qb, f);

        if (isJsonb) {
          const key = f.replace(columnName + '.', '');
          return `coalesce("${tableAlias}"."${columnName}"->>'${key}', '')`;
        } else {
          return `coalesce("${tableAlias}"."${columnName}", '')`;
        }
      })
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

  protected applyOrdering<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
    let _qb = qb;
    Object.entries(this.order).forEach(([sort, order]) => {
      if (!order) return;
      const { tableAlias, columnName, isJsonb } = this.applyJoins<T>(_qb, sort);

      if (isJsonb) {
        const columnAlias = `${_qb.alias}_${sort.replace('.', '_').toLowerCase()}`;
        _qb = _qb
          .addSelect(
            `${_qb.alias}.${columnName}->>'${sort.replace(columnName + '.', '')}'`,
            columnAlias,
          )
          .addOrderBy(
            columnAlias,
            order,
            order === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST',
          );
      } else {
        _qb = _qb.addOrderBy(
          `${tableAlias}.${columnName}`,
          order,
          order === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST',
        );
        if (_qb.alias !== tableAlias) {
          _qb = _qb.addSelect(`${tableAlias}.${columnName}`);
        }
      }
    });
    return _qb;
  }

  protected applyFilters<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
  ): SelectQueryBuilder<T> {
    let _qb = qb;

    const containmentQueries: Record<string, Record<string, string>> = {};
    const containsKeyQueries: ContainsJsonKeyQuery[] = [];

    // Apply where clauses for all remaining fields.
    Object.entries(this).forEach(([fieldName, fieldValue]) => {
      if (fieldValue === undefined) return;
      if (['limit', 'offset', 'order', 'search'].includes(fieldName)) return;
      const { tableAlias, columnName, isJsonb } = this.applyJoins<T>(
        _qb,
        fieldName,
      );

      if (isJsonb) {
        const key = fieldName.replace(columnName + '.', '');
        if (Array.isArray(fieldValue)) {
          containsKeyQueries.push({
            tableAlias,
            columnName,
            key,
            value: fieldValue,
          });
        } else {
          const colRef = `${tableAlias}.${columnName}`;
          if (!containmentQueries[colRef]) {
            containmentQueries[colRef] = {};
          }
          containmentQueries[colRef][key] = fieldValue;
        }
      } else {
        const fieldAlias = `${tableAlias}_${columnName}`;

        if (Array.isArray(fieldValue)) {
          _qb = _qb.andWhere(
            `${tableAlias}.${columnName} IN (:...${fieldAlias})`,
            {
              [fieldAlias]: fieldValue,
            },
          );
        } else {
          _qb = _qb.andWhere(`${tableAlias}.${columnName} = :${fieldAlias}`, {
            [fieldAlias]: fieldValue,
          });
        }
      }
    });

    for (const [colRef, containmentQuery] of Object.entries(
      containmentQueries,
    )) {
      const parameterName = colRef.replace(/\./g, '_');
      _qb = _qb.andWhere(`${colRef} @> :${parameterName}`, {
        [parameterName]: JSON.stringify(containmentQuery),
      });
    }

    for (const { key, value, columnName, tableAlias } of containsKeyQueries) {
      _qb = _qb.andWhere(
        `${tableAlias}.${columnName} -> '${key}' ?| ARRAY(SELECT jsonb_array_elements_text('${JSON.stringify(value)}'))`,
      );
    }

    return _qb;
  }

  protected applyJoins<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    fieldKey: string,
    alias?: Alias,
  ): {
    qb: SelectQueryBuilder<T>;
    tableAlias: string;
    columnName: string;
    isJsonb: boolean;
  } {
    const thisAlias = alias ?? qb.expressionMap.mainAlias;
    const { columnMetadata } = this.getColumnMetadata(fieldKey, thisAlias);

    const aliasName = thisAlias?.name ?? qb.alias;

    if (
      !fieldKey.includes('.') ||
      columnMetadata === undefined ||
      columnMetadata.relationMetadata === undefined
    ) {
      return {
        qb,
        tableAlias: aliasName,
        columnName: columnMetadata?.propertyPath ?? fieldKey,
        isJsonb: columnMetadata?.type === 'jsonb',
      };
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
