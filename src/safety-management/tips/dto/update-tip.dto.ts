import { PartialType } from '@nestjs/mapped-types';
import { CreateTipDto } from './create-tip.dto';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipStatus } from '../entities/tip.entity';
import { CreateTipSubmissionDto } from './create-tip-submission.dto';
import { Exclude, Transform } from 'class-transformer';

export class UpdateTipDto extends PartialType(CreateTipDto) {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }) => (value === '' ? null : value))
  tag?: string | null;

  // Only tip managers can update tip status.
  @IsEnum(TipStatus)
  @IsOptional()
  status?: TipStatus;

  // Tip sumbissions cannot be edited once created.
  @Exclude()
  @IsOptional()
  submission?: CreateTipSubmissionDto | undefined;
}
