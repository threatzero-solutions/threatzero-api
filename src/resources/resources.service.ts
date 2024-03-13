import { Injectable } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Resource } from './entities/resource.entity';
import { Repository } from 'typeorm';
import { MediaService } from '../media/media.service';

@Injectable()
export class ResourcesService extends BaseEntityService<Resource> {
  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    private media: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.resourceRepository;
  }

  async mapResult(r: Resource) {
    return r.sign(this.getCloudFrontUrlSigner());
  }

  private getCloudFrontUrlSigner() {
    return this.media.getCloudFrontUrlSigner('resources');
  }
}
