import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { validate } from './env.validation';
import { TlsOptions } from 'tls';
import { readFileToString } from './utils';
import { Type } from 'class-transformer';

class DatabaseTlsOptions implements TlsOptions {
  @IsString()
  @IsNotEmpty()
  ca: string;

  @IsBoolean()
  @IsOptional()
  rejectUnauthorized?: boolean | undefined;
}

export class DatabaseConfig implements PostgresConnectionOptions {
  @IsIn(['postgres'])
  @IsOptional()
  type: 'postgres' = 'postgres' as const;

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

  @ValidateNested()
  @Type(() => DatabaseTlsOptions)
  @IsOptional()
  ssl?: DatabaseTlsOptions;
}

export default registerAs('database', () => {
  const tlsEnabled = process.env.DB_SSL_ENABLED === 'true';
  let ssl: DatabaseTlsOptions | undefined = undefined;
  if (tlsEnabled) {
    ssl = {
      ca: readFileToString(
        process.env.DB_SSL_CA ?? '/etc/ssl/certs/ca-certificates.crt',
      ),
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
    };
  }

  return validate(DatabaseConfig, {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING !== 'false',
    cache: process.env.DB_CACHE !== 'false',
    ssl,
  });
});
