import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class BaseQueryOrganizationsDto extends BaseQueryDto {
  protected getSearchFields() {
    return ['name', 'slug', 'address'];
  }
}
