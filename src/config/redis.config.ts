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
  clusterMode: boolean;

  @ValidateNested()
  @Type(() => ConnectionOptions)
  connectionOptions: ConnectionOptions;

  @ValidateNested()
  @Type(() => ClusterOptionsConfig)
  clusterOptions: ClusterOptionsConfig;

  @ValidateNested()
  @Type(() => RedisOptionsConfig)
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
  };

  return {
    clusterMode: process.env.REDIS_CLUSTER_MODE === 'true',
    connectionOptions: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379') ?? 6379,
    },
    clusterOptions: {
      dnsLookup: (address, callback) => callback(null, address),
      slotsRefreshTimeout: 5000,
      redisOptions,
    },
    redisOptions,
  } as RedisConfig;
});
