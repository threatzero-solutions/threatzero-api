import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
  QueryOrder,
  QueryOrderOptions,
} from 'src/common/dto/base-query-order.dto';
import {
  ViewingUserTokenQueryDto,
  ViewingUserTokenQueryOrderDto,
} from 'src/media/dto/viewing-user-token-query.dto';

export class TrainingTokenQueryOrderDto extends ViewingUserTokenQueryOrderDto {
  @IsOptional()
  @IsIn(QueryOrderOptions)
  trainingItemId?: QueryOrder;
}

export class TrainingTokenQueryDto extends ViewingUserTokenQueryDto {
  @IsOptional()
  @IsString()
  trainingItemId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingTokenQueryOrderDto)
  order: TrainingTokenQueryOrderDto = new TrainingTokenQueryOrderDto();
}
