import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OpaqueToken } from './entities/opaque-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { OpaqueTokenQueryDto } from './dto/opaque-token-query.dto';
import { Paginated } from 'src/common/dto/paginated.dto';
import { Page } from 'src/common/types/page';

@Injectable()
export class OpaqueTokenService {
  logger = new Logger(OpaqueTokenService.name);

  constructor(
    @InjectRepository(OpaqueToken)
    private opaqueTokenRepository: Repository<OpaqueToken>,
  ) {}

  async create<T extends object>(
    value: unknown,
    valueClass?: new () => T,
    type?: string,
    keyFactory: () => string = uuidv4,
  ) {
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

  async get(key: string): Promise<OpaqueToken | null> {
    return await this.opaqueTokenRepository.findOneBy({ key });
  }

  getQb(query?: OpaqueTokenQueryDto) {
    let qb = this.opaqueTokenRepository.createQueryBuilder();
    if (query) {
      qb = query.applyToQb(qb);
    }
    return qb;
  }

  async findAll(query: OpaqueTokenQueryDto): Promise<Page<OpaqueToken>> {
    return Paginated.fromQb(this.getQb(query), query);
  }

  async validate<T extends object>(
    key: string,
    valueClass: new () => T,
  ): Promise<T | null> {
    const opaqueToken = await this.get(key);
    if (!opaqueToken) {
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
