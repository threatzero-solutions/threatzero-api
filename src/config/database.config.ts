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
  @IsOptional()
  type: 'postgres' = 'postgres';

  @IsString()
  @IsOptional()
  host: string = 'localhost';

  @IsPositive()
  @IsOptional()
  port: number = 5432;

  @IsString()
  @IsOptional()
  username: string = 'root';

  @IsString()
  @IsOptional()
  password: string = 'asdf';

  @IsString()
  @IsOptional()
  database: string = 'threatzero_app';

  @IsBoolean()
  @IsOptional()
  synchronize: boolean = false;

  @IsBoolean()
  @IsOptional()
  logging: boolean = true;

  @IsBoolean()
  @IsOptional()
  cache: boolean = true;

  @IsOptional()
  @IsOptional()
  ssl: boolean = false;
}

export default registerAs(
  'database',
  () =>
    validate(DatabaseConfig, {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING !== 'false',
      cache: process.env.DB_CACHE !== 'false',
      ssl: process.env.DB_SSL_ENABLED === 'true',
    }) as DatabaseConfig,
);
