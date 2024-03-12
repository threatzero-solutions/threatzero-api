import PostgresInterval, { IPostgresInterval } from 'postgres-interval';

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
