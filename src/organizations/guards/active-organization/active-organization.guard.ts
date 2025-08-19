import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-ioredis-yet';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/auth/auth.guard';
import { isNil } from 'src/common/utils';
import { buildOrganizationStatusCacheKey } from 'src/organizations/common/organizations.utils';
import {
  Organization,
  OrganizationStatus,
} from 'src/organizations/organizations/entities/organization.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ActiveOrganizationGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache<RedisStore>,
    private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      return false;
    }

    const organizationSlug = user.organizationSlug;
    if (isNil(organizationSlug)) {
      return false;
    }

    const isActive = await this.isOrganizationActive(organizationSlug);
    if (!isActive) {
      throw new ForbiddenException({
        message: 'Organization is not active. Please contact support.',
        error: 'organization_not_active',
        statusCode: 403,
      });
    }

    return true;
  }

  private async isOrganizationActive(organizationSlug: string) {
    const cacheKey = buildOrganizationStatusCacheKey(organizationSlug);
    const cachedValue = await this.cache.get<OrganizationStatus>(cacheKey);

    let status: OrganizationStatus | undefined;
    if (isNil(cachedValue)) {
      const organization = await this.dataSource
        .getRepository(Organization)
        .findOne({
          where: { slug: organizationSlug },
        });

      if (organization) {
        status = organization.status;
        await this.cache.set(cacheKey, status, 1000 * 60 * 60);
      }
    } else {
      status = cachedValue;
    }

    if (isNil(status)) {
      return false;
    }

    return status === OrganizationStatus.ACTIVE;
  }
}
