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
  ['value.trainingItemId']?: QueryOrder;

  @IsOptional()
  @IsIn(QueryOrderOptions)
  ['watchStat.percentWatched']: QueryOrder;
}

const defaultOrder = new TrainingTokenQueryOrderDto();
defaultOrder.createdOn = 'DESC';

export class TrainingTokenQueryDto extends ViewingUserTokenQueryDto {
  @IsOptional()
  @IsString({ each: true })
  ['value.trainingItemId']?: string | string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingTokenQueryOrderDto)
  order: TrainingTokenQueryOrderDto = defaultOrder;
}
