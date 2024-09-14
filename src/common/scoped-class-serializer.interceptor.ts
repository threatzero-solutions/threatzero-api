import {
  Injectable,
  ClassSerializerInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from './types/common-cls-store';
import { Observable } from 'rxjs';

const REFLECTOR = 'Reflector';

@Injectable()
export class ScopedClassSerializerInterceptor extends ClassSerializerInterceptor {
  constructor(
    @Inject(REFLECTOR) protected readonly reflector: any,
    protected readonly cls: ClsService<CommonClsStore>,
  ) {
    super(reflector);
  }

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const user = this.cls.get('user');
    if (user) {
      this.defaultOptions.groups = user.permissions
        .filter((p) => p.startsWith('level:'))
        .map((p) => p.slice(6));
    }
    return super.intercept(context, next);
  }
}
