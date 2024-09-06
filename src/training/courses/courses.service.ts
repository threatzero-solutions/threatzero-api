import { InjectRepository } from '@nestjs/typeorm';
import { TrainingCourse } from './entities/course.entity';
import { Repository } from 'typeorm';
import { filterTraining } from '../common/training.utils';
import { BaseEntityService } from 'src/common/base-entity.service';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { MediaService } from 'src/media/media.service';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

export class CoursesService extends BaseEntityService<TrainingCourse> {
  alias = 'course';

  constructor(
    private readonly cls: ClsService<CommonClsStore>,
    @InjectRepository(TrainingCourse)
    private coursesRepository: Repository<TrainingCourse>,
    private mediaService: MediaService,
  ) {
    super();
  }

  getRepository() {
    return this.coursesRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    let qb = super
      .getQb(query)
      .leftJoinAndSelect('course.audiences', 'audience')
      .leftJoinAndSelect('course.presentableBy', 'presentableBy');

    qb = filterTraining(user, qb);

    return qb;
  }

  getQbSingle(id: string) {
    return super
      .getQbSingle(id)
      .leftJoinAndSelect('course.sections', 'section')
      .leftJoinAndSelect('section.items', 'section_items')
      .leftJoinAndSelect('section_items.item', 'item');
  }

  async mapResult(course: TrainingCourse) {
    await course.loadVideoThumbnails((url) =>
      this.mediaService.getThumbnailUrlForVimeoUrl(url),
    );
    return course;
  }
}
