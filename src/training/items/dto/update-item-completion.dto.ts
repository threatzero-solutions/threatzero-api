import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class UpdateItemCompletionDto {
  @IsNotEmpty()
  @IsBoolean()
  completed: boolean;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => Math.ceil(value * 10000) / 10000, {})
  progress: number;
}
