import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { BaseQueryDto } from './base-query.dto';

export class Paginated<T> {
  limit: number;
  offset: number;
  count: number;
  results: T[];

  static async fromQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    query: BaseQueryDto,
    mapResults: (e: T[]) => Promise<T[]> = (r) => Promise.resolve(r),
  ) {
    let [results, count] = await qb.getManyAndCount();

    results = await mapResults(results);

    const p = new Paginated<T>();

    p.results = results;
    p.count = count;
    p.limit = results.length;
    p.offset = query.offset;

    return p;
  }
}
