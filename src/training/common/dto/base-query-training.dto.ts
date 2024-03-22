import { BaseQueryDto } from 'src/common/dto/base-query.dto';

export class BaseQueryTrainingDto extends BaseQueryDto {
  protected getSearchFields() {
    return ['metadataTitle'];
  }
}
