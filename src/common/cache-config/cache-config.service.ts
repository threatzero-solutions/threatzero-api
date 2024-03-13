import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClusterConfig, redisStore } from 'cache-manager-ioredis-yet';
import { RedisOptions } from 'ioredis';
import { RedisConfig } from 'src/config/redis.config';

type RedisCacheModuleOptions = CacheModuleOptions<
  | RedisOptions
  | {
      clusterConfig: RedisClusterConfig;
    }
>;

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createCacheOptions():
    | RedisCacheModuleOptions
    | Promise<RedisCacheModuleOptions> {
    const redisConfig = this.config.getOrThrow<RedisConfig>('redis');

    const moduleOptions: CacheModuleOptions = {
      store: redisStore,
    };

    const redisOptions = {
      ...redisConfig.redisOptions,
      keyPrefix: '{tz-cache}',
    };

    if (redisConfig.clusterMode) {
      return {
        ...moduleOptions,
        clusterConfig: {
          nodes: [redisConfig.connectionOptions],
          options: {
            ...redisConfig.clusterOptions,
            redisOptions,
          },
        },
      };
    }

    return {
      ...moduleOptions,
      ...redisConfig.connectionOptions,
      ...redisOptions,
    };
  }
}
