import PostgresInterval, { IPostgresInterval } from 'postgres-interval';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export const intervalTransformer = {
  to: (anonIntervalObject: object): string => {
    if (anonIntervalObject !== null && typeof anonIntervalObject === 'object') {
      // Somewhere along the line, `anonIntervalObject` loses some properties required by
      // `PostgresInterval.prototype.toPostgres`. Specifically, the `hasOwnProperty` method
      // is undefined, which breaks `PostgresInterval.prototype.toPostgres`.
      return PostgresInterval.prototype.toPostgres.call({
        ...anonIntervalObject,
      });
    }
    return anonIntervalObject;
  },
  from: (interval: IPostgresInterval): IPostgresInterval => {
    return interval;
  },
};

export const withJoin = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  entityOrProperty: Function | string,
  alias: string,
  joinType?: 'inner' | 'left',
  select = false,
) => {
  if (
    qb.expressionMap.joinAttributes.findIndex(
      (j) =>
        j.entityOrProperty === entityOrProperty && (!select || j.isSelected),
    ) > -1
  ) {
    return qb;
  }

  let fn = qb.leftJoin;
  switch (joinType) {
    case 'inner':
      fn = select ? qb.innerJoinAndSelect : qb.innerJoin;
      break;
    case 'left':
    default:
      fn = select ? qb.leftJoinAndSelect : qb.leftJoin;
      break;
  }

  return fn(entityOrProperty, alias);
};

export const withLeftJoin = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  entityOrProperty: Function | string,
  alias: string,
) => withJoin(qb, entityOrProperty, alias, 'left');

export const withLeftJoinAndSelect = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  entityOrProperty: Function | string,
  alias: string,
) => withJoin(qb, entityOrProperty, alias, 'left', true);

export const withInnerJoin = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  entityOrProperty: Function | string,
  alias: string,
) => withJoin(qb, entityOrProperty, alias, 'inner');

export const withInnerJoinAndSelect = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  entityOrProperty: Function | string,
  alias: string,
) => withJoin(qb, entityOrProperty, alias, 'inner', true);
