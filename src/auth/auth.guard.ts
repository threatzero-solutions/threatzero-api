import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Jwt } from 'jsonwebtoken';
import { expressJwtSecret } from 'jwks-rsa';
import { ClsService } from 'nestjs-cls';
import { UserFactory } from './user.factory';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);
  private readonly getSecret: ReturnType<typeof expressJwtSecret>;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private userFactory: UserFactory,
    private reflector: Reflector,
    private cls: ClsService,
  ) {
    this.getSecret = expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: this.config.get<string>('auth.jwksUri') ?? '',
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      if (isPublic) {
        return true;
      }

      throw new UnauthorizedException();
    }
    try {
      const jwt: Jwt = this.jwtService.decode(token, {
        complete: true,
      });
      const secret = await new Promise<string>((resolve, reject) =>
        this.getSecret(request, jwt.header, jwt.payload, (e, key) => {
          if (e) {
            reject(e);
          } else if (!key) {
            reject('No key/secret found.');
          } else {
            resolve(key.toString());
          }
        }),
      );
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secret,
        issuer: this.config.get<string>('auth.issuer'),
        audience: this.config.get<string>('auth.audience'),
      });

      request.user = this.userFactory.fromJwtPayload(payload);
      this.cls.set('user', request.user);
      this.cls.set('ip', request.ip);
    } catch (e) {
      this.logger.error('Error validating JWT token', e);

      if (isPublic) {
        return true;
      }

      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
