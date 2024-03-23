import { Inject, Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceItem } from './entities/resource.entity';
import { Repository } from 'typeorm';
import { MediaService } from '../media/media.service';
import { REQUEST } from '@nestjs/core';
import { LEVEL } from 'src/auth/permissions';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { getOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { Request } from 'express';

@Injectable()
export class ResourcesService extends BaseEntityService<ResourceItem> {
  constructor(
    @InjectRepository(ResourceItem)
    private resourceRepository: Repository<ResourceItem>,
    @Inject(REQUEST) private request: Request,
    private media: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.resourceRepository;
  }

  getQb(query?: BaseQueryDto) {
    let qb = super.getQb(query);

    switch (getOrganizationLevel(this.request)) {
      case LEVEL.ADMIN:
        return qb;
      default:
        return qb
          .leftJoin(`${super.getQb().alias}.organizations`, 'organization')
          .andWhere('organization.slug = :organizationSlug', {
            organizationSlug: this.request.user?.organizationSlug,
          });
    }
  }

  async mapResult(r: ResourceItem) {
    r = r.sign(this.getCloudFrontUrlSigner());
    r = await r.loadThumbnailUrl((url) =>
      this.media.getThumbnailUrlForVimeoUrl(url),
    );
    return r;
  }

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('resources');
  }
}
