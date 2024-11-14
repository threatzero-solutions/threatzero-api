import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DNSLookupFunction, RedisOptions } from 'ioredis';
import { ConnectionOptions as TlsConnectionOptions } from 'tls';
import { readFileToString } from './utils';
import { ClusterOptions } from 'bullmq';
import { validate } from './env.validation';

class ConnectionOptions {
  @IsString()
  @IsOptional()
  host?: string;

  @IsNumber()
  @IsOptional()
  port?: number;
}

class RedisTlsOptions implements TlsConnectionOptions {
  @IsString()
  @IsNotEmpty()
  ca: string;
}

class ClusterOptionsConfig implements ClusterOptions {
  @IsNotEmpty()
  dnsLookup: DNSLookupFunction;

  @IsNotEmpty()
  @IsNumber()
  slotsRefreshTimeout: number;
}

class RedisOptionsConfig implements RedisOptions {
  @IsOptional()
  @Type(() => RedisTlsOptions)
  @ValidateNested()
  tls: RedisTlsOptions;

  @IsBoolean()
  @IsNotEmpty()
  enableAutoPipelining: boolean;
}

export class RedisConfig {
  @IsBoolean()
  @IsNotEmpty()
  clusterMode: boolean;

  @ValidateNested()
  @Type(() => ConnectionOptions)
  @IsNotEmpty()
  connectionOptions: ConnectionOptions;

  @ValidateNested()
  @Type(() => ClusterOptionsConfig)
  @IsNotEmpty()
  clusterOptions: ClusterOptionsConfig;

  @ValidateNested()
  @Type(() => RedisOptionsConfig)
  @IsNotEmpty()
  redisOptions: RedisOptionsConfig;
}

export default registerAs('redis', () => {
  const tlsEnabled = process.env.REDIS_TLS !== 'false';
  let tls: RedisTlsOptions | undefined = undefined;
  if (tlsEnabled) {
    tls = {
      ca: readFileToString(
        process.env.REDIS_TLS_CA ?? '/etc/ssl/certs/ca-certificates.crt',
      ),
    };
  }

  const redisOptions = {
    tls,
    enableAutoPipelining: true,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  };

  return validate(RedisConfig, {
    clusterMode: process.env.REDIS_CLUSTER_MODE === 'true',
    connectionOptions: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379') ?? 6379,
    },
    clusterOptions: {
      dnsLookup: (address: string, callback: any) => callback(null, address),
      slotsRefreshTimeout: 5000,
      redisOptions,
    },
    redisOptions,
  });
});
