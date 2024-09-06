import { TrainingSection } from './entities/section.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/training.utils';
import { BaseEntityService } from 'src/common/base-entity.service';
import { MediaService } from 'src/media/media.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { StatelessUser } from 'src/auth/user.factory';

export class SectionsService extends BaseEntityService<TrainingSection> {
  alias = 'section';

  constructor(
    private readonly cls: ClsService<CommonClsStore>,
    @InjectRepository(TrainingSection)
    private sectionsRepository: Repository<TrainingSection>,
    private mediaService: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.sectionsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    let qb = super
      .getQb(query)
      .leftJoin('section.course', 'course')
      .leftJoinAndSelect('section.items', 'sectionItems')
      .leftJoinAndSelect('sectionItems.item', 'item');

    qb = filterTraining(user, qb);

    return qb;
  }

  async mapResult(section: TrainingSection) {
    await section.loadVideoThumbnails((url) =>
      this.mediaService.getThumbnailUrlForVimeoUrl(url),
    );
    return section;
  }
}
