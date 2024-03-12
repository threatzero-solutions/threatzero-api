import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ClusterOptions } from 'ioredis';

class ClusterNodeConfig {
  @IsString()
  @IsOptional()
  host?: string;

  @IsNumber()
  @IsOptional()
  port?: number;
}

class ClusterOptionsConfig implements ClusterOptions {}

export class RedisConfig {
  @IsBoolean()
  clusterMode: boolean;

  @ValidateNested()
  @Type(() => ClusterNodeConfig)
  cluster: ClusterNodeConfig;

  @ValidateNested()
  @Type(() => ClusterOptionsConfig)
  options: ClusterOptionsConfig;

  @IsBoolean()
  tls: boolean;

  @IsString()
  tlsCaPath: string;
}

export default registerAs('redis', () => ({
  clusterMode: process.env.REDIS_CLUSTER_MODE === 'true',
  cluster: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379') ?? 6379,
  },
  options: {},
  tls: process.env.REDIS_TLS !== 'false',
  tlsCaPath:
    process.env.REDIS_TLS_CA_PATH ?? '/etc/ssl/certs/ca-certificates.crt',
}));
