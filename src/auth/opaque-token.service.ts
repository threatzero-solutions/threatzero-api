import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OpaqueToken } from './entities/opaque-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { OpaqueTokenQueryDto } from './dto/opaque-token-query.dto';
import { Paginated } from 'src/common/dto/paginated.dto';
import dayjs from 'dayjs';

export interface CreateOpaqueTokenOptions<T extends object> {
  valueClass?: new () => T;
  type?: string;
  expiresOn?: Date;
  keyFactory?: () => string;
}

@Injectable()
export class OpaqueTokenService {
  logger = new Logger(OpaqueTokenService.name);

  constructor(
    @InjectRepository(OpaqueToken)
    private opaqueTokenRepository: Repository<OpaqueToken>,
  ) {}

  async create<T extends object>(
    value: unknown[],
    options?: CreateOpaqueTokenOptions<T>,
  ): Promise<OpaqueToken<T>[]>;
  async create<T extends object>(
    value: unknown,
    options?: CreateOpaqueTokenOptions<T>,
  ): Promise<OpaqueToken<T>>;
  async create<T extends object>(
    value: unknown,
    {
      valueClass,
      type,
      expiresOn,
      keyFactory = uuidv4,
    }: CreateOpaqueTokenOptions<T> = {},
  ): Promise<OpaqueToken<T> | OpaqueToken<T>[]> {
    let validatedValue: object;
    if (valueClass) {
      validatedValue = plainToInstance(valueClass, value, {
        enableImplicitConversion: true,
      });

      // Validate value.
      const _validate = async (val: object) => {
        const errors = await validate(val);
        if (errors.length > 0) {
          throw new BadRequestException(errors);
        }
      };

      if (Array.isArray(validatedValue)) {
        await Promise.all(validatedValue.map(_validate));
      } else {
        await _validate(validatedValue);
      }
    } else {
      validatedValue = value as object;
    }

    const _build = (val: object, batchId?: string) => {
      const key = keyFactory();
      return this.opaqueTokenRepository.create({
        key,
        value: val,
        type,
        batchId,
        expiresOn,
      }) as OpaqueToken<T>;
    };

    if (Array.isArray(validatedValue)) {
      const batchId = uuidv4();
      return await this.opaqueTokenRepository.save(
        validatedValue.map((v) => _build(v, batchId)),
      );
    }

    return await this.opaqueTokenRepository.save<OpaqueToken<T>>(
      _build(validatedValue),
    );
  }

  async get(key: string, type?: string): Promise<OpaqueToken | null> {
    const condition: FindOptionsWhere<OpaqueToken> = { key };
    if (type) {
      condition.type = type;
    }
    return await this.opaqueTokenRepository.findOneBy(condition);
  }

  getQb(
    query?: OpaqueTokenQueryDto,
    mod = (qb: SelectQueryBuilder<OpaqueToken>) => qb,
  ) {
    let qb = this.opaqueTokenRepository.createQueryBuilder('opaque_token');
    qb = mod(qb);
    if (query) {
      qb = query.applyToQb(qb);
    }
    return qb;
  }

  async findAll<
    V extends object = object,
    Q extends OpaqueTokenQueryDto = OpaqueTokenQueryDto,
  >(query: Q): Promise<Paginated<OpaqueToken<V>>> {
    return Paginated.fromQb(this.getQb(query), query) as Promise<
      Paginated<OpaqueToken<V>>
    >;
  }

  async setExpiration(query: OpaqueTokenQueryDto, expiration: Date | null) {
    await this.getQb(query)
      // Order by not allowed in update, so it is removed here.
      .orderBy()
      .update({ expiresOn: expiration })
      .execute();
  }

  async validate<T extends object>(
    key: string,
    valueClass: new () => T,
    type?: string,
  ): Promise<T | null> {
    const opaqueToken = await this.get(key, type);
    if (
      !opaqueToken ||
      (opaqueToken.expiresOn && dayjs(opaqueToken.expiresOn).isBefore(dayjs()))
    ) {
      return null;
    }

    const valueDto = plainToInstance(valueClass, opaqueToken.value, {
      enableImplicitConversion: true,
    });

    const errors = await validate(valueDto);

    if (errors.length > 0) {
      this.logger.error(errors);
      return null;
    }

    return valueDto;
  }

  async delete(key: string) {
    return await this.opaqueTokenRepository.delete({ key });
  }
}
