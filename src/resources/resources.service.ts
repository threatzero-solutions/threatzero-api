import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceItem } from './entities/resource.entity';
import { Repository } from 'typeorm';
import { MediaService } from '../media/media.service';
import { LEVEL } from 'src/auth/permissions';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { getOrganizationLevel } from 'src/organizations/common/organizations.utils';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

export class ResourcesService extends BaseEntityService<ResourceItem> {
  constructor(
    @InjectRepository(ResourceItem)
    private resourceRepository: Repository<ResourceItem>,
    private readonly cls: ClsService<CommonClsStore>,
    private media: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.resourceRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    let qb = super.getQb(query);

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        return qb;
      default:
        return qb
          .leftJoin(`${super.getQb().alias}.organizations`, 'organization')
          .andWhere('organization.slug = :organizationSlug', {
            organizationSlug: user?.organizationSlug,
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
