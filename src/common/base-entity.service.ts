import { NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { BaseQueryDto } from './dto/base-query.dto';
import { Page } from './types/page';

export class BaseEntityService<E extends ObjectLiteral> {
  alias?: string;
  constructor() {
    if (this.constructor === BaseEntityService) {
      throw new Error('Cannot construct abstract class');
    }
  }

  getRepository(): Repository<E> {
    throw new Error('Not implemented');
  }

  async mapResult(entity: E) {
    return entity;
  }

  async mapResults(entities: E[]) {
    return Promise.all(entities.map((e) => this.mapResult(e)));
  }

  getQb(query?: BaseQueryDto, ...args: unknown[]): SelectQueryBuilder<E> {
    let qb = this.getRepository().createQueryBuilder(this.alias);

    if (query) {
      qb = query.applyToQb(qb);
    }

    return qb;
  }

  getQbSingle(
    id: NonNullable<E['id']>,
    ...args: unknown[]
  ): SelectQueryBuilder<E> {
    return this.getQb(undefined, ...args).andWhere({ id });
  }

  async create(createEntityDto: DeepPartial<E>, ...args: unknown[]) {
    return this.getRepository().save(createEntityDto);
  }

  async findAll(...args: unknown[]): Promise<E[]>;
  async findAll(query: BaseQueryDto, ...args: unknown[]): Promise<Page<E>>;
  async findAll(query?: BaseQueryDto, ...args: unknown[]) {
    let [results, count] = await this.getQb(query, ...args).getManyAndCount();

    results = await this.mapResults(results);

    if (query) {
      return {
        results,
        count,
        limit: results.length,
        offset: +query.offset,
      };
    }

    return results;
  }

  async findOne(id: NonNullable<E['id']>, ...args: unknown[]) {
    const r = await this.getQbSingle(id, ...args).getOneOrFail();

    return await this.mapResult(r);
  }

  async update(
    id: NonNullable<E['id']>,
    updateEntityDto: DeepPartial<E>,
    ...args: unknown[]
  ) {
    const updatedEntity = await this.getRepository().preload({
      id,
      ...updateEntityDto,
    });
    if (!updatedEntity) {
      throw new NotFoundException();
    }
    return await this.getRepository().save(updatedEntity);
  }

  async remove(id: NonNullable<E['id']>, ...args: unknown[]) {
    return this.getRepository().delete({ id });
  }
}
