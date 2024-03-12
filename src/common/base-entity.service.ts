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

  mapResult(entity: E) {
    return entity;
  }

  mapResults(entities: E[]) {
    return entities.map((e) => this.mapResult(e));
  }

  getQb(query?: BaseQueryDto): SelectQueryBuilder<E> {
    let qb = this.getRepository().createQueryBuilder(this.alias);

    if (query) {
      qb = query.applyToQb(qb);
    }

    return qb;
  }

  getQbSingle(id: NonNullable<E['id']>): SelectQueryBuilder<E> {
    return this.getQb().andWhere({ id });
  }

  async create(createEntityDto: DeepPartial<E>) {
    return this.getRepository().save(createEntityDto);
  }

  async findAll(): Promise<E[]>;
  async findAll(query: BaseQueryDto): Promise<Page<E>>;
  async findAll(query?: BaseQueryDto) {
    let [results, count] = await this.getQb(query).getManyAndCount();

    results = this.mapResults(results);

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

  async findOne(id: NonNullable<E['id']>) {
    const r = await this.getQbSingle(id).getOneOrFail();

    return this.mapResult(r);
  }

  async update(id: NonNullable<E['id']>, updateEntityDto: DeepPartial<E>) {
    const updatedEntity = await this.getRepository().preload({
      id,
      ...updateEntityDto,
    });
    if (!updatedEntity) {
      throw new NotFoundException();
    }
    return await this.getRepository().save(updatedEntity);
  }

  async remove(id: NonNullable<E['id']>) {
    return this.getRepository().delete({ id });
  }
}
