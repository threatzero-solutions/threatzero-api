import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import { isNil } from 'src/common/utils';

export const SCORM_VERSIONS = ['1.2', '2004.3', '2004.4'] as const;
export type ScormVersion = (typeof SCORM_VERSIONS)[number];

interface ScormVersionPipeOptions {
  optional?: boolean;
}

@Injectable()
export class ScormVersionPipe implements PipeTransform {
  constructor(
    @Optional() protected readonly options?: ScormVersionPipeOptions,
  ) {
    options = options || {};
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (isNil(value) && this.options?.optional) {
      return value;
    }

    if (
      typeof value === 'string' &&
      SCORM_VERSIONS.includes(value as ScormVersion)
    ) {
      return value as ScormVersion;
    }

    throw new BadRequestException(
      `Validation failed (${metadata.data} must be one of ${SCORM_VERSIONS})`,
    );
  }
}
