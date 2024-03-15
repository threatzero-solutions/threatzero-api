import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsPort,
  IsPositive,
  IsString,
} from 'class-validator';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { validate } from './env.validation';

export class DatabaseConfig implements PostgresConnectionOptions {
  @IsIn(['postgres'])
  type: 'postgres';

  @IsString()
  host: string;

  @IsPositive()
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  database: string;

  @IsBoolean()
  synchronize: boolean;

  @IsBoolean()
  logging: boolean;

  @IsBoolean()
  cache: boolean;

  @IsOptional()
  ssl: boolean;
}

export default registerAs(
  'database',
  () =>
    validate(DatabaseConfig, {
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432') || 5432,
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? 'asdf',
      database: process.env.DB_DATABASE ?? 'threatzero',
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING !== 'false',
      cache: process.env.DB_CACHE !== 'false',
      ssl: process.env.DB_SSL_ENABLED === 'true',
    }) as DatabaseConfig,
);
