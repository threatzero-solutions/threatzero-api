import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceItem } from './entities/resource.entity';
import { Repository } from 'typeorm';
import { MediaService } from '../media/media.service';

@Injectable()
export class ResourcesService extends BaseEntityService<ResourceItem> {
  constructor(
    @InjectRepository(ResourceItem)
    private resourceRepository: Repository<ResourceItem>,
    private media: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.resourceRepository;
  }

  async mapResult(r: ResourceItem) {
    return r.sign(this.getCloudFrontUrlSigner());
  }

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('resources');
  }
}
