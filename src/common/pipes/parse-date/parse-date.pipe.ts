import {
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { isNil } from 'src/common/utils';

interface ParseDatePipeOptions {
  optional?: boolean;
}

@Injectable()
export class ParseDatePipe implements PipeTransform {
  constructor(@Optional() protected readonly options?: ParseDatePipeOptions) {
    options = options || {};
  }

  transform(value: any) {
    if (isNil(value) && this.options?.optional) {
      return value;
    }

    const parsedDate = dayjs(value);

    if (!parsedDate.isValid()) {
      throw new BadRequestException(
        'Validation failed (date string is expected)',
      );
    }

    return parsedDate.toDate();
  }
}
