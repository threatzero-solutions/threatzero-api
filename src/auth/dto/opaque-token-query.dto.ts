import { IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class OpaqueTokenQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsUUID('4', { each: true })
  id?: string | string[];

  @IsOptional()
  @IsString({ each: true })
  key?: string | string[];

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  batchId?: string;
}
