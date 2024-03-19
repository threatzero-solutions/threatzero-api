import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { expressJwtSecret } from 'jwks-rsa';
import { UserFactory } from './user.factory';
import { Reflector } from '@nestjs/core';
import { Jwt } from 'jsonwebtoken';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private userFactory: UserFactory,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
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
        expressJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: this.config.get<string>('auth.jwksUri') ?? '',
        })(request, jwt.header, jwt.payload, (e, key) => {
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
    } catch (e) {
      console.error('Error validating JWT token', e);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
