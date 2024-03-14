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
    await this.beforeCreate(createEntityDto, ...args);
    const entity = await this.getRepository().save(createEntityDto);
    await this.afterCreate(entity, ...args);
    return await this.mapResult(entity);
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
    await this.beforeUpdate(updatedEntity, ...args);
    const entity = await this.getRepository().save(updatedEntity);
    await this.afterUpdate(entity, ...args);
    return await this.mapResult(entity);
  }

  async remove(id: NonNullable<E['id']>, ...args: unknown[]) {
    await this.beforeRemove(id, ...args);
    const res = await this.getRepository().delete({ id });
    await this.afterRemove(id, ...args);
    return res;
  }

  protected async beforeCreate(
    createEntityDto: DeepPartial<E>,
    ...args: unknown[]
  ) {}
  protected async afterCreate(entity: E, ...args: unknown[]) {}
  protected async beforeUpdate(entity: E, ...args: unknown[]) {}
  protected async afterUpdate(entity: E, ...args: unknown[]) {}
  protected async beforeRemove(id: E['id'], ...args: unknown[]) {}
  protected async afterRemove(id: E['id'], ...args: unknown[]) {}
}
