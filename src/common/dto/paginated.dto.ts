import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { BaseQueryDto } from './base-query.dto';

export class Paginated<T> {
  limit: number;
  offset: number;
  count: number;
  pageCount: number;
  results: T[];

  static async fromQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    query: BaseQueryDto,
    mapResults: (e: T[]) => Promise<T[]> = (r) => Promise.resolve(r),
  ) {
    const [results, count] = await qb.getManyAndCount();

    const mappedResults = await mapResults(results);

    const p = new Paginated<T>();

    p.results = mappedResults;
    p.count = count;
    p.pageCount = mappedResults.length;
    p.limit = query.limit;
    p.offset = query.offset;

    return p;
  }
}
