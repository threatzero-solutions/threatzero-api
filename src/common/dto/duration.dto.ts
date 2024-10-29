import { IsOptional, IsNumber } from 'class-validator';
import { IPostgresInterval } from 'postgres-interval';

export class DurationDto implements IPostgresInterval {
  @IsOptional()
  @IsNumber()
  years: number;

  @IsOptional()
  @IsNumber()
  months: number;

  @IsOptional()
  @IsNumber()
  days: number;

  @IsOptional()
  @IsNumber()
  hours: number;

  @IsOptional()
  @IsNumber()
  minutes: number;

  @IsOptional()
  @IsNumber()
  seconds: number;

  @IsOptional()
  @IsNumber()
  milliseconds: number;

  toPostgres(): string {
    throw new Error('Method not implemented.');
  }
  toISO(): string {
    throw new Error('Method not implemented.');
  }
  toISOString(): string {
    throw new Error('Method not implemented.');
  }
  toISOStringShort(): string {
    throw new Error('Method not implemented.');
  }
}
