import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { LanguageQueryOrderDto } from './language-query-order.dto';
import { Type } from 'class-transformer';

export class QueryLanguageDto extends BaseQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageQueryOrderDto)
  order: LanguageQueryOrderDto = new LanguageQueryOrderDto();

  @IsOptional()
  @IsString()
  code?: string;

  protected getSearchFields() {
    return ['name', 'nativeName'];
  }
}
