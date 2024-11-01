import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from '../../types/common-cls-store';

@Injectable()
export class ScopedValidationPipe extends ValidationPipe {
  constructor(protected readonly cls: ClsService<CommonClsStore>) {
    super({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });
  }

  public async transform(value: any, metadata: ArgumentMetadata) {
    const user = this.cls.get('user');
    if (user) {
      this.transformOptions.groups = user.permissions
        .filter((p) => p.startsWith('level:'))
        .map((p) => p.slice(6));
    }
    return await super.transform(value, metadata);
  }
}
