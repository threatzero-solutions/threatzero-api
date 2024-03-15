import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class QueryLocationsDto extends BaseQueryDto {
  protected getSearchFields() {
    return ['name', 'locationId'];
  }
}
