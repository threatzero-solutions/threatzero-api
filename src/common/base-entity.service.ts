import { NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { BaseQueryDto } from './dto/base-query.dto';
import { Paginated } from './dto/paginated.dto';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const { id } = await this.getRepository().save(createEntityDto);
    const entity = await this.getRepository().findOneByOrFail({
      id,
    });
    await this.afterCreate(entity, ...args);
    return await this.mapResult(entity);
  }

  async findAll(...args: unknown[]): Promise<E[]>;
  async findAll(query: BaseQueryDto, ...args: unknown[]): Promise<Paginated<E>>;
  async findAll(query?: BaseQueryDto, ...args: unknown[]) {
    if (query) {
      return this.paginate(this.getQb(query, ...args), query);
    }

    let results = await this.getQb(query, ...args).getMany();
    results = await this.mapResults(results);
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
    // Validate proper access to object here since `preload` doesn't perform such a check.
    const exists = await this.getQbSingle(id, ...args).getExists();
    let updatedEntity: E | null | undefined = null;
    if (exists) {
      updatedEntity = await this.getRepository().preload({
        id,
        ...updateEntityDto,
      });
    }
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

  async paginate(qb: SelectQueryBuilder<E>, query: BaseQueryDto) {
    return Paginated.fromQb(qb, query, (r) => this.mapResults(r));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async beforeCreate(createEntityDto: DeepPartial<E>, ...args: unknown[]) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async afterCreate(entity: E, ...args: unknown[]) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async beforeUpdate(entity: E, ...args: unknown[]) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async afterUpdate(entity: E, ...args: unknown[]) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async beforeRemove(id: E['id'], ...args: unknown[]) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async afterRemove(id: E['id'], ...args: unknown[]) {}
}
